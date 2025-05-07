import React, { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { getAdminUsers, getAdminFeedbacksByUser, deleteFeedback } from '../api/admin';
import {
  Navbar, Nav, Container, Card,
  Spinner, Alert, Row, Col,
  ListGroup, Image, Button
} from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';

export default function AdminPage() {
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [feedbacks, setFeedbacks] = useState([]);
  const [loadingFeedbacks, setLoadingFeedbacks] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    async function initAdmin() {
      try {
        const list = await getAdminUsers();
        setUsers(list);
      } catch (e) {
        console.error('Fetch failed:', e, { message: e.message, status: e.status });
        if (e.message.includes('403')) {
          setError(`You are not authorized to access the admin panel. Error: ${e.message}`);
        } else {
          setError(`Failed to load admin panel: ${e.message}`);
        }
      } finally {
        setLoading(false);
      }
    }
    initAdmin();
  }, []);

  const handleUserSelect = async (user) => {
    setSelectedUser(user);
    console.log('Selected user attributes:', user);
    setFeedbacks([]);
    setLoadingFeedbacks(true);
    try {
      const fbs = await getAdminFeedbacksByUser(user.username);
      setFeedbacks(fbs);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoadingFeedbacks(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/logout', { method: 'POST', credentials: 'include' });
    } catch (err) {
      console.error('Logout failed', err);
    } finally {
      navigate('/', { replace: true });
    }
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center min-vh-100">
        <Spinner animation="border" variant="primary" />
        <span className="ms-2">Loading Admin Panel...</span>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="danger" className="m-4">
        <Alert.Heading>Error</Alert.Heading>
        <p>{error}</p>
        <Link to="/user" className="btn btn-primary">Return to User Page</Link>
      </Alert>
    );
  }

  return (
    <div className="d-flex flex-column min-vh-100">
      <Navbar bg="dark" variant="dark" expand="lg" sticky="top">
        <Container>
          <Navbar.Brand as={Link} to="/">Code Review Hub - Admin</Navbar.Brand>
          <Navbar.Collapse className="justify-content-end">
            <Nav>
              <Nav.Link onClick={handleLogout}>Log Out</Nav.Link>
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>

      <main className="flex-grow-1 py-4">
        <Container fluid>
          <Row>
            <Col md={3} className="border-end">
              <h5 className="mb-3">All Users</h5>
              <ListGroup>
                {users.map(u => (
                  <ListGroup.Item
                    key={u.username}
                    action
                    active={selectedUser?.username === u.username}
                    onClick={() => handleUserSelect(u)}
                    className="d-flex align-items-center"
                  >
                    {u.avatar ? (
                      <Image
                        src={u.avatar}
                        roundedCircle
                        width={30}
                        height={30}
                        className="me-2"
                        onError={(e) => (e.target.src = '')}
                      />
                    ) : (
                      <div
                        className="bg-primary text-white d-flex align-items-center justify-content-center me-2 rounded-circle"
                        style={{ width: '30px', height: '30px', fontSize: '14px' }}
                      >
                        {(u.name || u.username)?.[0]?.toUpperCase() || 'U'}
                      </div>
                    )}
                    <span>{u.name || u.username}</span>
                  </ListGroup.Item>
                ))}
              </ListGroup>
            </Col>

            <Col md={9}>
              {!selectedUser ? (
                <div className="text-center text-muted mt-5">
                  Select a user to view details and feedbacks.
                </div>
              ) : (
                <>
                  <Card className="mb-4">
                    <Card.Body className="d-flex align-items-center">
                      {selectedUser.avatar ? (
                        <Image
                          src={selectedUser.avatar}
                          roundedCircle
                          width={80}
                          height={80}
                          className="me-3"
                          onError={(e) => (e.target.src = '')}
                        />
                      ) : (
                        <div
                          className="bg-primary text-white d-flex align-items-center justify-content-center me-3"
                          style={{ width: '80px', height: '80px', borderRadius: '50%', fontSize: '32px' }}
                        >
                          {(selectedUser.name || selectedUser.username)?.[0]?.toUpperCase() || 'U'}
                        </div>
                      )}
                      <div>
                        <h5 className="mb-1">{selectedUser.name || selectedUser.username}</h5>
                        <p className="mb-0 text-muted" style={{ fontSize: '0.9rem' }}>
                          @{selectedUser.username} • {selectedUser.email}
                        </p>
                      </div>
                    </Card.Body>
                  </Card>

                  <h5 className="mb-3">Feedbacks</h5>
                  {loadingFeedbacks ? (
                    <Spinner animation="border" />
                  ) : feedbacks.length === 0 ? (
                    <Alert variant="info">No feedbacks for this user.</Alert>
                  ) : (
                    feedbacks.map(fb => (
                      <Card key={fb.id} className="mb-3 shadow-sm">
                        <Card.Body>
                          <Card.Title>
                            PR #{fb.prId} • <span className="text-primary">{fb.repoFullName}</span>
                          </Card.Title>
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>{fb.comment}</ReactMarkdown>
                          <Button
                            variant="outline-danger"
                            size="sm"
                            className="mt-2"
                            onClick={() => deleteFeedback(fb.id).then(() => handleUserSelect(selectedUser))}
                          >
                            Delete
                          </Button>
                        </Card.Body>
                      </Card>
                    ))
                  )}
                </>
              )}
            </Col>
          </Row>
        </Container>
      </main>

      <footer className="bg-light text-center py-3">
        © {new Date().getFullYear()} Code Review Hub. Admin Panel
      </footer>
    </div>
  );
}