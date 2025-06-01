export async function getUserInfo() {
  const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/user`, { credentials: 'include' });
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
  const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/feedbacks/user/${username}`, {
    credentials: 'include'
  });
  if (!response.ok) {
    throw new Error(`${response.status} - Nu s-au putut obține feedback-urile`);
  }
  return response.json();
}

export async function enableWebhookToken() {
  const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/user/webhook-token`, {
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
  const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/user/webhook-token`, {
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

export async function getUserRepos(username) {
  try {
    const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/user/repos/${username}`, {
      method: 'GET',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' }
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch user repositories:', error);
    throw error;
  }
}

export async function getUserReviewAspects(username) {
  try {
    const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/user/${username}/aspects`, {
      method: 'GET',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' }
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch user review aspects:', error);
    throw error;
  }
}

export async function updateUserReviewAspects(username, aspects) {
  try {
    const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/user/${username}/aspects`, {
      method: 'PUT',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(aspects)
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return true;
  } catch (error) {
    console.error('Failed to update user review aspects:', error);
    throw error;
  }
}

export async function getUserTeams() {
  try {
    const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/teams`, {
      method: 'GET',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' }
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch user teams:', error);
    throw error;
  }
}

export async function createTeam(name, password) {
  try {
    const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/teams`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, password })
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`${response.status} - ${errorData.message || 'Failed to create team'}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Failed to create team:', error);
    throw error;
  }
}

export async function joinTeam(teamId, password) {
  try {
    const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/teams/${teamId}/join`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password })
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`${response.status} - ${errorData.message || 'Failed to join team'}`);
    }
    return true;
  } catch (error) {
    console.error('Failed to join team:', error);
    throw error;
  }
}

export async function leaveTeam(teamId) {
  try {
    const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/teams/${teamId}/leave`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' }
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`${response.status} - ${errorData.message || 'Failed to leave team'}`);
    }
    return true;
  } catch (error) {
    console.error('Failed to leave team:', error);
    throw error;
  }
}

export async function deleteTeam(teamId) {
  try {
    const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/teams/${teamId}`, {
      method: 'DELETE',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' }
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return true;
  } catch (error) {
    console.error('Failed to delete team:', error);
    throw error;
  }
}

export async function getTeamMembers(teamId) {
  try {
    const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/teams/${teamId}/members`, {
      method: 'GET',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' }
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch team members:', error);
    throw error;
  }
}