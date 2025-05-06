import React, { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { getUserInfo, getUserFeedbacks } from '../api/user';
import { sendChat } from '../api/chat';
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
  const navigate = useNavigate();
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState([]); 
  const [chatInput, setChatInput] = useState('');

  const aiModels = [
    { id: 1, ai: 'ChatGPT', model: 'gpt-4o-mini',      label: 'GPT-4o-mini' },
    { id: 2, ai: 'ChatGPT', model: 'gpt-4o',           label: 'GPT-4o' },
    { id: 3, ai: 'ChatGPT', model: 'o3',               label: 'o3' },
    { id: 4, ai: 'ChatGPT', model: 'o4-mini',          label: 'o4 Mini' },
  
    { id: 5, ai: 'Grok',    model: 'grok',             label: 'Grok' },
    { id: 6, ai: 'Grok',    model: 'grok-3',           label: 'Grok 3' },
  
    { id: 7, ai: 'Copilot', model: 'copilot-codex',    label: 'Copilot Codex' },
    { id: 8, ai: 'Copilot', model: 'copilot-gpt-4',    label: 'Copilot GPT-4' },
  
    { id: 9, ai: 'Gemini',  model: 'gemini-1.5-pro',   label: 'Gemini 1.5 Pro' },
    { id: 10,ai: 'Gemini',  model: 'gemini-1.5-flash', label: 'Gemini 1.5 Flash' },
    { id: 11,ai: 'Gemini',  model: 'gemini-2.5-pro',   label: 'Gemini 2.5 Pro' },
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

  const handleSend = async () => {
    const text = chatInput.trim();
    if (!text) return;
    // 1. adaugă ce-a scris user-ul
    setChatMessages(m => [...m, { sender: 'user', text }]);
    setChatInput('');
    try {
      // 2. apelează API-ul
      console.log("AI: " + user.aiModel.ai + "\nModel: " + user.aiModel.model + "\nText: " + text)
      const aiReply = await sendChat(user.aiModel.ai, user.aiModel.model, text);
      // 3. adaugă răspunsul AI-ului
      setChatMessages(m => [...m, { sender: 'ai', text: aiReply }]);
    } catch (err) {
      console.error('Chat failed:', err);
      setChatMessages(m => [...m, { sender: 'ai', text: '😢 Eroare la chat.' }]);
    }
  };
  

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

  const handleToggleTheme = () => {
    console.log('Toggle theme');
  };

  const handleSwitchToAdmin = () => {
    navigate('/admin');
  };

  const handleModelChange = async (ai, model) => {
    try {
      await fetch(
        `/api/user/ai?ai=${encodeURIComponent(ai)}&model=${encodeURIComponent(model)}`,
        { method: 'POST', credentials: 'include' }
      );
      const updatedUser = await getUserInfo();
      setUser(updatedUser);
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
              <Nav className="ms-auto allign-items-center">
                <Dropdown align="end">
                        <Dropdown.Toggle as={Nav.Link} className="avatar-link p-0">
                          <img
                            src={user.avatar}
                            alt="User Avatar"
                            className="navbar-avatar"
                          />
                        </Dropdown.Toggle>
                        <Dropdown.Menu>
                          <Dropdown.Item onClick={handleToggleTheme}>
                            Theme
                          </Dropdown.Item>
                          <Dropdown.Item onClick={handleSwitchToAdmin}>
                            Switch to Admin
                          </Dropdown.Item>
                          <Dropdown.Divider />
                          <Dropdown.Item onClick={handleLogout}>
                            Log Out
                          </Dropdown.Item>
                        </Dropdown.Menu>
                      </Dropdown>
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
                    <h6 className="mb-3">Choose Your AI Model</h6>
                    {uniqueAis.map(ai => (
                      <DropdownButton
                            key={ai}
                            id={`dropdown-${ai}`}
                            title={ai.charAt(0).toUpperCase() + ai.slice(1)}
                            variant="outline-secondary"
                            className="mb-2 ai-dropdown"
                            onSelect={model => handleModelChange(ai, model)}
                          >
                        {aiModels
                          .filter(m => m.ai === ai)
                          .map(model => (
                            <Dropdown.Item
                              key={model.model}
                              eventKey={model.model}
                              active={
                                user.aiModel.model === model.model
                              }
                            >
                              {model.label}
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
                          {user?.aiModel.ai}: {user?.aiModel.model}
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
        <style jsx>{
          `@import url('https://fonts.googleapis.com/css2?family=Gabarito:wght@400..900&display=swap');

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
                font-family: "Gabarito", sans-serif;
                font-optical-sizing: auto;
                font-weight: 400;
                font-style: normal;
                font-size: 27px;
            }

          .navbar-avatar {
              width: 35px;
              height: 35px;
              border-radius: 50%;
              object-fit: cover;
              transition: opacity 0.2s ease;
            }

          .avatar-link:hover .navbar-avatar {
            opacity: 2;
          }

          .ai-dropdown{
            display:block;
            width:100% !important;
          }

          .ai-dropdown > .btn{
              width:100% !important;
              text-allign:left;
          }

          .ai-dropdown .dropdown-menu{
            width:100% !important;
          }

          .ai-chat-button {
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: #0d6efd;
            color: #fff;
            border: none;
            border-radius: 50%;
            width: 56px;
            height: 56px;
            font-size: 24px;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
            cursor: pointer;
            z-index: 1000;
          }

          .ai-chat-window {
            position: fixed;
            bottom: 90px;
            right: 20px;
            width: 300px;
            height: 400px;
            background: #fff;
            border: 1px solid #ccc;
            border-radius: 8px;
            display: flex;
            flex-direction: column;
            overflow: hidden;
            box-shadow: 0 2px 12px rgba(0,0,0,0.2);
            z-index: 1000;
          }

          .ai-chat-header {
            background: #0d6efd;
            color: #fff;
            padding: 8px;
            display: flex;
            justify-content: space-between;
            align-items: center;
          }

          .ai-chat-body {
            flex: 1;
            padding: 8px;
            overflow-y: auto;
            background: #f9f9f9;
          }

          .chat-message {
            margin-bottom: 6px;
            padding: 6px 8px;
            border-radius: 4px;
          }
          .chat-message.user {
            background: #d1e7dd;
            text-align: right;
          }
          .chat-message.ai {
            background: #fff;
            text-align: left;
          }

          .ai-chat-footer {
            padding: 8px;
            display: flex;
            gap: 4px;
            border-top: 1px solid #ddd;
          }
          .ai-chat-footer input {
            flex: 1;
            padding: 6px;
            border: 1px solid #ccc;
            border-radius: 4px;
          }
          .ai-chat-footer button {
            padding: 6px 12px;
            border: none;
            background: #0d6efd;
            color: #fff;
            border-radius: 4px;
            cursor: pointer;
          }
          `
          }</style>

          {/* —–––––––––––––––––––––––––––––––––––––––––––––– */}
          {/* Floating AI Chat Button */}
          <button
            className="ai-chat-button"
            onClick={() => setChatOpen(o => !o)}
            title="Chat with AI"
          >
            🤖
          </button>

          {/* Chat window */}
          {chatOpen && (
            <div className="ai-chat-window">
              <div className="ai-chat-header">
                <span>AI Assistant</span>
                <button onClick={() => setChatOpen(false)}>✕</button>
              </div>
              <div className="ai-chat-body">
                {chatMessages.map((m, i) => (
                  <div key={i} className={`chat-message ${m.sender}`}>
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{m.text}</ReactMarkdown>
                  </div>
                ))}
              </div>
              <div className="ai-chat-footer">
                <input
                  type="text"
                  placeholder="Type a message…"
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSend()}
                />
                <button onClick={handleSend}>Send</button>
              </div>
            </div>
          )}
      </div>
    </>
  );
}