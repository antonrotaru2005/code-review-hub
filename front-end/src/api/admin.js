export async function getAdminUsers() {
    const res = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/admin/users`, {
      credentials: 'include'
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`getAdminUsers failed: ${res.status} ${text}`);
    }
    return res.json();
}

export async function getAdminTeams() {
    const res = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/admin/teams`, {
      credentials: 'include'
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`getAdminTeams failed: ${res.status} ${text}`);
    }
    return res.json();
}

export async function getTeamMembers(teamId) {
    const res = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/admin/teams/${teamId}/members`, {
      credentials: 'include'
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`getTeamMembers failed: ${res.status} ${text}`);
    }
    return res.json();
}

export async function getAdminFeedbacksByUser(username) {
    const res = await fetch(
      `${process.env.REACT_APP_BACKEND_URL}/api/admin/users/${encodeURIComponent(username)}/feedbacks`, {
        credentials: 'include'
      }
    );
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`getAdminFeedbacksByUser failed: ${res.status} ${text}`);
    }
    return res.json();
}

export async function getUserStats(teamId, username) {
    const url = teamId
      ? `${process.env.REACT_APP_BACKEND_URL}/api/admin/teams/${teamId}/members/${encodeURIComponent(username)}/stats`
      : `${process.env.REACT_APP_BACKEND_URL}/api/admin/users/${encodeURIComponent(username)}/stats`;
    const res = await fetch(url, {
      credentials: 'include'
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`getUserStats failed: ${res.status} ${text}`);
    }
    return res.json();
}

export async function deleteMemberFeedback(teamId, username, feedbackId) {
    const url = teamId
      ? `${process.env.REACT_APP_BACKEND_URL}/api/admin/teams/${teamId}/members/${encodeURIComponent(username)}/feedbacks/${feedbackId}`
      : `${process.env.REACT_APP_BACKEND_URL}/api/admin/feedbacks/${feedbackId}`;
    const res = await fetch(url, {
      method: 'DELETE',
      credentials: 'include'
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`deleteMemberFeedback failed: ${res.status} ${text}`);
    }
}