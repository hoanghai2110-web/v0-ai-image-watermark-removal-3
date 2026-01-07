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

        // Extract alpha values from reference image
        for (let i = 0; i < data.length; i += 4) {
          alphaMap[i / 4] = data[i + 3] / 255 // Normalize alpha to 0-1
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

          // Apply reverse alpha blending formula
          // Pixel_original = (Pixel_final - (α × 255)) / (1 - α)
          for (let i = 0; i < data.length; i += 4) {
            const pixelIndex = i / 4
            if (pixelIndex < alphaMap.length) {
              const alpha = alphaMap[pixelIndex]

              if (alpha > 0.01) {
                // Only process pixels with watermark
                // R channel
                data[i] = Math.max(0, Math.min(255, (data[i] - alpha * 255) / (1 - alpha)))
                // G channel
                data[i + 1] = Math.max(0, Math.min(255, (data[i + 1] - alpha * 255) / (1 - alpha)))
                // B channel
                data[i + 2] = Math.max(0, Math.min(255, (data[i + 2] - alpha * 255) / (1 - alpha)))
                // Keep original alpha
              }
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
