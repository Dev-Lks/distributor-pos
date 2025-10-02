import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import type { PermissionKey } from "@prisma/client";

export async function getServerAuth() {
  const session = await getServerSession(authOptions);
  
  if (!session || !session.user) {
    return { session: null, isAdmin: false, permissions: [] as PermissionKey[], hasPermission: () => false };
  }

  const isAdmin = session.user.isAdmin || false;
  const permissions = (session.user.permissions || []) as PermissionKey[];

  const hasPermission = (permission: PermissionKey) => {
    return isAdmin || permissions.includes(permission);
  };

  return {
    session,
    isAdmin,
    permissions,
    hasPermission,
  };
}

export function unauthorized(message = "Não autorizado") {
  return Response.json({ error: message }, { status: 403 });
}

export function notAuthenticated(message = "Não autenticado") {
  return Response.json({ error: message }, { status: 401 });
}
