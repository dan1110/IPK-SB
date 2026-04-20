import fs from 'fs'
import path from 'path'
import { execSync } from 'child_process'

async function run() {
  console.log('--- TEST VIDEO UPLOAD FLOW ---')
  const baseUrl = 'http://localhost:3000'
  
  // 1. Setup - generate a 1-second silent mp3 file
  const testFileName = 'test_audio_silence.mp3'
  const testFilePath = path.join(process.cwd(), testFileName)
  console.log('1. Generating fake audio file...')
  try {
    execSync(`ffmpeg -f lavfi -i anullsrc=r=16000:cl=mono -t 1 -q:a 9 -acodec libmp3lame "${testFilePath}" -y`, { stdio: 'pipe' })
  } catch (e) {
    console.error('Failed to generate test audio with ffmpeg. Creating a dummy text file instead.')
    fs.writeFileSync(testFilePath, 'dummy audio data')
  }

  // 2. Mock STT / Ensure API key exists
  if (!process.env.GEMINI_API_KEY) {
    console.warn('WARNING: GEMINI_API_KEY is not set. The endpoint will fallback to local Whisper. If whisper is not installed, it will return an error string.')
  }

  // Ensure project exists
  console.log('2. Creating or getting test project...')
  const projectsRes = await fetch(`${baseUrl}/api/projects`)
  let projects = await projectsRes.json()
  let testProject = projects.find((p: any) => p.name === 'Test Project Video')
  
  if (!testProject) {
    const createRes = await fetch(`${baseUrl}/api/projects`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Test Project Video', color: 'blue' })
    })
    testProject = await createRes.json()
  }

  const projectId = testProject.id
  console.log(`Using project ID: ${projectId}`)

  // 3. Upload file
  console.log('3. Uploading file to /api/upload/video...')
  const formData = new FormData()
  const fileBuffer = fs.readFileSync(testFilePath)
  const blob = new Blob([fileBuffer], { type: 'audio/mpeg' })
  formData.append('file', blob, testFileName)
  formData.append('project_id', projectId)
  formData.append('title', 'Automated Test Meeting')
  formData.append('uploaded_by', 'test_script')

  const uploadStart = Date.now()
  const uploadRes = await fetch(`${baseUrl}/api/upload/video`, {
    method: 'POST',
    body: formData
  })
  
  const uploadData = await uploadRes.json()
  const uploadEnd = Date.now()
  console.log(`Upload API Response (${Math.round((uploadEnd - uploadStart)/1000)}s):`)
  console.log(JSON.stringify(uploadData, null, 2))

  // 4. Verification
  console.log('4. Verifying meeting was created in DB...')
  const meetingsRes = await fetch(`${baseUrl}/api/meetings?project_id=${projectId}`)
  const meetings = await meetingsRes.json()
  
  const found = meetings.find((m: any) => m.title === 'Automated Test Meeting')
  if (found) {
    console.log('SUCCESS! Meeting was created in DB.')
    console.log(`Meeting Transcript Preview: ${found.transcript?.slice(0, 50)}...`)
  } else {
    console.error('FAILED! Meeting not found in DB.')
  }

  // Cleanup
  if (fs.existsSync(testFilePath)) fs.unlinkSync(testFilePath)
  console.log('--- TEST COMPLETE ---')
}

run().catch(console.error)
