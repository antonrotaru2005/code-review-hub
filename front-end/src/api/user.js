// src/api/user.js

// 1. Fetch datele de profil
export async function getUserInfo() {
  const res = await fetch('/api/user', { credentials: 'include' });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`getUserInfo failed: ${res.status} — ${text}`);
  }
  return res.json();
}

// 2. Fetch feedback-urile trimise de user
export async function getUserFeedbacks(username) {
  const res = await fetch(`/api/feedbacks/user/${encodeURIComponent(username)}`, {
    credentials: 'include'
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`getUserFeedbacks failed: ${res.status} — ${text}`);
  }
  return res.json();
}

// 3. Fetch a one-time webhook token
export async function getWebhookToken() {
  const res = await fetch('/api/user/webhook-token', {
    method: 'POST',
    credentials: 'include'
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`getWebhookToken failed: ${res.status} — ${text}`);
  }
  const { token } = await res.json();
  return token;
}
