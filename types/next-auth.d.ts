import NextAuth from "next-auth"

declare module "next-auth" {
  interface User {
    id: string
    email?: string | null
  }

  interface Session {
    user: User
  }

  interface JWT {
    id: string
  }
}