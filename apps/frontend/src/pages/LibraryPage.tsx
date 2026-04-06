import { useAuth } from '@/hooks/useAuth'
import { useMangaList } from '@/hooks/useManga'
import { Button } from '@/components/ui/button'
import QuotaBar from '@/components/manga/QuotaBar'
import MangaCard from '@/components/manga/MangaCard'
import ScrapeDialog from '@/components/manga/ScrapeDialog'

export default function LibraryPage() {
  const { user, logout } = useAuth()
  const { data: mangas, isLoading } = useMangaList()

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b sticky top-0 bg-background/80 backdrop-blur-sm z-10">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <span className="font-semibold text-lg">📚 MangaFlow</span>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground hidden sm:block">
              {user?.email}
            </span>
            <Button variant="ghost" size="sm" onClick={logout}>
              Đăng xuất
            </Button>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-5xl mx-auto px-4 py-6 flex flex-col gap-6">
        {/* Quota + Add button */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="w-full sm:w-80">
            <QuotaBar />
          </div>
          <ScrapeDialog />
        </div>

        {/* Manga Grid */}
        {isLoading ? (
          <div className="text-center text-muted-foreground py-20">Đang tải...</div>
        ) : !mangas?.length ? (
          <div className="text-center py-20 flex flex-col items-center gap-3">
            <span className="text-5xl">📭</span>
            <p className="text-muted-foreground">Chưa có truyện nào</p>
            <p className="text-sm text-muted-foreground">
              Nhấn "+ Thêm truyện" để bắt đầu cào
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {mangas.map(manga => (
              <MangaCard key={manga.id} manga={manga as any} />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}