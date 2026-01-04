"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Copy, Share2, TrendingUp, DollarSign, Users } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface AffiliateStats {
  referralCode: string
  totalReferrals: number
  totalEarnings: number
  pendingEarnings: number
  completedEarnings: number
}

export default function AffiliatePage() {
  const [stats, setStats] = useState<AffiliateStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [authenticated, setAuthenticated] = useState(false)
  const [copied, setCopied] = useState(false)
  const { toast } = useToast()
  const supabase = createClient()

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session) {
        setAuthenticated(false)
        setLoading(false)
        return
      }

      setAuthenticated(true)
      fetchAffiliateStats()
    } catch (error) {
      console.error("[v0] Auth check error:", error)
      setLoading(false)
    }
  }

  const fetchAffiliateStats = async () => {
    try {
      const response = await fetch("/api/affiliate/stats")
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch stats")
      }

      setStats(data)
    } catch (error: any) {
      console.error("[v0] Error fetching stats:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to load affiliate stats",
      })
    } finally {
      setLoading(false)
    }
  }

  const referralUrl = stats ? `${window.location.origin}?ref=${stats.referralCode}` : ""

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(referralUrl)
      setCopied(true)
      toast({
        title: "Copied!",
        description: "Referral link copied to clipboard",
      })
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to copy link",
      })
    }
  }

  const shareReferral = async () => {
    if (!navigator.share) {
      copyToClipboard()
      return
    }

    try {
      await navigator.share({
        title: "ClearView - Remove Watermarks with AI",
        text: "Kiếm 30% hoa hồng từ mỗi người bạn giới thiệu nâng cấp Pro! Nhân viên tháng đầu, không giới hạn số lần.",
        url: referralUrl,
      })
    } catch (error) {
      console.error("[v0] Share error:", error)
    }
  }

  if (loading) {
    return (
      <main className="flex-grow w-full max-w-lg mx-auto relative overflow-hidden min-h-screen bg-[#f8fafc]">
        <Header />
        <div className="px-6 py-16 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </div>
      </main>
    )
  }

  if (!authenticated) {
    return (
      <main className="flex-grow w-full max-w-lg mx-auto relative overflow-hidden min-h-screen bg-[#f8fafc]">
        <Header />
        <div className="px-6 py-16">
          <div className="text-center space-y-4">
            <h1 className="font-display font-bold text-3xl">Trở thành Đại lý</h1>
            <p className="text-muted-foreground">Đăng nhập để xem chương trình hoa hồng của bạn</p>
            <div className="flex gap-2 justify-center pt-4">
              <Button asChild>
                <a href="/auth/login">Đăng nhập</a>
              </Button>
              <Button asChild variant="outline">
                <a href="/auth/sign-up">Đăng ký</a>
              </Button>
            </div>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="flex-grow w-full max-w-lg mx-auto relative overflow-hidden min-h-screen bg-[#f8fafc]">
      <Header />

      <div className="px-6 py-8 space-y-8 inset-0 dot-bg">
        {/* Header Section */}
        <div className="space-y-2">
          <h1 className="font-display font-bold text-3xl text-foreground">Chương trình Đại lý</h1>
          <p className="text-muted-foreground">Kiếm hoa hồng 30% từ mỗi người bạn giới thiệu nâng cấp Pro</p>
        </div>

        {/* Referral Link Section */}
        {stats && (
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100/50 border-blue-200 p-6 space-y-4">
            <div className="space-y-2">
              <p className="text-sm font-medium text-blue-900">Liên kết giới thiệu của bạn</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={referralUrl}
                  readOnly
                  className="flex-1 bg-white border border-blue-200 rounded-lg px-3 py-2 text-sm font-mono text-gray-700"
                />
                <Button
                  onClick={copyToClipboard}
                  variant="outline"
                  size="sm"
                  className="border-blue-200 hover:bg-blue-50 bg-transparent"
                >
                  <Copy className="h-4 w-4" />
                  {copied ? "Copied" : "Copy"}
                </Button>
              </div>
            </div>

            <Button onClick={shareReferral} className="w-full bg-primary hover:bg-black gap-2 text-white">
              <Share2 className="h-4 w-4" />
              Chia sẻ với bạn bè
            </Button>

            <div className="bg-white rounded-lg p-3 space-y-1 text-xs">
              <p className="text-gray-600">
                <span className="font-semibold">Mã đại lý:</span> {stats.referralCode}
              </p>
              <p className="text-gray-500">Chia sẻ liên kết này để bạn bè đăng ký và nâng cấp Pro</p>
            </div>
          </Card>
        )}

        {/* Stats Section */}
        <div className="grid grid-cols-1 gap-4">
          {/* Total Referrals */}
          <Card className="bg-gradient-to-br from-green-50 to-green-100/50 border-green-200 p-6">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-green-900">Tổng giới thiệu</p>
                <p className="text-3xl font-bold text-green-700">{stats?.totalReferrals || 0}</p>
              </div>
              <div className="p-3 bg-green-200 rounded-lg">
                <Users className="h-6 w-6 text-green-700" />
              </div>
            </div>
          </Card>

          {/* Total Earnings */}
          <Card className="bg-gradient-to-br from-purple-50 to-purple-100/50 border-purple-200 p-6">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-purple-900">Tổng hoa hồng</p>
                <p className="text-3xl font-bold text-purple-700">${stats?.totalEarnings.toFixed(2) || "0.00"}</p>
              </div>
              <div className="p-3 bg-purple-200 rounded-lg">
                <DollarSign className="h-6 w-6 text-purple-700" />
              </div>
            </div>
          </Card>

          {/* Completed Earnings */}
          <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100/50 border-yellow-200 p-6">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-yellow-900">Đã nhận</p>
                <p className="text-3xl font-bold text-yellow-700">${stats?.completedEarnings.toFixed(2) || "0.00"}</p>
              </div>
              <div className="p-3 bg-yellow-200 rounded-lg">
                <TrendingUp className="h-6 w-6 text-yellow-700" />
              </div>
            </div>
          </Card>

          {/* Pending Earnings */}
          {stats && stats.pendingEarnings > 0 && (
            <Card className="bg-gradient-to-br from-blue-50 to-blue-100/50 border-blue-200 p-6">
              <div className="space-y-2">
                <p className="text-sm font-medium text-blue-900">Hoa hồng chờ xử lý</p>
                <p className="text-2xl font-bold text-blue-700">${stats.pendingEarnings.toFixed(2)}</p>
                <p className="text-xs text-blue-600">Sẽ được thanh toán vào đầu tháng tiếp theo</p>
              </div>
            </Card>
          )}
        </div>

        {/* How it works */}
        <Card className="bg-gray-50 border-gray-200 p-6 space-y-4">
          <h3 className="font-display font-bold text-lg text-foreground">Cách thức hoạt động</h3>
          <div className="space-y-4">
            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center h-8 w-8 rounded-full bg-primary text-white font-bold text-sm">
                  1
                </div>
              </div>
              <div>
                <p className="font-medium text-foreground">Chia sẻ liên kết của bạn</p>
                <p className="text-sm text-muted-foreground">
                  Sao chép và chia sẻ liên kết giới thiệu của bạn với bạn bè
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center h-8 w-8 rounded-full bg-primary text-white font-bold text-sm">
                  2
                </div>
              </div>
              <div>
                <p className="font-medium text-foreground">Bạn bè đăng ký và nâng cấp</p>
                <p className="text-sm text-muted-foreground">
                  Họ sử dụng liên kết của bạn để đăng ký và nâng cấp gói Pro
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-8 w-8 rounded-full bg-primary text-white font-bold text-sm">
                    3
                  </div>
                </div>
              </div>
              <div>
                <p className="font-medium text-foreground">Nhận 30% hoa hồng</p>
                <p className="text-sm text-muted-foreground">Bạn nhận 30% giá trị đơn hàng của họ từ tháng đầu tiên</p>
              </div>
            </div>
          </div>
        </Card>

        <div className="pb-8 space-y-2 text-center">
          <p className="text-xs text-muted-foreground">Hoa hồng được tính từ tháng đầu tiên nâng cấp Pro</p>
          <p className="text-xs text-muted-foreground">Thanh toán hàng tháng vào đầu tháng</p>
        </div>
      </div>
    </main>
  )
}
