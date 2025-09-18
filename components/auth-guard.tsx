"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { RefreshCw } from "lucide-react";

interface AuthGuardProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export function AuthGuard({ children, fallback }: AuthGuardProps) {
  const { status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      // 用户未登录，重定向到 landing page
      router.push("/landing");
    }
  }, [status, router]);

  // 加载中状态
  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardContent className="py-8 text-center">
            <div className="flex items-center justify-center gap-2 mb-4">
              <RefreshCw className="w-6 h-6 animate-spin text-blue-500" />
              <span className="text-lg font-medium">正在验证身份...</span>
            </div>
            <p className="text-muted-foreground">
              请稍候，我们正在检查您的登录状态
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // 未认证状态
  if (status === "unauthenticated") {
    return fallback || (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardContent className="py-8 text-center">
            <div className="mb-4">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                需要登录
              </h2>
              <p className="text-muted-foreground">
                请先登录以访问此页面
              </p>
            </div>
            <div className="text-sm text-muted-foreground">
              正在跳转到登录页面...
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // 已认证，显示子组件
  return <>{children}</>;
}
