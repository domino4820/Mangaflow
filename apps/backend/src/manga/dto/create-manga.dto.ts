import { IsString, IsUrl } from 'class-validator';

export class CreateMangaDto {
  @IsString()
  title: string;

  @IsUrl()
  sourceUrl: string;  // URL trang truyện muốn cào
}