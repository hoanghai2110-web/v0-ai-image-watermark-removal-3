import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { CheckCircle2 } from "lucide-react"

export default function SignUpSuccessPage() {
  return (
    <div className="flex min-h-screen w-full items-center justify-center p-4 bg-background">
      <div className="w-full max-w-sm">
        <Card className="border-border/40">
          <CardHeader className="space-y-1 text-center">
            <div className="flex justify-center mb-2">
              <CheckCircle2 className="h-12 w-12 text-primary" />
            </div>
            <CardTitle className="text-xl">Đăng ký thành công!</CardTitle>
            <CardDescription className="text-sm">
              Vui lòng kiểm tra email của bạn để xác nhận tài khoản.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <p className="text-xs text-muted-foreground text-center">
                Chúng tôi đã gửi một email xác nhận đến địa chỉ email của bạn. Nhấp vào liên kết trong email để kích
                hoạt tài khoản.
              </p>
              <Button asChild className="w-full h-9">
                <Link href="/auth/login">Quay lại đăng nhập</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
