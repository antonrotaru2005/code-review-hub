// src/api/user.js

export async function getUserInfo() {
  // fetch relativ – va fi proxy-uit automat către http://localhost:8080/user
  const res = await fetch(`/user`, { credentials: 'include' })
  if (!res.ok) throw new Error('Failed to fetch user info')
  return res.json()
}

export async function getUserPRs() {
  // fetch relativ – va fi proxy-uit către http://localhost:8080/user/prs
  const res = await fetch(`/user/prs`, { credentials: 'include' })
  if (!res.ok) throw new Error('Failed to fetch PR list')
  return res.json()
}