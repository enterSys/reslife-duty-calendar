"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { UserAvatar } from "@/components/ui/user-avatar";

export function Navbar() {
  const pathname = usePathname();
  const { data: session } = useSession();

  // Hide navbar on login and register pages
  if (pathname === "/auth/login" || pathname === "/auth/register") {
    return null;
  }

  return (
    <nav className="w-full border-b bg-background/80 backdrop-blur sticky top-0 z-40">
      <div className="container mx-auto flex items-center justify-between h-16 px-4">
        <Link href="/dashboard" className="text-xl font-bold tracking-tight">
          ResLife Duty Calendar
        </Link>
        {session?.user && (
          <UserAvatar
            user={{
              name: session.user.name || undefined,
              email: session.user.email || undefined,
              allocatedBuilding: session.user.allocatedBuilding || undefined,
            }}
          />
        )}
      </div>
    </nav>
  );
} 