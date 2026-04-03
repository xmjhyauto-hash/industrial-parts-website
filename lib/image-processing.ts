import sharp from 'sharp'
import { join } from 'path'
import { existsSync } from 'fs'

interface WatermarkOptions {
  type: 'text' | 'image'
  text?: string
  imagePath?: string
  position?: 'center' | 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'
  opacity?: number
}

interface ProcessImageOptions {
  maxWidth?: number
  maxHeight?: number
  quality?: number
  watermark?: WatermarkOptions
}

const DEFAULT_MAX_WIDTH = 1920
const DEFAULT_MAX_HEIGHT = 1080
const DEFAULT_QUALITY = 85

/**
 * Process image: compress and optionally add watermark
 */
export async function processImage(
  inputBuffer: Buffer,
  options: ProcessImageOptions = {}
): Promise<Buffer> {
  const {
    maxWidth = DEFAULT_MAX_WIDTH,
    maxHeight = DEFAULT_MAX_HEIGHT,
    quality = DEFAULT_QUALITY,
    watermark,
  } = options

  let image = sharp(inputBuffer)

  // Get original metadata
  const metadata = await image.metadata()

  // Resize if needed (only shrink, don't enlarge)
  if (metadata.width && metadata.height) {
    if (metadata.width > maxWidth || metadata.height > maxHeight) {
      image = image.resize(maxWidth, maxHeight, {
        fit: 'inside',
        withoutEnlargement: true,
      })
    }
  }

  // Compress to JPEG/PNG based on input format
  const format = metadata.format || 'jpeg'
  if (format === 'jpeg' || format === 'jpg') {
    image = image.jpeg({ quality })
  } else if (format === 'png') {
    image = image.png({ compressionLevel: Math.floor((100 - quality) / 10) })
  } else if (format === 'webp') {
    image = image.webp({ quality })
  } else if (format === 'gif') {
    image = image.gif()
  }

  // Apply watermark if provided
  if (watermark) {
    image = await applyWatermark(image, watermark, metadata.width || maxWidth, metadata.height || maxHeight)
  }

  return image.toBuffer()
}

/**
 * Apply watermark to image
 */
async function applyWatermark(
  image: sharp.Sharp,
  watermark: WatermarkOptions,
  width: number,
  height: number
): Promise<sharp.Sharp> {
  const opacity = watermark.opacity ?? 0.3

  if (watermark.type === 'text' && watermark.text) {
    // Create text watermark using SVG
    const svgText = `
      <svg width="${width}" height="${height}">
        <style>
          .watermark {
            fill: white;
            font-size: ${Math.max(width / 20, 24)}px;
            font-family: Arial, sans-serif;
            font-weight: bold;
            opacity: ${opacity};
          }
        </style>
        <text
          x="50%"
          y="50%"
          text-anchor="middle"
          dy=".35em"
          class="watermark"
        >${escapeXml(watermark.text)}</text>
      </svg>
    `

    const textBuffer = Buffer.from(svgText)

    return image.composite([
      {
        input: textBuffer,
        gravity: getGravity(watermark.position || 'center'),
      },
    ])
  }

  if (watermark.type === 'image' && watermark.imagePath) {
    try {
      // Convert URL path to file path
      const watermarkPath = watermark.imagePath.startsWith('/')
        ? join(process.cwd(), 'public', watermark.imagePath)
        : watermark.imagePath

      // Check if file exists
      if (!existsSync(watermarkPath)) {
        console.warn('Watermark image not found:', watermarkPath)
        return image
      }

      // Load and resize watermark to be ~20% of image width
      const watermarkImage = sharp(watermarkPath)
      const wmMetadata = await watermarkImage.metadata()
      const wmWidth = wmMetadata.width || 200
      const wmHeight = wmMetadata.height || 100

      // Calculate watermark size (20% of image width, maintain aspect ratio)
      const targetWmWidth = Math.max(width * 0.2, 100)
      const ratio = wmHeight / wmWidth
      const targetWmHeight = Math.round(targetWmWidth * ratio)

      // Resize and ensure alpha channel exists
      const resizedWatermarkBuffer = await watermarkImage
        .resize(targetWmWidth, targetWmHeight)
        .ensureAlpha()
        .raw()
        .toBuffer()

      // Apply opacity by modulating the alpha channel directly
      const pixels = Buffer.from(resizedWatermarkBuffer)
      for (let i = 0; i < pixels.length; i += 4) {
        // RGBA format: i, i+1, i+2, i+3 are R, G, B, A
        // Multiply alpha by the opacity factor
        pixels[i + 3] = Math.round(pixels[i + 3] * opacity)
      }

      // Convert back to PNG with modulated alpha
      const modulatedWatermark = await sharp(pixels, {
        raw: {
          width: targetWmWidth,
          height: targetWmHeight,
          channels: 4,
        },
      })
        .png()
        .toBuffer()

      return image.composite([
        {
          input: modulatedWatermark,
          gravity: getGravity(watermark.position || 'bottom-right'),
        },
      ])
    } catch (error) {
      console.error('Error applying watermark image:', error)
      return image
    }
  }

  return image
}

/**
 * Get gravity value for watermark positioning
 */
function getGravity(position?: string): string {
  switch (position) {
    case 'bottom-right':
      return 'southeast'
    case 'bottom-left':
      return 'southwest'
    case 'top-right':
      return 'northeast'
    case 'top-left':
      return 'northwest'
    case 'center':
    default:
      return 'centre'
  }
}

/**
 * Escape XML special characters
 */
function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

/**
 * Generate thumbnail
 */
export async function generateThumbnail(
  inputBuffer: Buffer,
  size: number = 300
): Promise<Buffer> {
  return sharp(inputBuffer)
    .resize(size, size, {
      fit: 'cover',
      position: 'centre',
    })
    .jpeg({ quality: 75 })
    .toBuffer()
}

/**
 * Get image metadata
 */
export async function getImageMetadata(buffer: Buffer) {
  return sharp(buffer).metadata()
}

/**
 * Check if buffer is a valid image
 */
export async function isValidImage(buffer: Buffer): Promise<boolean> {
  try {
    const metadata = await sharp(buffer).metadata()
    return !!metadata.width && !!metadata.height
  } catch {
    return false
  }
}
