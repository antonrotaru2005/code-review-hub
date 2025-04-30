// src/api/user.js
const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:8080'

export async function getUserInfo() {
  const res = await fetch(`${API_BASE}/user`, { credentials: 'include' })
  if (!res.ok) throw new Error('Failed to fetch user info')
  return res.json()
}

export async function getUserPRs() {
  const res = await fetch(`${API_BASE}/user/prs`, { credentials: 'include' })
  if (!res.ok) throw new Error('Failed to fetch PR list')
  return res.json()
}
