export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server'
import { writeFile } from 'fs/promises'
import path from 'path'
import os from 'os'
import { v4 as uuid } from 'uuid'
import { extractAudio, transcribeAudio, cleanup } from '@/lib/transcribe'
import { processMeetingNotes, buildContext } from '@/lib/ai'
import { db } from '@/lib/db'

export const maxDuration = 300

export async function POST(req: NextRequest) {
  let videoPath = ''
  let audioPath = ''

  try {
    const { url, project_id, title, language = 'en-US', uploaded_by = 'steven' } = await req.json()

    if (!url || !project_id) {
      return NextResponse.json({ error: 'url and project_id required' }, { status: 400 })
    }

    const project = db.projects.get(project_id)
    if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 })

    // ── Extract Google Drive file ID ──────────────────────────────────────────
    const fileId = extractDriveFileId(url)
    if (!fileId) {
      return NextResponse.json({ error: 'Invalid Google Drive URL. Supported formats: drive.google.com/file/d/..., drive.google.com/open?id=...' }, { status: 400 })
    }

    // ── Download from Google Drive ────────────────────────────────────────────
    const downloadUrl = `https://drive.google.com/uc?export=download&id=${fileId}&confirm=t`
    const res = await fetch(downloadUrl, { redirect: 'follow' })

    if (!res.ok) {
      return NextResponse.json({ error: `Failed to download from Drive (${res.status}). Make sure the file is shared as "Anyone with the link".` }, { status: 400 })
    }

    const contentType = res.headers.get('content-type') || ''
    // Check if we got HTML instead of a file (access denied or large file warning)
    if (contentType.includes('text/html')) {
      return NextResponse.json({ error: 'Cannot download — file may be too large for direct download or not shared publicly. Try sharing with "Anyone with the link" permission.' }, { status: 400 })
    }

    const buffer = Buffer.from(await res.arrayBuffer())
    const sizeMB = buffer.length / 1024 / 1024

    if (sizeMB > 500) {
      return NextResponse.json({ error: 'File too large — max 500MB' }, { status: 400 })
    }

    // Guess extension from content type
    const extMap: Record<string, string> = {
      'video/mp4': 'mp4', 'video/webm': 'webm', 'video/quicktime': 'mov',
      'audio/mpeg': 'mp3', 'audio/wav': 'wav', 'audio/flac': 'flac', 'audio/mp4': 'm4a',
    }
    const ext = extMap[contentType] || 'mp4'

    // ── Save to temp ──────────────────────────────────────────────────────────
    videoPath = path.join(os.tmpdir(), `ipk_drive_${uuid()}.${ext}`)
    await writeFile(videoPath, buffer)

    // ── Extract audio ─────────────────────────────────────────────────────────
    const isAudio = contentType.startsWith('audio/')
    audioPath = isAudio ? videoPath : await extractAudio(videoPath)

    // ── Transcribe ────────────────────────────────────────────────────────────
    const transcript = await transcribeAudio(audioPath, language)

    // ── AI process ────────────────────────────────────────────────────────────
    const pages = db.knowledge.byProject(project_id) as { title: string; content: string }[]
    const meetings = db.meetings.byProject(project_id) as { title: string; date: string; summary: string; action_items: string; key_decisions: string }[]
    const context = buildContext(pages, meetings)

    let processed = {
      title: title || `Meeting ${new Date().toLocaleDateString('en-US')}`,
      summary: transcript.slice(0, 500),
      translation: '',
      action_items: [] as string[],
      key_decisions: [] as string[],
      knowledge_updates: [] as { topic: string; content: string }[],
    }

    if (process.env.GEMINI_API_KEY && transcript && !transcript.startsWith('[')) {
      processed = await processMeetingNotes(transcript, context)
      if (title) processed.title = title
    }

    // ── Save meeting ──────────────────────────────────────────────────────────
    const meetingId = uuid()
    const durationMinutes = await getVideoDuration(videoPath)

    db.meetings.create({
      id: meetingId,
      project_id,
      title: processed.title || 'Meeting',
      date: new Date().toISOString().split('T')[0],
      duration_minutes: durationMinutes,
      transcript,
      translation: processed.translation || '',
      summary: processed.summary || '',
      action_items: JSON.stringify(processed.action_items || []),
      key_decisions: JSON.stringify(processed.key_decisions || []),
      uploaded_by,
    })

    // ── Auto-update knowledge pages ───────────────────────────────────────────
    let knowledgeUpdated = 0
    for (const update of processed.knowledge_updates || []) {
      const existing = (db.knowledge.byProject(project_id) as { id: string; title: string; content: string }[])
        .find(p => p.title.toLowerCase().includes(update.topic.toLowerCase()))
      if (existing) {
        db.knowledge.update(existing.id, {
          content: existing.content + `\n\n**From meeting ${processed.title}:** ${update.content}`,
          source: 'meeting'
        })
      } else {
        db.knowledge.create({ id: uuid(), project_id, title: update.topic, content: update.content, source: 'meeting' })
      }
      knowledgeUpdated++
    }

    return NextResponse.json({
      ok: true,
      meeting_id: meetingId,
      title: processed.title,
      duration_minutes: durationMinutes,
      file_size_mb: sizeMB.toFixed(1),
      transcript_length: transcript.length,
      knowledge_updated: knowledgeUpdated,
    })

  } catch (err) {
    console.error('[Drive upload error]', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  } finally {
    if (videoPath !== audioPath) cleanup(videoPath, audioPath)
    else cleanup(videoPath)
  }
}

function extractDriveFileId(url: string): string | null {
  // https://drive.google.com/file/d/FILE_ID/view
  const match1 = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/)
  if (match1) return match1[1]

  // https://drive.google.com/open?id=FILE_ID
  const match2 = url.match(/[?&]id=([a-zA-Z0-9_-]+)/)
  if (match2) return match2[1]

  // https://docs.google.com/uc?id=FILE_ID
  const match3 = url.match(/uc\?.*id=([a-zA-Z0-9_-]+)/)
  if (match3) return match3[1]

  return null
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
