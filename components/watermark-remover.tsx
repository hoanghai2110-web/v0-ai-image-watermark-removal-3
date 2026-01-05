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
    <div>
      {/* ================= HEADER ================= */}
      <div>
        {[1, 2, 3].map((i) => (
          <div key={i}></div>
        ))}
        <span>+2k happy users</span>
        <h1>Fix blurry photos instantly.</h1>
        <p>Turn fuzzy memories into crystal-clear images with advanced AI restoration.</p>
      </div>

      {/* ================= USAGE BANNER ================= */}
      {!usageStatus ? (
        <div>Loading...</div>
      ) : usageStatus.authenticated ? (
        <div>
          <div>
            {usageStatus.isPremium && <Crown />}
            <span>{usageStatus.usageCount}/{usageStatus.usageLimit} uses today</span>
            {usageStatus.isPremium && <span>Pro</span>}
          </div>
          {!usageStatus.isPremium && usageStatus.usageCount >= (usageStatus.usageLimit || 5) ? (
            <div>
              <p>You've reached today's free limit.</p>
              <Link href="/pricing">Upgrade to Pro</Link>
            </div>
          ) : (
            !usageStatus.isPremium && (
              <Link href="/pricing">Upgrade to Pro for 500 uses/month →</Link>
            )
          )}
        </div>
      ) : (
        <div>
          <p>Sign in to get 5 free uses per day</p>
          <Link href="/signin">Sign in</Link>
          <Link href="/signup">Create account</Link>
        </div>
      )}

      {/* ================= UPLOAD ================= */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleUpload}
      />

      {!image ? (
        <>
          <button
            onClick={() => fileInputRef.current?.click()}
          >
            <span>upload_file</span>
            Upload an image
          </button>
        </>
      ) : (
        <div>
          <div>
            <img src={image} alt="Original" />
            {result && <img src={result} alt="Enhanced" />}
          </div>

          {loading && (
            <div>Processing...</div>
          )}

          <button
            onClick={() => {
              setImage(null)
              setFile(null)
              setResult(null)
            }}
          >
            <span>delete_outline</span>
          </button>
          <button onClick={handleRemoveWatermark} disabled={loading}>
            {loading ? "Enhancing..." : "Restore now"}
          </button>
        </div>
      )}

      {/* ================= FEATURES ================= */}
      {[
        ["motion_photos_on", "Fix motion blur automatically"],
        ["hd", "Enhance low-resolution images"],
        ["auto_fix_high", "Restore old & damaged photos"],
      ].map(([icon, title]) => (
        <div key={icon}>
          <span>{icon}</span>
          <h3>{title}</h3>
          <p>AI intelligently restores clarity while preserving natural details.</p>
        </div>
      ))}
    </div>
  )
}
