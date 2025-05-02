// src/pages/UserPage.jsx
import React, { useEffect, useState } from 'react'
import { getUserInfo, getUserFeedbacks } from '../api/user'

export default function UserPage() {
  const [user, setUser] = useState(null)
  const [feedbacks, setFeedbacks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function fetchData() {
      try {
        // 1) Ia profile-ul
        const userData = await getUserInfo()
        setUser(userData)

        // 2) Ia feedback-urile pentru acest user
        //    presupozi că userData conține câmpul `username`
        const fbs = await getUserFeedbacks(userData.username)
        setFeedbacks(fbs)
      } catch (err) {
        console.error(err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  if (loading) return <p>Se încarcă...</p>
  if (error)   return <p className="text-danger">Eroare: {error}</p>

  return (
    <div className="user-page container py-4">
      <h2>Salut, {user.name}!</h2>
      <p>Email: {user.email}</p>

      <hr />

      <h3>Iată feedback-urile tale</h3>
      {feedbacks.length === 0 ? (
        <p>Nu ai trimis încă niciun feedback.</p>
      ) : (
        <ul className="list-group">
          {feedbacks.map(fb => (
            <li key={fb.id} className="list-group-item">
              <strong>PR #{fb.prId}:</strong> {fb.comment}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
