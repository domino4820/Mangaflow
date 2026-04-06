import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import api from '@/lib/api'

interface Chapter {
  id: string
  chapterNumber: number
  title: string
  imageUrls: string[]
}

interface MangaDetail {
  manga: { id: string; title: string; totalChapters: number }
  chapters: Chapter[]
}

// Component lazy load từng ảnh
function LazyImage({ src, alt }: { src: string; alt: string }) {
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState(false)
  const imgRef = useRef<HTMLImageElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && imgRef.current) {
          imgRef.current.src = src
          observer.disconnect()
        }
      },
      { rootMargin: '200px' } // preload trước 200px
    )
    if (imgRef.current) observer.observe(imgRef.current)
    return () => observer.disconnect()
  }, [src])

  return (
    <div className="w-full bg-muted relative">
      {!loaded && !error && (
        <div className="w-full h-64 flex items-center justify-center text-muted-foreground text-sm animate-pulse">
          Đang tải...
        </div>
      )}
      {error && (
        <div className="w-full h-32 flex items-center justify-center text-destructive text-sm">
          ❌ Không tải được ảnh
        </div>
      )}
      <img
        ref={imgRef}
        alt={alt}
        className={`w-full h-auto block transition-opacity duration-300 ${loaded ? 'opacity-100' : 'opacity-0 absolute top-0'
          }`}
        onLoad={() => setLoaded(true)}
        onError={() => { setError(true); setLoaded(true) }}
      />
    </div>
  )
}

export default function ReaderPage() {
  const { mangaId, chapterNumber } = useParams()
  const navigate = useNavigate()
  const currentChapter = Number(chapterNumber)

  const { data, isLoading } = useQuery<MangaDetail>({
    queryKey: ['manga', mangaId],
    queryFn: () => api.get(`/manga/${mangaId}`).then(r => r.data),
    enabled: !!mangaId,
  })

  const chapter = data?.chapters.find(
    c => c.chapterNumber === currentChapter
  )
  const totalChapters = data?.manga.totalChapters ?? 0
  const hasPrev = currentChapter > 1
  const hasNext = currentChapter < totalChapters

  const goToChapter = (n: number) => {
    navigate(`/read/${mangaId}/${n}`)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  if (isLoading) return (
    <div className="flex h-screen items-center justify-center text-muted-foreground">
      Đang tải...
    </div>
  )

  if (!chapter) return (
    <div className="flex h-screen flex-col items-center justify-center gap-4">
      <p className="text-muted-foreground">Không tìm thấy chapter</p>
      <Button variant="outline" onClick={() => navigate('/')}>← Về thư viện</Button>
    </div>
  )

  return (
    <div className="min-h-screen bg-black">
      {/* Top bar */}
      <div className="sticky top-0 z-10 bg-black/90 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-3xl mx-auto px-4 h-12 flex items-center justify-between gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="text-white/70 hover:text-white hover:bg-white/10 shrink-0"
            onClick={() => navigate('/')}
          >
            ← Thư viện
          </Button>

          <span className="text-white/80 text-sm truncate text-center">
            {data?.manga.title} · Ch.{currentChapter}
          </span>

          <div className="flex gap-1 shrink-0">
            <Button
              variant="ghost"
              size="sm"
              className="text-white/70 hover:text-white hover:bg-white/10"
              disabled={!hasPrev}
              onClick={() => goToChapter(currentChapter - 1)}
            >
              ‹ Trước
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-white/70 hover:text-white hover:bg-white/10"
              disabled={!hasNext}
              onClick={() => goToChapter(currentChapter + 1)}
            >
              Sau ›
            </Button>
          </div>
        </div>
      </div>

      {/* Pages */}
      <div className="max-w-3xl mx-auto">
        {chapter.imageUrls.filter(Boolean).map((url, i) => (
          <LazyImage
            key={i}
            src={url}
            alt={`Trang ${i + 1}`}
          />
        ))}
      </div>

      {/* Bottom navigation */}
      <div className="max-w-3xl mx-auto px-4 py-8 flex justify-between gap-4">
        <Button
          variant="outline"
          className="flex-1 bg-white/5 border-white/20 text-white hover:bg-white/10"
          disabled={!hasPrev}
          onClick={() => goToChapter(currentChapter - 1)}
        >
          ← Chapter trước
        </Button>
        <Button
          variant="outline"
          className="flex-1 bg-white/5 border-white/20 text-white hover:bg-white/10"
          disabled={!hasNext}
          onClick={() => goToChapter(currentChapter + 1)}
        >
          Chapter sau →
        </Button>
      </div>
    </div>
  )
}