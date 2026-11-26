const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000'

export interface AIServiceStatus {
  available: boolean
  disabledFeatures: string[]
}

export async function checkAIService(): Promise<AIServiceStatus> {
  try {
    const res = await fetch(`${AI_SERVICE_URL}/health`, { 
      signal: AbortSignal.timeout(3000),
      cache: 'no-store'
    })
    if (res.ok) {
      return { available: true, disabledFeatures: [] }
    }
  } catch {
    // degraded/down
  }
  return { 
    available: false, 
    disabledFeatures: ['classification', 'duplicate-detection', 'priority', 'routing', 'proof-of-fix'] 
  }
}

export async function callAI(endpoint: string, data: FormData | object): Promise<any> {
  const isFormData = data instanceof FormData
  const res = await fetch(`${AI_SERVICE_URL}${endpoint}`, {
    method: 'POST',
    headers: isFormData ? {} : { 'Content-Type': 'application/json' },
    body: isFormData ? data : JSON.stringify(data),
  })
  if (!res.ok) {
    const error = await res.text()
    throw new Error(`AI service error (${res.status}): ${error}`)
  }
  return res.json()
}
