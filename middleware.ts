import { withAuth } from "next-auth/middleware"

export default withAuth({
  callbacks: {
    authorized: ({ token }: { token: unknown }) => Boolean(token),
  },
  pages: {
    signIn: "/login",
  },
})

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/api/inventory/:path*",
    "/api/points/:path*",
    "/api/product-points-of-sale/:path*",
    "/api/products/:path*",
    "/api/sales/:path*",
  ],
}
