import { execSync } from 'child_process'
import fs from 'fs'
import path from 'path'
import os from 'os'

const GEMINI_API_KEY = process.env.GEMINI_API_KEY
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.0-flash-lite'

// ── Extract audio from video using ffmpeg ─────────────────────────────────────
export async function extractAudio(videoPath: string): Promise<string> {
  const tmpDir = os.tmpdir()
  const audioPath = path.join(tmpDir, `ipk_audio_${Date.now()}.wav`)

  // Convert to WAV mono 16kHz — optimal for transcription
  execSync(
    `ffmpeg -i "${videoPath}" -ac 1 -ar 16000 -f wav "${audioPath}" -y`,
    { stdio: 'pipe' }
  )

  return audioPath
}

// ── Convert WAV to MP3 for smaller upload size ───────────────────────────────
function convertToMp3(wavPath: string): string {
  if (wavPath.toLowerCase().endsWith('.mp3')) return wavPath;
  const mp3Path = wavPath.replace(/\.[^/.]+$/, "") + ".mp3";
  execSync(
    `ffmpeg -i "${wavPath}" -ac 1 -ar 16000 -b:a 64k "${mp3Path}" -y`,
    { stdio: 'pipe' }
  )
  return mp3Path
}

// ── Transcribe audio — Gemini first, Whisper fallback ────────────────────────
export async function transcribeAudio(audioPath: string, languageCode = 'en-US'): Promise<string> {
  // Try Gemini transcription first (uses existing API key)
  if (GEMINI_API_KEY) {
    try {
      const result = await transcribeWithGemini(audioPath, languageCode)
      if (result && !result.startsWith('[')) return result
    } catch (err) {
      console.error('[Gemini transcription failed, falling back to Whisper]', err)
    }
  }

  // Fallback to local Whisper
  return transcribeWithWhisper(audioPath, languageCode)
}

// ── Gemini-based transcription (Google service) ──────────────────────────────
async function transcribeWithGemini(audioPath: string, languageCode: string): Promise<string> {
  const langNames: Record<string, string> = {
    'vi-VN': 'Vietnamese',
    'en-US': 'English',
    'ja-JP': 'Japanese',
    'ko-KR': 'Korean',
    'zh-CN': 'Chinese',
  }
  const langName = langNames[languageCode] || 'Vietnamese'

  // Always convert to mp3 first — WAV files are too large for API upload
  let mp3Path = ''
  try {
    mp3Path = convertToMp3(audioPath)
  } catch (err) {
    console.error('[MP3 conversion failed, using original file]', err)
    mp3Path = audioPath
  }

  const audioBuffer = fs.readFileSync(mp3Path)
  const fileSizeMB = audioBuffer.length / (1024 * 1024)
  console.log(`[Gemini transcribe] Audio size: ${fileSizeMB.toFixed(1)}MB (mp3)`)

  const mimeType = mp3Path.endsWith('.mp3') ? 'audio/mpeg' : 'audio/wav'

  try {
    // For files > 10MB, use File API upload
    if (fileSizeMB > 10) {
      return await transcribeViaFileAPI(audioBuffer, mimeType, langName)
    }

    // Inline audio for smaller files
    const base64Audio = audioBuffer.toString('base64')
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: `Transcribe this audio recording word-by-word in ${langName}. Output ONLY the full transcription, no commentary or timestamps. If there are multiple speakers, indicate speaker changes with "Speaker 1:", "Speaker 2:", etc.` },
            { inline_data: { mime_type: mimeType, data: base64Audio } },
          ],
        }],
        generationConfig: { temperature: 0.1, maxOutputTokens: 8192 },
      }),
    })

    if (!res.ok) {
      const errText = await res.text()
      throw new Error(`Gemini API ${res.status}: ${errText.slice(0, 300)}`)
    }

    const data = await res.json() as {
      candidates?: { content?: { parts?: { text?: string }[] } }[]
      error?: { message?: string }
    }

    if (data.error) throw new Error(`Gemini: ${data.error.message}`)
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || ''
    if (!text) throw new Error('Gemini returned empty transcription')
    return text
  } finally {
    // Cleanup mp3 temp file
    if (mp3Path !== audioPath) cleanup(mp3Path)
  }
}

