import fs from 'fs'
import path from 'path'
import sharp from 'sharp'
import { supabaseAdmin } from './supabase'

const defaultBaseDir = (Boolean(process.env.VERCEL) || process.env.NODE_ENV === 'production') && !process.env.UPLOAD_DIR
  ? '/tmp/uploads'
  : path.resolve(process.cwd(), '../../uploads')

const UPLOAD_DIR = process.env.UPLOAD_DIR || defaultBaseDir

export async function saveImage(buffer: Buffer, sha256Hex: string, kind: 'report' | 'fix'): Promise<string> {
  // Convert input buffer (JPEG, PNG, HEIC, etc.) to optimized WebP
  let webpBuffer: Buffer = buffer
  try {
    webpBuffer = await sharp(buffer)
      .resize(1600, 1600, { fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 82, effort: 4 })
      .toBuffer()
  } catch (err) {
    console.warn('Sharp webp conversion failed, using raw buffer:', err)
  }

  const filename = `${sha256Hex}.webp`
  const relativePath = `${kind}/${filename}`

  // 1. Upload to Supabase Storage (Permanent CDN URL across all Vercel instances)
  try {
    const { error } = await supabaseAdmin.storage
      .from('uploads')
      .upload(relativePath, webpBuffer, {
        contentType: 'image/webp',
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
    fs.writeFileSync(path.join(primaryDir, filename), webpBuffer)
  } catch {
    const fallbackDir = path.join('/tmp/uploads', kind)
    try {
      if (!fs.existsSync(fallbackDir)) {
        fs.mkdirSync(fallbackDir, { recursive: true })
      }
      fs.writeFileSync(path.join(fallbackDir, filename), webpBuffer)
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
