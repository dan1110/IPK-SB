import fs from 'fs'
import path from 'path'
import { execSync } from 'child_process'
import { transcribeAudio } from '../lib/transcribe'

async function run() {
  console.log('--- TEST STT CONFIGURATION ---')
  const testFileName = 'test_audio_stt.mp3'
  const testFilePath = path.join(process.cwd(), testFileName)

  try {
    console.log('Generating sample audio...')
    execSync(`ffmpeg -f lavfi -i anullsrc=r=16000:cl=mono -t 2 -q:a 9 -acodec libmp3lame "${testFilePath}" -y`, { stdio: 'pipe' })
    
    console.log('Transcribing audio...')
    const result = await transcribeAudio(testFilePath, 'en-US')
    
    console.log('\nTranscription Result:')
    console.log(result)
  } catch (err) {
    console.error('Error during STT test:', err)
  } finally {
    if (fs.existsSync(testFilePath)) fs.unlinkSync(testFilePath)
  }
}

run().catch(console.error)
