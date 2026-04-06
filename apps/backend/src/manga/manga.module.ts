import { Module } from '@nestjs/common';
import { MangaController } from './manga.controller';
import { MangaService } from './manga.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [MangaController],
  providers: [MangaService],
})
export class MangaModule { }