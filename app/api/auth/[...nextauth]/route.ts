import NextAuth from "next-auth"

import { authOptions } from "@/lib/auth"

// Force dynamic rendering - critical for real-time updates
export const dynamic = 'force-dynamic'
export const revalidate = 0

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }
