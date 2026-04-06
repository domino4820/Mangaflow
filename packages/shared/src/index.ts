// Shared types giữa frontend và backend

export interface Manga {
    id: string
    title: string
    coverUrl: string
    sourceUrl: string
    totalChapters: number
    status: 'pending' | 'scraping' | 'done' | 'error'
    createdAt: string
    userId: string
}

export interface Chapter {
    id: string
    mangaId: string
    chapterNumber: number
    title: string
    imageUrls: string[]
    scrapedAt: string
}

export interface UserQuota {
    used: number      // số truyện đã cào
    limit: number     // max 12
    remaining: number
}

export interface ScrapeJob {
    jobId: string
    mangaId: string
    status: 'waiting' | 'active' | 'completed' | 'failed'
    progress: number  // 0-100
    error?: string
}