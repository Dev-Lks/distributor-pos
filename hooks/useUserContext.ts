"use client";

import { useSession } from "next-auth/react";
import { useMemo } from "react";

export function useUserContext() {
  const { data: session } = useSession();

  const userPOSIds = useMemo(() => {
    return session?.user?.pointsOfSale?.map((pos) => pos.id) || [];
  }, [session]);

  const primaryPOS = useMemo(() => {
    return session?.user?.pointsOfSale?.find((pos) => pos.isPrimary);
  }, [session]);

  const canAccessPOS = (posId: string) => {
    if (session?.user?.isAdmin) return true;
    return userPOSIds.includes(posId);
  };

  const shouldFilterByPOS = () => {
    return !session?.user?.isAdmin;
  };

  return {
    user: session?.user,
    userPOSIds,
    primaryPOS,
    canAccessPOS,
    shouldFilterByPOS,
  };
}
