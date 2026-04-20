import { NextRequest, NextResponse } from 'next/server'

const GEMINI_API_KEY = process.env.GEMINI_API_KEY
const MODEL = process.env.GEMINI_MODEL || 'gemini-2.0-flash-lite'

export async function POST(req: NextRequest) {
  const { text } = await req.json()

  if (!text) return NextResponse.json({ error: 'text required' }, { status: 400 })
  if (!GEMINI_API_KEY) return NextResponse.json({ error: 'GEMINI_API_KEY not configured' }, { status: 500 })

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${GEMINI_API_KEY}`

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: `Translate the following English text to Vietnamese. Keep formatting, bullet points, and structure intact. Only output the translation, no explanation.\n\n${text}` }] }],
      generationConfig: { temperature: 0.3, maxOutputTokens: 2000 },
    }),
  })

  const data = await res.json() as {
    candidates?: { content?: { parts?: { text?: string }[] } }[]
    error?: { message?: string }
  }

  if (data.error) return NextResponse.json({ error: data.error.message }, { status: 500 })

  const translated = data.candidates?.[0]?.content?.parts?.[0]?.text || ''
  return NextResponse.json({ translated })
}
