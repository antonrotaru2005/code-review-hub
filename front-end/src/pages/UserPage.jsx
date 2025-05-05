import React, { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { getUserInfo, getUserFeedbacks } from '../api/user';
import {
  Navbar, Nav, Container, Card,
  Spinner, Alert, Row, Col,
  Dropdown, DropdownButton
} from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';

export default function UserPage() {
  const [user, setUser] = useState(null);
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedAi, setSelectedAi] = useState(null);
  const [selectedModel, setSelectedModel] = useState(null);
  const navigate = useNavigate();

  const aiModels = [
    { id: 1, ai: 'chatgpt', model: 'gpt-4o-mini' },
    { id: 2, ai: 'chatgpt', model: 'gpt-3.5-turbo' },
    { id: 3, ai: 'grok',    model: 'grok-3-mini-beta' }
  ];

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
        if (u.aiModel) {
          setSelectedAi(u.aiModel.ai);
          setSelectedModel(u.aiModel.model);
        }
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

  const handleModelChange = async (ai, model) => {
    setSelectedAi(ai);
    setSelectedModel(model);
    try {
      await fetch(
        `/api/user/ai?ai=${encodeURIComponent(ai)}&model=${encodeURIComponent(model)}`,
        { method: 'POST', credentials: 'include' }
      );
      const updatedUser = await getUserInfo();
      setUser(updatedUser);
      if (updatedUser.aiModel) {
        setSelectedAi(updatedUser.aiModel.ai);
        setSelectedModel(updatedUser.aiModel.model);
      }
    } catch (e) {
      console.error('Failed to set model preference:', e);
    }
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center min-vh-100">
        <Spinner animation="border" variant="primary" />
        <span className="ms-2">Loading...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="d-flex justify-content-center align-items-center min-vh-100">
        <Alert variant="danger" className="w-50">
          <Alert.Heading>Error</Alert.Heading>
          <p>
            Please <Link to="/login">Log In</Link> or{' '}
            <Link to="/signup">Sign Up</Link>
          </p>
        </Alert>
      </div>
    );
  }

  const grouped = groupByRepo(feedbacks);
  const uniqueAis = [...new Set(aiModels.map(m => m.ai))];

  return (
    <>


      <div className="d-flex flex-column min-vh-100">
        <Navbar bg="dark" variant="dark" expand="lg" sticky="top">
          <Container>
            <Navbar.Brand className="navbar-brand" as={Link} to="/">
              Code Review Hub
            </Navbar.Brand>
            <Navbar.Toggle aria-controls="basic-navbar-nav" />
            <Navbar.Collapse id="basic-navbar-nav">
              <Nav className="ms-auto">
                <Nav.Link as={Link} to="/">
                  Home
                </Nav.Link>
                <Nav.Link onClick={handleLogout}>
                  Logout
                </Nav.Link>
                <Nav.Link
                  as={Link}
                  to="/user"
                  className="avatar-link d-flex align-items-center ms-2"
                >
                  <img
                    src={user.avatar}
                    alt="User Avatar"
                    className="navbar-avatar"
                  />
                </Nav.Link>
              </Nav>
            </Navbar.Collapse>
          </Container>
        </Navbar>

        <main className="flex-grow-1 py-5">
          <Container>
            <Row>
              <Col className="sticky-sidebar" md={3}>
                <Card className="shadow-sm mb-4 text-center">
                  <Card.Body>
                    {user.avatar ? (
                      <img
                        src={user.avatar}
                        alt="Avatar"
                        className="rounded-circle mb-3"
                        style={{
                          width: '120px',
                          height: '120px',
                          objectFit: 'cover'
                        }}
                      />
                    ) : (
                      <div
                        className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center mb-3 mx-auto"
                        style={{
                          width: '120px',
                          height: '120px',
                          fontSize: '40px'
                        }}
                      >
                        {user.name
                          ? user.name[0].toUpperCase()
                          : 'U'}
                      </div>
                    )}
                    <h5 className="mb-1">
                      Hello, {user.name}!
                    </h5>
                    <p
                      className="text-muted mb-0"
                      style={{ fontSize: '0.9rem' }}
                    >
                      {user.email}
                    </p>
                  </Card.Body>
                </Card>

                <Card className="shadow-sm mb-4">
                  <Card.Body>
                    <h6 className="mb-3">Choose AI Model</h6>
                    {uniqueAis.map(ai => (
                      <DropdownButton
                        key={ai}
                        id={`dropdown-${ai}`}
                        title={
                          ai.charAt(0).toUpperCase() + ai.slice(1)
                        }
                        variant="outline-secondary"
                        className="mb-2"
                        onSelect={model =>
                          handleModelChange(ai, model)
                        }
                      >
                        {aiModels
                          .filter(m => m.ai === ai)
                          .map(model => (
                            <Dropdown.Item
                              key={model.model}
                              eventKey={model.model}
                              active={
                                selectedModel === model.model
                              }
                            >
                              {model.model}
                            </Dropdown.Item>
                          ))}
                      </DropdownButton>
                    ))}
                  </Card.Body>
                </Card>
              </Col>

              <Col md={9}>
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h3
                    className="mb-0"
                    style={{
                      fontWeight: '600',
                      fontSize: '1.7rem'
                    }}
                  >
                    Your AI Feedbacks 🧠
                  </h3>
                  {user?.aiModel && (
                    <Card
                      className="shadow-sm px-3 py-2"
                      style={{ fontSize: '0.9rem' }}
                    >
                      <span className="text-muted">
                        Current AI model:{' '}
                        <strong>
                         {user?.aiModel}
                        </strong>
                      </span>
                    </Card>
                  )}
                </div>

                {Object.entries(grouped).length === 0 ? (
                  <Alert variant="info">
                    You haven't left any feedback yet.
                  </Alert>
                ) : (
                  Object.entries(grouped).map(
                    ([repo, items]) => (
                      <div key={repo} className="mb-4">
                        <hr className="my-3" />
                        <h5
                          className="mb-2 text-muted"
                          style={{
                            fontWeight: '500',
                            fontSize: '1rem'
                          }}
                        >
                          {repo}
                        </h5>
                        <div className="row g-3">
                          {items.map(fb => (
                            <div
                              key={fb.id}
                              className="col-12"
                            >
                              <Card className="shadow-sm">
                                <Card.Body>
                                  <Card.Title className="d-flex align-items-center">
                                    <span className="text-primary me-2">
                                      Pull Request #{fb.prId} -{' '}
                                      {user?.aiModel}
                                    </span>
                                  </Card.Title>
                                  <ReactMarkdown
                                    remarkPlugins={[remarkGfm]}
                                  >
                                    {fb.comment}
                                  </ReactMarkdown>
                                </Card.Body>
                              </Card>
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  )
                )}
              </Col>
            </Row>
          </Container>
        </main>

        <footer className="bg-dark text-white py-4">
          <Container>
            <div className="row">
              <div className="col-md-4">
                <h5>Code Review Hub</h5>
                <p>
                  Empowering developers through collaboration
                  and code review.
                </p>
              </div>
              <div className="col-md-4">
                <h5>Quick Links</h5>
                <ul className="list-unstyled">
                  <li>
                    <Link
                      to="/about"
                      className="text-white text-decoration-none"
                    >
                      About
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/contact"
                      className="text-white text-decoration-none"
                    >
                      Contact
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/faq"
                      className="text-white text-decoration-none"
                    >
                      FAQ
                    </Link>
                  </li>
                </ul>
              </div>
              <div className="col-md-4">
                <h5>Connect</h5>
                <ul className="list-unstyled">
                  <li>
                    <a
                      href="#"
                      className="text-white text-decoration-none"
                    >
                      Twitter
                    </a>
                  </li>
                  <li>
                    <a
                      href="#"
                      className="text-white text-decoration-none"
                    >
                      GitHub
                    </a>
                  </li>
                  <li>
                    <a
                      href="#"
                      className="text-white text-decoration-none"
                    >
                      LinkedIn
                    </a>
                  </li>
                </ul>
              </div>
            </div>
            <div className="text-center mt-3">
              <p className="mb-0">
                © {new Date().getFullYear()} Code Review Hub. All
                rights reserved.
              </p>
            </div>
          </Container>
        </footer>
        <style jsx>{`
          @import url('https://fonts.googleapis.com/css2?family=Poller+One&display=swap');

            .sticky-sidebar {
              position: sticky;
              top: 118px; /* Adjust based on navbar height */
              align-self: flex-start;
            }

            @media (max-width: 767.98px) {
              .sticky-sidebar {
                position: static;
              }
            }

          .navbar-brand {
              font-family: "Poller One", serif;
              font-weight: 700;
              font-style: normal;
              font-size: 30px;
            }

          .navbar-avatar {
              width: 30px;
              height: 30px;
              border-radius: 50%;
              object-fit: cover;
              transition: opacity 0.2s ease;
            }
          .avatar-link:hover .navbar-avatar {
            opacity: 0.8;
          }
          `}</style>
      </div>
    </>
  );
}
