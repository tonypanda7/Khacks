import fs from 'fs'
import path from 'path'
import { supabaseAdmin } from './supabase'

const defaultBaseDir = (Boolean(process.env.VERCEL) || process.env.NODE_ENV === 'production') && !process.env.UPLOAD_DIR
  ? '/tmp/uploads'
  : path.resolve(process.cwd(), '../../uploads')

const UPLOAD_DIR = process.env.UPLOAD_DIR || defaultBaseDir

export async function saveImage(buffer: Buffer, sha256Hex: string, kind: 'report' | 'fix'): Promise<string> {
  const filename = `${sha256Hex}.jpg`
  const relativePath = `${kind}/${filename}`

  // 1. Upload to Supabase Storage (Permanent CDN URL across all Vercel instances)
  try {
    const { error } = await supabaseAdmin.storage
      .from('uploads')
      .upload(relativePath, buffer, {
        contentType: 'image/jpeg',
        upsert: true,
      })

    if (!error) {
      const { data: pub } = supabaseAdmin.storage
        .from('uploads')
        .getPublicUrl(relativePath)
      if (pub?.publicUrl) {
        return pub.publicUrl
      }
    }
  } catch (err) {
    console.warn('Supabase storage upload fallback:', err)
  }

  // 2. Local disk caching
  try {
    const primaryDir = path.join(UPLOAD_DIR, kind)
    if (!fs.existsSync(primaryDir)) {
      fs.mkdirSync(primaryDir, { recursive: true })
    }
    fs.writeFileSync(path.join(primaryDir, filename), buffer)
  } catch {
    const fallbackDir = path.join('/tmp/uploads', kind)
    try {
      if (!fs.existsSync(fallbackDir)) {
        fs.mkdirSync(fallbackDir, { recursive: true })
      }
      fs.writeFileSync(path.join(fallbackDir, filename), buffer)
    } catch {}
  }

  return `/${kind}/${filename}`
}

export function getImagePath(pathOrUrl: string): string {
  if (pathOrUrl.startsWith('http://') || pathOrUrl.startsWith('https://')) {
    return pathOrUrl
  }
  const cleanPath = pathOrUrl.startsWith('/') ? pathOrUrl.slice(1) : pathOrUrl
  return path.join(UPLOAD_DIR, cleanPath)
}
