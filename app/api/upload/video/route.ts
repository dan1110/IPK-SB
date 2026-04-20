import { NextRequest, NextResponse } from 'next/server'
import { writeFile } from 'fs/promises'
import { existsSync, mkdirSync } from 'fs'
import path from 'path'
import os from 'os'
import { v4 as uuid } from 'uuid'
import { extractAudio, transcribeAudio, cleanup } from '@/lib/transcribe'
import { processMeetingNotes, buildContext } from '@/lib/ai'
import { db } from '@/lib/db'

export const maxDuration = 300 // 5 min timeout for large videos

// Next.js 14 — disable body parser for file uploads
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const tmpDir = os.tmpdir()

  let videoPath = ''
  let audioPath = ''

  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    const projectId = formData.get('project_id') as string | null
    const uploadedBy = (formData.get('uploaded_by') as string) || 'steven'
    const manualTitle = formData.get('title') as string | null
    const langCode = (formData.get('language') as string) || 'en-US'

    if (!file || !projectId) {
      return NextResponse.json({ error: 'file and project_id required' }, { status: 400 })
    }

    const project = db.projects.get(projectId)
    if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 })

    // Validate file type
    const allowedTypes = ['video/mp4', 'video/webm', 'video/quicktime', 'audio/mpeg', 'audio/wav', 'audio/flac']
    if (!allowedTypes.includes(file.type) && !file.name.match(/\.(mp4|webm|mov|mp3|wav|flac|m4a)$/i)) {
      return NextResponse.json({ error: 'File must be .mp4, .webm, .mov, .mp3, .wav, or .flac' }, { status: 400 })
    }

    // Max 500MB
    const maxSize = 500 * 1024 * 1024
    if (file.size > maxSize) {
      return NextResponse.json({ error: 'File too large — max 500MB' }, { status: 400 })
    }

    // ── Step 1: Save uploaded file ────────────────────────────────────────────
    const ext = file.name.split('.').pop() || 'mp4'
    videoPath = path.join(tmpDir, `ipk_video_${uuid()}.${ext}`)
    const bytes = await file.arrayBuffer()
    await writeFile(videoPath, Buffer.from(bytes))

    // ── Step 2: Extract audio (skip if already audio) ─────────────────────────
    const isAudio = file.type.startsWith('audio/') || file.name.match(/\.(mp3|wav|flac|m4a)$/i)
    if (isAudio) {
      audioPath = videoPath // use directly
    } else {
      audioPath = await extractAudio(videoPath)
    }

    // ── Step 3: Transcribe ────────────────────────────────────────────────────
    const transcript = await transcribeAudio(audioPath, langCode)

    // ── Step 4: AI process transcript ─────────────────────────────────────────
    const pages = db.knowledge.byProject(projectId) as { title: string; content: string }[]
    const meetings = db.meetings.byProject(projectId) as { title: string; date: string; summary: string; action_items: string; key_decisions: string }[]
    const context = buildContext(pages, meetings)

    let processed = {
      title: manualTitle || `Meeting ${new Date().toLocaleDateString('vi-VN')}`,
      summary: transcript.slice(0, 500),
      translation: '',
      action_items: [] as string[],
      key_decisions: [] as string[],
      knowledge_updates: [] as { topic: string; content: string }[],
    }

    if (process.env.GEMINI_API_KEY && transcript && !transcript.startsWith('[')) {
      processed = await processMeetingNotes(transcript, context)
      if (manualTitle) processed.title = manualTitle
    }

    // ── Step 5: Save meeting ──────────────────────────────────────────────────
    const meetingId = uuid()
    const durationMinutes = await getVideoDuration(videoPath)

    db.meetings.create({
      id: meetingId,
      project_id: projectId,
      title: processed.title || 'Meeting',
      date: new Date().toISOString().split('T')[0],
      duration_minutes: durationMinutes,
      transcript,
      translation: processed.translation || '',
      summary: processed.summary || '',
      action_items: JSON.stringify(processed.action_items || []),
      key_decisions: JSON.stringify(processed.key_decisions || []),
      uploaded_by: uploadedBy,
    })

    // ── Step 6: Auto-update knowledge pages ───────────────────────────────────
    let knowledgeUpdated = 0
    const currentPages = db.knowledge.byProject(projectId) as { id: string; title: string; content: string }[]
    for (const update of processed.knowledge_updates || []) {
      const topicLower = update.topic.toLowerCase()
      // Match by: exact title, title contains topic, or topic contains title
      const existing = currentPages.find(p => {
        const titleLower = p.title.toLowerCase()
        return titleLower === topicLower || titleLower.includes(topicLower) || topicLower.includes(titleLower)
      })
      if (existing) {
        db.knowledge.update(existing.id, {
          content: existing.content + `\n\n**From meeting "${processed.title}":**\n${update.content}`,
          source: 'meeting'
        })
      } else {
        db.knowledge.create({ id: uuid(), project_id: projectId, title: update.topic, content: update.content, source: 'meeting' })
        currentPages.push({ id: uuid(), title: update.topic, content: update.content }) // track for subsequent matches
      }
      knowledgeUpdated++
    }

    return NextResponse.json({
      ok: true,
      meeting_id: meetingId,
      title: processed.title,
      duration_minutes: durationMinutes,
      transcript_length: transcript.length,
      knowledge_updated: knowledgeUpdated,
      summary_preview: processed.summary?.slice(0, 200),
    })

  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err)
    console.error('[Video upload error]', errMsg, err)
    return NextResponse.json({ error: errMsg }, { status: 500 })
  } finally {
    // Always cleanup temp files
    if (videoPath !== audioPath) cleanup(videoPath, audioPath)
    else cleanup(videoPath)
  }
}

async function getVideoDuration(videoPath: string): Promise<number | undefined> {
  try {
    const { execSync } = await import('child_process')
    const out = execSync(
      `ffprobe -v error -show_entries format=duration -of csv=p=0 "${videoPath}"`,
      { stdio: 'pipe' }
    ).toString().trim()
    const secs = parseFloat(out)
    return isNaN(secs) ? undefined : Math.round(secs / 60)
  } catch {
    return undefined
  }
}
