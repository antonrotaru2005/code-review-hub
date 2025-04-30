// src/pages/UserPage.jsx
import React, { useEffect, useState } from 'react'
import { Container, Spinner, Alert } from 'react-bootstrap'
import { getUserInfo, getUserPRs } from '../api/user'
import UserProfile from '../components/UserProfile'
import PRList from '../components/PRList'

export default function UserPage() {
  const [user, setUser] = useState(null)
  const [prs, setPrs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function load() {
      try {
        const [u, p] = await Promise.all([getUserInfo(), getUserPRs()])
        setUser(u)
        setPrs(p)
      } catch (e) {
        setError(e.message)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) {
    return (
      <Container className="text-center mt-5">
        <Spinner animation="border" />
      </Container>
    )
  }

  if (error) {
    return (
      <Container className="mt-4">
        <Alert variant="danger">Eroare: {error}</Alert>
      </Container>
    )
  }

  return (
    <Container className="my-4">
      <UserProfile user={user} />
      <h3 className="mb-3">Pull Requests trimise</h3>
      <PRList prs={prs} />
    </Container>
  )
}
