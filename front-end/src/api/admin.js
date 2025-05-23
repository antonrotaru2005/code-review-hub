export async function getAdminUsers() {
    const res = await fetch('/api/admin/users', {
      credentials: 'include'
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`getAdminUsers failed: ${res.status} — ${text}`);
    }
    return res.json();
}

export async function getAdminFeedbacks() {
    const res = await fetch('/api/admin/feedbacks', {
      credentials: 'include'
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`getAdminFeedbacks failed: ${res.status} — ${text}`);
    }
    return res.json();
}

export async function getAdminFeedbacksByUser(username) {
    const res = await fetch(
      `/api/admin/users/${encodeURIComponent(username)}/feedbacks`, {
        credentials: 'include'
      }
    );
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`getAdminFeedbacksByUser failed: ${res.status} — ${text}`);
    }
    return res.json();
}

export async function getUserStats(username) {
    const res = await fetch(
      `/api/admin/users/${encodeURIComponent(username)}/stats`, {
        credentials: 'include'
      }
    );
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`getUserStats failed: ${res.status} — ${text}`);
    }
    return res.json();
}

export async function deleteFeedback(id) {
    const res = await fetch(`/api/admin/feedbacks/${id}`, {
      method: 'DELETE',
      credentials: 'include'
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`deleteFeedback failed: ${res.status} — ${text}`);
    }
}