import { useNavigate } from 'react-router-dom'
import { useDeleteManga } from '@/hooks/useManga'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'

interface Props {
  manga: {
    id: string
    title: string
    coverUrl: string
    status: string
    totalChapters: number
    sourceUrl: string
  }
}

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  pending: { label: 'Chờ cào', variant: 'outline' },
  scraping: { label: 'Đang cào', variant: 'default' },
  done: { label: 'Hoàn thành', variant: 'secondary' },
  error: { label: 'Lỗi', variant: 'destructive' },
}

export default function MangaCard({ manga }: Props) {
  const navigate = useNavigate()
  const deleteManga = useDeleteManga()

  const status = statusConfig[manga.status] ?? statusConfig.pending

  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow">
      {/* Cover */}
      <div className="aspect-[3/4] bg-muted relative overflow-hidden">
        {manga.coverUrl ? (
          <img
            src={manga.coverUrl}
            alt={manga.title}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl">
            📚
          </div>
        )}
        <Badge
          variant={status.variant}
          className="absolute top-2 right-2 text-xs"
        >
          {status.label}
        </Badge>
      </div>

      <CardContent className="p-3 flex flex-col gap-2">
        <h3 className="font-medium text-sm line-clamp-2 leading-tight">
          {manga.title}
        </h3>
        <p className="text-xs text-muted-foreground">
          {manga.totalChapters} chapters
        </p>

        <div className="flex gap-1.5 mt-1">
          {manga.status === 'done' && (
            <Button
              size="sm"
              className="flex-1 h-7 text-xs"
              onClick={() => navigate(`/read/${manga.id}/1`)}
            >
              Đọc
            </Button>
          )}
          <Button
            size="sm"
            variant="outline"
            className="flex-1 h-7 text-xs text-destructive hover:text-destructive"
            onClick={() => {
              if (confirm(`Xóa "${manga.title}"?`)) {
                deleteManga.mutate(manga.id)
              }
            }}
            disabled={deleteManga.isPending}
          >
            Xóa
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}