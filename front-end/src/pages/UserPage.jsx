import React, { useEffect, useState } from 'react';
import { getUserInfo, getUserFeedbacks } from '../api/user';

export default function UserPage() {
  const [user, setUser] = useState(null);
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // grupează după repoFullName
  function groupByRepo(feedbacks) {
    return feedbacks.reduce((acc, fb) => {
      (acc[fb.repoFullName] = acc[fb.repoFullName] || []).push(fb);
      return acc;
    }, {});
  }

  useEffect(() => {
    async function load() {
      try {
        const u = await getUserInfo();
        setUser(u);
        const fbs = await getUserFeedbacks(u.username);
        setFeedbacks(fbs);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) return <p>Se încarcă...</p>;
  if (error)   return <p className="text-danger">Eroare: {error}</p>;

  const grouped = groupByRepo(feedbacks);

  return (
    <div className="container py-4">
      <h2>Salut, {user.name}!</h2>
      <p>Email: {user.email}</p>
      <hr/>

      <h3>Feedback-urile tale</h3>
      {Object.entries(grouped).map(([repo, items]) => (
        <div key={repo} className="mb-4">
          <h4>{repo}</h4>
          {items.map(fb => (
            <div key={fb.id} className="card mb-2">
              <div className="card-body">
                <strong>PR #{fb.prId}:</strong> {fb.comment}
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
