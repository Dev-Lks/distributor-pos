import { compare } from "bcryptjs";
import type { UserRole, UserStatus } from "@prisma/client";
import type { NextAuthOptions } from "next-auth";
import type { AdapterUser } from "next-auth/adapters";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";

import { prisma } from "@/lib/prisma";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as any,
  session: {
    strategy: "jwt",
    maxAge: 8 * 60 * 60, // 8 horas
  },
  pages: {
    signIn: "/login",
    error: "/login",
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
          throw new Error("Email e senha são obrigatórios");
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email.toLowerCase() },
          include: {
            userPointsOfSale: {
              where: { isActive: true },
              include: {
                pointOfSale: true,
              },
            },
          },
        });

        if (!user) {
          throw new Error("Credenciais inválidas");
        }

        // Verificar status do usuário
        if (user.status === "INACTIVE") {
          throw new Error("Usuário inativo. Contate o administrador.");
        }

        if (user.status === "SUSPENDED") {
          throw new Error("Usuário suspenso. Contate o administrador.");
        }

        // Verificar bloqueio por tentativas falhas
        if (user.lockedUntil && user.lockedUntil > new Date()) {
          throw new Error("Conta temporariamente bloqueada. Tente novamente mais tarde.");
        }

        // Validar senha - suporta tanto passwordHash quanto password (legado)
        const passwordToCheck = user.passwordHash || user.password || "";
        const isPasswordValid = await compare(credentials.password, passwordToCheck);

        if (!isPasswordValid) {
          // Incrementar tentativas falhas
          await prisma.user.update({
            where: { id: user.id },
            data: {
              failedLoginAttempts: { increment: 1 },
              lockedUntil:
                user.failedLoginAttempts >= 4
                  ? new Date(Date.now() + 15 * 60 * 1000) // 15 minutos
                  : undefined,
            },
          });
          throw new Error("Credenciais inválidas");
        }

        // Reset tentativas falhas e atualizar último login
        await prisma.user.update({
          where: { id: user.id },
          data: {
            failedLoginAttempts: 0,
            lockedUntil: null,
            lastLoginAt: new Date(),
          },
        });

        return {
          id: user.id,
          email: user.email,
          name: user.fullName || user.name || null,
          role: user.role,
          status: user.status,
          avatarUrl: user.avatarUrl || null,
          tenantId: user.tenantId ?? null,
          pointsOfSale: user.userPointsOfSale.map((ups) => ({
            id: ups.pointOfSaleId,
            name: ups.pointOfSale.name,
            roleInPOS: ups.roleInPOS,
            isPrimary: ups.isPrimary,
          })),
        } as any;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const typedUser = user as AdapterUser & {
          role?: UserRole;
          status?: UserStatus;
          tenantId?: string;
          pointsOfSale?: any[];
        };
        token.id = user.id;
        token.role = typedUser.role;
        token.status = typedUser.status;
        token.tenantId = typedUser.tenantId;
        token.pointsOfSale = typedUser.pointsOfSale;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as UserRole;
        session.user.status = token.status as UserStatus;
        session.user.tenantId = (token.tenantId as string) || null;
        session.user.pointsOfSale = (token.pointsOfSale as any[]) || [];
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};
