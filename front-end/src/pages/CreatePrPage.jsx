import React, { useEffect, useState, useRef } from 'react';
import { Container, Card } from 'react-bootstrap';
import { useNavigate, Link } from 'react-router-dom';
import { FaInfoCircle, FaLink, FaCheck, FaSave, FaSun, FaMoon, FaBars, FaTimes } from 'react-icons/fa';
import { getUserInfo } from '../api/user';
import { useTheme } from '../contexts/ThemeContext';

export default function CreatePrPage() {
  const [user, setUser] = useState(null);
  const [webhookToken, setWebhookToken] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const didFetchRef = useRef(false);
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  // Fetch user data and webhook token
  useEffect(() => {
    if (didFetchRef.current) return;
    didFetchRef.current = true;

    async function fetchData() {
      try {
        const userData = await getUserInfo();
        if (!userData || !userData.username) {
          throw new Error('401');
        }
        setUser(userData);

        // Fetch webhook token
        try {
          const response = await fetch('/api/user/webhook-token', {
            method: 'GET',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' }
          });
          console.log('Response GET /api/user/webhook-token:', { status: response.status });
          if (response.ok) {
            const data = await response.json();
            setWebhookToken(data.token);
          } else {
            setWebhookToken(null);
          }
        } catch (tokenErr) {
          console.error('Failed to fetch webhook token:', {
            message: tokenErr.message,
            status: tokenErr.message.match(/\d{3}/)?.[0],
            stack: tokenErr.stack
          });
          setWebhookToken(null);
        }
      } catch (err) {
        console.error('Error fetching user data:', {
          message: err.message,
          status: err.status
        });
        setError('You are not logged in. Please log in or sign up to access this page.');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  // Handle logout
  const handleLogout = async () => {
    try {
      await fetch('/logout', { method: 'POST', credentials: 'include' });
    } catch {}
    finally {
      setUser(null);
      setWebhookToken(null);
      setError(null);
      setLoading(false);
      navigate('/');
    }
  };

  // Toggle mobile menu
  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  if (loading) {
    return (
      <div className={`relative min-h-screen ${theme === 'light' ? 'bg-white text-black' : 'bg-black text-white'} flex items-center justify-center`}>
        <div className="absolute inset-0 z-0 opacity-30">
          {theme === 'dark' && (
            <>
              <div className="absolute inset-0 bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900 animate-gradient-x"></div>
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-transparent via-black/50 to-black opacity-70"></div>
            </>
          )}
        </div>
        <div className={`relative z-10 flex items-center text-xl ${theme === 'light' ? 'text-black' : 'text-white'}`}>
          <div className={`animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 ${theme === 'light' ? 'border-blue-600' : 'border-purple-600'}`}></div>
          <span className="ml-2">Loading...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`relative min-h-screen ${theme === 'light' ? 'bg-white text-black' : 'bg-black text-white'} flex items-center justify-center`}>
        <div className="absolute inset-0 z-0 opacity-30">
          {theme === 'dark' && (
            <>
              <div className="absolute inset-0 bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900 animate-gradient-x"></div>
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-transparent via-black/50 to-black opacity-70"></div>
            </>
          )}
        </div>
        <div className={`relative z-10 ${theme === 'light' ? 'bg-white/70' : 'bg-black/70'} border border-${theme === 'light' ? 'black/10' : 'white/10'} rounded-2xl p-6 text-${theme === 'light' ? 'black' : 'white'} text-center`}>
          <h3 className={`text-lg font-semibold mb-4 ${theme === 'light' ? 'text-black' : 'text-white'}`}>Error</h3>
          <p className={`mb-4 ${theme === 'light' ? 'text-black' : 'text-white'}`}>{error}</p>
          <div className="space-x-4">
            <Link to="/user" className={`px-4 py-2 ${theme === 'light' ? 'bg-blue-600 text-white hover:bg-blue-500' : 'bg-purple-600 text-white hover:bg-purple-500'} rounded-full transition no-underline`}>
              Return to User Page
            </Link>
            <Link to="/login" className={`px-4 py-2 ${theme === 'light' ? 'bg-blue-600 text-white hover:bg-blue-500' : 'bg-purple-600 text-white hover:bg-purple-500'} rounded-full transition no-underline`}>
              Log In
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative min-h-screen ${theme === 'light' ? 'bg-white text-black' : 'bg-black text-white'} font-['Gabarito'] flex flex-col overflow-hidden`}>
      {/* Background */}
      <div className="absolute inset-0 z-0 opacity-30">
        {theme === 'dark' && (
          <>
            <div className="absolute inset-0 bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900 animate-gradient-x"></div>
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-transparent via-black/50 to-black opacity-70"></div>
          </>
        )}
      </div>

      {/* Navigation */}
      <nav className={`relative z-50 px-4 sm:px-8 py-4 sm:py-6 flex justify-between items-center`}>
        <Link
          to="/"
          className={`text-2xl sm:text-3xl font-bold ${theme === 'light' ? 'text-black' : 'text-white'} tracking-wider hover:scale-105 transition-transform no-underline`}
        >
          Code Review Hub
        </Link>
        {/* Desktop Navbar */}
        <div className="hidden sm:flex items-center space-x-6">
          <div className="flex space-x-2">
            <button
              onClick={() => toggleTheme('light')}
              className={`p-2 rounded-full ${theme === 'light' ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'} transition-colors`}
              title="Switch to Light Theme"
            >
              <FaSun size={20} />
            </button>
            <button
              onClick={() => toggleTheme('dark')}
              className={`p-2 rounded-full ${theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-blue-600 text-gray-300 hover:bg-blue-500'} transition-colors`}
              title="Switch to Dark Theme"
            >
              <FaMoon size={20} />
            </button>
          </div>
          {user ? (
            <div className="flex items-center space-x-4">
              <Link to="/user" className="flex-shrink-0">
                {user.avatar ? (
                  <img
                    src={user.avatar}
                    alt="User avatar"
                    className={`w-10 h-10 rounded-full object-cover border-2 ${theme === 'light' ? 'border-blue-600 hover:border-blue-400' : 'border-purple-600 hover:border-purple-400'} transition-colors`}
                  />
                ) : (
                  <div className={`w-10 h-10 ${theme === 'light' ? 'bg-blue-600 hover:bg-blue-500' : 'bg-purple-600 hover:bg-purple-500'} text-white rounded-full flex items-center justify-center text-lg font-bold transition-all`}>
                    {user.name[0].toUpperCase()}
                  </div>
                )}
              </Link>
              <button
                onClick={handleLogout}
                className={`px-4 py-2 border ${theme === 'light' ? 'border-blue-600 hover:bg-blue-600 text-black hover:text-white' : 'border-purple-600 hover:bg-purple-600 text-white'} rounded-full transition-colors`}
              >
                Logout
              </button>
            </div>
          ) : (
            <>
              <Link to="/login" className={`text-center ${theme === 'light' ? 'text-black/80 hover:text-black' : 'text-white/80 hover:text-white'} transition-colors no-underline`}>
                Login
              </Link>
              <Link
                to="/signup"
                className={`px-6 py-3 ${theme === 'light' ? 'bg-blue-600 hover:bg-blue-500 text-white' : 'bg-purple-600 text-white hover:bg-purple-500'} rounded-full transition-all no-underline`}
              >
                Sign Up
              </Link>
            </>
          )}
        </div>
        {/* Mobile Burger Button */}
        <button className="sm:hidden p-2" onClick={toggleMenu}>
          {menuOpen ? <FaTimes size={24} className={theme === 'light' ? 'text-black' : 'text-white'} /> : <FaBars size={24} className={theme === 'light' ? 'text-black' : 'text-white'} />}
        </button>
      </nav>
      {/* Mobile Menu */}
      {menuOpen && (
        <div className={`sm:hidden flex flex-col items-center space-y-4 pb-4 ${theme === 'light' ? 'bg-white' : 'bg-black'} border-t border-${theme === 'light' ? 'black/10' : 'purple-500/30'}`}>
          <div className="flex space-x-2">
            <button
              onClick={() => toggleTheme('light')}
              className={`p-2 rounded-full ${theme === 'light' ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'} transition-colors`}
              title="Switch to Light Theme"
            >
              <FaSun size={20} />
            </button>
            <button
              onClick={() => toggleTheme('dark')}
              className={`p-2 rounded-full ${theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-blue-600 text-gray-300 hover:bg-blue-500'} transition-colors`}
              title="Switch to Dark Theme"
            >
              <FaMoon size={20} />
            </button>
          </div>
          {user ? (
            <div className="flex flex-col items-center space-y-4">
              <Link to="/user" className="flex-shrink-0" onClick={toggleMenu}>
                {user.avatar ? (
                  <img
                    src={user.avatar}
                    alt="User avatar"
                    className={`w-10 h-10 rounded-full object-cover border-2 ${theme === 'light' ? 'border-blue-600 hover:border-blue-400' : 'border-purple-600 hover:border-purple-400'} transition-colors`}
                  />
                ) : (
                  <div className={`w-10 h-10 ${theme === 'light' ? 'bg-blue-600 hover:bg-blue-500' : 'bg-purple-600 hover:bg-purple-500'} text-white rounded-full flex items-center justify-center text-lg font-bold transition-all`}>
                    {user.name[0].toUpperCase()}
                  </div>
                )}
              </Link>
              <button
                onClick={() => {
                  handleLogout();
                  toggleMenu();
                }}
                className={`px-4 py-2 border ${theme === 'light' ? 'border-blue-600 hover:bg-blue-600 text-black hover:text-white' : 'border-purple-600 hover:bg-purple-600 text-white'} rounded-full transition-colors`}
              >
                Logout
              </button>
            </div>
          ) : (
            <>
              <Link
                to="/login"
                className={`text-center ${theme === 'light' ? 'text-black/80 hover:text-black' : 'text-white/80 hover:text-white'} transition-colors no-underline`}
                onClick={toggleMenu}
              >
                Login
              </Link>
              <Link
                to="/signup"
                className={`px-6 py-3 ${theme === 'light' ? 'bg-blue-600 hover:bg-blue-500 text-white' : 'bg-purple-600 text-white hover:bg-purple-500'} rounded-full transition-all no-underline`}
                onClick={toggleMenu}
              >
                Sign Up
              </Link>
            </>
          )}
        </div>
      )}

      <main className={`relative z-40 px-6 py-4 flex-grow flex items-center justify-center ${theme === 'light' ? 'bg-white' : 'bg-transparent'}`}>
        <Container className="text-center max-w-lg">
          <Card className={`bg-transparent border border-${theme === 'light' ? 'black/10' : 'purple-500/30'} rounded-2xl p-4 shadow-lg`}>
            <Card.Header className={`bg-gradient-to-r ${theme === 'light' ? 'from-blue-800 to-blue-900' : 'from-purple-800 to-indigo-900'} text-${theme === 'light' ? 'white' : 'white'} text-lg font-bold py-3 rounded-t-2xl flex items-center`}>
              <FaInfoCircle className={`w-5 h-5 mr-2 ${theme === 'light' ? 'text-blue-300' : 'text-purple-300'}`} />
              Configuration Instructions
            </Card.Header>
            <Card.Body className={`text-${theme === 'light' ? 'black' : 'white'} space-y-2`}>
              <ol className="list-decimal pl-5 space-y-2 text-sm">
                <li className="flex items-start">
                  <FaInfoCircle className={`w-4 h-4 mr-2 ${theme === 'light' ? 'text-blue-400' : 'text-purple-400'} mt-0.5 flex-shrink-0`} />
                  <span className={theme === 'light' ? 'text-black' : 'text-white'}>In Bitbucket, go to <strong className={theme === 'light' ? 'text-blue-300' : 'text-purple-300'}>Repository Settings → Webhooks</strong>.</span>
                </li>
                <li className="flex items-start">
                  <FaLink className={`w-4 h-4 mr-2 ${theme === 'light' ? 'text-blue-400' : 'text-purple-400'} mt-0.5 flex-shrink-0`} />
                  <span className={theme === 'light' ? 'text-black' : 'text-white'}>
                    <strong className={theme === 'light' ? 'text-blue-300' : 'text-purple-300'}>Add a new webhook with URL:</strong>{" "}
                    {webhookToken ? (
                      <code className={`bg-${theme === 'light' ? 'black/20' : 'black/90'} text-${theme === 'light' ? 'text-black' : 'text-white'} px-1.5 py-0.5 rounded-lg shadow-sm`}>
                        localhost:8080/webhook/bitbucket/{webhookToken}
                      </code>
                    ) : (
                      <span>
                        <span className={theme === 'light' ? 'text-red-600' : 'text-red-400'}>Webhook inactive. </span>
                        <Link to="/user" className={`underline ${theme === 'light' ? 'text-blue-600 hover:text-blue-500' : 'text-purple-400 hover:text-purple-300'}`}>
                          Activate the webhook on the user page.
                        </Link>
                      </span>
                    )}
                  </span>
                </li>
                <li className="flex items-start">
                  <FaCheck className={`w-4 h-4 mr-2 ${theme === 'light' ? 'text-blue-400' : 'text-purple-400'} mt-0.5 flex-shrink-0`} />
                  <span className={theme === 'light' ? 'text-black' : 'text-white'}>Select <strong className={theme === 'light' ? 'text-blue-300' : 'text-purple-300'}>Pull Request events</strong> (created, updated).</span>
                </li>
                <li className="flex items-start">
                  <FaSave className={`w-4 h-4 mr-2 ${theme === 'light' ? 'text-blue-400' : 'text-purple-400'} mt-0.5 flex-shrink-0`} />
                  <span className={theme === 'light' ? 'text-black' : 'text-white'}>
                    <strong className={theme === 'light' ? 'text-blue-300' : 'text-purple-300'}>Save</strong> and then <strong className={theme === 'light' ? 'text-blue-300' : 'text-purple-300'}>create a Pull Request</strong> in the repository.
                  </span>
                </li>
              </ol>
              <div className="mt-4">
                <Link
                  to="/user"
                  className={`px-4 py-2 ${theme === 'light' ? 'bg-blue-600 text-white hover:bg-blue-500' : 'bg-purple-600 text-white hover:bg-purple-500'} rounded-full transition no-underline`}
                >
                  Return to User Page
                </Link>
              </div>
            </Card.Body>
          </Card>
        </Container>
      </main>

      {/* Footer */}
      <footer className={`relative z-40 ${theme === 'light' ? 'bg-white/70' : 'bg-black/70'} backdrop-blur-lg border-t border-${theme === 'light' ? 'black/10' : 'purple-500/30'} py-4 sm:py-6`}>
        <div className={`text-center mt-2 sm:mt-4 ${theme === 'light' ? 'text-black/50' : 'text-white/50'} text-xs sm:text-sm`}>
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
        .card {
          background-color: transparent !important;
        }
        .card-header {
          background: linear-gradient(to right, ${theme === 'light' ? '#1e40af, #1e3a8a' : '#5b21b6, #312e81'}) !important;
          border-bottom: none !important;
        }
        .card-body {
          background-color: transparent !important;
        }
        html, body {
          background-color: ${theme === 'light' ? '#ffffff' : '#000000'} !important;
        }
      `}</style>
    </div>
  );
}