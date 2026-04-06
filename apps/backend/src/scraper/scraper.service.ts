import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { FirebaseService } from '../firebase/firebase.service';

@Injectable()
export class ScraperService {
  constructor(
    @InjectQueue('scraper') private scraperQueue: Queue,
    private firebaseService: FirebaseService,
  ) { }

  private get db() {
    return this.firebaseService.firestore;
  }

  // Đẩy job vào queue
  async enqueueScrapeJob(userId: string, mangaId: string) {
    const doc = await this.db.collection('mangas').doc(mangaId).get();

    if (!doc.exists) throw new NotFoundException('Manga not found');
    if (doc.data()?.userId !== userId) throw new BadRequestException('Unauthorized');
    if (doc.data()?.status === 'scraping') {
      throw new BadRequestException('Manga đang được cào, vui lòng đợi');
    }

    // Cập nhật status → scraping
    await this.db.collection('mangas').doc(mangaId).update({
      status: 'scraping',
      startedAt: new Date().toISOString(),
    });

    // Đẩy job vào BullMQ queue
    const job = await this.scraperQueue.add(
      'scrape-manga',  // tên job
      { mangaId, userId, sourceUrl: doc.data()?.sourceUrl },
      {
        attempts: 3,        // retry tối đa 3 lần nếu fail
        backoff: { type: 'exponential', delay: 5000 },
        removeOnComplete: false,  // giữ lại job đã xong để query status
        removeOnFail: false,
      },
    );

    return {
      jobId: job.id,
      mangaId,
      status: 'queued',
      message: 'Đã thêm vào hàng đợi, đang cào...',
    };
  }

  // Polling status của job
  async getJobStatus(jobId: string) {
    const job = await this.scraperQueue.getJob(jobId);
    if (!job) throw new NotFoundException('Job not found');

    const state = await job.getState();
    const progress = job.progress as number;

    return {
      jobId,
      state,           // waiting | active | completed | failed
      progress,        // 0-100
      data: job.data,
      failedReason: job.failedReason,
    };
  }
}