export async function getUserInfo() {
  const response = await fetch('/api/user', { credentials: 'include' });
  if (!response.ok) {
    const contentType = response.headers.get('Content-Type');
    if (contentType && !contentType.includes('application/json')) {
      throw new Error(`${response.status} - Răspuns non-JSON primit`);
    }
    const errorData = await response.json().catch(() => ({}));
    throw new Error(`${response.status} - ${errorData.message || 'Nu s-au putut obține datele utilizatorului'}`);
  }
  return response.json();
}

export async function getUserFeedbacks(username) {
  const response = await fetch(`/api/feedbacks/user/${username}`, {
    credentials: 'include'
  });
  if (!response.ok) {
    throw new Error(`${response.status} - Nu s-au putut obține feedback-urile`);
  }
  return response.json();
}

export async function enableWebhookToken() {
  const response = await fetch('/api/user/webhook-token', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' }
  });
  console.log('Răspuns POST /api/user/webhook-token:', { status: response.status });
  if (!response.ok) {
    const contentType = response.headers.get('Content-Type');
    const errorData = contentType && contentType.includes('application/json')
      ? await response.json().catch(() => ({}))
      : {};
    throw new Error(`${response.status} - ${errorData.message || 'Nu s-a putut activa webhook-ul'}`);
  }
  const data = await response.json();
  console.log('Token activat:', data);
  return data;
}

export async function disableWebhookToken() {
  const response = await fetch('/api/user/webhook-token', {
    method: 'DELETE',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' }
  });
  console.log('Răspuns DELETE /api/user/webhook-token:', { status: response.status });
  if (!response.ok) {
    const contentType = response.headers.get('Content-Type');
    const errorData = contentType && contentType.includes('application/json')
      ? await response.json().catch(() => ({}))
      : {};
    throw new Error(`${response.status} - ${errorData.message || 'Nu s-a putut dezactiva webhook-ul'}`);
  }
  if (response.status === 204 || response.status === 200) {
    return {};
  }
  return response.json();
}