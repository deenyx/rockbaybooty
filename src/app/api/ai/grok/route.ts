import { NextRequest, NextResponse } from 'next/server'

import { getAuthenticatedUserId } from '@/lib/auth'
import { MESSAGES } from '@/lib/constants'

export const dynamic = 'force-dynamic'

const GROK_API_URL = 'https://api.x.ai/v1/chat/completions'
const DEFAULT_MODEL = 'grok-2-latest'
const MAX_PROMPT_LENGTH = 1000

const SYSTEM_PROMPT =
  'You are a concise, stylish dating-message writing assistant for adults. Keep responses respectful, confident, and non-explicit. Return plain text only.'

function trimContext(value: unknown): string {
  if (typeof value !== 'string') {
    return ''
  }

  return value.trim().slice(0, 1800)
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getAuthenticatedUserId(request)

    if (!userId) {
      return NextResponse.json({ error: MESSAGES.AUTH_REQUIRED }, { status: 401 })
    }

    const body = await request.json().catch(() => ({})) as {
      prompt?: unknown
      context?: unknown
    }

    const prompt = typeof body.prompt === 'string' ? body.prompt.trim() : ''
    const context = trimContext(body.context)

    if (!prompt) {
      return NextResponse.json({ error: MESSAGES.FIELD_REQUIRED }, { status: 400 })
    }

    if (prompt.length > MAX_PROMPT_LENGTH) {
      return NextResponse.json(
        { error: `Prompt is too long (max ${MAX_PROMPT_LENGTH} chars).` },
        { status: 400 }
      )
    }

    const apiKey = process.env.XAI_API_KEY || process.env.GROK_API_KEY
    const model = process.env.GROK_MODEL || DEFAULT_MODEL

    if (!apiKey) {
      return NextResponse.json(
        { error: 'Grok is not configured yet. Add XAI_API_KEY in environment variables.' },
        { status: 503 }
      )
    }

    const messages = [{ role: 'system', content: SYSTEM_PROMPT }] as Array<{ role: 'system' | 'user'; content: string }>

    if (context) {
      messages.push({ role: 'user', content: `Conversation context:\n${context}` })
    }

    messages.push({ role: 'user', content: prompt })

    const response = await fetch(GROK_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages,
        max_tokens: 220,
        temperature: 0.7,
      }),
    })

    const payload = await response.json().catch(() => ({})) as {
      choices?: Array<{ message?: { content?: string } }>
      error?: { message?: string }
    }

    if (!response.ok) {
      const message = payload.error?.message || 'Failed to reach Grok.'
      return NextResponse.json({ error: message }, { status: response.status })
    }

    const reply = payload.choices?.[0]?.message?.content?.trim()

    if (!reply) {
      return NextResponse.json({ error: MESSAGES.ERROR_GENERAL }, { status: 502 })
    }

    return NextResponse.json({ reply, model })
  } catch (error) {
    console.error('Grok API error:', error)
    return NextResponse.json({ error: MESSAGES.ERROR_GENERAL }, { status: 500 })
  }
}
