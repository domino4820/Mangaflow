import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../lib/api'
import type { Manga, UserQuota, ScrapeJob } from '@mangacloud/shared'

// Lấy danh sách manga
export function useMangaList() {
  return useQuery<Manga[]>({
    queryKey: ['mangas'],
    queryFn: async () => {
      const res = await api.get('/manga')
      return res.data
    },
  })
}

// Lấy quota
export function useQuota() {
  return useQuery<UserQuota>({
    queryKey: ['quota'],
    queryFn: async () => {
      const res = await api.get('/manga/quota')
      return res.data
    },
  })
}

// Tạo manga mới
export function useCreateManga() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: { title: string; sourceUrl: string }) =>
      api.post('/manga', data).then(r => r.data),
    onSuccess: () => {
      // Invalidate cache → tự fetch lại list
      queryClient.invalidateQueries({ queryKey: ['mangas'] })
      queryClient.invalidateQueries({ queryKey: ['quota'] })
    },
  })
}

// Xóa manga
export function useDeleteManga() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (mangaId: string) =>
      api.delete(`/manga/${mangaId}`).then(r => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mangas'] })
      queryClient.invalidateQueries({ queryKey: ['quota'] })
    },
  })
}

// Bắt đầu cào
export function useStartScrape() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (mangaId: string) =>
      api.post(`/scrape/${mangaId}`).then(r => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mangas'] })
    },
  })
}

// Polling job status
export function useJobStatus(jobId: string | null) {
  return useQuery<ScrapeJob>({
    queryKey: ['job', jobId],
    queryFn: async () => {
      const res = await api.get(`/scrape/status/${jobId}`)
      return res.data
    },
    enabled: !!jobId,
    refetchInterval: (query) => {
      // Tự động polling mỗi 2s khi job đang chạy
      const state = query.state.data?.status
      if (state === 'completed' || state === 'failed') return false
      return 2000
    },
  })
}