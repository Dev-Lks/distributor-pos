import { compare } from "bcryptjs"
import type { Role } from "@prisma/client"
import type { NextAuthOptions, Session } from "next-auth"
import type { JWT } from "next-auth/jwt"
import Credentials from "next-auth/providers/credentials"

import { prisma } from "@/lib/prisma"

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  providers: [
    Credentials({
      name: "Credenciais",
      credentials: {
        email: { label: "E-mail", type: "email", placeholder: "admin@nitrobeer.com" },
        password: { label: "Senha", type: "password" },
      },
      async authorize(credentials: Record<"email" | "password", string> | undefined) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email.toLowerCase() },
        })

        if (!user) {
          return null
        }

        if (!user.isActive) {
          throw new Error("Usuário desativado. Procure o administrador.")
        }

        const isValidPassword = await compare(credentials.password, user.password)

        if (!isValidPassword) {
          return null
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name ?? undefined,
          role: user.role,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }: { token: JWT; user?: { role?: Role } & Record<string, unknown> | null }) {
      if (user) {
        token.role = user.role
      }
      return token
    },
    async session({ session, token }: { session: Session; token: JWT }) {
      if (session.user) {
        session.user.id = token.sub ?? ""
        session.user.role = token.role as string | undefined
      }
      return session
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
}
