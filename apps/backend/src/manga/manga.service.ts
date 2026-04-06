import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { FirebaseService } from '../firebase/firebase.service';
import { CreateMangaDto } from './dto/create-manga.dto';

const QUOTA_LIMIT = 12;

@Injectable()
export class MangaService {
  constructor(private firebaseService: FirebaseService) { }

  private get db() {
    return this.firebaseService.firestore;
  }

  // Kiểm tra quota của user
  async checkQuota(userId: string): Promise<{ used: number; remaining: number }> {
    const snapshot = await this.db
      .collection('mangas')
      .where('userId', '==', userId)
      .where('deleted', '==', false)
      .get();

    const used = snapshot.size;
    return { used, remaining: QUOTA_LIMIT - used };
  }

  // Lấy danh sách manga của user
  async getMangaList(userId: string) {
    const snapshot = await this.db
      .collection('mangas')
      .where('userId', '==', userId)
      .where('deleted', '==', false)
      .orderBy('createdAt', 'desc')
      .get();

    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data()! }));
  }

  // Tạo manga mới (chưa cào)
  async createManga(userId: string, dto: CreateMangaDto) {
    const quota = await this.checkQuota(userId);

    if (quota.remaining <= 0) {
      throw new BadRequestException(
        `Đã đạt giới hạn ${QUOTA_LIMIT} truyện. Xóa truyện cũ để thêm mới.`
      );
    }

    const docRef = await this.db.collection('mangas').add({
      userId,
      title: dto.title,
      sourceUrl: dto.sourceUrl,
      status: 'pending',
      totalChapters: 0,
      coverUrl: '',
      deleted: false,
      createdAt: new Date().toISOString(),
    });

    return { id: docRef.id, message: 'Manga created, ready to scrape' };
  }

  // Xóa mềm manga (giải phóng quota)
  async deleteManga(userId: string, mangaId: string) {
    const docRef = this.db.collection('mangas').doc(mangaId);
    const doc = await docRef.get();

    if (!doc.exists) throw new NotFoundException('Manga not found');
    if (doc.data()?.userId !== userId) throw new BadRequestException('Unauthorized');

    await docRef.update({ deleted: true, deletedAt: new Date().toISOString() });
    return { message: 'Manga deleted' };
  }

  // Lấy chi tiết 1 manga + chapters
  async getMangaDetail(userId: string, mangaId: string) {
    const doc = await this.db.collection('mangas').doc(mangaId).get();
    if (!doc.exists || doc.data()?.userId !== userId) {
      throw new NotFoundException('Manga not found');
    }

    const chapters = await this.db
      .collection('chapters')
      .where('mangaId', '==', mangaId)
      .orderBy('chapterNumber', 'asc')
      .get();

    return {
      manga: { id: doc.id, ...doc.data() },
      chapters: chapters.docs.map(d => ({ id: d.id, ...d.data() })),
    };
  }
}