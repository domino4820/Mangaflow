import { useQuota } from '@/hooks/useManga'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'

export default function QuotaBar() {
  const { data: quota, isLoading } = useQuota()

  if (isLoading) return null

  const used = quota?.used ?? 0
  const limit = quota?.limit ?? 12
  const percent = (used / limit) * 100

  return (
    <div className="rounded-lg border p-4 bg-card">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium">Dung lượng truyện</span>
        <Badge variant={used >= limit ? 'destructive' : 'secondary'}>
          {used} / {limit}
        </Badge>
      </div>
      <Progress value={percent} className="h-2" />
      {used >= limit && (
        <p className="text-xs text-destructive mt-2">
          Đã đạt giới hạn — xóa truyện cũ để thêm mới
        </p>
      )}
    </div>
  )
}