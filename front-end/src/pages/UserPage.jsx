import React, { useEffect, useState, useRef } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { getUserInfo, getUserFeedbacks, enableWebhookToken, disableWebhookToken } from '../api/user';
import { sendChat } from '../api/chat';
import { Link, useNavigate } from 'react-router-dom';
import { FaRobot, FaCaretDown, FaSun, FaMoon, FaCheckCircle, FaChevronDown, FaChevronUp } from 'react-icons/fa';
import { DropdownButton, Dropdown, Spinner, Alert } from 'react-bootstrap';
import Switch from 'react-switch';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

export async function getUserRepos(username) {
  try {
    const response = await fetch(`/api/user/repos/${username}`, {
      method: 'GET',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' }
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch user repositories:', error);
    throw error;
  }
}

export default function UserPage() {
  const [user, setUser] = useState(null);
  const [feedbacks, setFeedbacks] = useState([]);
  const [repos, setRepos] = useState(['all']);
  const [selectedRepo, setSelectedRepo] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
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
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [themeOptionsOpen, setThemeOptionsOpen] = useState(false);
  const [webhookEnabled, setWebhookEnabled] = useState(false);
  const [token, setToken] = useState(null);
  const [stage, setStage] = useState(null);
  const [done, setDone] = useState(false);
  const [popup, setPopup] = useState({ visible: false, stage: null, prId: null });
  const [collapsedFeedbacks, setCollapsedFeedbacks] = useState({});
  const feedbackRefs = useRef({});
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const dropdownRef = useRef(null);
  const didFetchRef = useRef(false);

  const aiModels = [
    { id: 1, ai: 'ChatGPT', model: 'gpt-4o-mini', label: 'GPT-4o-mini' },
    { id: 2, ai: 'ChatGPT', model: 'gpt-4o', label: 'GPT-4o' },
    { id: 3, ai: 'ChatGPT', model: 'o3', label: 'o3' },
    { id: 4, ai: 'ChatGPT', model: 'o4-mini', label: 'o4 Mini' },
    { id: 5, ai: 'Grok', model: 'grok', label: 'Grok' },
    { id: 6, ai: 'Grok', model: 'grok-3', label: 'Grok 3' },
    { id: 7, ai: 'Copilot', model: 'copilot-codex', label: 'Copilot Codex' },
    { id: 8, ai: 'Copilot', model: 'copilot-gpt-4', label: 'Copilot GPT-4' },
    { id: 9, ai: 'Gemini', model: 'gemini-1.5-pro', label: 'Gemini 1.5 Pro' },
    { id: 10, ai: 'Gemini', model: 'gemini-1.5-flash', label: 'Gemini 1.5 Flash' },
    { id: 11, ai: 'Gemini', model: 'gemini-2.5-pro', label: 'Gemini 2.5 Pro' },
  ];

  // Groups feedbacks by repoFullName and sorts by createdAt (or id) in descending order
  const groupByRepo = (feedbacks) => {
    const grouped = feedbacks.reduce((acc, fb) => {
      (acc[fb.repoFullName] = acc[fb.repoFullName] || []).push(fb);
      return acc;
    }, {});
    Object.keys(grouped).forEach(repo => {
      grouped[repo].sort((a, b) => {
        const aTime = a.createdAt ? new Date(a.createdAt).getTime() : a.id;
        const bTime = b.createdAt ? new Date(b.createdAt).getTime() : b.id;
        return bTime - aTime; // Descending order
      });
    });
    return Object.fromEntries(
      Object.entries(grouped).sort(([, a], [, b]) => {
        const aTime = a[0]?.createdAt ? new Date(a[0].createdAt).getTime() : a[0]?.id;
        const bTime = b[0]?.createdAt ? new Date(b[0].createdAt).getTime() : b[0]?.id;
        return bTime - aTime; // Descending order
      })
    );
  };

  // Toggles the collapse state for an individual feedback item
  const toggleCollapse = (feedbackId) => {
    setCollapsedFeedbacks(prev => ({
      ...prev,
      [feedbackId]: !prev[feedbackId],
    }));
  };

  // Load user, feedbacks, repositories, and webhook status
  useEffect(() => {
    if (didFetchRef.current) return;
    didFetchRef.current = true;

    async function load() {
      try {
        const u = await getUserInfo();
        setUser(u);
        try {
          const fbs = await getUserFeedbacks(u.username);
          setFeedbacks(fbs);
          // Initialize all feedbacks as collapsed by default
          setCollapsedFeedbacks(
            fbs.reduce((acc, fb) => ({ ...acc, [fb.id]: true }), {})
          );
        } catch (fbErr) {
          console.error('Failed to load feedbacks:', {
            message: fbErr.message,
            status: fbErr.message.match(/\d{3}/)?.[0],
            stack: fbErr.stack,
            username: u.username
          });
          setFeedbacks([]);
          setCollapsedFeedbacks({});
        }
        try {
          const userRepos = await getUserRepos(u.username);
          setRepos(['all', ...userRepos]);
        } catch (repoErr) {
          console.error('Failed to load repositories:', {
            message: repoErr.message,
            status: repoErr.message.match(/\d{3}/)?.[0],
            stack: repoErr.stack
          });
          setRepos(['all']);
        }
        try {
          const response = await fetch('/api/user/webhook-token', {
            method: 'GET',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' }
          });
          console.log('Response GET /api/user/webhook-token:', { status: response.status });
          if (response.ok) {
            const t = await response.json();
            console.log('Token received:', t);
            setToken(t.token);
            setWebhookEnabled(true);
          } else {
            setWebhookEnabled(false);
            setToken(null);
          }
        } catch (tokenErr) {
          console.error('Failed to check webhook status:', {
            message: tokenErr.message,
            status: tokenErr.message.match(/\d{3}/)?.[0],
            stack: tokenErr.stack
          });
          setWebhookEnabled(false);
          setToken(null);
        }
      } catch (e) {
        console.error('Error loading user data:', {
          message: e.message,
          status: e.message.match(/\d{3}/)?.[0],
          stack: e.stack
        });
        if (e.message.includes('401') || e.message.includes('403') || e.message.includes('Failed to fetch')) {
          setError('You are not authenticated. Please log in or sign up.');
        } else if (e.message.includes('404')) {
          setError('User data not found. Please contact support.');
        } else {
          setError('An error occurred while loading the page. Please try again later.');
        }
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // Save chat messages to localStorage
  useEffect(() => {
    localStorage.setItem('chatMessages', JSON.stringify(chatMessages));
  }, [chatMessages]);

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

    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [dropdownOpen]);

  // WebSocket for feedback stages and PR creation
  useEffect(() => {
    if (!user || error || loading || !webhookEnabled) return;

    const socket = new SockJS('/ws-feedback');
    const client = new Client({
      webSocketFactory: () => socket,
      reconnectDelay: 5000,
      debug: () => {}
    });

    client.onConnect = () => {
      const username = user.username;
      client.subscribe(`/topic/feedback/${username}`, async (msg) => {
        const body = JSON.parse(msg.body);
        if (body.stage && body.status !== 'done') {
          setStage(body.stage);
          setDone(false);
          setPopup({ visible: true, stage: body.stage, prId: null });
        } else if (body.status === 'done') {
          setStage('Done');
          setDone(true);
          setPopup({ visible: true, stage: 'Done', prId: body.prId });
          try {
            const fbs = await getUserFeedbacks(username);
            setFeedbacks(fbs);
            // Update collapsedFeedbacks, collapsing new feedbacks by default
            setCollapsedFeedbacks(prev => ({
              ...prev,
              ...fbs.reduce((acc, fb) => ({
                ...acc,
                [fb.id]: prev[fb.id] !== undefined ? prev[fb.id] : true
              }), {})
            }));
          } catch (fbErr) {
            console.error('Failed to refresh feedbacks:', fbErr);
          }
          setTimeout(() => {
            setPopup({ visible: false, stage: null, prId: null });
            setStage(null);
            setDone(false);
          }, 2000);
        }
      });
    };

    client.activate();
    return () => client.deactivate();
  }, [user, error, loading, webhookEnabled]);

  // Update feedback content heights for animation
  useEffect(() => {
    Object.keys(feedbackRefs.current).forEach(id => {
      const el = feedbackRefs.current[id];
      if (el) {
        el.style.maxHeight = collapsedFeedbacks[id]
          ? '0px'
          : `${el.scrollHeight}px`;
      }
    });
  }, [collapsedFeedbacks, feedbacks]);

  const handleWebhookToggle = async (checked) => {
    try {
      if (checked) {
        const t = await enableWebhookToken();
        setToken(t.token || t);
        setWebhookEnabled(true);
      } else {
        await disableWebhookToken();
        setToken(null);
        setWebhookEnabled(false);
        setStage(null);
        setDone(false);
        setPopup({ visible: false, stage: null, prId: null });
      }
    } catch (e) {
      console.error('Error toggling webhook:', e);
      setError(`Failed to ${checked ? 'enable' : 'disable'} webhook. Please try again.`);
      setWebhookEnabled(!checked);
    }
  };

  const handleSend = async () => {
    const text = chatInput.trim();
    if (!text || !user?.aiModel) return;
    setChatMessages(prev => [...prev, { sender: 'user', text }]);
    setChatInput('');
    const history = [...chatMessages.map(m => ({ role: m.sender === 'user' ? 'user' : 'assistant', content: m.text })), { role: 'user', content: text }];
    try {
      const aiReply = await sendChat(user.aiModel.ai, user.aiModel.model, history);
      setChatMessages(prev => [...prev, { sender: 'ai', text: aiReply }]);
    } catch (err) {
      setChatMessages(prev => [...prev, { sender: 'ai', text: '😢 Chat error.' }]);
    }
  };

  const handleLogout = async () => {
    try {
      if (webhookEnabled) {
        try {
          await disableWebhookToken();
        } catch (tokenErr) {
          console.error('Failed to disable webhook token:', tokenErr);
        }
      }
      const response = await fetch('/logout', {
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
    }
    setUser(null);
    setToken(null);
    setWebhookEnabled(false);
    setStage(null);
    setDone(false);
    setPopup({ visible: false, stage: null, prId: null });
    localStorage.clear();
    document.cookie = 'JSESSIONID=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
    navigate('/');
  };

  const handleSwitchToAdmin = () => navigate('/admin');
  const handleToggleTheme = () => setThemeOptionsOpen(!themeOptionsOpen);
  const handleThemeSelect = (selectedTheme) => {
    setTheme(selectedTheme);
    setThemeOptionsOpen(false);
  };

  const handleModelChange = async (ai, model) => {
    try {
      await fetch(`/api/user/ai?ai=${encodeURIComponent(ai)}&model=${encodeURIComponent(model)}`, { method: 'POST', credentials: 'include' });
      const updatedUser = await getUserInfo();
      setUser(updatedUser);
    } catch (e) {
      console.error('Failed to set model preference:', e);
    }
  };

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${theme === 'light' ? 'bg-white text-black' : 'bg-black text-white'}`}>
        <div className={`animate-spin rounded-full h-8 w-8 ${theme === 'light' ? 'border-t-2 border-b-2 border-blue-600' : 'border-t-2 border-b-2 border-purple-600'}`}></div>
        <span className="ml-2">Loading User Page...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${theme === 'light' ? 'bg-white text-black' : 'bg-black text-white'}`}>
        <div className={`bg-${theme === 'light' ? 'white/70' : 'bg-black/70'} border border-${theme === 'light' ? 'black/10' : 'white/10'} rounded-2xl p-6 text-${theme === 'light' ? 'black' : 'white'} text-center`}>
          <h3 className="text-lg font-semibold mb-4">Authentication Required</h3>
          <p className="mb-4">{error}</p>
          <div className="space-x-4">
            <Link to="/login" className={`px-4 py-2 ${theme === 'light' ? 'bg-blue-600 text-white hover:bg-blue-500' : 'bg-purple-600 text-white hover:bg-purple-500'} rounded-full transition no-underline`}>
              Log In
            </Link>
            <Link to="/signup" className={`px-4 py-2 ${theme === 'light' ? 'bg-blue-600 text-white hover:bg-blue-500' : 'bg-purple-600 text-white hover:bg-purple-500'} rounded-full transition no-underline`}>
              Sign Up
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const grouped = groupByRepo(feedbacks);
  const uniqueAis = [...new Set(aiModels.map(m => m.ai))];

  return (
    <div className={`relative min-h-screen ${theme === 'light' ? 'bg-white text-black' : 'bg-black text-white'} overflow-hidden font-['Gabarito'] flex flex-col`}>
      {/* Background */}
      {theme === 'dark' && (
        <div className="absolute inset-0 z-0 opacity-30">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900 animate-gradient-x"></div>
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-transparent via-black/50 to-black opacity-70"></div>
        </div>
      )}

      {/* Pop-up Notification */}
      {popup.visible && (
        <div
          className={`fixed top-5 left-50% w-64 bg-${theme === 'light' ? 'white/90' : 'black/90'} border border-${theme === 'light' ? 'black/10' : 'white/10'} rounded-lg shadow-xl p-4 z-50 animate-fade-in`}
          style={{ left: '50%', transform: 'translateX(-50%)' }}
        >
          <div className="flex items-center justify-center">
            {popup.stage !== 'Done' ? (
              <>
                <Spinner animation="border" className={`mr-2 ${theme === 'light' ? 'text-blue-400' : 'text-purple-400'}`} />
                <span className={`text-${theme === 'light' ? 'black' : 'white'}`}>{popup.stage}</span>
              </>
            ) : (
              <div className="flex items-center">
                <FaCheckCircle size={20} className={`mr-2 ${theme === 'light' ? 'text-blue-400' : 'text-purple-400'}`} />
                <span className={`text-${theme === 'light' ? 'black' : 'white'}`}>Done</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Navbar */}
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
              {user?.roles?.includes('ROLE_ADMIN') && (
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

      <main className={`relative z-40 px-6 py-6 flex-grow`}>
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1 flex flex-col gap-6">
            <div className={`relative rounded-2xl border border-${theme === 'light' ? 'black/10' : 'white/10'} ${theme === 'light' ? 'bg-white/80' : 'bg-transparent from-purple-900/60 via-indigo-900/60 to-blue-900/60'} backdrop-blur-md shadow-xl p-6 text-center`}>
              {user.avatar ? (
                <img
                  src={user.avatar}
                  alt="Avatar"
                  className="w-24 h-24 rounded-full object-cover mx-auto ring-4 ring-blue-500/40"
                />
              ) : (
                <div className={`w-24 h-24 rounded-full ${theme === 'light' ? 'bg-blue-600/80' : 'bg-purple-600/80'} flex items-center justify-center mx-auto text-3xl font-bold shadow-md ring-4 ring-${theme === 'light' ? 'blue-500/40' : 'purple-500/40'}`}>
                  {user.name[0]}
                </div>
              )}
              <h3 className="mt-4 text-2xl font-bold tracking-wide">
                Hello, {user.name}!
              </h3>
              <p className={`text-${theme === 'light' ? 'black/70' : 'white/70'} text-sm`}>{user.email}</p>
            </div>

            <div className={`relative rounded-2xl border border-${theme === 'light' ? 'black/10' : 'white/10'} ${theme === 'light' ? 'bg-white/80' : 'bg-transparent from-purple-900/60 via-indigo-900/60 to-blue-900/60'} backdrop-blur-md shadow-xl p-3 text-center`}>
              <h4 className={`text-lg font-semibold mb-2 text-${theme === 'light' ? 'black' : 'white'}`}>Current AI Model:</h4>
              <p className={`text-sm ${theme === 'light' ? 'text-black' : 'text-white'}`}>
                <strong>{user.aiModel.ai} - {user.aiModel.model}</strong>
              </p>
            </div>

            <div className={`relative rounded-2xl border border-${theme === 'light' ? 'black/10' : 'white/10'} ${theme === 'light' ? 'bg-white/80' : 'bg-transparent from-purple-900/60 via-indigo-900/60 to-blue-900/60'} backdrop-blur-md shadow-xl p-6 flex flex-col`}>
              <h4 className={`text-lg font-semibold mb-4 text-${theme === 'light' ? 'black' : 'white'} text-center`}>
                Choose Your AI Model
              </h4>
              <div className="flex flex-col gap-3">
                {uniqueAis.map(ai => (
                  <DropdownButton
                    key={ai}
                    id={`dropdown-${ai}`}
                    title={ai.charAt(0).toUpperCase() + ai.slice(1)}
                    variant="secondary"
                    className="w-full ai-dropdown"
                    onSelect={model => handleModelChange(ai, model)}
                  >
                    {aiModels
                      .filter(m => m.ai === ai)
                      .map(model => (
                        <Dropdown.Item
                          key={model.model}
                          eventKey={model.model}
                          active={user.aiModel.model === model.model}
                          className={`text-${theme === 'light' ? 'black' : 'white'}`}
                        >
                          {model.label}
                        </Dropdown.Item>
                      ))}
                  </DropdownButton>
                ))}
              </div>
            </div>
          </div>

          {/* Main content */}
          <div className="lg:col-span-3">
            <div className="flex flex-col lg:flex-row justify-between items-center mb-6 gap-4">
              <h2 className="text-2xl font-bold">Your AI Feedbacks 🧠</h2>
              <div className="flex flex-col gap-2 items-center">
                <div className="flex gap-4 items-center">
                  <Link
                    to="/create-pr"
                    className={`text-sm ${theme === 'light' ? 'text-blue-600 hover:text-blue-500' : 'text-purple-600 hover:text-purple-500'} no-underline`}
                  >
                    How to use?
                  </Link>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <Switch
                      id="webhook-switch"
                      onChange={handleWebhookToggle}
                      checked={webhookEnabled}
                      onColor={theme === 'light' ? '#2563eb' : '#7c3aed'}
                      offColor={theme === 'light' ? '#9ca3af' : '#4b5563'}
                      handleDiameter={20}
                      uncheckedIcon={false}
                      checkedIcon={false}
                      height={24}
                      width={48}
                    />
                    <span className={`ml-2 text-sm ${theme === 'light' ? 'text-black' : 'text-white'}`}>
                      {webhookEnabled ? 'Enabled' : 'Disabled'}
                    </span>
                  </label>
                </div>
                <div className={`bg-${theme === 'light' ? 'white/60' : 'black/60'} border border-${theme === 'light' ? 'black/10' : 'white/10'} rounded px-4 py-2 text-sm text-center`}>
                  {webhookEnabled ? (
                    <span>
                      Active Token: <code className={`bg-${theme === 'light' ? 'black/20' : 'black/90'} px-1.5 py-0.5 rounded`}>{token}</code>
                    </span>
                  ) : (
                    <span>Your session is disabled</span>
                  )}
                </div>
                {webhookEnabled && stage && !popup.visible && (
                  <div className={`bg-${theme === 'light' ? 'white/60' : 'black/60'} border border-${theme === 'light' ? 'black/10' : 'white/10'} rounded px-4 py-2 text-sm text-center`}>
                    <h5 className={`text-lg font-semibold ${theme === 'light' ? 'text-black' : 'text-white'}`}>{stage}</h5>
                    {!done && <Spinner animation="border" role="status" className={`my-2 ${theme === 'light' ? 'text-blue-400' : 'text-purple-400'}`} />}
                    {done && (
                      <Alert variant="success" className={`bg-${theme === 'light' ? 'white/70' : 'black/80'} border border-${theme === 'light' ? 'black/10' : 'white/10'} text-${theme === 'light' ? 'black' : 'white'} rounded p-2 flex items-center justify-center`}>
                        <FaCheckCircle size={20} className={`mr-2 ${theme === 'light' ? 'text-blue-400' : 'text-purple-400'}`} />
                        <span>Done!</span>
                      </Alert>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="mb-6">
              <DropdownButton
                id="repo-dropdown"
                title={selectedRepo === 'all' ? 'All Repositories' : selectedRepo}
                variant="secondary"
                className="ai-dropdown mb-2 text-lg"
                onSelect={(repo) => setSelectedRepo(repo)}
              >
                {repos.map(repo => (
                  <Dropdown.Item
                    key={repo}
                    eventKey={repo}
                    className={`text-${theme === 'light' ? 'black' : 'white'} text-lg`}
                  >
                    {repo === 'all' ? 'All Repositories' : repo}
                  </Dropdown.Item>
                ))}
              </DropdownButton>
              {Object.entries(grouped).length === 0 ? (
                <div className={`text-${theme === 'light' ? 'black/60' : 'white/60'}`}>
                  You haven't left any feedback yet.
                </div>
              ) : (
                Object.entries(grouped)
                  .filter(([repo]) => selectedRepo === 'all' || repo === selectedRepo)
                  .map(([repo, items]) => (
                    <div key={repo} className="mb-6">
                      <div className="space-y-4">
                        {items.map(fb => (
                          <div key={fb.id} className={`bg-${theme === 'light' ? 'white/60' : 'black/60'} border border-${theme === 'light' ? 'black/10' : 'white/10'} rounded-2xl p-4`}>
                            <div className="flex items-center justify-between">
                              <h5 className={`font-semibold ${theme === 'light' ? 'text-blue-400' : 'text-purple-400'} mb-2 truncate`}>
                                Pull Request #{fb.prId} – {fb.model}
                              </h5>
                              <button
                                onClick={() => toggleCollapse(fb.id)}
                                className={`p-2 ${theme === 'light' ? 'text-blue-600 hover:text-blue-500' : 'text-purple-600 hover:text-purple-500'}`}
                                aria-label={`Toggle feedback for PR ${fb.prId}`}
                                aria-expanded={!collapsedFeedbacks[fb.id]}
                              >
                                {collapsedFeedbacks[fb.id] ? <FaChevronDown /> : <FaChevronUp />}
                              </button>
                            </div>
                            <div
                              ref={el => (feedbackRefs.current[fb.id] = el)}
                              className={`overflow-hidden transition-all duration-300 ease-in-out`}
                              style={{ maxHeight: collapsedFeedbacks[fb.id] ? '0px' : feedbackRefs.current[fb.id]?.scrollHeight || 'auto' }}
                            >
                              <ReactMarkdown
                                remarkPlugins={[remarkGfm]}
                                components={{ p: ({ node, ...props }) => <p className={`text-${theme === 'light' ? 'black/90' : 'white/90'}`} {...props} /> }}
                              >
                                {fb.comment}
                              </ReactMarkdown>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
              )}
            </div>
          </div>
        </div>
      </main>

      <button
        className={`fixed bottom-5 right-5 w-14 h-14 rounded-full ${theme === 'light' ? 'bg-blue-600' : 'bg-purple-600'} flex items-center justify-center shadow-lg z-50`}
        onClick={() => setChatOpen(!chatOpen)}
        title="Chat with AI"
      >
        <FaRobot size={24} className="text-white" />
      </button>

      {chatOpen && (
        <div className={`fixed bottom-24 right-5 w-80 h-96 ${theme === 'light' ? 'bg-white text-black' : 'bg-gray-900 text-white'} rounded-xl shadow-2xl z-50 flex flex-col overflow-hidden`}>
          <div className={`bg-${theme === 'light' ? 'bg-blue-600' : 'bg-purple-600'} text-white px-4 py-2 flex justify-between items-center`}>
            <span>AI Assistant</span>
            <button onClick={() => setChatOpen(false)}>✕</button>
          </div>
          <div className={`flex-1 overflow-y-auto p-4 space-y-2 ${theme === 'light' ? 'bg-gray-100' : 'bg-gray-800'}`}>
            {chatMessages.map((m, i) => (
              <div key={i} className={`rounded-lg px-3 py-2 ${m.sender === 'user' ? (theme === 'light' ? 'bg-blue-100 text-right' : 'bg-blue-700 text-right') : (theme === 'light' ? 'bg-white' : 'bg-gray-700')}`}>
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{ p: ({ node, ...props }) => <p className={theme === 'light' ? 'text-black' : 'text-white'} {...props} /> }}
                >
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
            <button onClick={handleSend} className={`px-3 ${theme === 'light' ? 'bg-blue-600 text-white' : 'bg-purple-600 text-white'} rounded`}>Send</button>
          </div>
        </div>
      )}

      <footer className={`relative z-40 ${theme === 'light' ? 'bg-white/70' : 'bg-black/70'} backdrop-blur-lg border-t border-${theme === 'light' ? 'black/10' : 'white/10'} py-6 sm:py-8`}>
        <div className="container mx-auto px-4 sm:px-8 grid grid-cols-1 sm:grid-cols-3 gap-4 justify-center text-center">
          <div>
            <h5 className={`text-xl sm:text-2xl font-bold mb-4 sm:mb-6 ${theme === 'light' ? 'text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-blue-600' : 'text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-500'}`}>
              Code Review Hub
            </h5>
            <p className={`text-sm sm:text-base ${theme === 'light' ? 'text-black/80' : 'text-white/80'}`}>
              Empowering developers through collaboration and code review.
            </p>
          </div>
          <div className="sm:col-start-3">
            <h5 className={`text-lg sm:text-xl font-bold mb-4 sm:mb-6 ${theme === 'light' ? 'text-black' : 'text-white'}`}>Connect</h5>
            <div className="flex justify-center space-x-4 sm:space-x-6">
              {['Twitter', 'GitHub', 'LinkedIn'].map((platform, idx) => (
                <a key={idx} href="#" className={`${theme === 'light' ? 'text-black/60 hover:text-black' : 'text-white/60 hover:text-white'} transition-colors text-sm sm:text-base`}>
                  {platform}
                </a>
              ))}
            </div>
          </div>
        </div>
        <div className={`text-center mt-4 sm:mt-6 ${theme === 'light' ? 'text-black/50' : 'text-white/50'} text-xs sm:text-sm`}>
          © {new Date().getFullYear()} Code Review Hub. All rights reserved.
        </div>
      </footer>

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
        @keyframes fade-in {
          0% { opacity: 0; margin-top: -10px; }
          100% { opacity: 1; margin-top: 0; }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
          will-change: opacity, margin-top; /* Optimize animation performance */
        }
        .ai-dropdown .btn {
          background-color: transparent;
          border-color: ${theme === 'light' ? 'rgba(0, 0, 0, 0.2)' : 'rgba(255, 255, 255, 0.2)'};
          color: ${theme === 'light' ? 'black' : 'white'};
          padding: 0.25rem 0.5rem;
          font-size: 1.125rem;
          line-height: 1.5rem;
          height: 2rem;
        }
        .ai-dropdown .btn:hover {
          background-color: ${theme === 'light' ? 'rgba(0, 0, 0, 0.1)' : 'rgba(255, 255, 255, 0.1)'};
        }
        .ai-dropdown .dropdown-menu {
          background-color: ${theme === 'light' ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.8)'};
          border: 1px solid ${theme === 'light' ? 'rgba(0, 0, 0, 0.1)' : 'rgba(255, 255, 255, 0.1)'};
          font-size: 1.125rem;
        }
        .ai-dropdown .dropdown-item {
          color: ${theme === 'light' ? 'black' : 'white'};
          padding: 0.25rem 0.5rem;
        }
        .ai-dropdown .dropdown-item:hover {
          background-color: ${theme === 'light' ? 'rgba(59, 130, 246, 0.5)' : 'rgba(147, 51, 234, 0.5)'};
        }
        .ai-dropdown .dropdown-item.active {
          background-color: ${theme === 'light' ? 'rgba(59, 130, 246, 0.7)' : 'rgba(147, 51, 234, 0.7)'};
        }
      `}</style>
    </div>
  );
}