import type { Metadata } from "next"
import WatermarkRemover from "@/components/watermark-remover"
import { Header } from "@/components/header"

export const metadata: Metadata = {
  title: "Xóa Watermark Gemini AI - Công Cụ Chuyên Nghiệp",
  description:
    "Xóa watermark ảnh Gemini, logo và vật thể thừa nhanh chóng với công nghệ Stability AI. Tối ưu di động, giao diện Neo Brutalism cực chất.",
  keywords: "xóa watermark, gemini ai, remove watermark, stability ai, chỉnh sửa ảnh ai",
}

export default function Home() {
  return (
    <main className="flex-grow w-full max-w-lg mx-auto relative overflow-hidden min-h-screen bg-[#f8fafc] dot-grid pb-32">
      <Header />
      <div className="absolute inset-0 dot-bg opacity-40 pointer-events-none z-0"></div>

      {/* Functional component integrated into the modern layout */}
      <WatermarkRemover />

      <div className="mt-20 pt-10 border-t border-gray-200 w-full px-6">
        <p className="text-center text-xs text-gray-400 uppercase tracking-widest font-semibold mb-6">
          Trusted by creatives at
        </p>
        <div className="flex flex-wrap justify-center gap-8 opacity-40 grayscale mix-blend-multiply mb-12">
          <span className="font-display font-bold text-xl">VOGUE</span>
          <span className="font-display font-bold text-xl italic">Wired</span>
          <span className="font-display font-bold text-xl">Unsplash</span>
        </div>
      </div>
    </main>
  )
}
