import React, { useEffect, useState, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { sendChat } from '../api/chat';
import { getUserInfo } from '../api/user';
import { getAdminUsers, getAdminFeedbacksByUser, deleteFeedback } from '../api/admin';
import { Link, useNavigate } from 'react-router-dom';
import { FaRobot, FaSun, FaMoon, FaCaretDown } from 'react-icons/fa';
import { useTheme } from '../contexts/ThemeContext';

export default function AdminPage() {
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [user, setUser] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [feedbacks, setFeedbacks] = useState([]);
  const [loadingFeedbacks, setLoadingFeedbacks] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState(() => {
    try {
      const saved = window.localStorage.getItem('chatMessages');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });
  const [chatInput, setChatInput] = useState('');
  const [themeOptionsOpen, setThemeOptionsOpen] = useState(false);
  const { theme, setTheme } = useTheme();
  const dropdownRef = useRef(null);

  const handleThemeSelect = (selectedTheme) => {
    setTheme(selectedTheme);
    setThemeOptionsOpen(false);
  };

  const handleSwitchToUser = () => navigate('/user');
  const handleToggleTheme = () => setThemeOptionsOpen(!themeOptionsOpen);

  useEffect(() => {
    async function initAdmin() {
      try {
        const adminUser = await getUserInfo();
        if (!adminUser) {
          throw new Error('You are not logged in. Please log in or sign up to access this page.');
        } else if (!adminUser.roles?.includes('ROLE_ADMIN')) {
          throw new Error('You do not have access to this page.');
        }
        setUser(adminUser);
        const list = await getAdminUsers();
        setUsers(list);
      } catch (e) {
        console.error('Fetch failed:', e, { message: e.message, status: e.status });
        if (
          e.message.includes('Failed to fetch') ||
          e.message.includes('401') ||
          e.message.includes('403')
        ) {
          setError('You are not logged in. Please log in or sign up to access this page.');
        } else {
          setError(e.message);
        }
      } finally {
        setLoading(false);
      }
    }
    initAdmin();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
        setThemeOptionsOpen(false); // Close theme options if open
      }
    };

    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [dropdownOpen]);

  const handleSend = async () => {
    const text = chatInput.trim();
    if (!text) return;
    setChatMessages(prev => [...prev, { sender: 'user', text }]);
    setChatInput('');
    const history = [...chatMessages.map(m => ({ role: m.sender === 'user' ? 'user' : 'assistant', content: m.text })), { role: 'user', content: text }];
    try {
      const aiModel = user?.aiModel;
      if (!aiModel) throw new Error('No AI model available');
      const aiReply = await sendChat(aiModel.ai, aiModel.model, history);
      setChatMessages(prev => [...prev, { sender: 'ai', text: aiReply }]);
    } catch (err) {
      setChatMessages(prev => [...prev, { sender: 'ai', text: '😢 Error in chat.' }]);
    }
  };

  const handleUserSelect = async (user) => {
    setSelectedUser(user);
    console.log('Selected user attributes:', user);
    setFeedbacks([]);
    setLoadingFeedbacks(true);
    try {
      const fbs = await getAdminFeedbacksByUser(user.username);
      setFeedbacks(fbs);
    } catch (e) {
      setError('You are not logged in. Please log in or sign up to access this page.');
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
      <div className={`min-h-screen flex items-center justify-center ${theme === 'light' ? 'bg-white text-black' : 'bg-black text-white'} text-xl`}>
        <div className={`animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 ${theme === 'light' ? 'border-blue-600' : 'border-purple-600'}`}></div>
        <span className="ml-2">Loading Admin Panel...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`min-h-screen ${theme === 'light' ? 'bg-white text-black' : 'bg-black text-white'} flex items-center justify-center`}>
        <div className={`relative z-10 ${theme === 'light' ? 'bg-white/70' : 'bg-black/70'} border border-${theme === 'light' ? 'black/10' : 'white/10'} rounded-2xl p-6 text-${theme === 'light' ? 'black' : 'white'} text-center`}>
          <h3 className={`text-lg font-semibold mb-4 ${theme === 'light' ? 'text-black' : 'text-white'}`}>Authentication Required</h3>
          <p className={`mb-4 ${theme === 'light' ? 'text-black' : 'text-white'}`}>{error}</p>
          {error === 'You are not logged in. Please log in or sign up to access this page.' ? (
            <div className="space-x-4">
              <Link to="/login" className={`px-4 py-2 ${theme === 'light' ? 'bg-blue-600 text-white hover:bg-blue-500' : 'bg-purple-600 text-white hover:bg-purple-500'} rounded-full transition no-underline`}>
                Log In
              </Link>
              <Link to="/signup" className={`px-4 py-2 ${theme === 'light' ? 'bg-blue-600 text-white hover:bg-blue-500' : 'bg-purple-600 text-white hover:bg-purple-500'} rounded-full transition no-underline`}>
                Sign Up
              </Link>
            </div>
          ) : (
            <Link to="/user" className={`mt-4 inline-block px-4 py-2 ${theme === 'light' ? 'bg-blue-600 text-white hover:bg-blue-500' : 'bg-purple-600 text-white hover:bg-purple-500'} rounded-full transition no-underline`}>
              Return to User Page
            </Link>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`relative min-h-screen ${theme === 'light' ? 'bg-white text-black' : 'bg-black text-white'} overflow-hidden font-['Gabarito'] flex flex-col`}>
      {/* Background */}
      <div className="absolute inset-0 z-0 opacity-30">
        {theme === 'dark' && (
          <>
            <div className="absolute inset-0 bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900 animate-gradient-x"></div>
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-transparent via-black/50 to-black opacity-70"></div>
          </>
        )}
      </div>

      {/* Navbar */}
      <nav className={`relative z-50 px-6 py-4 flex justify-between items-center ${theme === 'light' ? 'bg-white/80' : 'bg-black/80'}`}>
        <Link to="/" className={`text-2xl font-bold ${theme === 'light' ? 'text-black' : 'text-white'} tracking-wider hover:scale-105 transition-transform no-underline`}>
          Code Review Hub - Admin
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
            <div className={`absolute right-0 mt-2 w-48 ${theme === 'light' ? 'bg-white/80' : 'bg-black/80'} border border-${theme === 'light' ? 'black/10' : 'white/10'} rounded-lg shadow-lg z-50`}>
              {user?.roles?.includes('ROLE_ADMIN') && (
                <button
                  onClick={() => { handleSwitchToUser(); setDropdownOpen(false); }}
                  className={`w-full text-left px-4 py-2 ${theme === 'light' ? 'text-black hover:bg-blue-200' : 'text-white hover:bg-purple-600'} rounded-t-lg`}
                >
                  Switch to User
                </button>
              )}
              <button
                onClick={handleToggleTheme}
                className={`w-full text-left px-4 py-2 ${theme === 'light' ? 'text-black hover:bg-blue-200' : 'text-white hover:bg-purple-600'} ${!user?.roles?.includes('ROLE_ADMIN') ? 'rounded-t-lg' : ''}`}
              >
                Theme
              </button>
              {themeOptionsOpen && (
                <div className={`pl-4 py-2 ${theme === 'light' ? 'text-black' : 'text-white'}`}>
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
                className={`w-full text-left px-4 py-2 ${theme === 'light' ? 'text-black hover:bg-blue-200' : 'text-white hover:bg-purple-600'} rounded-b-lg`}
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </nav>

      <main className={`relative z-40 px-6 py-6 flex-grow ${theme === 'light' ? 'bg-white' : 'bg-black'}`}>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="md:col-span-1 space-y-6">
            <div className={`bg-${theme === 'light' ? 'white/70' : 'black/70'} border border-${theme === 'light' ? 'black/10' : 'white/10'} rounded-2xl p-4`}>
              <h5 className={`mb-3 text-lg font-semibold ${theme === 'light' ? 'text-black' : 'text-white'}`}>All Users</h5>
              <div className="space-y-2">
                {users.map(u => (
                  <div
                    key={u.username}
                    className={`p-2 rounded-lg cursor-pointer flex items-center ${selectedUser?.username === u.username ? (theme === 'light' ? 'bg-blue-200/30' : 'bg-purple-600/30') : (theme === 'light' ? 'hover:bg-blue-200/40' : 'hover:bg-black/40')}`}
                    onClick={() => handleUserSelect(u)}
                  >
                    {u.avatar ? (
                      <img
                        src={u.avatar}
                        alt="Avatar"
                        className="w-8 h-8 rounded-full object-cover mr-2"
                        onError={(e) => (e.target.src = '')}
                      />
                    ) : (
                      <div
                        className={`bg-${theme === 'light' ? 'blue-600' : 'purple-600'} text-white w-8 h-8 rounded-full flex items-center justify-center mr-2 text-sm`}
                      >
                        {(u.name || u.username)?.[0]?.toUpperCase() || 'U'}
                      </div>
                    )}
                    <span className={theme === 'light' ? 'text-black' : 'text-white'}>{u.name || u.username}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="md:col-span-3">
            {!selectedUser ? (
              <div className={`text-center ${theme === 'light' ? 'text-black/60' : 'text-white/60'} mt-10`}>
                Select a user to view details and feedbacks.
              </div>
            ) : (
              <>
                <div className={`bg-${theme === 'light' ? 'white/70' : 'black/70'} border border-${theme === 'light' ? 'black/10' : 'white/10'} rounded-2xl p-4 mb-6 flex items-center`}>
                  {selectedUser.avatar ? (
                    <img
                      src={selectedUser.avatar}
                      alt="Avatar"
                      className="w-20 h-20 rounded-full object-cover mr-4"
                      onError={(e) => (e.target.src = '')}
                    />
                  ) : (
                    <div
                      className={`bg-${theme === 'light' ? 'blue-600' : 'purple-600'} text-white w-20 h-20 rounded-full flex items-center justify-center mr-4 text-2xl`}
                    >
                      {(selectedUser.name || selectedUser.username)?.[0]?.toUpperCase() || 'U'}
                    </div>
                  )}
                  <div>
                    <h5 className={`mb-1 text-xl font-semibold ${theme === 'light' ? 'text-black' : 'text-white'}`}>{selectedUser.name || selectedUser.username}</h5>
                    <p className={`text-${theme === 'light' ? 'black/70' : 'white/70'} text-sm`}>@{selectedUser.username} • {selectedUser.email}</p>
                  </div>
                </div>

                <h5 className={`mb-3 text-lg font-semibold ${theme === 'light' ? 'text-black' : 'text-white'}`}>Feedbacks</h5>
                {loadingFeedbacks ? (
                  <div className="flex justify-center">
                    <div className={`animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 ${theme === 'light' ? 'border-blue-600' : 'border-purple-600'}`}></div>
                  </div>
                ) : feedbacks.length === 0 ? (
                  <div className={`bg-${theme === 'light' ? 'white/60' : 'black/60'} border border-${theme === 'light' ? 'black/10' : 'white/10'} rounded-2xl p-4 text-${theme === 'light' ? 'black/60' : 'white/60'}`}>
                    No feedbacks for this user.
                  </div>
                ) : (
                  feedbacks.map(fb => (
                    <div key={fb.id} className={`bg-${theme === 'light' ? 'white/60' : 'black/60'} border border-${theme === 'light' ? 'black/10' : 'white/10'} rounded-2xl p-4 mb-3`}>
                      <h5 className={`font-semibold ${theme === 'light' ? 'text-blue-400' : 'text-purple-400'} mb-2`}>
                        PR #{fb.prId} • <span className={theme === 'light' ? 'text-black' : 'text-white'}>{fb.repoFullName}</span>
                      </h5>
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{ p: ({ node, ...props }) => <p className={theme === 'light' ? 'text-black/90' : 'text-white/90'} {...props} /> }}
                      >
                        {fb.comment}
                      </ReactMarkdown>
                      <button
                        className="mt-2 px-3 py-1 bg-red-600 text-white rounded-full hover:bg-red-500 transition"
                        onClick={() => deleteFeedback(fb.id).then(() => handleUserSelect(selectedUser))}
                      >
                        Delete
                      </button>
                    </div>
                  ))
                )}
              </>
            )}
          </div>
        </div>
      </main>

      {/* Floating AI Chat Button */}
      <button
        className={`fixed bottom-5 right-5 w-14 h-14 rounded-full ${theme === 'light' ? 'bg-blue-600' : 'bg-purple-600'} text-white text-xl flex items-center justify-center shadow-lg z-50`}
        onClick={() => setChatOpen(!chatOpen)}
        title="Chat with AI"
      >
        <FaRobot size={24} />
      </button>

      {/* Chat window */}
      {chatOpen && (
        <div className={`fixed bottom-24 right-5 w-80 h-96 ${theme === 'light' ? 'bg-white text-black' : 'bg-gray-900 text-white'} rounded-xl shadow-2xl z-50 flex flex-col overflow-hidden`}>
          <div className={`bg-${theme === 'light' ? 'blue-600' : 'purple-600'} text-white px-4 py-2 flex justify-between items-center`}>
            <span>AI Assistant</span>
            <button onClick={() => setChatOpen(false)}>✕</button>
          </div>
          <div className={`flex-1 overflow-y-auto p-4 space-y-2 ${theme === 'light' ? 'bg-gray-100' : 'bg-gray-800'}`}>
            {chatMessages.map((m, i) => (
              <div key={i} className={`rounded-lg px-3 py-2 ${m.sender === 'user' ? (theme === 'light' ? 'bg-blue-100 text-right' : 'bg-blue-700 text-right') : (theme === 'light' ? 'bg-white' : 'bg-gray-700')}`}>
                <ReactMarkdown remarkPlugins={[remarkGfm]} components={{ p: ({ node, ...props }) => <p className={theme === 'light' ? 'text-black' : 'text-white'} {...props} /> }}>
                  {m.text}
                </ReactMarkdown>
              </div>
            ))}
          </div>
          <div className={`border-t p-2 flex gap-2 ${theme === 'light' ? 'bg-white' : 'bg-gray-900'}`}>
            <input
              type="text"
              className={`flex-1 border border-${theme === 'light' ? 'gray-300' : 'gray-600'} rounded px-2 py-1 ${theme === 'light' ? 'bg-white text-black' : 'bg-gray-700 text-white'}`}
              placeholder="Type a message..."
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
            />
            <button onClick={handleSend} className={`px-3 ${theme === 'light' ? 'bg-blue-600' : 'bg-purple-600'} text-white rounded`}>Send</button>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className={`relative z-40 ${theme === 'light' ? 'bg-white/70' : 'bg-black/70'} backdrop-blur-lg border-t border-${theme === 'light' ? 'black/10' : 'white/10'} py-6 sm:py-8`}>
        <div className={`text-center mt-4 sm:mt-6 ${theme === 'light' ? 'text-black/50' : 'text-white/50'} text-xs sm:text-sm`}>
          © {new Date().getFullYear()} Code Review Hub. All rights reserved.
        </div>
      </footer>

      {/* Animations */}
      <style jsx global>{`
        @keyframes gradient-x {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        .animate-gradient-x {
          background-size: 200% 200%;
          animation: gradient-x 15s ease infinite;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        .animate-spin {
          animation: spin 1s linear infinite;
        }
      `}</style>
    </div>
  );
}