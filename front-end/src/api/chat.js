// src/api/chat.js

/**
 * Trimite un mesaj către endpoint-ul /api/chat și primește răspunsul AI-ului.
 * @param {string} ai    – ex. "ChatGPT"
 * @param {string} model – ex. "gpt-4o-mini"
 * @param {string} message
 * @returns {Promise<string>} reply
 */
export async function sendChat(ai, model, history) {
  const res = await fetch('/api/chat', {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ ai, model, history })
  });
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Chat API error: ${res.status} ${errorText}`);
  }
  const { reply } = await res.json();
  return reply;
}
