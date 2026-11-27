import { NextResponse } from 'next/server'
import { checkAIService } from '@/lib/ai-client'

export async function GET() {
  try {
    const ai = await checkAIService()
    return NextResponse.json({
      status: 'ok',
      aiOnline: ai.available,
      mode: ai.useDirectCloud ? 'cloud_vision' : 'local_fastapi',
    })
  } catch {
    return NextResponse.json({ status: 'degraded', aiOnline: false })
  }
}
