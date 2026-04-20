export type UserRole = 'boss' | 'lead' | 'employee'
export type ProjectRole = 'lead' | 'member'

export interface User {
  id: string
  name: string
  email: string
  role: UserRole
  title: string        // position: BE, FE, BA, QC, PM, Designer, DevOps, etc.
  avatar: string
  active: boolean
  created_at: string
}

export interface ProjectAssignment {
  id: string
  user_id: string
  project_id: string
  role_in_project: ProjectRole
  assigned_at: string
  // joined fields
  user_name?: string
  email?: string
  user_role?: UserRole
  avatar?: string
  project_name?: string
  color?: string
}

export interface ActivityLogEntry {
  id: string
  user_id: string
  project_id: string | null
  action: string
  target_type: string
  target_id: string
  meta: string
  created_at: string
  user_name?: string
}

export interface ProjectIntegration {
  id: string
  project_id: string
  type: string
  label: string
  config: string  // JSON
  n8n_webhook_url: string
  active: boolean
  created_at: string
}

export type ProjectTool = 'jira' | 'monday' | 'asana' | 'trello' | 'linear' | 'none'

export interface Project {
  id: string
  name: string
  color: string
  slack_workspace: string | null
  tool: ProjectTool
  created_at: string
}

export interface KnowledgePage {
  id: string
  project_id: string
  title: string
  content: string
  updated_at: string
  source: 'manual' | 'upload' | 'meeting' | 'slack'
}

export interface Meeting {
  id: string
  project_id: string
  title: string
  date: string
  duration_minutes: number | null
  transcript: string
  translation: string
  summary: string
  action_items: string   // JSON string[]
  key_decisions: string  // JSON string[]
  uploaded_by: string
  created_at: string
}

export interface SlackMessage {
  id: string
  project_id: string
  from_name: string
  from_initials: string
  channel: string
  workspace: string
  message: string
  tags: string           // JSON string[]
  status: 'pending' | 'replied' | 'flagged' | 'dismissed'
  draft_reply: string
  flagged_by: string
  flagged_to: string
  pulled_at: string
}

export interface ChatMessage {
  id: string
  project_id: string
  role: 'user' | 'assistant'
  content: string
  created_at: string
}

export interface ToneProfile {
  id: string
  project_id: string
  samples: string        // JSON string[]
  style_notes: string
  salutation: string
  updated_at: string
}

export interface JiraTicket {
  id: string
  project_id: string
  jira_key: string
  title: string
  status: string
  assignee: string
  priority: string
  description: string
  risk_level: 'none' | 'low' | 'medium' | 'high' | 'critical'
  risk_reason: string
  due_date: string | null
  labels: string         // JSON string[]
  synced_at: string
}

export interface GithubRepo {
  id: string
  project_id: string
  repo_url: string
  default_branch: string
  last_synced: string | null
}

export interface GithubFile {
  id: string
  repo_id: string
  file_path: string
  content: string
  last_synced: string
}
