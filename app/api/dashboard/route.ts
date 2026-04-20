import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  const overview = db.dashboard.overview()
  const projects = db.dashboard.projectStats()
  const flagged = db.dashboard.flaggedMessages()
  const activity = db.activity.recent(20)

  return NextResponse.json({ overview, projects, flagged, activity })
}
