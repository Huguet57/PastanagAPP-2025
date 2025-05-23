'use client'

import { useState } from 'react'
import { signIn, getSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { CarrotIcon, EyeIcon, EyeOffIcon } from 'lucide-react'

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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-carrot-50 to-carrot-100 p-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="carrot-gradient rounded-full p-4 w-20 h-20 mx-auto mb-4 flex items-center justify-center">
            <CarrotIcon className="h-10 w-10 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Pastanagapp
          </h2>
          <p className="text-gray-600">
            Entra al teu compte per començar a jugar
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-carrot-500"
                placeholder="nom@example.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Contrasenya
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-carrot-500 pr-10"
                  placeholder="Introdueix la teva contrasenya"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showPassword ? (
                    <EyeOffIcon className="h-4 w-4 text-gray-400" />
                  ) : (
                    <EyeIcon className="h-4 w-4 text-gray-400" />
                  )}
                </button>
              </div>
            </div>

            {error && (
              <div className="text-red-600 text-sm text-center bg-red-50 p-2 rounded">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full carrot-gradient text-white py-2 px-4 rounded-md hover:opacity-90 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {isLoading ? 'Entrant...' : 'Entrar'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              No tens compte?{' '}
              <a href="/auth/signup" className="text-carrot-600 hover:text-carrot-500 font-medium">
                Registra't aquí
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
} 