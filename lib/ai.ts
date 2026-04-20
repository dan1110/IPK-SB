const GEMINI_API_KEY = process.env.GEMINI_API_KEY
const MODEL = process.env.GEMINI_MODEL || 'gemini-2.0-flash-lite'
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${GEMINI_API_KEY}`

async function gemini(prompt: string, systemInstruction?: string, maxTokens?: number): Promise<string> {
  const body: Record<string, unknown> = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: { temperature: 0.7, maxOutputTokens: maxTokens || 8192 },
  }
  if (systemInstruction) {
    body.systemInstruction = { parts: [{ text: systemInstruction }] }
  }

  const res = await fetch(GEMINI_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  const data = await res.json() as {
    candidates?: { content?: { parts?: { text?: string }[] } }[]
    error?: { message?: string }
  }

  if (data.error) throw new Error(`Gemini API error: ${data.error.message}`)
  return data.candidates?.[0]?.content?.parts?.[0]?.text || ''
}

async function geminiChat(
  history: { role: 'user' | 'assistant'; content: string }[],
  systemInstruction: string
): Promise<string> {
  const contents = history.map(m => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }))

  const body = {
    contents,
    systemInstruction: { parts: [{ text: systemInstruction }] },
    generationConfig: { temperature: 0.7, maxOutputTokens: 8192 },
  }

  const res = await fetch(GEMINI_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  const data = await res.json() as {
    candidates?: { content?: { parts?: { text?: string }[] } }[]
    error?: { message?: string }
  }

  if (data.error) throw new Error(`Gemini API error: ${data.error.message}`)
  return data.candidates?.[0]?.content?.parts?.[0]?.text || ''
}

// ── Build context string from knowledge + meetings + jira + code ─────────────
export function buildContext(
  pages: { title: string; content: string }[],
  meetings: { title: string; date: string; summary: string; action_items: string; key_decisions: string }[],
  tickets?: { jira_key: string; title: string; status: string; assignee: string; priority: string; risk_level: string; due_date: string | null }[],
  codeFiles?: { file_path: string; content: string }[]
): string {
  const kbSection = pages.length
    ? `## KNOWLEDGE PAGES\n` + pages.map(p => `### ${p.title}\n${p.content}`).join('\n\n')
    : ''
  const meetingSection = meetings.length
    ? `## MEETING NOTES\n` + meetings.map(m => `### ${m.title} (${m.date})\n**Summary:** ${m.summary}\n**Decisions:** ${m.key_decisions}\n**Action Items:** ${m.action_items}`).join('\n\n')
    : ''
  const jiraSection = tickets?.length
    ? `## JIRA TICKETS\n` + tickets.map(t => `- **${t.jira_key}** ${t.title} | Status: ${t.status} | Assignee: ${t.assignee || 'Unassigned'} | Priority: ${t.priority}${t.risk_level !== 'none' ? ` | ⚠ Risk: ${t.risk_level}` : ''}${t.due_date ? ` | Due: ${t.due_date}` : ''}`).join('\n')
    : ''
  const codeSection = codeFiles?.length
    ? `## SOURCE CODE\n` + codeFiles.map(f => `### ${f.file_path}\n\`\`\`\n${f.content.slice(0, 3000)}\n\`\`\``).join('\n\n')
    : ''
  return [kbSection, meetingSection, jiraSection, codeSection].filter(Boolean).join('\n\n')
}

// ── Process uploaded text → classify + update knowledge ──────────────────────
export async function processUploadedText(content: string, existingPages: { id: string; title: string; content: string }[]) {
  const pagesJson = JSON.stringify(existingPages.map(p => ({ id: p.id, title: p.title, preview: p.content.slice(0, 200) })))

  const text = await gemini(`You are a knowledge management AI. Analyze the uploaded content and decide how to organize it into knowledge pages.

EXISTING PAGES:
${pagesJson}

UPLOADED CONTENT:
${content}

Respond ONLY with valid JSON (no markdown, no explanation):
{
  "updates": [
    { "id": "existing-page-id", "title": "page title", "content": "full updated content" }
  ],
  "creates": [
    { "title": "new page title", "content": "full content for new page" }
  ],
  "summary": "one sentence describing what was processed"
}`)

  try {
    return JSON.parse(text.replace(/```json|```/g, '').trim())
  } catch {
    return { updates: [], creates: [], summary: 'Content processed' }
  }
}

