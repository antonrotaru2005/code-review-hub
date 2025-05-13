import React, { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { getUserInfo, getUserFeedbacks } from '../api/user';
import { sendChat } from '../api/chat';
import { Link, useNavigate } from 'react-router-dom';
import { FaRobot, FaCaretDown, FaSun, FaMoon } from 'react-icons/fa';
export default function UserPage() {
  const [user, setUser] = useState(null);
  const [feedbacks, setFeedbacks] = useState([]);
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
  const [dropdownOpen, setDropdownOpen] = useState(false); // New state for dropdown
  const navigate = useNavigate();
  const [themeOptionsOpen, setThemeOptionsOpen] = useState(false);
  const [theme, setTheme] = useState('dark');

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

  const groupByRepo = (feedbacks) => {
    return feedbacks.reduce((acc, fb) => {
      (acc[fb.repoFullName] = acc[fb.repoFullName] || []).push(fb);
      return acc;
    }, {});
  };

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

  useEffect(() => {
    document.body.className = theme === 'light' ? 'bg-white text-black' : 'bg-black text-white';
    window.localStorage.setItem('chatMessages', JSON.stringify(chatMessages));
  }, [chatMessages]);

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
      setChatMessages(prev => [...prev, { sender: 'ai', text: '😢 Eroare la chat.' }]);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/logout', { method: 'POST', credentials: 'include' });
    } catch {}
    finally {
      setUser(null);
      localStorage.removeItem('chatMessages');
      navigate('/');
    }
  };

  const handleSwitchToAdmin = () => navigate('/admin');
  const handleToggleTheme = () => setThemeOptionsOpen(!themeOptionsOpen);
  const handleThemeSelect = (selectedTheme) => {
  setTheme(selectedTheme);
  setThemeOptionsOpen(false);
  document.body.className = selectedTheme === 'light' ? 'bg-white text-black' : 'bg-black text-white';
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

  if (loading) return <div className="min-h-screen flex items-center justify-center text-white text-xl">Loading...</div>;
  if (error) return <div className="min-h-screen flex items-center justify-center text-white text-xl">{error}</div>;

  const grouped = groupByRepo(feedbacks);
  const uniqueAis = [...new Set(aiModels.map(m => m.ai))];

return (
  <div className="relative min-h-screen bg-black text-white overflow-hidden font-['Gabarito']">
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
          <div
            className="flex items-center gap-3 cursor-pointer"
            onClick={() => setDropdownOpen(!dropdownOpen)}
          >
            {user?.avatar ? (
              <img src={user.avatar} alt="Avatar" className="w-10 h-10 rounded-full object-cover" />
            ) : (
              <div className="w-10 h-10 bg-purple-600 text-white rounded-full flex items-center justify-center text-lg">
                {user.name[0]}
              </div>
            )}
            <FaCaretDown className="text-white" />
          </div>
          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-black/80 border border-white/10 rounded-lg shadow-lg z-50">
              <button
                onClick={handleSwitchToAdmin}
                className="w-full text-left px-4 py-2 text-white hover:bg-purple-600 rounded-t-lg"
              >
                Switch to Admin
              </button>
              <button
                onClick={() => setThemeOptionsOpen(!themeOptionsOpen)} // Updated to toggle theme options
                className="w-full text-left px-4 py-2 text-white hover:bg-purple-600"
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
                onClick={handleLogout}
                className="w-full text-left px-4 py-2 text-white hover:bg-purple-600 rounded-b-lg"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </nav>

    {/* Content */}
    <main className="relative z-40 px-6 py-6 grid grid-cols-1 md:grid-cols-4 gap-6">
      {/* Sidebar */}
      <div className="md:col-span-1 space-y-6">
        <div className="bg-black/70 border border-white/10 rounded-2xl p-4 text-center">
          {user.avatar ? (
            <img src={user.avatar} alt="Avatar" className="w-24 h-24 rounded-full object-cover mx-auto" />
          ) : (
            <div className="w-24 h-24 rounded-full bg-purple-600 flex items-center justify-center mx-auto text-3xl">
              {user.name[0]}
            </div>
          )}
          <h3 className="mt-4 text-xl font-semibold">Hello, {user.name}!</h3>
          <p className="text-white/70 text-sm">{user.email}</p>
        </div>

        <div className="bg-black/70 border border-white/10 rounded-2xl p-4">
          <h4 className="text-lg font-semibold mb-2">Choose Your AI Model</h4>
          {uniqueAis.map(ai => (
            <div key={ai} className="mb-3">
              <label className="block mb-1 text-white/80">{ai}</label>
              <select
                className="w-full bg-black/80 text-white border border-white/20 rounded px-3 py-2"
                onChange={e => handleModelChange(ai, e.target.value)}
                value={aiModels.find(m => m.ai === ai && m.model === user.aiModel.model)?.model || ''}
              >
                {aiModels.filter(m => m.ai === ai).map(model => (
                  <option key={model.model} value={model.model}>{model.label}</option>
                ))}
              </select>
            </div>
          ))}
        </div>
      </div>

      {/* Main content */}
      <div className="md:col-span-3">
        <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
          <h2 className="text-2xl font-bold">Your AI Feedbacks 🧠</h2>
          <div className="flex gap-4 items-center">
            <Link to="/create-pr" className="px-4 py-2 bg-purple-600 rounded-full hover:bg-purple-500 transition text-white font-medium">
              Create PR
            </Link>
            <div className="bg-black/60 border border-white/10 rounded px-4 py-2 text-sm">
              Current Model: <strong>{user.aiModel.ai} - {user.aiModel.model}</strong>
            </div>
          </div>
        </div>

        {Object.entries(grouped).length === 0 ? (
          <div className="text-white/60">You haven't left any feedback yet.</div>
        ) : (
          Object.entries(grouped).map(([repo, items]) => (
            <div key={repo} className="mb-6">
              <h4 className="text-white/70 text-lg mb-2">{repo}</h4>
              <div className="space-y-4">
                {items.map(fb => (
                  <div key={fb.id} className="bg-black/60 border border-white/10 rounded-2xl p-4">
                    <h5 className="font-semibold text-purple-400 mb-2">Pull Request #{fb.prId} – {user.aiModel.model}</h5>
                    <ReactMarkdown remarkPlugins={[remarkGfm]} className="text-white/90">
                      {fb.comment}
                    </ReactMarkdown>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </main>

    {/* Floating AI Chat Button */}
    <button
      className="fixed bottom-5 right-5 w-14 h-14 rounded-full bg-purple-600 text-white text-xl flex items-center justify-center shadow-lg z-50"
      onClick={() => setChatOpen(!chatOpen)}
      title="Chat with AI"
    >
      <FaRobot size={24} />
    </button>

    {/* Chat window */}
    {chatOpen && (
      <div className="fixed bottom-24 right-5 w-80 h-96 bg-white text-black rounded-xl shadow-2xl z-50 flex flex-col overflow-hidden">
        <div className="bg-purple-600 text-white px-4 py-2 flex justify-between items-center">
          <span>AI Assistant</span>
          <button onClick={() => setChatOpen(false)}>✕</button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-gray-100">
          {chatMessages.map((m, i) => (
            <div key={i} className={`rounded-lg px-3 py-2 ${m.sender === 'user' ? 'bg-blue-100 text-right' : 'bg-white'}`}>
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{m.text}</ReactMarkdown>
            </div>
          ))}
        </div>
        <div className="border-t p-2 flex gap-2">
          <input
            type="text"
            className="flex-1 border border-gray-300 rounded px-2 py-1"
            placeholder="Type a message..."
            value={chatInput}
            onChange={e => setChatInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSend()}
          />
          <button onClick={handleSend} className="px-3 bg-purple-600 text-white rounded">Send</button>
        </div>
      </div>
    )}

    {/* Footer */}
    <footer className="relative z-40 bg-black/70 backdrop-blur-lg border-t border-white/10 py-12 sm:py-16">
      <div className="container mx-auto px-4 sm:px-8 grid grid-cols-1 sm:grid-cols-3 gap-4 justify-center text-center">
        <div>
          <h5 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-500">
            Code Review Hub
          </h5>
          <p className="text-sm sm:text-base text-white/80">
            Empowering developers through collaboration and code review.
          </p>
        </div>
        <div className="sm:col-start-3">
          <h5 className="text-lg sm:text-xl font-bold mb-4 sm:mb-6 text-white">Connect</h5>
          <div className="flex justify-center space-x-4 sm:space-x-6">
            {['Twitter', 'GitHub', 'LinkedIn'].map((platform, idx) => (
              <a key={idx} href="#" className="text-white/60 hover:text-white transition-colors text-sm sm:text-base">
                {platform}
              </a>
            ))}
          </div>
        </div>
      </div>
      <div className="text-center mt-8 sm:mt-12 text-white/50 text-xs sm:text-sm">
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

      a {
        text-decoration: none;
      }
    `}</style>
  </div>
);
}