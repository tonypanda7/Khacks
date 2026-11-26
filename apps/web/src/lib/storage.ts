import fs from 'fs'
import path from 'path'

// Allow fallback to /tmp/uploads on serverless environments like Vercel
const defaultBaseDir = process.env.NODE_ENV === 'production' && !process.env.UPLOAD_DIR
  ? '/tmp/uploads'
  : path.resolve(process.cwd(), '../../uploads')

const UPLOAD_DIR = process.env.UPLOAD_DIR || defaultBaseDir

export async function saveImage(buffer: Buffer, sha256Hex: string, kind: 'report' | 'fix'): Promise<string> {
  const dir = path.join(UPLOAD_DIR, kind)
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
  const filename = `${sha256Hex}.jpg`
  const filePath = path.join(dir, filename)
  fs.writeFileSync(filePath, buffer)
  return `/${kind}/${filename}`
}

export function getImagePath(relativePath: string): string {
  const cleanPath = relativePath.startsWith('/') ? relativePath.slice(1) : relativePath
  return path.join(UPLOAD_DIR, cleanPath)
}
