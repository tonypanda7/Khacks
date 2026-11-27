import { NextRequest, NextResponse } from 'next/server'
import { getImagePath } from '@/lib/storage'
import fs from 'fs'

const SUPABASE_STORAGE_BASE = 'https://xcuyombakgbmxplzklph.supabase.co/storage/v1/object/public/uploads'

export async function GET(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  try {
    const { path: pathSegments } = await params
    const relativePath = '/' + pathSegments.join('/')
    const filePath = getImagePath(relativePath)

    if (fs.existsSync(filePath)) {
      const buffer = fs.readFileSync(filePath)
      return new NextResponse(buffer, {
        headers: {
          'Content-Type': 'image/jpeg',
          'Cache-Control': 'public, max-age=31536000, immutable',
        },
      })
    }

    // Fallback: Redirect to Supabase Storage CDN
    return NextResponse.redirect(`${SUPABASE_STORAGE_BASE}${relativePath}`, 307)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
