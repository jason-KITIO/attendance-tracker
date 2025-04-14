"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { signOut, useSession } from "next-auth/react"

export function MainNav() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const isAdmin = session?.user?.role === "admin"

  return (
    <div className="flex items-center space-x-4 lg:space-x-6">
      <Link
        href="/dashboard"
        className={cn(
          "text-sm font-medium transition-colors hover:text-primary",
          pathname === "/dashboard" ? "text-primary" : "text-muted-foreground",
        )}
      >
        Dashboard
      </Link>
      {isAdmin && (
        <Link
          href="/admin"
          className={cn(
            "text-sm font-medium transition-colors hover:text-primary",
            pathname.startsWith("/admin") ? "text-primary" : "text-muted-foreground",
          )}
        >
          Admin
        </Link>
      )}
      {/* <Button
        variant="ghost"
        className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
        onClick={() => signOut({ callbackUrl: "/login" })}
      >
        Logout
      </Button> */}
    </div>
  )
}

