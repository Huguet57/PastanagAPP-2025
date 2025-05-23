'use client'

import { useState } from 'react'
import { signIn, getSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { CarrotIcon, EyeIcon, EyeOffIcon, Skull, Target } from 'lucide-react'

export default function SignInPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        setError('Credencials incorrectes')
      } else {
        const session = await getSession()
        if (session) {
          router.push('/dashboard')
          router.refresh()
        }
      }
    } catch (error) {
      setError('Error en el login')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-400 via-orange-300 to-yellow-300 p-4">
      <div className="max-w-md w-full space-y-8">
        {/* Fun animated icons */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-10 left-10 animate-bounce">
            <Target className="h-12 w-12 text-orange-600/20" />
          </div>
          <div className="absolute bottom-20 right-20 animate-pulse">
            <Skull className="h-16 w-16 text-red-600/20" />
          </div>
          <div className="absolute top-1/3 right-10 animate-bounce delay-75">
            <CarrotIcon className="h-10 w-10 text-orange-600/20 rotate-45" />
          </div>
        </div>

        <div className="text-center relative z-10">
          <div className="bg-white rounded-full p-6 w-32 h-32 mx-auto mb-4 flex items-center justify-center shadow-2xl border-4 border-orange-400">
            <CarrotIcon className="h-16 w-16 text-orange-500" />
          </div>
          <h1 className="text-5xl font-bold text-white mb-2 drop-shadow-lg">
            Pastanaga
          </h1>
          <h2 className="text-2xl font-bold text-white mb-2 drop-shadow-lg">
            Assassina
          </h2>
          <p className="text-white/90 text-lg drop-shadow">
            Qui serà l'últim supervivent? 🔪
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8 relative z-10">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-bold text-gray-700 mb-2">
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border-2 border-orange-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all"
                placeholder="nom@example.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-bold text-gray-700 mb-2">
                Contrasenya
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-orange-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 pr-12 transition-all"
                  placeholder="La teva contrasenya secreta"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showPassword ? (
                    <EyeOffIcon className="h-5 w-5 text-orange-400 hover:text-orange-600" />
                  ) : (
                    <EyeIcon className="h-5 w-5 text-orange-400 hover:text-orange-600" />
                  )}
                </button>
              </div>
            </div>

            {error && (
              <div className="text-red-600 text-sm text-center bg-red-50 p-3 rounded-lg border border-red-200">
                💀 {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white py-3 px-6 rounded-lg hover:from-orange-600 hover:to-red-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-bold text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              {isLoading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Entrant...
                </span>
              ) : (
                'Entra al joc'
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              No tens compte?{' '}
              <a href="/auth/signup" className="text-orange-600 hover:text-orange-700 font-bold underline">
                Uneix-te a la batalla!
              </a>
            </p>
          </div>
        </div>

        {/* Fun footer */}
        <p className="text-center text-white/80 text-sm drop-shadow">
          🥕 Vigila l'esquena... mai saps qui et pot estar observant 👀
        </p>
      </div>
    </div>
  )
} 