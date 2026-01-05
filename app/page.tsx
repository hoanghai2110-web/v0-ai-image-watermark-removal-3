import type { Metadata } from "next"
import WatermarkRemover from "@/components/watermark-remover"

export const metadata: Metadata = {
  title: "Xóa Watermark Gemini AI - Công Cụ Chuyên Nghiệp",
  description:
    "Xóa watermark ảnh Gemini, logo và vật thể thừa nhanh chóng với công nghệ Stability AI. Tối ưu di động, giao diện Neo Brutalism cực chất.",
  keywords: "xóa watermark, gemini ai, remove watermark, stability ai, chỉnh sửa ảnh ai",
}

export default function Home() {
  return (
    <main className="w-full bg-[#f8fafc]">
      {/* Background pattern */}
      <div className="fixed inset-0 dot-bg opacity-40 pointer-events-none -z-10" />

      {/* Main content */}
      <div className="mx-auto max-w-lg px-6 pt-8 pb-32">
        <WatermarkRemover />

        {/* Social proof */}
        <div className="mt-20 pt-10 border-t border-gray-200 w-full">
          <p className="text-center text-xs text-gray-400 uppercase tracking-widest font-semibold mb-6">
            Trusted by creatives at
          </p>
          <div className="flex flex-wrap justify-center gap-8 opacity-40 grayscale mix-blend-multiply mb-12">
            <span className="font-display font-bold text-xl">VOGUE</span>
            <span className="font-display font-bold text-xl italic">Wired</span>
            <span className="font-display font-bold text-xl">Unsplash</span>
          </div>
        </div>
      </div>
    </main>
  )
}
