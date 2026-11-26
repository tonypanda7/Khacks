import { NextRequest, NextResponse } from 'next/server'
import { getImagePath } from '@/lib/storage'
import fs from 'fs'

export async function GET(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  try {
    const { path: pathSegments } = await params
    const relativePath = '/' + pathSegments.join('/')
    const filePath = getImagePath(relativePath)

    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: 'Image not found' }, { status: 404 })
    }

    const buffer = fs.readFileSync(filePath)
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'image/jpeg',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
