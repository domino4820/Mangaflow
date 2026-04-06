import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function LoginPage() {
  const { user, loading, loginWithGoogle } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (user) navigate('/')
  }, [user, navigate])

  return (
    <div className="flex h-screen items-center justify-center bg-background">
      <Card className="w-[380px]">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">📚 MangaFlow</CardTitle>
          <CardDescription>
            Cào và đọc manga mọi lúc mọi nơi
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <Button
            onClick={loginWithGoogle}
            disabled={loading}
            className="w-full"
          >
            Đăng nhập với Google
          </Button>
          <p className="text-center text-xs text-muted-foreground">
            Mỗi tài khoản được lưu tối đa 12 bộ truyện
          </p>
        </CardContent>
      </Card>
    </div>
  )
}