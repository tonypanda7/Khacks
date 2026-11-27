import fs from 'fs'
import path from 'path'

// Allow fallback to /tmp/uploads on serverless environments like Vercel
const defaultBaseDir = (Boolean(process.env.VERCEL) || process.env.NODE_ENV === 'production') && !process.env.UPLOAD_DIR
  ? '/tmp/uploads'
  : path.resolve(process.cwd(), '../../uploads')

const UPLOAD_DIR = process.env.UPLOAD_DIR || defaultBaseDir

export async function saveImage(buffer: Buffer, sha256Hex: string, kind: 'report' | 'fix'): Promise<string> {
  const primaryDir = path.join(UPLOAD_DIR, kind)
  const filename = `${sha256Hex}.jpg`
  
  try {
    if (!fs.existsSync(primaryDir)) {
      fs.mkdirSync(primaryDir, { recursive: true })
    }
    const filePath = path.join(primaryDir, filename)
    fs.writeFileSync(filePath, buffer)
    return `/${kind}/${filename}`
  } catch {
    // Fallback directly to /tmp on serverless environments
    const fallbackDir = path.join('/tmp/uploads', kind)
    try {
      if (!fs.existsSync(fallbackDir)) {
        fs.mkdirSync(fallbackDir, { recursive: true })
      }
      fs.writeFileSync(path.join(fallbackDir, filename), buffer)
    } catch {}
    return `/${kind}/${filename}`
  }
}

export function getImagePath(relativePath: string): string {
  const cleanPath = relativePath.startsWith('/') ? relativePath.slice(1) : relativePath
  return path.join(UPLOAD_DIR, cleanPath)
}
