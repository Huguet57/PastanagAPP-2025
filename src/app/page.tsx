'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { CarrotIcon } from 'lucide-react'

export default function HomePage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'loading') return // Still loading

    if (!session) {
      router.push('/auth/signin')
      return
    }

    // If user is authenticated, redirect to dashboard
    router.push('/dashboard')
  }, [session, status, router])

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-carrot-50 to-carrot-100">
        <div className="text-center">
          <CarrotIcon className="h-16 w-16 text-carrot-500 mx-auto mb-4 animate-spin" />
          <p className="text-carrot-700 text-lg font-medium">Carregant...</p>
        </div>
      </div>
    )
  }

  return null
} 