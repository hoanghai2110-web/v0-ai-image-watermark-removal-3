"use client"

import type React from "react"
import { Suspense, useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { trackReferralAction } from "@/app/actions/referral"

function SignUpFormContent() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [repeatPassword, setRepeatPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [referralCode, setReferralCode] = useState<string | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const ref = searchParams.get("ref")
    if (ref) {
      setReferralCode(ref)
    }
  }, [searchParams])

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    if (password !== repeatPassword) {
      setError("Mật khẩu không khớp")
      setIsLoading(false)
      return
    }

    if (password.length < 6) {
      setError("Mật khẩu phải có ít nhất 6 ký tự")
      setIsLoading(false)
      return
    }

    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL || `${window.location.origin}`,
        },
      })

      if (signUpError) throw signUpError

      if (referralCode && data.user?.id) {
        try {
          await trackReferralAction(referralCode, data.user.id)
          console.log("[v0] Referral tracked for user:", data.user.id)
        } catch (refError) {
          console.error("[v0] Error tracking referral:", refError)
        }
      }

      router.push("/auth/sign-up-success")
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "Đã có lỗi xảy ra")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="border-border/40">
      <CardHeader className="space-y-1">
        <CardTitle className="text-xl text-white">Đăng ký</CardTitle>
        <CardDescription className="text-sm">
          {referralCode ? "Bạn được giới thiệu - nhận 30% hoa hồng!" : "Tạo tài khoản mới để sử dụng dịch vụ"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSignUp}>
          <div className="flex flex-col gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="email" className="text-sm">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="email@example.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-9"
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="password" className="text-sm">
                Mật khẩu
              </Label>
              <Input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-9"
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="repeat-password" className="text-sm">
                Nhập lại mật khẩu
              </Label>
              <Input
                id="repeat-password"
                type="password"
                required
                value={repeatPassword}
                onChange={(e) => setRepeatPassword(e.target.value)}
                className="h-9"
              />
            </div>
            {error && <p className="text-xs text-destructive">{error}</p>}
            <Button type="submit" className="w-full h-9 mt-1" disabled={isLoading}>
              {isLoading ? "Đang tạo tài khoản..." : "Đăng ký"}
            </Button>
          </div>
          <div className="mt-3 text-center text-xs text-muted-foreground">
            Đã có tài khoản?{" "}
            <Link href="/auth/login" className="text-foreground underline underline-offset-4 hover:text-primary">
              Đăng nhập
            </Link>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

export default function SignUpPage() {
  return (
    <div className="flex min-h-screen w-full items-center justify-center p-4 bg-background">
      <div className="w-full max-w-sm">
        <Suspense fallback={<div className="h-96" />}>
          <SignUpFormContent />
        </Suspense>
      </div>
    </div>
  )
}
