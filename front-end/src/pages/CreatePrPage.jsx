import React, { useEffect, useState, useRef } from 'react';
import { Container, Card, Spinner, Alert } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { FaCheckCircle, FaInfoCircle, FaLink, FaCheck, FaSave } from 'react-icons/fa';
import { getUserInfo, getWebhookToken } from '../api/user';
import { Link } from 'react-router-dom';

export default function CreatePrPage() {
  const [user, setUser] = useState(null);
  const [stage, setStage] = useState('Waiting for PR...');
  const [done, setDone] = useState(false);
  const [token, setToken] = useState(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const didFetchRef = useRef(false);
  const navigate = useNavigate();

  // 1. Fetch the user data for the username
  useEffect(() => {
    if (didFetchRef.current) return;
    didFetchRef.current = true;

    async function fetchUser() {
      try {
        const userData = await getUserInfo();
        if (!userData) {
          throw new Error('You are not logged in. Please log in or sign up to access this page.');
        }
        setUser(userData);
        const t = await getWebhookToken();
        setToken(t);
      } catch (err) {
        console.error('Error fetching user:', err, { message: err.message, status: err.status });
        setError('You are not logged in. Please log in or sign up to access this page.');
      } finally {
        setLoading(false);
      }
    }
    fetchUser();
  }, []);

  // 2. Initialize WebSocket connection and subscribe using username
  useEffect(() => {
    if (!user || error || loading) return;

    const socket = new SockJS('/ws-feedback');
    const client = new Client({
      webSocketFactory: () => socket,
      reconnectDelay: 5000,
      debug: () => {}
    });

    client.onConnect = () => {
      const username = user.username;
      client.subscribe(`/topic/feedback/${username}`, msg => {
        const body = JSON.parse(msg.body);
        if (body.status === 'done') {
          setStage('Done');
          setDone(true);
          client.deactivate();
        } else if (body.stage) {
          setStage(body.stage);
        }
      });
    };

    client.activate();
    return () => client.deactivate();
  }, [user, error, loading]);

  // 3. Redirect at the end
  useEffect(() => {
    if (done && !error && !loading) {
      const timer = setTimeout(() => navigate('/user'), 2000);
      return () => clearTimeout(timer);
    }
  }, [done, navigate, error, loading]);

  // 4. Copy to clipboard and show message
  const handleCopyLink = () => {
    if (token && !error && !loading) {
      const link = `${window.location.origin}/webhook/bitbucket/${token}`;
      navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/logout', { method: 'POST', credentials: 'include' });
    } catch {}
    finally {
      setUser(null);
      setError(null);
      setLoading(false);
      navigate('/');
    }
  };

  if (loading) {
    return (
      <div className="relative min-h-screen bg-black text-white flex items-center justify-center">
        <div className="absolute inset-0 z-0 opacity-30">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900 animate-gradient-x"></div>
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-transparent via-black/50 to-black opacity-70"></div>
        </div>
        <div className="relative z-10 flex items-center text-xl">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-600"></div>
          <span className="ml-2">Loading...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="relative min-h-screen bg-black text-white flex items-center justify-center">
        <div className="absolute inset-0 z-0 opacity-30">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900 animate-gradient-x"></div>
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-transparent via-black/50 to-black opacity-70"></div>
        </div>
        <div className="relative z-10 bg-black/70 border border-white/10 rounded-2xl p-6 text-white text-center">
          <h3 className="text-lg font-semibold mb-4">Authentication Required</h3>
          <p className="mb-4">You are not logged in. Please log in or sign up to access this page.</p>
          <div className="space-x-4">
            <Link to="/login" className="px-4 py-2 bg-purple-600 text-white rounded-full hover:bg-purple-500 transition no-underline">
              Log In
            </Link>
            <Link to="/signup" className="px-4 py-2 bg-purple-600 text-white rounded-full hover:bg-purple-500 transition no-underline">
              Sign Up
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-black text-white font-['Gabarito'] flex flex-col overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 z-0 opacity-30">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900 animate-gradient-x"></div>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-transparent via-black/50 to-black opacity-70"></div>
      </div>

      {/* Navbar */}
      <nav className="relative z-50 px-6 py-4 flex justify-between items-center">
        <Link to="/" className="text-2xl font-bold text-white tracking-wider hover:scale-105 transition-transform no-underline">
          Code Review Hub
        </Link>
        <div className="relative">
          <span
            className="text-white/80 hover:text-purple-400 transition-colors cursor-pointer"
            onClick={handleLogout}
          >
            Log Out
          </span>
        </div>
      </nav>

      <main className="relative z-40 px-6 py-4 flex-grow flex items-center justify-center">
        <Container className="text-center max-w-lg">
          <Card className="bg-black/80 border border-purple-500/30 rounded-2xl p-4 shadow-lg">
            <Card.Header className="bg-gradient-to-r from-purple-800 to-indigo-900 text-white text-lg font-bold py-3 rounded-t-2xl flex items-center">
              <FaInfoCircle className="w-5 h-5 mr-2 text-purple-300" />
              Configuration Instructions
            </Card.Header>
            <Card.Body className="text-white space-y-2">
              <ol className="list-decimal pl-5 space-y-2 text-sm">
                <li className="flex items-start">
                  <FaInfoCircle className="w-4 h-4 mr-2 text-purple-400 mt-0.5 flex-shrink-0" />
                  <span>In Bitbucket, go to <strong className="text-purple-300">Repository Settings → Webhooks</strong>.</span>
                </li>
                <li className="flex items-start">
                  <FaLink className="w-4 h-4 mr-2 text-purple-400 mt-0.5 flex-shrink-0" />
                  <span>
                    <strong className="text-purple-300">Add a new webhook with URL:</strong>{" "}
                    {token ? (
                      <strong>
                        <code
                          className="bg-black/90 text-white px-1.5 py-0.5 rounded-lg shadow-sm hover:bg-purple-900/50 transition duration-200 cursor-pointer"
                          onClick={handleCopyLink}
                        >
                          {window.location.origin}/webhook/bitbucket/{token}
                        </code>
                      </strong>
                    ) : (
                      <em className="text-purple-400/70 italic">Generating your one-time link…</em>
                    )}
                  </span>
                </li>
                {copied && (
                  <div className="text-purple-400 text-xs mt-1">Copied to clipboard</div>
                )}
                <li className="flex items-start">
                  <FaCheck className="w-4 h-4 mr-2 text-purple-400 mt-0.5 flex-shrink-0" />
                  <span>Select <strong className="text-purple-300">Pull Request events</strong> (created, updated).</span>
                </li>
                <li className="flex items-start">
                  <FaSave className="w-4 h-4 mr-2 text-purple-400 mt-0.5 flex-shrink-0" />
                  <span>
                    <strong className="text-purple-300">Save</strong> and then <strong className="text-purple-300">create a Pull Request</strong> in the repository.
                  </span>
                </li>
              </ol>
            </Card.Body>
          </Card>

          <h5 className="text-lg font-semibold text-white mt-4">{stage}</h5>
          {!done && <Spinner animation="border" role="status" className="my-2 text-purple-400" />}
          {done && (
            <Alert variant="success" className="bg-black/80 border border-purple-500/30 text-white rounded-2xl p-3 mt-4 flex items-center justify-center">
              <FaCheckCircle size={20} className="mr-2 text-purple-400" />
              <span>Done!</span>
            </Alert>
          )}
        </Container>
      </main>

      {/* Footer */}
      <footer className="relative z-40 bg-black/70 backdrop-blur-lg border-t border-purple-500/30 py-4 sm:py-6">
        <div className="text-center mt-2 sm:mt-4 text-white/50 text-xs sm:text-sm">
          © {new Date().getFullYear()} Code Review Hub. All rights reserved.
        </div>
      </footer>

      {/* Animations and Styles */}
      <style jsx global>{`
        @keyframes gradient-x {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        .animate-gradient-x {
          background-size: 200% 200%;
          animation: gradient-x 15s ease infinite;
        }
        /* Override Bootstrap Card styles */
        .card {
          background-color: transparent !important;
        }
        .card-header {
          background: linear-gradient(to right, #5b21b6, #312e81) !important; /* Matches from-purple-800 to-indigo-900 */
          border-bottom: none !important;
        }
        .card-body {
          background-color: transparent !important;
        }
        /* Ensure dark background for error states */
        html, body {
          background-color: #000 !important;
        }
      `}</style>
    </div>
  );
}