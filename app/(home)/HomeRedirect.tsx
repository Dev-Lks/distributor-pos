'use client'

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

export function HomeRedirect() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    // Redirecionar para dashboard se estiver autenticado
    if (status === 'authenticated' && session) {
      router.replace('/dashboard')
    }
  }, [session, status, router])

  return null
}
