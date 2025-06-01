export async function sendChat(ai, model, history) {
  const res = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/chat`, {
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