// ── Process meeting notes → structured output ─────────────────────────────────
export async function processMeetingNotes(rawText: string, projectContext: string) {
  const text = await gemini(`You are processing meeting notes for a software project. Your job is to create EXTREMELY DETAILED, COMPREHENSIVE notes.

CRITICAL RULES:
1. ALL output MUST be in ENGLISH (except the "translation" field which is Vietnamese).
2. The "summary" field is the MAIN OUTPUT. It must be DETAILED MEETING MINUTES — NOT a brief summary.
   - Write multiple paragraphs, organized by discussion topic.
   - Include EVERY important point: names, numbers, dates, technical terms, URLs, decisions, reasoning.
   - If someone explains a process or decision, capture the FULL reasoning, not just the conclusion.
   - Include who said what when possible. Preserve context and nuance.
   - Think of this as a transcript-to-minutes conversion. Someone who missed the meeting should be able to read this and know everything that was discussed.
   - MINIMUM 500 words for any non-trivial meeting.
3. The "translation" field: Full VIETNAMESE translation of the entire raw content/transcript.
   - This is a TRANSLATION, not a summary. Translate as close to word-for-word as possible.
   - Keep speaker labels, technical terms, and proper nouns intact.
   - If the original is already in Vietnamese, copy it as-is and clean up formatting.
4. Do NOT skip, shorten, or summarize away any information. When in doubt, include more detail.

PROJECT CONTEXT:
${projectContext}

RAW MEETING CONTENT:
${rawText}

Respond ONLY with valid JSON:
{
  "title": "Meeting title (descriptive, include topic and date if mentioned)",
  "summary": "EXTREMELY DETAILED meeting minutes IN ENGLISH. Multiple paragraphs, organized by topic. Cover every discussion point, decision rationale, context, technical detail, names, dates, and action items discussed. Minimum 500 words.",
  "translation": "Full VIETNAMESE translation of the raw transcript/content. Near word-for-word, preserving speaker labels and all details.",
  "action_items": ["action item 1 — include WHO is responsible and WHEN deadline is", "action item 2"],
  "key_decisions": ["decision 1 — include the reasoning/context behind it", "decision 2"],
  "knowledge_updates": [
    { "topic": "topic name", "content": "detailed content to add to knowledge pages" }
  ]
}`, undefined, 16384)

  try {
    return JSON.parse(text.replace(/```json|```/g, '').trim())
  } catch {
    return { title: 'Meeting', summary: rawText.slice(0, 300), translation: '', action_items: [], key_decisions: [], knowledge_updates: [] }
  }
}

// ── Draft reply for a Slack message ──────────────────────────────────────────
export async function draftReply(
  slackMessage: string,
  fromName: string,
  context: string,
  toneProfile: { samples: string[]; style_notes: string; salutation: string } | null
) {
  const toneSection = toneProfile
    ? `TONE PROFILE:\nStyle notes: ${toneProfile.style_notes}\nSalutation: ${toneProfile.salutation}\nSample replies:\n${toneProfile.samples.join('\n---\n')}`
    : 'Write in a professional but friendly tone. Keep it concise.'

  return await gemini(`You are drafting a reply to a Slack message on behalf of Steven (the project manager).

${toneSection}

PROJECT CONTEXT:
${context}

MESSAGE FROM ${fromName}:
${slackMessage}

Write a draft reply. Be helpful, accurate based on the context, and match Steven's tone. Reply directly — no preamble.`)
}

// ── Chat with project context ─────────────────────────────────────────────────
export async function chatWithContext(
  history: { role: 'user' | 'assistant'; content: string }[],
  context: string,
  projectName: string
) {
  return await geminiChat(history, `You are Project Brain, an AI assistant for the project "${projectName}".
Answer questions based on the knowledge pages and meeting notes provided.
Always cite your source using [Source: page/meeting name] format (e.g., [Source: Tech Stack], [Source: Meeting Jan 10]).
If you don't know something, say so clearly.

${context}`)
}

