import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ScraperService } from './scraper.service';
import { ScraperController } from './scraper.controller';
import { ScraperProcessor } from './scraper.processor';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'scraper',  // tên queue trong Redis
    }),
    AuthModule,
  ],
  controllers: [ScraperController],
  providers: [ScraperService, ScraperProcessor],
})
export class ScraperModule { }