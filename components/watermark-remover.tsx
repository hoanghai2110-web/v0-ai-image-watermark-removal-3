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
    <div className="max-w-5xl mx-auto px-4 py-12">
      {/* ================= HEADER ================= */}
      <div className="text-center mb-12">
        <div className="flex justify-center items-center gap-2 mb-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="w-10 h-10 rounded-full bg-gray-200" />
          ))}
          <span className="text-sm font-medium">+2k happy users</span>
        </div>

        <h1 className="text-4xl md:text-5xl font-bold mb-4">
          Fix blurry photos instantly.
        </h1>
        <p className="text-gray-600 text-lg">
          Turn fuzzy memories into crystal-clear images with advanced AI restoration.
        </p>
      </div>

      {/* ================= USAGE BANNER ================= */}
      <div className="mb-8">
        {!usageStatus ? (
          <div className="bg-gray-100 p-4 rounded-lg text-center">
            <p className="text-gray-600">Loading...</p>
          </div>
        ) : usageStatus.authenticated ? (
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {usageStatus.isPremium && <Crown className="w-5 h-5 text-yellow-500" />}
                <span className="font-medium">
                  {usageStatus.usageCount}/{usageStatus.usageLimit} uses today
                </span>
                {usageStatus.isPremium && (
                  <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs font-medium">
                    Pro
                  </span>
                )}
              </div>

              {!usageStatus.isPremium && usageStatus.usageCount >= (usageStatus.usageLimit || 5) ? (
                <div className="text-right">
                  <p className="text-sm text-gray-600 mb-2">You've reached today's free limit.</p>
                  <Link
                    href="/pricing"
                    className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-black transition"
                  >
                    Upgrade to Pro
                  </Link>
                </div>
              ) : (
                !usageStatus.isPremium && (
                  <Link href="/pricing" className="text-blue-600 hover:underline text-sm">
                    Upgrade to Pro for 500 uses/month →
                  </Link>
                )
              )}
            </div>
          </div>
        ) : (
          <div className="bg-gray-100 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <p className="text-gray-700">Sign in to get 5 free uses per day</p>
              <div className="flex gap-3">
                <Link
                  href="/signin"
                  className="bg-white border px-4 py-2 rounded-lg hover:bg-gray-50 transition"
                >
                  Sign in
                </Link>
                <Link
                  href="/signup"
                  className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-black transition"
                >
                  Create account
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ================= UPLOAD ================= */}
      <div className="bg-white border rounded-xl p-8 mb-12">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleUpload}
          className="hidden"
        />

        {!image ? (
          <>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full bg-primary hover:bg-black text-white py-3 px-6 rounded-lg flex items-center justify-center gap-3 transition"
            >
              <span className="material-icons">upload_file</span>
              Upload an image
            </button>
          </>
        ) : (
          <div className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <h3 className="font-medium mb-2">Original</h3>
                <img src={image} alt="Original" className="w-full rounded-lg" />
              </div>
              {result && (
                <div>
                  <h3 className="font-medium mb-2">Enhanced</h3>
                  <img src={result} alt="Enhanced" className="w-full rounded-lg" />
                </div>
              )}
            </div>

            {loading && (
              <div className="text-center py-4">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-300 border-t-primary"></div>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setImage(null)
                  setFile(null)
                  setResult(null)
                }}
                className="p-3 border rounded-md hover:bg-gray-50 transition"
              >
                <span className="material-icons">delete_outline</span>
              </button>
              <button
                onClick={handleRemoveWatermark}
                disabled={loading}
                className="flex-1 bg-primary hover:bg-black text-white py-3 px-6 rounded-lg transition disabled:opacity-50"
              >
                {loading ? "Enhancing..." : "Restore now"}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ================= FEATURES ================= */}
      <div className="grid md:grid-cols-3 gap-6">
        {[
          ["motion_photos_on", "Fix motion blur automatically"],
          ["hd", "Enhance low-resolution images"],
          ["auto_fix_high", "Restore old & damaged photos"],
        ].map(([icon, title]) => (
          <div key={icon} className="text-center p-6 bg-gray-50 rounded-lg">
            <span className="material-icons text-4xl text-primary mb-3">{icon}</span>
            <h3 className="font-semibold mb-2">{title}</h3>
            <p className="text-sm text-gray-600">
              AI intelligently restores clarity while preserving natural details.
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
