"use client"

import Link from "next/link"
import { Check, Crown, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Header } from "@/components/header"
import { useState } from "react"
import { useRouter } from "next/navigation"

export default function PricingPageClient() {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleUpgrade = async () => {
    setIsLoading(true)
    window.location.href = "/api/checkout"
  }

  return (
    <div className="min-h-screen bg-slate-50/50 flex flex-col">
      <Header />
      <main className="flex-1 py-12 px-5 inset-0 dot-bg">
        <div className="max-w-4xl mx-auto text-center mb-12">
          <h1 className="text-3xl font-display font-bold tracking-tight mb-4">Chọn gói dịch vụ của bạn</h1>
          <p className="text-slate-500 max-w-lg mx-auto">
            Sử dụng miễn phí hoặc nâng cấp để trải nghiệm toàn bộ sức mạnh của AI xóa watermark.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
          {/* Free Plan */}
          <Card className="flex flex-col border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="text-xl">Miễn phí</CardTitle>
              <CardDescription>Cơ bản cho người dùng mới</CardDescription>
              <div className="mt-4">
                <span className="text-3xl font-bold">0đ</span>
                <span className="text-slate-500 ml-1">/tháng</span>
              </div>
            </CardHeader>
            <CardContent className="flex-1 space-y-4">
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  <span>Xóa watermark bằng AI</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  <span>5 lượt xử lý mỗi ngày</span>
                </li>
                <li className="flex items-center gap-2 text-slate-400">
                  <Check className="h-4 w-4" />
                  <span>Độ phân giải tiêu chuẩn</span>
                </li>
              </ul>
            </CardContent>
            <CardFooter>
              <Button asChild variant="outline" className="w-full bg-transparent">
                <Link href="/">Bắt đầu ngay</Link>
              </Button>
            </CardFooter>
          </Card>

          {/* Pro Plan */}
          <Card className="flex flex-col border-primary/20 shadow-md relative overflow-hidden bg-white hover:shadow-lg transition-shadow">
            <div className="absolute top-0 right-0 px-3 py-1 bg-primary text-white text-[10px] font-bold uppercase tracking-wider rounded-bl-lg">
              Phổ biến nhất
            </div>
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2">
                Pro <Crown className="h-4 w-4 text-yellow-500" />
              </CardTitle>
              <CardDescription>Dành cho nhu cầu chuyên nghiệp</CardDescription>
              <div className="mt-4">
                <span className="text-3xl font-bold">$9.9</span>
                <span className="text-slate-500 ml-1">/tháng</span>
              </div>
            </CardHeader>
            <CardContent className="flex-1 space-y-4">
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  <span>Xóa watermark bằng AI mạnh mẽ nhất</span>
                </li>
                <li className="flex items-center gap-2 font-medium">
                  <Check className="h-4 w-4 text-green-500" />
                  <span>500 lượt tải chất lượng cao / tháng</span>
                </li>
                <li className="flex items-center gap-2 text-primary">
                  <Zap className="h-4 w-4 fill-primary/20" />
                  <span>Ưu tiên xử lý nhanh</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  <span>Không quảng cáo</span>
                </li>
              </ul>
            </CardContent>
            <CardFooter>
              <div className="w-full flex flex-col gap-2">
                <Button onClick={handleUpgrade} disabled={isLoading} className="w-full text-white">
                  {isLoading ? "Đang xử lý..." : "Nâng cấp ngay"}
                </Button>
                <p className="text-[10px] text-slate-400 text-center">Thanh toán bảo mật qua Lemon Squeezy</p>
              </div>
            </CardFooter>
          </Card>
        </div>
      </main>
    </div>
  )
}
