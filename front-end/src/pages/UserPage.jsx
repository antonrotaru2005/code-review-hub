import React, { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { getUserInfo, getUserFeedbacks } from '../api/user';
import { Navbar, Nav, Container, Card, Spinner, Alert } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';

export default function UserPage() {
  const [user, setUser] = useState(null);
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // Group feedbacks by repository name
  function groupByRepo(feedbacks) {
    return feedbacks.reduce((acc, fb) => {
      (acc[fb.repoFullName] = acc[fb.repoFullName] || []).push(fb);
      return acc;
    }, {});
  }

  // Load user info and feedbacks
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

  // Logout handler
  const handleLogout = async () => {
    try {
      await fetch('/logout', {
        method: 'POST',
        credentials: 'include'
      });
    } catch (err) {
      console.error('Logout failed', err);
    } finally {
      setUser(null);
      navigate('/');
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center min-vh-100">
        <Spinner animation="border" variant="primary" />
        <span className="ms-2">Loading...</span>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="d-flex justify-content-center align-items-center min-vh-100">
        <Alert variant="danger" className="w-50">
          <Alert.Heading>Error</Alert.Heading>
          <p>Please <Link to="/login">Log In</Link> or <Link to="/signup">Sign Up</Link></p>
        </Alert>
      </div>
    );
  }

  const grouped = groupByRepo(feedbacks);

  return (
    <div className="d-flex flex-column min-vh-100">
      {/* Navbar */}
      <Navbar bg="dark" variant="dark" expand="lg" sticky="top">
        <Container>
          <Navbar.Brand as={Link} to="/">Code Review Hub</Navbar.Brand>
          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          <Navbar.Collapse id="basic-navbar-nav">
            <Nav className="ms-auto">
              <Nav.Link as={Link} to="/">Home</Nav.Link>
              <Nav.Link as={Link} to="/user" active>User</Nav.Link>
              <Nav.Link onClick={handleLogout}>Logout</Nav.Link>
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>

      {/* Main Content */}
      <main className="flex-grow-1 py-5">
        <Container>
          {/* User Info */}
          <Card className="shadow-sm mb-4">
            <Card.Body className="d-flex align-items-center">
              {user.avatar ? (
                <img
                  src={user.avatar}
                  alt="Avatar"
                  className="rounded-circle me-3"
                  style={{ width: '64px', height: '64px', objectFit: 'cover' }}
                />
              ) : (
                <div
                  className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center me-3"
                  style={{ width: '64px', height: '64px', fontSize: '24px' }}
                >
                  {user.name ? user.name[0].toUpperCase() : 'U'}
                </div>
              )}
              <div>
                <h2 className="mb-1">Hello, {user.name}!</h2>
                <p className="text-muted mb-0">Email: {user.email}</p>
              </div>
            </Card.Body>
          </Card>

          {/* User Feedbacks */}
          <h3 className="mb-4">Your Feedback</h3>
          {Object.entries(grouped).length === 0 ? (
            <Alert variant="info">
              You haven't left any feedback yet.
            </Alert>
          ) : (
            Object.entries(grouped).map(([repo, items]) => (
              <div key={repo} className="mb-4">
                <h4 className="mb-3">{repo}</h4>
                <div className="row g-3">
                  {items.map(fb => (
                    <div key={fb.id} className="col-12">
                      <Card className="shadow-sm">
                        <Card.Body>
                          <Card.Title className="d-flex align-items-center">
                            <span className="text-primary me-2">PR #{fb.prId}</span>
                          </Card.Title>
                          {/* Render Markdown-formatted feedback */}
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {fb.comment}
                          </ReactMarkdown>
                        </Card.Body>
                      </Card>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </Container>
      </main>

      {/* Footer */}
      <footer className="bg-dark text-white py-4">
        <Container>
          <div className="row">
            <div className="col-md-4">
              <h5>Code Review Hub</h5>
              <p>Empowering developers through collaboration and code review.</p>
            </div>
            <div className="col-md-4">
              <h5>Quick Links</h5>
              <ul className="list-unstyled">
                <li><Link to="/about" className="text-white text-decoration-none">About</Link></li>
                <li><Link to="/contact" className="text-white text-decoration-none">Contact</Link></li>
                <li><Link to="/faq" className="text-white text-decoration-none">FAQ</Link></li>
              </ul>
            </div>
            <div className="col-md-4">
              <h5>Connect</h5>
              <ul className="list-unstyled">
                <li><a href="#" className="text-white text-decoration-none">Twitter</a></li>
                <li><a href="#" className="text-white text-decoration-none">GitHub</a></li>
                <li><a href="#" className="text-white text-decoration-none">LinkedIn</a></li>
              </ul>
            </div>
          </div>
          <div className="text-center mt-3">
            <p className="mb-0">© {new Date().getFullYear()} Code Review Hub. All rights reserved.</p>
          </div>
        </Container>
      </footer>
    </div>
  );
}