// ── Process Slack messages into knowledge ─────────────────────────────────────
export async function processSlackKnowledge(
  messagesText: string,
  channel: string,
  existingPages: { id: string; title: string; content: string }[]
) {
  const pagesJson = JSON.stringify(existingPages.map(p => ({ id: p.id, title: p.title, preview: p.content.slice(0, 200) })))

  const text = await gemini(`You are a knowledge management AI. Analyze Slack messages from ${channel} and extract project-relevant knowledge.

IMPORTANT: Filter out casual conversation, greetings, and noise. Only extract:
- Technical decisions and discussions
- Requirements and specifications
- Deadlines and milestones
- Team assignments and responsibilities
- Bug reports and issues
- Architecture and design discussions

EXISTING KNOWLEDGE PAGES:
${pagesJson}

SLACK MESSAGES:
${messagesText}

If no useful knowledge is found, return empty arrays.

Respond ONLY with valid JSON (no markdown, no explanation):
{
  "updates": [
    { "id": "existing-page-id", "title": "page title", "content": "full updated content with new info appended" }
  ],
  "creates": [
    { "title": "new page title", "content": "full content for new page" }
  ],
  "summary": "one sentence describing what was extracted"
}`)

  try {
    return JSON.parse(text.replace(/```json|```/g, '').trim())
  } catch {
    return { updates: [], creates: [], summary: 'No actionable knowledge found' }
  }
}

// ── Analyze Jira tickets for risks ──────────────────────────────────────────
export async function analyzeJiraRisks(
  tickets: { id: string; jira_key: string; title: string; status: string; assignee: string; priority: string; due_date: string | null }[]
): Promise<{ jira_key: string; risk_level: string; risk_reason: string }[]> {
  if (!tickets.length) return []

  const ticketsJson = JSON.stringify(tickets.map(t => ({
    key: t.jira_key, title: t.title, status: t.status,
    assignee: t.assignee, priority: t.priority, due_date: t.due_date
  })))

  const today = new Date().toISOString().split('T')[0]

  const text = await gemini(`You are a project risk analyst. Analyze these Jira tickets and identify risks.

TODAY'S DATE: ${today}

TICKETS:
${ticketsJson}

Flag tickets that have risks such as:
- Overdue (due_date is past today)
- High/Critical priority but status is still "To Do"
- No assignee on important tickets
- Stuck in "In Progress" without recent updates
- Blocked status

Respond ONLY with valid JSON array (no markdown):
[
  { "jira_key": "PROJ-123", "risk_level": "high", "risk_reason": "Overdue by 5 days, still in progress" }
]

Risk levels: low, medium, high, critical
Only include tickets with actual risks. Return [] if no risks found.`)

  try {
    return JSON.parse(text.replace(/```json|```/g, '').trim())
  } catch {
    return []
  }
}

// ── Build code context for chat ─────────────────────────────────────────────
export function buildCodeContext(
  files: { file_path: string; content: string }[],
  query: string
): { file_path: string; content: string }[] {
  if (!files.length) return []
  const queryLower = query.toLowerCase()
  const queryWords = queryLower.split(/\s+/).filter(w => w.length > 2)

  // Score each file by relevance to the query
  const scored = files.map(f => {
    let score = 0
    const pathLower = f.file_path.toLowerCase()
    const contentLower = f.content.toLowerCase()

    for (const word of queryWords) {
      if (pathLower.includes(word)) score += 10
      const contentMatches = (contentLower.match(new RegExp(word, 'g')) || []).length
      score += Math.min(contentMatches, 5)
    }

    return { ...f, score }
  })

  // Return top 8 most relevant files
  return scored
    .filter(f => f.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 8)
    .map(({ score: _s, ...f }) => f)
}

// ── Auto-tag a Slack message ──────────────────────────────────────────────────
export async function autoTagMessage(message: string): Promise<string[]> {
  const urgentKeywords = ['deadline', 'urgent', 'asap', 'today', 'immediately', '502', 'down', 'error', 'broken', 'critical']
  const tags: string[] = ['@mention']
  const lower = message.toLowerCase()
  if (urgentKeywords.some(k => lower.includes(k))) tags.push('urgent')
  if (lower.includes('review') || lower.includes('approve') || lower.includes('pr')) tags.push('review')
  if (lower.includes('budget') || lower.includes('payment') || lower.includes('contract')) tags.push('finance')
  if (lower.includes('deadline') || lower.includes('when') || lower.includes('date')) tags.push('deadline')
  return tags
}
