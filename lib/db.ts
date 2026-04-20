import Database from 'better-sqlite3'
import path from 'path'
import fs from 'fs'

const DB_PATH = process.env.DATABASE_PATH || path.join(process.cwd(), 'data', 'brain.db')

let _db: Database.Database | null = null

export function getDb(): Database.Database {
  if (_db) return _db
  const dir = path.dirname(DB_PATH)
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
  _db = new Database(DB_PATH)
  _db.pragma('journal_mode = WAL')
  _db.pragma('foreign_keys = ON')
  migrate(_db)
  return _db
}

function migrate(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS projects (
      id          TEXT PRIMARY KEY,
      name        TEXT NOT NULL,
      color       TEXT NOT NULL DEFAULT '#4f8ef7',
      slack_workspace TEXT,
      tool        TEXT NOT NULL DEFAULT 'none',
      created_at  TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS knowledge_pages (
      id          TEXT PRIMARY KEY,
      project_id  TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      title       TEXT NOT NULL,
      content     TEXT NOT NULL DEFAULT '',
      updated_at  TEXT NOT NULL DEFAULT (datetime('now')),
      source      TEXT NOT NULL DEFAULT 'manual'
    );

    CREATE TABLE IF NOT EXISTS meetings (
      id              TEXT PRIMARY KEY,
      project_id      TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      title           TEXT NOT NULL,
      date            TEXT NOT NULL,
      duration_minutes INTEGER,
      transcript      TEXT NOT NULL DEFAULT '',
      translation     TEXT NOT NULL DEFAULT '',
      summary         TEXT NOT NULL DEFAULT '',
      action_items    TEXT NOT NULL DEFAULT '[]',
      key_decisions   TEXT NOT NULL DEFAULT '[]',
      uploaded_by     TEXT NOT NULL DEFAULT 'steven',
      created_at      TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS slack_messages (
      id            TEXT PRIMARY KEY,
      project_id    TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      from_name     TEXT NOT NULL,
      from_initials TEXT NOT NULL,
      channel       TEXT NOT NULL,
      workspace     TEXT NOT NULL,
      message       TEXT NOT NULL,
      tags          TEXT NOT NULL DEFAULT '[]',
      status        TEXT NOT NULL DEFAULT 'pending',
      draft_reply   TEXT NOT NULL DEFAULT '',
      pulled_at     TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS chat_messages (
      id          TEXT PRIMARY KEY,
      project_id  TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      role        TEXT NOT NULL,
      content     TEXT NOT NULL,
      created_at  TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS tone_profiles (
      id          TEXT PRIMARY KEY,
      project_id  TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      samples     TEXT NOT NULL DEFAULT '[]',
      style_notes TEXT NOT NULL DEFAULT '',
      salutation  TEXT NOT NULL DEFAULT '',
      updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS jira_tickets (
      id          TEXT PRIMARY KEY,
      project_id  TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      jira_key    TEXT NOT NULL,
      title       TEXT NOT NULL,
      status      TEXT NOT NULL DEFAULT 'To Do',
      assignee    TEXT NOT NULL DEFAULT '',
      priority    TEXT NOT NULL DEFAULT 'Medium',
      description TEXT NOT NULL DEFAULT '',
      risk_level  TEXT NOT NULL DEFAULT 'none',
      risk_reason TEXT NOT NULL DEFAULT '',
      due_date    TEXT,
      labels      TEXT NOT NULL DEFAULT '[]',
      synced_at   TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE UNIQUE INDEX IF NOT EXISTS idx_jira_project_key ON jira_tickets(project_id, jira_key);

    CREATE TABLE IF NOT EXISTS github_repos (
      id              TEXT PRIMARY KEY,
      project_id      TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      repo_url        TEXT NOT NULL,
      default_branch  TEXT NOT NULL DEFAULT 'main',
      last_synced     TEXT
    );

    CREATE TABLE IF NOT EXISTS github_files (
      id          TEXT PRIMARY KEY,
      repo_id     TEXT NOT NULL REFERENCES github_repos(id) ON DELETE CASCADE,
      file_path   TEXT NOT NULL,
      content     TEXT NOT NULL DEFAULT '',
      last_synced TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE UNIQUE INDEX IF NOT EXISTS idx_github_repo_path ON github_files(repo_id, file_path);

    CREATE TABLE IF NOT EXISTS users (
      id            TEXT PRIMARY KEY,
      name          TEXT NOT NULL,
      email         TEXT NOT NULL UNIQUE,
      role          TEXT NOT NULL DEFAULT 'employee' CHECK(role IN ('boss','lead','employee')),
      avatar        TEXT NOT NULL DEFAULT '',
      active        INTEGER NOT NULL DEFAULT 1,
      password_hash TEXT NOT NULL DEFAULT '',
      created_at    TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS project_assignments (
      id              TEXT PRIMARY KEY,
      user_id         TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      project_id      TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      role_in_project TEXT NOT NULL DEFAULT 'member' CHECK(role_in_project IN ('lead','member')),
      assigned_at     TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE UNIQUE INDEX IF NOT EXISTS idx_assignment_user_project ON project_assignments(user_id, project_id);

    CREATE TABLE IF NOT EXISTS activity_log (
      id          TEXT PRIMARY KEY,
      user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      project_id  TEXT REFERENCES projects(id) ON DELETE SET NULL,
      action      TEXT NOT NULL,
      target_type TEXT NOT NULL DEFAULT '',
      target_id   TEXT NOT NULL DEFAULT '',
      meta        TEXT NOT NULL DEFAULT '{}',
      created_at  TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_activity_user ON activity_log(user_id);
    CREATE INDEX IF NOT EXISTS idx_activity_project ON activity_log(project_id);

    CREATE TABLE IF NOT EXISTS project_integrations (
      id              TEXT PRIMARY KEY,
      project_id      TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      type            TEXT NOT NULL,
      label           TEXT NOT NULL DEFAULT '',
      config          TEXT NOT NULL DEFAULT '{}',
      n8n_webhook_url TEXT NOT NULL DEFAULT '',
      active          INTEGER NOT NULL DEFAULT 1,
      created_at      TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE UNIQUE INDEX IF NOT EXISTS idx_integration_project_type ON project_integrations(project_id, type);
  `)

  // ── Additive migrations for existing databases ───────────────────────────────
  const projCols = db.pragma('table_info(projects)') as { name: string }[]
  if (!projCols.find(c => c.name === 'tool')) {
    db.exec(`ALTER TABLE projects ADD COLUMN tool TEXT NOT NULL DEFAULT 'none'`)
  }

  const userCols = db.pragma('table_info(users)') as { name: string }[]
  if (!userCols.find(c => c.name === 'title')) {
    db.exec(`ALTER TABLE users ADD COLUMN title TEXT NOT NULL DEFAULT ''`)
  }

  const slackCols = db.pragma('table_info(slack_messages)') as { name: string }[]
  if (!slackCols.find(c => c.name === 'flagged_by')) {
    db.exec(`ALTER TABLE slack_messages ADD COLUMN flagged_by TEXT NOT NULL DEFAULT ''`)
  }
  if (!slackCols.find(c => c.name === 'flagged_to')) {
    db.exec(`ALTER TABLE slack_messages ADD COLUMN flagged_to TEXT NOT NULL DEFAULT ''`)
  }
}

// ── Projects ─────────────────────────────────────────────────────────────────
export const db = {
  projects: {
    all: () => getDb().prepare('SELECT * FROM projects ORDER BY created_at DESC').all(),
    get: (id: string) => getDb().prepare('SELECT * FROM projects WHERE id=?').get(id),
    create: (data: { id: string; name: string; color: string; slack_workspace?: string; tool?: string }) =>
      getDb().prepare('INSERT INTO projects (id,name,color,slack_workspace,tool) VALUES (?,?,?,?,?)').run(data.id, data.name, data.color, data.slack_workspace ?? null, data.tool ?? 'none'),
    update: (id: string, data: Partial<{ name: string; color: string; slack_workspace: string; tool: string }>) => {
      const fields = Object.keys(data).map(k => `${k}=?`).join(',')
      return getDb().prepare(`UPDATE projects SET ${fields} WHERE id=?`).run(...Object.values(data), id)
    },
    delete: (id: string) => getDb().prepare('DELETE FROM projects WHERE id=?').run(id),
  },

  knowledge: {
    byProject: (project_id: string) =>
      getDb().prepare('SELECT * FROM knowledge_pages WHERE project_id=? ORDER BY updated_at DESC').all(project_id),
    get: (id: string) => getDb().prepare('SELECT * FROM knowledge_pages WHERE id=?').get(id),
    search: (project_id: string, query: string) =>
      getDb().prepare("SELECT * FROM knowledge_pages WHERE project_id=? AND (title LIKE ? OR content LIKE ?) ORDER BY updated_at DESC").all(project_id, `%${query}%`, `%${query}%`),
    create: (data: { id: string; project_id: string; title: string; content: string; source: string }) =>
      getDb().prepare('INSERT INTO knowledge_pages (id,project_id,title,content,source) VALUES (?,?,?,?,?)').run(data.id, data.project_id, data.title, data.content, data.source),
    update: (id: string, data: Partial<{ title: string; content: string; source: string }>) => {
      const fields = Object.keys(data).map(k => `${k}=?`).join(',') + ', updated_at=datetime(\'now\')'
      return getDb().prepare(`UPDATE knowledge_pages SET ${fields} WHERE id=?`).run(...Object.values(data), id)
    },
    delete: (id: string) => getDb().prepare('DELETE FROM knowledge_pages WHERE id=?').run(id),
  },

  meetings: {
    byProject: (project_id: string) =>
      getDb().prepare('SELECT * FROM meetings WHERE project_id=? ORDER BY date DESC').all(project_id),
    get: (id: string) => getDb().prepare('SELECT * FROM meetings WHERE id=?').get(id),
    create: (data: { id: string; project_id: string; title: string; date: string; duration_minutes?: number; transcript: string; translation: string; summary: string; action_items: string; key_decisions: string; uploaded_by: string }) =>
      getDb().prepare(`INSERT INTO meetings (id,project_id,title,date,duration_minutes,transcript,translation,summary,action_items,key_decisions,uploaded_by) VALUES (?,?,?,?,?,?,?,?,?,?,?)`).run(data.id, data.project_id, data.title, data.date, data.duration_minutes ?? null, data.transcript, data.translation, data.summary, data.action_items, data.key_decisions, data.uploaded_by),
    update: (id: string, data: Record<string, unknown>) => {
      const keys = Object.keys(data)
      const fields = keys.map(k => `${k}=?`).join(',')
      return getDb().prepare(`UPDATE meetings SET ${fields} WHERE id=?`).run(...Object.values(data), id)
    },
    delete: (id: string) => getDb().prepare('DELETE FROM meetings WHERE id=?').run(id),
  },

  slack: {
    byProject: (project_id: string, status?: string) => {
      if (status && status !== 'all') return getDb().prepare('SELECT * FROM slack_messages WHERE project_id=? AND status=? ORDER BY pulled_at DESC').all(project_id, status)
      return getDb().prepare('SELECT * FROM slack_messages WHERE project_id=? ORDER BY pulled_at DESC').all(project_id)
    },
    pendingCount: (project_id: string) => {
      const row = getDb().prepare("SELECT COUNT(*) as cnt FROM slack_messages WHERE project_id=? AND status='pending'").get(project_id) as { cnt: number }
      return row.cnt
    },
    get: (id: string) => getDb().prepare('SELECT * FROM slack_messages WHERE id=?').get(id),
    create: (data: { id: string; project_id: string; from_name: string; from_initials: string; channel: string; workspace: string; message: string; tags: string; draft_reply: string }) =>
      getDb().prepare('INSERT INTO slack_messages (id,project_id,from_name,from_initials,channel,workspace,message,tags,draft_reply) VALUES (?,?,?,?,?,?,?,?,?)').run(data.id, data.project_id, data.from_name, data.from_initials, data.channel, data.workspace, data.message, data.tags, data.draft_reply),
    update: (id: string, data: Partial<{ status: string; draft_reply: string; tags: string; flagged_by: string; flagged_to: string }>) => {
      const fields = Object.keys(data).map(k => `${k}=?`).join(',')
      return getDb().prepare(`UPDATE slack_messages SET ${fields} WHERE id=?`).run(...Object.values(data), id)
    },
  },

  chat: {
    byProject: (project_id: string) =>
      getDb().prepare('SELECT * FROM chat_messages WHERE project_id=? ORDER BY created_at ASC').all(project_id),
    create: (data: { id: string; project_id: string; role: string; content: string }) =>
      getDb().prepare('INSERT INTO chat_messages (id,project_id,role,content) VALUES (?,?,?,?)').run(data.id, data.project_id, data.role, data.content),
    clear: (project_id: string) => getDb().prepare('DELETE FROM chat_messages WHERE project_id=?').run(project_id),
  },

  tone: {
    get: (project_id: string) => getDb().prepare('SELECT * FROM tone_profiles WHERE project_id=?').get(project_id),
    upsert: (data: { id: string; project_id: string; samples: string; style_notes: string; salutation: string }) =>
      getDb().prepare(`INSERT INTO tone_profiles (id,project_id,samples,style_notes,salutation) VALUES (?,?,?,?,?)
        ON CONFLICT(project_id) DO UPDATE SET samples=excluded.samples, style_notes=excluded.style_notes, salutation=excluded.salutation, updated_at=datetime('now')`).run(data.id, data.project_id, data.samples, data.style_notes, data.salutation),
  },

  jira: {
    byProject: (project_id: string, status?: string) => {
      if (status && status !== 'all') return getDb().prepare('SELECT * FROM jira_tickets WHERE project_id=? AND status=? ORDER BY synced_at DESC').all(project_id, status)
      return getDb().prepare('SELECT * FROM jira_tickets WHERE project_id=? ORDER BY synced_at DESC').all(project_id)
    },
    get: (id: string) => getDb().prepare('SELECT * FROM jira_tickets WHERE id=?').get(id),
    getByKey: (project_id: string, jira_key: string) => getDb().prepare('SELECT * FROM jira_tickets WHERE project_id=? AND jira_key=?').get(project_id, jira_key),
    upsert: (data: { id: string; project_id: string; jira_key: string; title: string; status: string; assignee: string; priority: string; description: string; due_date: string | null; labels: string }) =>
      getDb().prepare(`INSERT INTO jira_tickets (id,project_id,jira_key,title,status,assignee,priority,description,due_date,labels,synced_at)
        VALUES (?,?,?,?,?,?,?,?,?,?,datetime('now'))
        ON CONFLICT(project_id,jira_key) DO UPDATE SET title=excluded.title, status=excluded.status, assignee=excluded.assignee, priority=excluded.priority, description=excluded.description, due_date=excluded.due_date, labels=excluded.labels, synced_at=datetime('now')`)
        .run(data.id, data.project_id, data.jira_key, data.title, data.status, data.assignee, data.priority, data.description, data.due_date, data.labels),
    updateRisk: (id: string, risk_level: string, risk_reason: string) =>
      getDb().prepare('UPDATE jira_tickets SET risk_level=?, risk_reason=? WHERE id=?').run(risk_level, risk_reason, id),
    riskTickets: (project_id: string) =>
      getDb().prepare("SELECT * FROM jira_tickets WHERE project_id=? AND risk_level != 'none' ORDER BY synced_at DESC").all(project_id),
    stats: (project_id: string) =>
      getDb().prepare('SELECT status, COUNT(*) as count FROM jira_tickets WHERE project_id=? GROUP BY status').all(project_id) as { status: string; count: number }[],
    count: (project_id: string) => {
      const row = getDb().prepare('SELECT COUNT(*) as cnt FROM jira_tickets WHERE project_id=?').get(project_id) as { cnt: number }
      return row.cnt
    },
  },

  users: {
    all: () => getDb().prepare('SELECT * FROM users WHERE active=1 ORDER BY role, name').all(),
    get: (id: string) => getDb().prepare('SELECT * FROM users WHERE id=?').get(id),
    getByEmail: (email: string) => getDb().prepare('SELECT * FROM users WHERE email=?').get(email),
    create: (data: { id: string; name: string; email: string; role: string; title?: string; avatar?: string; password_hash?: string }) =>
      getDb().prepare('INSERT INTO users (id,name,email,role,title,avatar,password_hash) VALUES (?,?,?,?,?,?,?)').run(data.id, data.name, data.email, data.role, data.title ?? '', data.avatar ?? '', data.password_hash ?? ''),
    update: (id: string, data: Partial<{ name: string; email: string; role: string; title: string; avatar: string; active: number; password_hash: string }>) => {
      const fields = Object.keys(data).map(k => `${k}=?`).join(',')
      return getDb().prepare(`UPDATE users SET ${fields} WHERE id=?`).run(...Object.values(data), id)
    },
    deactivate: (id: string) => getDb().prepare('UPDATE users SET active=0 WHERE id=?').run(id),
  },

  assignments: {
    byProject: (project_id: string) =>
      getDb().prepare(`SELECT pa.*, u.name as user_name, u.email, u.role as user_role, u.avatar, u.title
        FROM project_assignments pa JOIN users u ON pa.user_id = u.id
        WHERE pa.project_id=? AND u.active=1 ORDER BY pa.role_in_project, u.name`).all(project_id),
    byUser: (user_id: string) =>
      getDb().prepare(`SELECT pa.*, p.name as project_name, p.color
        FROM project_assignments pa JOIN projects p ON pa.project_id = p.id
        WHERE pa.user_id=? ORDER BY p.name`).all(user_id),
    assign: (data: { id: string; user_id: string; project_id: string; role_in_project: string }) =>
      getDb().prepare('INSERT OR REPLACE INTO project_assignments (id,user_id,project_id,role_in_project) VALUES (?,?,?,?)').run(data.id, data.user_id, data.project_id, data.role_in_project),
    remove: (user_id: string, project_id: string) =>
      getDb().prepare('DELETE FROM project_assignments WHERE user_id=? AND project_id=?').run(user_id, project_id),
    isAssigned: (user_id: string, project_id: string) =>
      getDb().prepare('SELECT * FROM project_assignments WHERE user_id=? AND project_id=?').get(user_id, project_id),
    projectIdsForUser: (user_id: string) =>
      (getDb().prepare('SELECT project_id FROM project_assignments WHERE user_id=?').all(user_id) as { project_id: string }[]).map(r => r.project_id),
  },

  activity: {
    log: (data: { id: string; user_id: string; project_id?: string; action: string; target_type?: string; target_id?: string; meta?: string }) =>
      getDb().prepare('INSERT INTO activity_log (id,user_id,project_id,action,target_type,target_id,meta) VALUES (?,?,?,?,?,?,?)').run(data.id, data.user_id, data.project_id ?? null, data.action, data.target_type ?? '', data.target_id ?? '', data.meta ?? '{}'),
    byProject: (project_id: string, limit = 50) =>
      getDb().prepare('SELECT al.*, u.name as user_name FROM activity_log al JOIN users u ON al.user_id=u.id WHERE al.project_id=? ORDER BY al.created_at DESC LIMIT ?').all(project_id, limit),
    byUser: (user_id: string, limit = 50) =>
      getDb().prepare('SELECT * FROM activity_log WHERE user_id=? ORDER BY created_at DESC LIMIT ?').all(user_id, limit),
    recent: (limit = 30) =>
      getDb().prepare('SELECT al.*, u.name as user_name, u.title as user_title, p.name as project_name, p.color as project_color FROM activity_log al JOIN users u ON al.user_id=u.id LEFT JOIN projects p ON al.project_id=p.id ORDER BY al.created_at DESC LIMIT ?').all(limit),
  },

  dashboard: {
    overview: () => {
      const d = getDb()
      const pending = (d.prepare("SELECT COUNT(*) as cnt FROM slack_messages WHERE status='pending'").get() as { cnt: number }).cnt
      const flagged = (d.prepare("SELECT COUNT(*) as cnt FROM slack_messages WHERE status='flagged'").get() as { cnt: number }).cnt
      const replied = (d.prepare("SELECT COUNT(*) as cnt FROM slack_messages WHERE status='replied'").get() as { cnt: number }).cnt
      const totalMessages = (d.prepare('SELECT COUNT(*) as cnt FROM slack_messages').get() as { cnt: number }).cnt
      const projectCount = (d.prepare('SELECT COUNT(*) as cnt FROM projects').get() as { cnt: number }).cnt
      const userCount = (d.prepare('SELECT COUNT(*) as cnt FROM users WHERE active=1').get() as { cnt: number }).cnt
      return { pending, flagged, replied, totalMessages, projectCount, userCount }
    },
    projectStats: () =>
      getDb().prepare(`
        SELECT p.id, p.name, p.color, p.slack_workspace,
          (SELECT COUNT(*) FROM slack_messages sm WHERE sm.project_id=p.id AND sm.status='pending') as pending,
          (SELECT COUNT(*) FROM slack_messages sm WHERE sm.project_id=p.id AND sm.status='flagged') as flagged,
          (SELECT COUNT(*) FROM slack_messages sm WHERE sm.project_id=p.id AND sm.status='replied') as replied,
          (SELECT COUNT(*) FROM slack_messages sm WHERE sm.project_id=p.id) as total,
          (SELECT COUNT(*) FROM project_assignments pa WHERE pa.project_id=p.id) as members
        FROM projects p ORDER BY p.created_at DESC
      `).all(),
    flaggedMessages: () =>
      getDb().prepare(`
        SELECT sm.*, p.name as project_name, p.color as project_color
        FROM slack_messages sm JOIN projects p ON sm.project_id=p.id
        WHERE sm.status='flagged' ORDER BY sm.pulled_at DESC
      `).all(),
  },

  github: {
    repos: {
      byProject: (project_id: string) =>
        getDb().prepare('SELECT * FROM github_repos WHERE project_id=? ORDER BY last_synced DESC').all(project_id),
      get: (id: string) => getDb().prepare('SELECT * FROM github_repos WHERE id=?').get(id),
      create: (data: { id: string; project_id: string; repo_url: string; default_branch: string }) =>
        getDb().prepare('INSERT INTO github_repos (id,project_id,repo_url,default_branch) VALUES (?,?,?,?)').run(data.id, data.project_id, data.repo_url, data.default_branch),
      delete: (id: string) => getDb().prepare('DELETE FROM github_repos WHERE id=?').run(id),
      updateSynced: (id: string) => getDb().prepare("UPDATE github_repos SET last_synced=datetime('now') WHERE id=?").run(id),
    },
    files: {
      byRepo: (repo_id: string) =>
        getDb().prepare('SELECT id, repo_id, file_path, last_synced FROM github_files WHERE repo_id=? ORDER BY file_path ASC').all(repo_id),
      get: (id: string) => getDb().prepare('SELECT * FROM github_files WHERE id=?').get(id),
      search: (repo_id: string, query: string) =>
        getDb().prepare("SELECT * FROM github_files WHERE repo_id=? AND (file_path LIKE ? OR content LIKE ?) ORDER BY file_path ASC").all(repo_id, `%${query}%`, `%${query}%`),
      upsert: (data: { id: string; repo_id: string; file_path: string; content: string }) =>
        getDb().prepare(`INSERT INTO github_files (id,repo_id,file_path,content,last_synced) VALUES (?,?,?,?,datetime('now'))
          ON CONFLICT(repo_id,file_path) DO UPDATE SET content=excluded.content, last_synced=datetime('now')`)
          .run(data.id, data.repo_id, data.file_path, data.content),
      deleteByRepo: (repo_id: string) => getDb().prepare('DELETE FROM github_files WHERE repo_id=?').run(repo_id),
    },
  },

  integrations: {
    byProject: (project_id: string) =>
      getDb().prepare('SELECT * FROM project_integrations WHERE project_id=? ORDER BY created_at ASC').all(project_id),
    get: (id: string) => getDb().prepare('SELECT * FROM project_integrations WHERE id=?').get(id),
    create: (data: { id: string; project_id: string; type: string; label?: string; config?: string; n8n_webhook_url?: string }) =>
      getDb().prepare('INSERT INTO project_integrations (id,project_id,type,label,config,n8n_webhook_url) VALUES (?,?,?,?,?,?)').run(data.id, data.project_id, data.type, data.label ?? data.type, data.config ?? '{}', data.n8n_webhook_url ?? ''),
    update: (id: string, data: Partial<{ type: string; label: string; config: string; n8n_webhook_url: string; active: number }>) => {
      const fields = Object.keys(data).map(k => `${k}=?`).join(',')
      return getDb().prepare(`UPDATE project_integrations SET ${fields} WHERE id=?`).run(...Object.values(data), id)
    },
    delete: (id: string) => getDb().prepare('DELETE FROM project_integrations WHERE id=?').run(id),
  },
}
