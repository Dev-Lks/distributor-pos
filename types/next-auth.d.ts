import type { UserRole, UserStatus } from "@prisma/client";
import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: UserRole;
      status: UserStatus;
      tenantId: string | null;
      pointsOfSale: Array<{
        id: string;
        name: string;
        roleInPOS: string;
        isPrimary: boolean;
      }>;
    } & DefaultSession["user"];
  }

  interface User {
    role: UserRole;
    status: UserStatus;
    tenantId: string | null;
    avatarUrl: string | null;
    pointsOfSale: Array<{
      id: string;
      name: string;
      roleInPOS: string;
      isPrimary: boolean;
    }>;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: UserRole;
    status: UserStatus;
    tenantId: string | null;
    pointsOfSale: Array<{
      id: string;
      name: string;
      roleInPOS: string;
      isPrimary: boolean;
    }>;
  }
}
