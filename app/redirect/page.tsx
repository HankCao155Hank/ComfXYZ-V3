"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { RefreshCw } from "lucide-react";

export default function RedirectPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "loading") return; // 还在加载中

    if (status === "authenticated") {
      // 已登录，跳转到主页
      router.push("/");
    } else {
      // 未登录，跳转到登录页
      router.push("/auth/signin");
    }
  }, [status, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardContent className="py-8 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <RefreshCw className="w-6 h-6 animate-spin text-blue-500" />
            <span className="text-lg font-medium">正在跳转...</span>
          </div>
          <p className="text-muted-foreground">
            请稍候，我们正在为您跳转到正确的页面
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
