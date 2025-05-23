import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('ca-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

export function formatRelativeTime(date: Date): string {
  const now = new Date()
  const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
  
  if (diffInMinutes < 1) {
    return 'Ara mateix'
  } else if (diffInMinutes < 60) {
    return `Fa ${diffInMinutes} minut${diffInMinutes > 1 ? 's' : ''}`
  } else if (diffInMinutes < 1440) { // 24 hours
    const hours = Math.floor(diffInMinutes / 60)
    return `Fa ${hours} hora${hours > 1 ? 's' : ''}`
  } else {
    const days = Math.floor(diffInMinutes / 1440)
    return `Fa ${days} dia${days > 1 ? 's' : ''}`
  }
}

export function generateGameCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let result = ''
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

export function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

export function createTargetChain<T extends { id: string }>(participants: T[]): Map<string, string> {
  if (participants.length < 2) {
    throw new Error('Need at least 2 participants to create a target chain')
  }

  const shuffled = shuffleArray(participants)
  const targetMap = new Map<string, string>()

  for (let i = 0; i < shuffled.length; i++) {
    const nextIndex = (i + 1) % shuffled.length
    targetMap.set(shuffled[i].id, shuffled[nextIndex].id)
  }

  return targetMap
}

export function validateSignature(signature: string): boolean {
  // Basic validation - check if it's a valid base64 string
  try {
    return btoa(atob(signature)) === signature
  } catch {
    return false
  }
}

export function getStatusColor(status: string): string {
  switch (status) {
    case 'ALIVE':
      return 'text-green-600 bg-green-100'
    case 'ELIMINATED':
      return 'text-red-600 bg-red-100'
    case 'WINNER':
      return 'text-yellow-600 bg-yellow-100'
    case 'SETUP':
      return 'text-blue-600 bg-blue-100'
    case 'ACTIVE':
      return 'text-green-600 bg-green-100'
    case 'PAUSED':
      return 'text-yellow-600 bg-yellow-100'
    case 'ENDED':
      return 'text-gray-600 bg-gray-100'
    default:
      return 'text-gray-600 bg-gray-100'
  }
}

export function getStatusText(status: string): string {
  switch (status) {
    case 'ALIVE':
      return 'Viu'
    case 'ELIMINATED':
      return 'Eliminat'
    case 'WINNER':
      return 'Guanyador'
    case 'SETUP':
      return 'Configuració'
    case 'ACTIVE':
      return 'Actiu'
    case 'PAUSED':
      return 'Pausat'
    case 'ENDED':
      return 'Finalitzat'
    default:
      return status
  }
}

export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
} 