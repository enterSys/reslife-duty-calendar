import { DefaultSession } from "next-auth"

declare module "next-auth" {
  interface User {
    role?: string
    building?: string
    profileImage?: string
  }

  interface Session {
    user: {
      id: string
      role: string
      building?: string
      profileImage?: string
    } & DefaultSession["user"]
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string
    role: string
    building?: string
    profileImage?: string
  }
}