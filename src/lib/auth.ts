import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { prisma } from "@/lib/prisma"
import bcryptjs from "bcryptjs"
import { z } from "zod"

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
})

export const { handlers, signIn, signOut, auth } = NextAuth({
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/auth/login",
    signOut: "/auth/logout",
    error: "/auth/error",
  },
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        try {
          // Check if database is available
          if (!process.env?.DATABASE_URL) {
            console.error("DATABASE_URL not configured")
            return null
          }

          const { email, password } = loginSchema.parse(credentials)

          const user = await prisma.user.findUnique({
            where: { email },
            select: {
              id: true,
              email: true,
              fullName: true,
              role: true,
              passwordHash: true,
              building: true,
              profileImage: true,
            },
          })

          if (!user) {
            return null
          }

          const isValidPassword = await bcryptjs.compare(password, user.passwordHash)

          if (!isValidPassword) {
            return null
          }

          return {
            id: user.id.toString(),
            email: user.email,
            name: user.fullName,
            role: user.role,
            building: user.building || undefined,
            profileImage: user.profileImage || undefined,
          }
        } catch (error) {
          console.error("Auth error:", error)
          return null
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = user.role
        token.building = user.building
        token.profileImage = user.profileImage
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as string
        session.user.building = token.building as string | undefined
        session.user.profileImage = token.profileImage as string | undefined
      }
      return session
    },
  },
  // Add better error handling for production
  debug: process.env?.NODE_ENV === "development",
})