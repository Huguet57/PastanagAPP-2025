import { NextAuthOptions } from 'next-auth'
import { PrismaAdapter } from '@next-auth/prisma-adapter'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { prisma } from './prisma'

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const user = await prisma.user.findUnique({
          where: {
            email: credentials.email
          }
        })

        if (!user) {
          return null
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password
        )

        if (!isPasswordValid) {
          return null
        }

        console.log('🔐 Authorization successful, returning user:', {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        });

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        }
      }
    })
  ],
  session: {
    strategy: 'jwt'
  },
  callbacks: {
    async jwt({ token, user }) {
      console.log('🎫 JWT callback - token before:', token);
      console.log('🎫 JWT callback - user:', user);
      
      if (user) {
        token.id = user.id
        token.role = user.role
      }
      
      console.log('🎫 JWT callback - token after:', token);
      return token
    },
    async session({ session, token }) {
      console.log('📦 Session callback - session before:', session);
      console.log('📦 Session callback - token:', token);
      
      if (token && session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as string
      }
      
      console.log('📦 Session callback - session after:', session);
      return session
    }
  },
  pages: {
    signIn: '/auth/signin',
    signUp: '/auth/signup',
  }
} 