import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { chromium } from 'playwright';
import { FirebaseService } from '../firebase/firebase.service';
import * as path from 'path';

interface ScrapeJobData {
  mangaId: string;
  userId: string;
  sourceUrl: string;
}

@Processor('scraper', { concurrency: 2 }) // xử lý tối đa 2 job cùng lúc
export class ScraperProcessor extends WorkerHost {
  constructor(private firebaseService: FirebaseService) {
    super();
  }

  private get db() {
    return this.firebaseService.firestore;
  }

  private get bucket() {
    return this.firebaseService.storage.bucket();
  }

  async process(job: Job<ScrapeJobData>): Promise<void> {
    const { mangaId, userId, sourceUrl } = job.data;
    console.log(`[Scraper] Starting job ${job.id} for manga ${mangaId}`);

    const browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    try {
      const page = await browser.newPage();

      // Set user agent thật để tránh bị block
      await page.setExtraHTTPHeaders({
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      });

      await job.updateProgress(5);

      // ── BƯỚC 1: Lấy danh sách chapters ──
      await page.goto(sourceUrl, { waitUntil: 'networkidle', timeout: 30000 });
      await job.updateProgress(10);

      // Lấy cover image
      const coverUrl = await this.extractCoverUrl(page);

      // Lấy danh sách chapter links
      const chapterLinks = await this.extractChapterLinks(page);
      console.log(`[Scraper] Found ${chapterLinks.length} chapters`);

      if (chapterLinks.length === 0) {
        throw new Error('Không tìm thấy chapter nào — URL có thể không đúng');
      }

      // Cập nhật tổng số chapter
      await this.db.collection('mangas').doc(mangaId).update({
        totalChapters: chapterLinks.length,
        coverUrl,
      });

      // ── BƯỚC 2: Cào từng chapter ──
      for (let i = 0; i < chapterLinks.length; i++) {
        const link = chapterLinks[i];

        try {
          await page.goto(link.url, { waitUntil: 'networkidle', timeout: 30000 });

          // Lấy tất cả ảnh trong chapter
          const imageUrls = await this.extractChapterImages(page);

          // Upload từng ảnh lên Firebase Storage
          const uploadedUrls = await this.uploadImages(
            imageUrls,
            userId,
            mangaId,
            i + 1,
            job,
          );

          // Lưu chapter vào Firestore
          await this.db.collection('chapters').add({
            mangaId,
            chapterNumber: i + 1,
            title: link.title || `Chapter ${i + 1}`,
            imageUrls: uploadedUrls,
            scrapedAt: new Date().toISOString(),
          });

          // Cập nhật progress
          const progress = Math.floor(10 + ((i + 1) / chapterLinks.length) * 85);
          await job.updateProgress(progress);

        } catch (chapterErr) {
          console.error(`[Scraper] Failed chapter ${i + 1}:`, chapterErr);
          // Bỏ qua chapter lỗi, tiếp tục chapter sau
        }
      }

      // ── BƯỚC 3: Hoàn thành ──
      await this.db.collection('mangas').doc(mangaId).update({
        status: 'done',
        completedAt: new Date().toISOString(),
      });

      await job.updateProgress(100);
      console.log(`[Scraper] Job ${job.id} completed!`);

    } catch (error) {
      // Cập nhật status lỗi vào Firestore
      await this.db.collection('mangas').doc(mangaId).update({
        status: 'error',
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error; // re-throw để BullMQ biết job failed → retry
    } finally {
      await browser.close();
    }
  }

  // ── Helper: Lấy cover image ──
  private async extractCoverUrl(page: any): Promise<string> {
    try {
      // Selector phổ biến trên các trang truyện VN
      const selectors = [
        '.series-cover img',
        '.book-cover img',
        '.manga-cover img',
        '.info-cover img',
        'img.cover',
      ];

      for (const selector of selectors) {
        const el = await page.$(selector);
        if (el) {
          return await el.getAttribute('src') || '';
        }
      }
      return '';
    } catch {
      return '';
    }
  }

  // ── Helper: Lấy links các chapter ──
  private async extractChapterLinks(page: any): Promise<{ url: string; title: string }[]> {
    // Selectors phổ biến cho danh sách chapter
    const links = await page.$$eval(
      'a[href*="chapter"], a[href*="chuong"], .chapter-list a, .list-chapter a',
      (els: HTMLAnchorElement[]) =>
        els.map(el => ({
          url: el.href,
          title: el.textContent?.trim() || '',
        })).filter(l => l.url && l.url.startsWith('http')),
    );

    // Dedup và sort
    const unique = [...new Map(links.map((l: any) => [l.url, l])).values()];
    return unique.reverse() as { url: string; title: string }[]; // chapter 1 trước
  }

  // ── Helper: Lấy ảnh trong chapter ──
  private async extractChapterImages(page: any): Promise<string[]> {
    // Scroll xuống để trigger lazy load
    await page.evaluate(async () => {
      await new Promise<void>((resolve) => {
        let totalHeight = 0
        const distance = 400
        const timer = setInterval(() => {
          window.scrollBy(0, distance)
          totalHeight += distance
          if (totalHeight >= document.body.scrollHeight) {
            clearInterval(timer)
            resolve()
          }
        }, 150)
      })
    })

    await page.waitForTimeout(2000)

    // Thử nhiều selector + data-src
    const imgs = await page.$$eval(
      'img',
      (els: HTMLImageElement[]) =>
        els
          .map(el =>
            el.getAttribute('data-src') ||
            el.getAttribute('data-lazy-src') ||
            el.getAttribute('data-original') ||
            el.getAttribute('src') || ''
          )
          .filter(src =>
            src &&
            src.startsWith('http') &&
            (src.includes('.jpg') || src.includes('.png') ||
              src.includes('.webp') || src.includes('.jpeg'))
          )
    )

    return imgs
  }

  // ── Helper: Upload ảnh lên Firebase Storage ──
  private async uploadImages(
    imageUrls: string[],
    userId: string,
    mangaId: string,
    chapterNumber: number,
    job: Job,
  ): Promise<string[]> {
    const uploadedUrls: string[] = [];
    const axios = (await import('axios')).default;

    for (let i = 0; i < imageUrls.length; i++) {
      try {
        // Download ảnh
        const response = await axios.get(imageUrls[i], {
          responseType: 'arraybuffer',
          timeout: 15000,
          headers: { Referer: 'https://google.com' },
        });

        const buffer = Buffer.from(response.data);
        const ext = path.extname(new URL(imageUrls[i]).pathname) || '.jpg';
        const fileName = `mangas/${userId}/${mangaId}/ch${chapterNumber}/page${i + 1}${ext}`;

        // Upload lên Firebase Storage
        const file = this.bucket.file(fileName);
        await file.save(buffer, {
          metadata: { contentType: response.headers['content-type'] || 'image/jpeg' },
          public: true,
        });

        const publicUrl = `https://firebasestorage.googleapis.com/v0/b/${this.bucket.name}/o/${encodeURIComponent(fileName)}?alt=media`
        uploadedUrls.push(publicUrl);

      } catch (imgErr) {
        console.error(`[Scraper] Failed image ${i + 1}:`, imgErr);
        uploadedUrls.push(''); // giữ index, để biết trang nào bị lỗi
      }
    }

    return uploadedUrls;
  }
}