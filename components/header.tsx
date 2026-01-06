"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Crown, LogOut, User, CreditCard } from "lucide-react"

interface UsageStatus {
  authenticated: boolean
  email?: string
  isPremium: boolean
  usageCount: number
  usageLimit: number | null
  isAdmin?: boolean
}

export function Header() {
  const [usageStatus, setUsageStatus] = useState<UsageStatus | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_IN" || event === "INITIAL_SESSION") {
        await fetchUsageStatus()
      } else if (event === "SIGNED_OUT") {
        setUsageStatus(null)
        setIsLoading(false)
      }
    })

    fetchUsageStatus()

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const fetchUsageStatus = async () => {
    try {
      const response = await fetch("/api/usage-status", { cache: "no-store" })
      const data = await response.json()
      if (!data.error) {
        setUsageStatus(data)
      }
    } catch (error) {
      // Silently fail - user will see login buttons if API fails
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogout = async () => {
    setUsageStatus(null)
    await supabase.auth.signOut()
    window.location.replace("/")
  }

  return (
    <nav className="sticky top-0 z-50 w-full bg-background transition-all duration-300 border-b border-gray-100">
      <div className="px-5 py-3 flex justify-between items-center max-w-lg mx-auto w-full">
        <Link href="/" className="flex items-center gap-2 cursor-pointer group">
          <span className="material-icons-round text-3xl text-gray-500 group-hover:text-primary transition-colors">
            blur_on
          </span>
          <span className="font-display font-bold text-xl tracking-tight text-gray-700 group-hover:text-primary transition-colors">
            clearview
          </span>
        </Link>

        <div className="flex items-center gap-2">
          {isLoading ? (
            <div className="h-9 w-20 bg-muted animate-pulse rounded-md" />
          ) : usageStatus?.authenticated ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-2 h-9 px-3">
                  <User className="h-4 w-4" />
                  <span className="text-xs hidden sm:inline">{usageStatus.email?.split("@")[0]}</span>
                  {usageStatus.isPremium && <Crown className="h-3 w-3 text-yellow-500" />}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <div className="px-2 py-1.5">
                  <p className="text-xs font-medium">{usageStatus.email}</p>
                  {usageStatus.isPremium ? (
                    <p className="text-xs text-yellow-600 font-medium flex items-center gap-1 mt-1">
                      <Crown className="h-3 w-3" /> Gói Pro (500 lượt/tháng)
                    </p>
                  ) : (
                    <p className="text-xs text-muted-foreground mt-1">
                      {usageStatus.usageCount}/{usageStatus.usageLimit} lượt miễn phí hôm nay
                    </p>
                  )}
                </div>
                <DropdownMenuSeparator />
                {!usageStatus.isPremium && (
                  <>
                    <DropdownMenuItem asChild>
                      <Link href="/pricing" className="cursor-pointer">
                        <CreditCard className="h-4 w-4 mr-2 text-primary" />
                        Nâng cấp Pro
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                  </>
                )}
                {usageStatus.isAdmin && (
                  <>
                    <DropdownMenuItem asChild>
                      <Link href="/protected/admin" className="cursor-pointer">
                        <span className="material-icons-round mr-2 text-sm">admin_panel_settings</span>
                        Admin Dashboard
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                  </>
                )}
                <DropdownMenuItem asChild>
                  <Link href="/affiliate" className="cursor-pointer">
                    <span className="material-icons-round mr-2 text-sm">trending_up</span>
                    Chương trình Đại lý
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-destructive cursor-pointer">
                  <LogOut className="h-4 w-4 mr-2" />
                  Đăng xuất
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex items-center gap-2">
              <Button asChild variant="ghost" size="sm" className="h-9 text-xs">
                <Link href="/auth/login">Đăng nhập</Link>
              </Button>
              <Button asChild size="sm" className="h-9 text-xs text-white">
                <Link href="/auth/sign-up">Đăng ký</Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}
