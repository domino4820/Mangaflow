import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { MangaService } from './manga.service';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../auth/auth.decorator';
import type { AuthUser } from '../auth/auth.decorator';
import { CreateMangaDto } from './dto/create-manga.dto';

@Controller('manga')
@UseGuards(AuthGuard)
export class MangaController {
  constructor(private readonly mangaService: MangaService) { }

  /** GET /api/manga — List all mangas for the authenticated user */
  @Get()
  findAll(@CurrentUser() user: AuthUser) {
    return this.mangaService.getMangaList(user.uid);
  }

  /** GET /api/manga/quota — Get current quota for the authenticated user */
  @Get('quota')
  getQuota(@CurrentUser() user: AuthUser) {
    return this.mangaService.checkQuota(user.uid);
  }

  /** GET /api/manga/:id — Get manga detail + chapters */
  @Get(':id')
  findOne(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.mangaService.getMangaDetail(user.uid, id);
  }

  /** POST /api/manga — Create a new manga (checks quota) */
  @Post()
  create(
    @Body() dto: CreateMangaDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.mangaService.createManga(user.uid, dto);
  }

  /** DELETE /api/manga/:id — Soft delete a manga */
  @Delete(':id')
  remove(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.mangaService.deleteManga(user.uid, id);
  }
}