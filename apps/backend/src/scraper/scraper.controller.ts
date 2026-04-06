import { Controller, Post, Get, Param, UseGuards } from '@nestjs/common';
import { ScraperService } from './scraper.service';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../auth/auth.decorator';
import type { AuthUser } from '../auth/auth.decorator';

@Controller('scrape')
@UseGuards(AuthGuard)
export class ScraperController {
    constructor(private scraperService: ScraperService) { }

    // POST /api/scrape/:mangaId → bắt đầu cào
    @Post(':mangaId')
    enqueue(
        @CurrentUser() user: AuthUser,
        @Param('mangaId') mangaId: string,
    ) {
        return this.scraperService.enqueueScrapeJob(user.uid, mangaId);
    }

    // GET /api/scrape/status/:jobId → polling
    @Get('status/:jobId')
    getStatus(@Param('jobId') jobId: string) {
        return this.scraperService.getJobStatus(jobId);
    }
}