// ── Gemini File API for large audio files ────────────────────────────────────
async function transcribeViaFileAPI(audioBuffer: Buffer, mimeType: string, langName: string): Promise<string> {
  const uint8 = new Uint8Array(audioBuffer)
  console.log('[Gemini] Using File API for large audio...')

  // Step 1: Upload file
  const uploadUrl = `https://generativelanguage.googleapis.com/upload/v1beta/files?key=${GEMINI_API_KEY}`
  const uploadRes = await fetch(uploadUrl, {
    method: 'POST',
    headers: {
      'Content-Type': mimeType,
      'X-Goog-Upload-Protocol': 'raw',
    },
    body: uint8,
  })

  if (!uploadRes.ok) {
    const errText = await uploadRes.text()
    throw new Error(`Gemini file upload ${uploadRes.status}: ${errText.slice(0, 300)}`)
  }

  const uploadData = await uploadRes.json() as { file?: { uri?: string; name?: string }; error?: { message?: string } }
  if (uploadData.error) throw new Error(`Gemini file upload: ${uploadData.error.message}`)
  const fileUri = uploadData.file?.uri
  if (!fileUri) throw new Error('Gemini file upload returned no URI')

  console.log(`[Gemini] File uploaded: ${fileUri}`)

  // Step 2: Wait for file to be processed (sometimes needs a moment)
  await new Promise(resolve => setTimeout(resolve, 2000))

  // Step 3: Transcribe using file reference
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{
        parts: [
          { text: `Transcribe this audio recording word-by-word in ${langName}. Output ONLY the full transcription, no commentary or timestamps. If there are multiple speakers, indicate speaker changes with "Speaker 1:", "Speaker 2:", etc.` },
          { file_data: { mime_type: mimeType, file_uri: fileUri } },
        ],
      }],
      generationConfig: { temperature: 0.1, maxOutputTokens: 8192 },
    }),
  })

  if (!res.ok) {
    const errText = await res.text()
    throw new Error(`Gemini transcribe ${res.status}: ${errText.slice(0, 300)}`)
  }

  const data = await res.json() as {
    candidates?: { content?: { parts?: { text?: string }[] } }[]
    error?: { message?: string }
  }

  if (data.error) throw new Error(`Gemini: ${data.error.message}`)
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || ''
  if (!text) throw new Error('Gemini returned empty transcription')
  return text
}

// ── Whisper fallback ─────────────────────────────────────────────────────────
async function transcribeWithWhisper(audioPath: string, languageCode: string): Promise<string> {
  const tmpDir = os.tmpdir()

  const langMap: Record<string, string> = {
    'vi-VN': 'vi',
    'en-US': 'en',
    'ja-JP': 'ja',
    'ko-KR': 'ko',
    'zh-CN': 'zh',
  }
  const lang = langMap[languageCode] || 'vi'

  try {
    execSync(
      `${getWhisperPath()} "${audioPath}" --model base --language ${lang} --output_format txt --output_dir "${tmpDir}" --fp16 False`,
      { stdio: 'pipe', timeout: 600000 }
    )

    const audioBaseName = path.basename(audioPath, path.extname(audioPath))
    const txtPath = path.join(tmpDir, `${audioBaseName}.txt`)

    if (fs.existsSync(txtPath)) {
      const transcript = fs.readFileSync(txtPath, 'utf-8').trim()
      cleanup(txtPath)
      return transcript || '[Transcription returned empty result]'
    }

    return '[Whisper output file not found — check whisper installation]'
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    if (msg.includes('command not found') || msg.includes('not recognized')) {
      return '[Whisper not installed and Gemini transcription failed — check GEMINI_API_KEY or run: pip install openai-whisper]'
    }
    return `[Transcription error: ${msg.slice(0, 200)}]`
  }
}

// ── Find whisper binary (venv or global) ─────────────────────────────────────
function getWhisperPath(): string {
  const venvPath = path.join(process.cwd(), '.venv', 'bin', 'whisper')
  if (fs.existsSync(venvPath)) return venvPath
  return 'whisper'
}

// ── Cleanup temp files ────────────────────────────────────────────────────────
export function cleanup(...paths: string[]) {
  for (const p of paths) {
    try { if (fs.existsSync(p)) fs.unlinkSync(p) } catch { /* ignore */ }
  }
}
