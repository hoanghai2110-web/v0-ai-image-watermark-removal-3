export class WatermarkRemover {
  private alphaMap48: Float32Array | null = null
  private alphaMap96: Float32Array | null = null

  async loadAlphaMaps() {
    try {
      const response48 = await fetch("/alpha-maps/bg-48.png")
      const blob48 = await response48.blob()
      this.alphaMap48 = await this.extractAlphaMap(blob48)

      const response96 = await fetch("/alpha-maps/bg-96.png")
      const blob96 = await response96.blob()
      this.alphaMap96 = await this.extractAlphaMap(blob96)

      console.log("[v0] Alpha maps loaded successfully")
    } catch (error) {
      console.error("[v0] Failed to load alpha maps:", error)
      throw new Error("Failed to load watermark removal data")
    }
  }

  private async extractAlphaMap(blob: Blob): Promise<Float32Array> {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.onload = () => {
        const canvas = new OffscreenCanvas(img.width, img.height)
        const ctx = canvas.getContext("2d")
        if (!ctx) reject(new Error("Failed to get canvas context"))
        ctx!.drawImage(img, 0, 0)
        const imageData = ctx!.getImageData(0, 0, img.width, img.height)
        const data = imageData.data
        const alphaMap = new Float32Array(data.length / 4)

        // This represents watermark transparency at each pixel
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i]
          const g = data[i + 1]
          const b = data[i + 2]
          // Normalize max channel to 0-1
          alphaMap[i / 4] = Math.max(r, g, b) / 255.0
        }
        resolve(alphaMap)
      }
      img.onerror = () => reject(new Error("Failed to load image"))
      img.src = URL.createObjectURL(blob)
    })
  }

  async removeWatermark(imageBuffer: Buffer): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const img = new Image()
      const blob = new Blob([imageBuffer], { type: "image/png" })

      img.onload = () => {
        try {
          // Detect watermark size based on image dimensions
          const isLarge = img.width > 1024 || img.height > 1024
          const watermarkSize = isLarge ? 96 : 48
          const margin = isLarge ? 64 : 32
          const alphaMap = isLarge ? this.alphaMap96 : this.alphaMap48

          if (!alphaMap) {
            throw new Error("Alpha map not loaded")
          }

          console.log(`[v0] Detected watermark size: ${watermarkSize}px for ${img.width}x${img.height} image`)

          // Create canvas and get image data
          const canvas = new OffscreenCanvas(img.width, img.height)
          const ctx = canvas.getContext("2d")
          if (!ctx) throw new Error("Failed to get canvas context")

          ctx.drawImage(img, 0, 0)
          const imageData = ctx.getImageData(0, 0, img.width, img.height)
          const data = imageData.data

          const watermarkX = img.width - margin - watermarkSize
          const watermarkY = img.height - margin - watermarkSize

          // Formula: Pixel_original = (Pixel_final - (α × 255)) / (1 - α)
          const ALPHA_THRESHOLD = 0.002
          const MAX_ALPHA = 0.99
          const LOGO_VALUE = 255

          for (let row = 0; row < watermarkSize; row++) {
            for (let col = 0; col < watermarkSize; col++) {
              const imgY = watermarkY + row
              const imgX = watermarkX + col

              // Bounds check
              if (imgX < 0 || imgX >= img.width || imgY < 0 || imgY >= img.height) continue

              const imgIdx = (imgY * img.width + imgX) * 4
              const alphaIdx = row * watermarkSize + col

              let alpha = alphaMap[alphaIdx]

              // Skip pixels with very low alpha (no watermark)
              if (alpha < ALPHA_THRESHOLD) continue

              // Clamp alpha to max value
              alpha = Math.min(alpha, MAX_ALPHA)

              // Apply reverse alpha blending to each RGB channel
              for (let c = 0; c < 3; c++) {
                const watermarked = data[imgIdx + c]
                const original = (watermarked - alpha * LOGO_VALUE) / (1.0 - alpha)
                data[imgIdx + c] = Math.max(0, Math.min(255, Math.round(original)))
              }
              // Keep original alpha channel
            }
          }

          ctx.putImageData(imageData, 0, 0)
          canvas.convertToBlob({ type: "image/png" }).then((blob) => {
            blob.arrayBuffer().then((buffer) => {
              resolve(Buffer.from(buffer))
            })
          })
        } catch (error) {
          reject(error)
        }
      }

      img.onerror = () => reject(new Error("Failed to load image"))
      img.src = URL.createObjectURL(blob)
    })
  }
}

export const watermarkRemover = new WatermarkRemover()
