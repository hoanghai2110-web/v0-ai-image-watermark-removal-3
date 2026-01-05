"use client"

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
  const { toast } = useToast()

  useEffect(() => {
    fetchUsageStatus()
  }, [])

  const fetchUsageStatus = async () => {
    try {
      const res = await fetch("/api/usage-status")
      const data = await res.json()
      setUsageStatus(data)
    } catch (err) {
      console.error(err)
    }
  }

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return

    setFile(selectedFile)
    const reader = new FileReader()
    reader.onload = (e) => setImage(e.target?.result as string)
    reader.readAsDataURL(selectedFile)
    setResult(null)
  }

  const handleRemoveWatermark = async () => {
    if (!file || !image) return

    if (!usageStatus?.authenticated) {
      toast({
        variant: "destructive",
        title: "Sign in required",
        description: "Please sign in to use this feature.",
      })
      return
    }

    setLoading(true)
    try {
      const formData = new FormData()
      formData.append("image", file)

      const res = await fetch("/api/remove-watermark", {
        method: "POST",
        body: formData,
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      setResult(data.image)
      fetchUsageStatus()
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: err.message || "Failed to process image.",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative z-10 px-3 pt-2 pb-8 flex flex-col items-center">
      {/* ================= HEADER ================= */}
      <div className="w-full text-center space-y-4 mb-8">
        <h1 className="font-display font-bold text-3xl sm:text-4xl leading-tight text-foreground">
  Fix blurry photos <br />
  <span
    className="
      bg-gradient-to-r
      from-gray-600 to-gray-900
      dark:from-gray-200 dark:to-white
      bg-clip-text text-transparent
    "
    style={{ WebkitBackgroundClip: "text" }}
  >
    instantly.
  </span>
</h1>


        <p className="text-sm sm:text-base text-muted-foreground max-w-sm mx-auto">
          Turn fuzzy memories into crystal-clear images with advanced AI restoration.
        </p>

        {/* ================= USAGE BANNER ================= */}
        <div className="w-full max-w-sm mx-auto min-h-[84px]">
          {!usageStatus ? (
            <div className="rounded-md border p-3 bg-muted/40 animate-pulse">
              <div className="h-4 w-3/4 bg-muted rounded mb-2 mx-auto" />
              <div className="h-3 w-1/2 bg-muted rounded mx-auto" />
            </div>
          ) : usageStatus.authenticated ? (
            <div
              className={`rounded-md p-3 text-sm border ${
                usageStatus.isPremium
                  ? "bg-yellow-50 border-yellow-100"
                  : "bg-blue-50 border-blue-100"
              }`}
            >
              <p className="font-medium flex items-center justify-center gap-2">
                {usageStatus.isPremium && (
                  <Crown className="h-4 w-4 text-yellow-600" />
                )}
                {usageStatus.usageCount}/{usageStatus.usageLimit} uses today
                {usageStatus.isPremium && (
                  <span className="text-[10px] bg-yellow-200 text-yellow-800 px-1.5 py-0.5 rounded-sm uppercase font-bold">
                    Pro
                  </span>
                )}
              </p>

              {!usageStatus.isPremium &&
              usageStatus.usageCount >= (usageStatus.usageLimit || 5) ? (
                <div className="mt-2 flex flex-col items-center gap-2">
                  <p className="text-xs text-blue-700">
                    You’ve reached today’s free limit.
                  </p>
                  <Link
                    href="/pricing"
                    className="bg-primary text-white text-xs px-4 py-1.5 rounded-lg font-bold hover:bg-black transition"
                  >
                    Upgrade to Pro
                  </Link>
                </div>
              ) : (
                !usageStatus.isPremium && (
                  <Link
                    href="/pricing"
                    className="block text-center text-[10px] text-blue-600 mt-1 hover:underline"
                  >
                    Upgrade to Pro for 500 uses/month →
                  </Link>
                )
              )}
            </div>
          ) : (
            <div className="rounded-md border border-yellow-100 bg-yellow-50 p-3 text-sm text-center">
              <p className="font-medium text-yellow-900">
                Sign in to get 5 free uses per day
              </p>
              <div className="flex justify-center gap-2 mt-2">
                <Link
                  href="/auth/login"
                  className="text-xs bg-primary text-white px-4 py-1.5 rounded-lg hover:bg-black transition"
                >
                  Sign in
                </Link>
                <Link
                  href="/auth/sign-up"
                  className="text-xs border px-4 py-1.5 rounded-lg hover:bg-gray-50 transition"
                >
                  Create account
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* ================= UPLOAD ================= */}
        <div className="flex flex-col gap-3 pt-2 w-full">
          {!image ? (
            <>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full bg-primary hover:bg-black text-white py-3 px-6 rounded-lg flex items-center justify-center gap-3 transition"
              >
                <span className="material-icons-round">upload_file</span>
                Upload an image
              </button>
              <input
                ref={fileInputRef}
                type="file"
                hidden
                accept="image/*"
                onChange={handleUpload}
              />
            </>
          ) : (
            <div className="space-y-4 w-full">
              <div className="relative aspect-square sm:aspect-video rounded-md overflow-hidden border bg-white">
                <img
                  src={result || image}
                  className="w-full h-full object-contain"
                  alt="Preview"
                />
                {loading && (
                  <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                    <div className="animate-spin h-8 w-8 border-b-2 border-primary rounded-full" />
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
                  className="p-3 border rounded-md hover:bg-gray-50 transition"
                >
                  <span className="material-icons-round">delete_outline</span>
                </button>

                <button
                  onClick={handleRemoveWatermark}
                  disabled={loading}
                  className="flex-1 bg-primary hover:bg-black text-white py-3 rounded-lg font-bold transition disabled:opacity-50"
                >
                  {loading ? "Enhancing..." : "Restore now"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ================= FEATURES ================= */}
      <div className="w-full mt-10 space-y-4">
        {[
          ["motion_photos_on", "Fix motion blur automatically"],
          ["hd", "Enhance low-resolution images"],
          ["auto_fix_high", "Restore old & damaged photos"],
        ].map(([icon, title]) => (
          <div
            key={title}
            className="border p-4 rounded-md flex gap-3 items-start bg-background"
          >
            <span className="material-icons-round text-lg">{icon}</span>
            <div>
              <h3 className="font-bold">{title}</h3>
              <p className="text-sm text-muted-foreground">
                AI intelligently restores clarity while preserving natural details.
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
