import { withAuth } from "next-auth/middleware";

export default withAuth(
  function middleware(req) {
    // 这里可以添加额外的中间件逻辑
  },
  {
    callbacks: {
      authorized: ({ token }) => {
        // 只有有有效 token 的用户才能访问受保护的路由
        return !!token;
      },
    },
  }
);

// 配置需要保护的路由
export const config = {
  matcher: [
    // 保护所有路由，除了认证相关的路由、landing page、根路径和静态资源
    "/((?!api/auth|auth|landing|_next/static|_next/image|favicon.ico|public|$).*)",
  ],
};
