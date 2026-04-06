import { useState, useEffect } from 'react'
import type { User } from 'firebase/auth'
import { signInWithPopup, signOut } from 'firebase/auth'
import { auth, googleProvider } from '../lib/firebase'

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Lắng nghe thay đổi auth state
    const unsubscribe = auth.onAuthStateChanged((u) => {
      setUser(u)
      setLoading(false)
    })
    return unsubscribe // cleanup khi unmount
  }, [])

  const loginWithGoogle = () => signInWithPopup(auth, googleProvider)
  const logout = () => signOut(auth)

  return { user, loading, loginWithGoogle, logout }
}