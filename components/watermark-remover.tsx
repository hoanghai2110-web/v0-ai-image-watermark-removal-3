"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { useToast } from "@/hooks/use-toast"
import { Crown } from "lucide-react"
import Link from "next/link"

interface UsageStatus {
  authenticated: boolean
  isPremium: boolean
  usageCount: number
  usageLimit: number | null
}

export default function WatermarkRemover() {
  const [image, setImage] = useState<string | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<string | null>(null)
  const [usageStatus, setUsageStatus] = useState<UsageStatus | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { toast } = useToast()

  useEffect(() => {
    fetchUsageStatus()
  }, [])

  const fetchUsageStatus = async () => {
    try {
      const response = await fetch("/api/usage-status")
      const data = await response.json()
      setUsageStatus(data)
    } catch (error) {
      console.error("[v0] Error fetching usage status:", error)
    }
  }

  const generateGeminiMask = (img: HTMLImageElement): Promise<Blob> => {
    return new Promise((resolve) => {
      const canvas = document.createElement("canvas")
      canvas.width = img.width
      canvas.height = img.height
      const ctx = canvas.getContext("2d")
      if (!ctx) return resolve(new Blob())

      ctx.fillStyle = "black"
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      const maskWidth = canvas.width * 0.2
      const maskHeight = canvas.height * 0.2
      ctx.fillStyle = "white"
      ctx.fillRect(canvas.width - maskWidth, canvas.height - maskHeight, maskWidth, maskHeight)

      canvas.toBlob((blob) => resolve(blob || new Blob()), "image/png")
    })
  }

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
      const reader = new FileReader()
      reader.onload = (event) => setImage(event.target?.result as string)
      reader.readAsDataURL(selectedFile)
      setResult(null)
    }
  }

  const handleRemoveWatermark = async () => {
    if (!file || !image) return

    if (!usageStatus?.authenticated) {
      toast({
        variant: "destructive",
        title: "Cần đăng nhập",
        description: "Vui lòng đăng nhập để sử dụng tính năng này.",
      })
      return
    }

    setLoading(true)
    try {
      const img = new Image()
      img.src = image
      await new Promise((resolve) => (img.onload = resolve))
      const maskBlob = await generateGeminiMask(img)

      const formData = new FormData()
      formData.append("image", file)
      formData.append("mask", maskBlob)

      const response = await fetch("/api/remove-watermark", {
        method: "POST",
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Không thể xử lý ảnh")
      }

      if (data.image) {
        setResult(data.image)
        toast({ title: "Thành công!", description: "Watermark đã được xóa." })
        fetchUsageStatus()
      } else {
        throw new Error(data.error || "Lỗi không xác định")
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: error.message || "Không thể xử lý ảnh.",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative z-10 px-6 pt-4 pb-16 flex flex-col items-center">
      <div className="w-full text-center space-y-4 mb-8">
        <div className="flex items-center justify-center gap-2 mb-2">
          <div className="flex -space-x-2">
            {[1, 2, 3].map((i) => (
              <img
                key={i}
                alt="User avatar"
                className="w-8 h-8 rounded-full border-2 border-background object-cover"
                src={`/generic-fantasy-character.png?key=rxuf5&height=32&width=32&query=avatar-${i}`}
              />
            ))}
            <div className="w-8 h-8 rounded-full border-2 border-background bg-gray-200 flex items-center justify-center text-[10px] font-bold text-gray-600">
              +2k
            </div>
          </div>
          <span className="text-sm text-muted-foreground font-medium">happy users</span>
        </div>

        <h1 className="font-display font-bold text-3xl sm:text-4xl leading-tight text-foreground">
          Fix blurry photos <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-gray-600 to-gray-900">instantly.</span>
        </h1>
        <p className="text-base text-muted-foreground leading-relaxed max-w-sm mx-auto">
          Turn your fuzzy memories into crystal clear moments. Powered by advanced AI restoration.
        </p>

        {usageStatus && usageStatus.authenticated && (
          <div
            className={`rounded-lg p-3 text-sm border ${
              usageStatus.isPremium ? "bg-yellow-50 border-yellow-100" : "bg-blue-50 border-blue-100"
            }`}
          >
            <p
              className={`font-medium ${usageStatus.isPremium ? "text-yellow-900" : "text-blue-900"} flex items-center justify-center gap-2`}
            >
              {usageStatus.isPremium && <Crown className="h-4 w-4 text-yellow-600" />}
              {usageStatus.usageCount}/{usageStatus.usageLimit} lượt dùng hôm nay
              {usageStatus.isPremium && (
                <span className="text-[10px] bg-yellow-200 text-yellow-800 px-1.5 py-0.5 rounded uppercase font-bold tracking-wider">
                  Pro
                </span>
              )}
            </p>
            {!usageStatus.isPremium && usageStatus.usageCount >= (usageStatus.usageLimit || 5) ? (
              <div className="mt-2 flex flex-col items-center gap-2">
                <p className="text-xs text-blue-700">Bạn đã dùng hết lượt miễn phí hôm nay.</p>
                <Link
                  href="/pricing"
                  className="bg-primary text-white text-xs px-4 py-1.5 rounded-lg font-bold flex items-center gap-1 hover:bg-black transition-all"
                >
                  <Crown className="h-3 w-3" /> Nâng cấp Pro ngay
                </Link>
              </div>
            ) : (
              !usageStatus.isPremium && (
                <Link href="/pricing" className="text-[10px] text-blue-600 font-medium block mt-1 hover:underline">
                  Nâng cấp Pro để có 500 lượt/tháng →
                </Link>
              )
            )}
          </div>
        )}

        {usageStatus && !usageStatus.authenticated && (
          <div className="bg-yellow-50 border border-yellow-100 rounded-lg p-3 text-sm">
            <p className="font-medium text-yellow-900">Đăng nhập để sử dụng miễn phí 5 lượt/ngày</p>
            <div className="flex gap-2 justify-center mt-2">
              <Link
                href="/auth/login"
                className="text-xs bg-primary text-white px-4 py-1.5 rounded-lg hover:bg-black transition-colors"
              >
                Đăng nhập
              </Link>
              <Link
                href="/auth/sign-up"
                className="text-xs border border-gray-300 px-4 py-1.5 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Đăng ký
              </Link>
            </div>
          </div>
        )}

        <div className="flex flex-col gap-3 pt-2 w-full">
          {!image ? (
            <>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full bg-primary hover:bg-black text-white text-base font-medium py-3 px-6 rounded-xl transition-all flex items-center justify-center gap-3"
              >
                <span className="material-icons-round">upload_file</span>
                Upload an Image
              </button>
              <input type="file" className="hidden" ref={fileInputRef} onChange={handleUpload} accept="image/*" />
            </>
          ) : (
            <div className="space-y-4 w-full">
              <div className="relative aspect-square sm:aspect-video rounded-xl overflow-hidden bg-white border border-gray-100">
                <img src={result || image} alt="Preview" className="w-full h-full object-contain" />
                {loading && (
                  <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center">
                    <div className="flex flex-col items-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4" />
                      <p className="font-bold text-primary">Processing...</p>
                    </div>
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setImage(null)
                    setFile(null)
                    setResult(null)
                  }}
                  className="p-3 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 text-destructive transition-all"
                >
                  <span className="material-icons-round">delete_outline</span>
                </button>
                {result ? (
                  <a
                    href={result}
                    download="restored-image.png"
                    className="flex-1 bg-green-500 hover:bg-green-600 text-white text-base font-bold py-3 rounded-xl flex items-center justify-center gap-2"
                  >
                    <span className="material-icons-round">download</span> Download
                  </a>
                ) : (
                  <button
                    onClick={handleRemoveWatermark}
                    disabled={loading}
                    className="flex-1 bg-primary hover:bg-black text-white text-base font-bold py-3 rounded-xl flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <span className="material-icons-round">auto_fix_high</span>
                    {loading ? "Enhancing..." : "Restore Now"}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Feature Sections */}
      {/* Feature Sections */}
<div className="w-full mt-10 space-y-6">
  <div className="text-center mb-6">
    <h2 className="font-display font-bold text-2xl mb-2 text-foreground">
      Perfect Image Restoration for Every Situation
    </h2>
    <p className="text-muted-foreground text-sm leading-relaxed max-w-xl mx-auto">
      Our AI-powered image restoration tool intelligently analyzes your photo and removes blur,
      noise, and quality loss while preserving natural details.
    </p>
  </div>

  <div className="grid grid-cols-1 gap-4">
    {/* Motion Blur */}
    <div className="bg-accent-soft-yellow border border-yellow-100 p-5 rounded-xl flex items-start gap-4">
      <div className="p-2 bg-yellow-100 rounded-lg text-yellow-700">
        <span className="material-icons-round text-xl">motion_photos_on</span>
      </div>
      <div>
        <h3 className="font-bold text-lg mb-1">Fix Motion Blur Automatically</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Remove motion blur caused by camera shake or moving subjects.
          Ideal for action shots, sports photos, pets, and low-light images.
        </p>
      </div>
    </div>

    {/* Low Resolution */}
    <div className="bg-accent-soft-blue border border-blue-100 p-5 rounded-xl flex items-start gap-4">
      <div className="p-2 bg-blue-100 rounded-lg text-blue-700">
        <span className="material-icons-round text-xl">hd</span>
      </div>
      <div>
        <h3 className="font-bold text-lg mb-1">Enhance Low-Resolution Images</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Upscale blurry or pixelated photos and restore sharp details without
          over-smoothing or artifacts.
        </p>
      </div>
    </div>

    {/* Old Photos */}
    <div className="bg-accent-soft-purple border border-purple-100 p-5 rounded-xl flex items-start gap-4">
      <div className="p-2 bg-purple-100 rounded-lg text-purple-700">
        <span className="material-icons-round text-xl">auto_fix_high</span>
      </div>
      <div>
        <h3 className="font-bold text-lg mb-1">Restore Old & Damaged Photos</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Bring old, faded, or damaged photos back to life with AI-powered restoration
          that keeps textures natural and realistic.
        </p>
      </div>
    </div>
  </div>
</div>

    </div>
  )
}
