// src/api/admin.js

// Fetch list of all users (admin only)
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
  
  // Fetch list of all feedbacks (admin only)
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
  
  // Fetch feedbacks by specific user (admin only)
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
  
  // Delete a feedback by ID (admin only)
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
  