"use client";

import { useSession, signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export function UserMenu() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return <div className="text-sm text-gray-500">加载中...</div>;
  }

  if (!session) {
    return (
      <div className="flex gap-2">
        <Link href="/auth/signin">
          <Button variant="outline" size="sm">
            登录
          </Button>
        </Link>
        <Link href="/auth/signup">
          <Button size="sm">
            注册
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-4">
      <span className="text-sm text-gray-700">
        欢迎，{session.user?.name || session.user?.email}
      </span>
      <Button
        variant="outline"
        size="sm"
        onClick={() => signOut({ callbackUrl: "/landing" })}
      >
        退出登录
      </Button>
    </div>
  );
}
