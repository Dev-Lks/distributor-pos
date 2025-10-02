import type { UserStatus, PermissionKey } from "@prisma/client";
import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      isAdmin: boolean;
      status: UserStatus;
      tenantId: string | null;
      permissions: PermissionKey[];
      pointsOfSale: Array<{
        id: string;
        name: string;
        isPrimary: boolean;
      }>;
    } & DefaultSession["user"];
  }

  interface User {
    isAdmin: boolean;
    status: UserStatus;
    tenantId: string | null;
    avatarUrl: string | null;
    permissions: PermissionKey[];
    pointsOfSale: Array<{
      id: string;
      name: string;
      isPrimary: boolean;
    }>;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    isAdmin: boolean;
    status: UserStatus;
    tenantId: string | null;
    permissions: PermissionKey[];
    pointsOfSale: Array<{
      id: string;
      name: string;
      isPrimary: boolean;
    }>;
  }
}
