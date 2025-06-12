import React, { useEffect, useState, useRef } from 'react';
import { Container, Card } from 'react-bootstrap';
import { useNavigate, Link } from 'react-router-dom';
import { FaInfoCircle, FaLink, FaCheck, FaSave, FaSun, FaMoon, FaCaretDown, FaCheckCircle } from 'react-icons/fa';
import { getUserInfo } from '../api/user';
import { useTheme } from '../contexts/ThemeContext';

export default function CreatePrPage() {
  const [user, setUser] = useState(null);
  const [webhookToken, setWebhookToken] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isCopied, setIsCopied] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [themeOptionsOpen, setThemeOptionsOpen] = useState(false);
  const didFetchRef = useRef(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();

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
          const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/user/webhook-token`, {
            method: 'GET',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' }
          });
          if (response.ok) {
            const data = await response.json();
            setWebhookToken(data.token);
          } else {
            setWebhookToken(null);
          }
        } catch (tokenErr) {
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

  // Restore and save theme
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme && ['light', 'dark'].includes(savedTheme)) {
      setTheme(savedTheme);
    } else {
      setTheme('dark');
    }
  }, [setTheme]);

  useEffect(() => {
    localStorage.setItem('theme', theme);
    document.body.className = theme === 'light' ? 'bg-white text-black' : 'bg-black text-white';
  }, [theme]);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
        setThemeOptionsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Handle logout
  const handleLogout = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/logout`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
      });
      if (!response.ok) {
        throw new Error(`Logout request failed: ${response.status} - ${await response.text()}`);
      }
    } catch (err) {
      console.error('Logout error:', err);
      setError('Failed to log out. Please try again.');
      return;
    } finally {
      setUser(null);
      setWebhookToken(null);
      document.cookie = 'JSESSIONID=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
      navigate('/');
    }
  };

  // Handle URL copy
  const handleCopyUrl = async () => {
    if (webhookToken) {
      const url = `https://nomadicdata.group/webhook/bitbucket/${webhookToken}`;
      try {
        await navigator.clipboard.writeText(url);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
      } catch (err) {
        console.error('Failed to copy URL:', err);
        setError('Failed to copy URL to clipboard.');
        setTimeout(() => setError(null), 2000);
      }
    }
  };

  const handleSwitchToAdmin = () => navigate('/admin');
  const handleToggleTheme = () => setThemeOptionsOpen(!themeOptionsOpen);
  const handleThemeSelect = (selectedTheme) => {
    setTheme(selectedTheme);
    setThemeOptionsOpen(false);
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
      <nav className={`relative z-50 px-6 py-4 flex justify-between items-center`}>
        <Link to="/" className={`text-2xl font-bold ${theme === 'light' ? 'text-black' : 'text-white'} tracking-wider hover:scale-105 transition-transform no-underline`}>
          Code Review Hub
        </Link>
        <div className="relative" ref={dropdownRef}>
          <div
            className="flex items-center gap-3 cursor-pointer"
            onClick={() => setDropdownOpen(!dropdownOpen)}
          >
            {user?.avatar ? (
              <img src={user.avatar} alt="Avatar" className="w-10 h-10 rounded-full object-cover" />
            ) : (
              <div className={`w-10 h-10 ${theme === 'light' ? 'bg-blue-600' : 'bg-purple-600'} text-white rounded-full flex items-center justify-center text-lg`}>
                {user.name[0]}
              </div>
            )}
            <FaCaretDown className={theme === 'light' ? 'text-black' : 'text-white'} />
          </div>
          {dropdownOpen && (
            <div className={`absolute right-0 mt-2 w-48 ${theme === 'light' ? 'bg-white/90' : 'bg-black/80'} border border-${theme === 'light' ? 'black/10' : 'white/10'} rounded-lg shadow-lg z-50`}>
              {user?.roles?.includes('ROLE_ADMIN' && 'ROLE_TEAM_ADMIN') && (
                <button
                  onClick={() => { handleSwitchToAdmin(); setDropdownOpen(false); }}
                  className={`w-full text-left px-4 py-2 ${theme === 'light' ? 'text-black hover:bg-blue-100' : 'text-white hover:bg-purple-600'} rounded-t-lg`}
                >
                  Switch to Admin
                </button>
              )}
              <button
                onClick={handleToggleTheme}
                className={`w-full text-left px-4 py-2 ${theme === 'light' ? 'text-black hover:bg-blue-100' : 'text-white hover:bg-purple-600'} ${!user?.roles?.includes('ROLE_ADMIN') ? 'rounded-t-lg' : ''}`}
              >
                Theme
              </button>
              {themeOptionsOpen && (
                <div className="pl-4 py-2">
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      name="theme"
                      checked={theme === 'light'}
                      onChange={() => handleThemeSelect('light')}
                      className="mr-2"
                    />
                    <FaSun className="mr-2 text-yellow-400" />
                    Light
                  </label>
                  <label className="flex items-center mt-2 cursor-pointer">
                    <input
                      type="radio"
                      name="theme"
                      checked={theme === 'dark'}
                      onChange={() => handleThemeSelect('dark')}
                      className="mr-2"
                    />
                    <FaMoon className="mr-2 text-gray-300" />
                    Dark
                  </label>
                </div>
              )}
              <button
                onClick={() => { handleLogout(); setDropdownOpen(false); }}
                className={`w-full text-left px-4 py-2 ${theme === 'light' ? 'text-black hover:bg-blue-100' : 'text-white hover:bg-purple-600'} rounded-b-lg`}
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </nav>

      <main className={`relative z-40 px-6 py-4 flex-grow flex items-center justify-center ${theme === 'light' ? 'bg-white' : 'bg-transparent'}`}>
        <Container className="text-center max-w-md md:max-w-lg">
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
                <li className="flex items-start relative">
                  <FaLink className={`w-4 h-4 mr-2 ${theme === 'light' ? 'text-blue-400' : 'text-purple-400'} mt-0.5 flex-shrink-0`} />
                  <span className={theme === 'light' ? 'text-black' : 'text-white'}>
                    <strong className={theme === 'light' ? 'text-blue-300' : 'text-purple-300'}>Add a new webhook with URL:</strong>{" "}
                    {webhookToken ? (
                      <span className="relative">
                        <code
                          className={`bg-${theme === 'light' ? 'black/20' : 'black/90'} text-${theme === 'light' ? 'text-black' : 'text-white'} px-1.5 py-0.5 rounded cursor-pointer hover:bg-${theme === 'light' ? 'black/30' : 'black/70'} break-all`}
                          onClick={handleCopyUrl}
                          title="Click to copy"
                        >
                          https://nomadicdata.group/webhook/bitbucket/{webhookToken}
                        </code>
                        {isCopied && (
                          <span className={`text-xs ${theme === 'light' ? 'text-blue-600' : 'text-white-600'} font-semibold ml-2 bg-${theme === 'light' ? 'blue-100' : 'purple-900'} px-1 rounded`}>
                            Copied!
                          </span>
                        )}
                      </span>
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
      <footer className={`relative z-40 ${theme === 'light' ? 'bg-white/70' : 'bg-black/70'} backdrop-blur-lg border-t border-${theme === 'light' ? 'black/10' : 'white/10'} py-4 sm:py-6`}>
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
        @keyframes fade-in {
          0% { opacity: 0; margin-top: -10px; }
          100% { opacity: 1; margin-top: 0; }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
          will-change: opacity, margin-top;
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
        code {
          word-break: break-all !important;
          overflow-wrap: break-word !important;
          display: inline-block;
          max-width: 100%;
        }
        html, body {
          background-color: ${theme === 'light' ? '#ffffff' : '#000000'} !important;
        }

        @media (max-width: 640px) {
          .card {
            width: 90vw !important;
            max-width: 100% !important;
          }
          .card-body ol li span {
            font-size: 0.875rem !important;
          }
          code {
            font-size: 0.75rem !important;
          }
        }
      `}</style>
    </div>
  );
}