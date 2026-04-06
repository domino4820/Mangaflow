import { useState } from 'react'
import { useCreateManga, useStartScrape, useJobStatus } from '@/hooks/useManga'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle, DialogTrigger,
} from '@/components/ui/dialog'

export default function ScrapeDialog() {
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [url, setUrl] = useState('')
  const [jobId, setJobId] = useState<string | null>(null)
  const [mangaId, setMangaId] = useState<string | null>(null)

  const createManga = useCreateManga()
  const startScrape = useStartScrape()
  const { data: jobStatus } = useJobStatus(jobId)

  const handleSubmit = async () => {
    if (!title || !url) return
    try {
      // Bước 1: tạo manga record
      const created = await createManga.mutateAsync({ title, sourceUrl: url })
      setMangaId(created.id)

      // Bước 2: enqueue scrape job
      const job = await startScrape.mutateAsync(created.id)
      setJobId(job.jobId)
    } catch (err: any) {
      alert(err.response?.data?.message || 'Có lỗi xảy ra')
    }
  }

  const isLoading = createManga.isPending || startScrape.isPending
  const isDone = jobStatus?.status === 'completed'
  const isFailed = jobStatus?.status === 'failed'
  const progress = typeof jobStatus?.progress === 'number' ? jobStatus.progress : 0

  const handleClose = () => {
    setOpen(false)
    setTitle('')
    setUrl('')
    setJobId(null)
    setMangaId(null)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>+ Thêm truyện</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Cào truyện mới</DialogTitle>
        </DialogHeader>

        {!jobId ? (
          <div className="flex flex-col gap-4 pt-2">
            <div className="flex flex-col gap-1.5">
              <Label>Tên truyện</Label>
              <Input
                placeholder="Ví dụ: Vinland Saga"
                value={title}
                onChange={e => setTitle(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>URL trang truyện</Label>
              <Input
                placeholder="https://..."
                value={url}
                onChange={e => setUrl(e.target.value)}
              />
            </div>
            <Button
              onClick={handleSubmit}
              disabled={isLoading || !title || !url}
              className="w-full"
            >
              {isLoading ? 'Đang xử lý...' : 'Bắt đầu cào'}
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-4 pt-2">
            {isDone ? (
              <>
                <p className="text-sm text-green-600 font-medium">✅ Cào hoàn thành!</p>
                <Button onClick={handleClose} className="w-full">Đóng</Button>
              </>
            ) : isFailed ? (
              <>
                <p className="text-sm text-destructive">❌ Cào thất bại: {jobStatus?.error}</p>
                <Button variant="outline" onClick={handleClose}>Đóng</Button>
              </>
            ) : (
              <>
                <p className="text-sm text-muted-foreground">
                  Đang cào... vui lòng không đóng trang
                </p>
                <Progress value={progress} className="h-3" />
                <p className="text-xs text-center text-muted-foreground">{progress}%</p>
              </>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}