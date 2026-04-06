import axios from 'axios'
import { auth } from './firebase'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
})

// Interceptor: tự động gắn Firebase token vào mọi request
api.interceptors.request.use(async (config) => {
  const user = auth.currentUser
  if (user) {
    const token = await user.getIdToken()
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Interceptor: xử lý lỗi global
api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      auth.signOut()
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default api