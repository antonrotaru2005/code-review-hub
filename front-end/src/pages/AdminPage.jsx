import React, { useEffect, useState, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { sendChat } from '../api/chat';
import { getUserInfo } from '../api/user';
import { getAdminUsers, getAdminTeams, getTeamMembers, getAdminFeedbacksByUser, getUserStats, deleteMemberFeedback } from '../api/admin';
import { Link, useNavigate } from 'react-router-dom';
import { FaRobot, FaSun, FaMoon, FaCaretDown, FaChevronDown, FaChevronUp } from 'react-icons/fa';
import { useTheme } from '../contexts/ThemeContext';
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, Title, Tooltip, Legend, ArcElement } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, Title, Tooltip, Legend, ArcElement);

// Plugin to display text in the center of Doughnut charts
const centerTextPlugin = {
  id: 'centerText',
  beforeDraw(chart) {
    const { ctx, chartArea } = chart;
    if (!chart.options.plugins.centerText || !chart.options.plugins.centerText.text) return;

    ctx.save();
    const text = chart.options.plugins.centerText.text;
    const fontSize = chart.options.plugins.centerText.fontSize || 18;
    ctx.font = `bold ${fontSize}px Gabarito, sans-serif`;
    ctx.fillStyle = chart.options.plugins.centerText.color;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const centerX = (chartArea.left + chartArea.right) / 2;
    const centerY = (chartArea.top + chartArea.bottom) / 2;
    ctx.fillText(text, centerX, centerY);
    ctx.restore();
  },
};

ChartJS.register(centerTextPlugin);

export default function AdminPage() {
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [teams, setTeams] = useState([]);
  const [user, setUser] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [stats, setStats] = useState(null);
  const [latestFeedback, setLatestFeedback] = useState(null);
  const [loadingStats, setLoadingStats] = useState(false);
  const [error, setError] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [viewMode, setViewMode] = useState('teams');
  const [expandedTeams, setExpandedTeams] = useState({});
  const [teamMembers, setTeamMembers] = useState({});
  const [chatMessages, setChatMessages] = useState(() => {
    try {
      const saved = localStorage.getItem('chatMessages');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });
  const [chatInput, setChatInput] = useState('');
  const [themeOptionsOpen, setThemeOptionsOpen] = useState(false);
  const [collapsedFeedback, setCollapsedFeedback] = useState(true);
  const feedbackRef = useRef(null);
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const dropdownRef = useRef(null);

  const isSuperAdmin = user?.roles?.includes('ROLE_ADMIN');

  const handleThemeSelect = (selectedTheme) => {
    setTheme(selectedTheme);
    setThemeOptionsOpen(false);
  };

  const handleSwitchToUser = () => navigate('/user');
  const handleToggleTheme = () => setThemeOptionsOpen(!themeOptionsOpen);

  const toggleCollapse = () => {
    setCollapsedFeedback((prev) => !prev);
  };

  const toggleTeamExpand = async (teamId) => {
    setExpandedTeams((prev) => ({
      ...prev,
      [teamId]: !prev[teamId],
    }));

    if (!teamMembers[teamId]) {
      try {
        const members = await getTeamMembers(teamId);
        setTeamMembers((prev) => ({
          ...prev,
          [teamId]: members,
        }));
      } catch (e) {
        setError('Failed to fetch team members.');
      }
    }
  };

  useEffect(() => {
    async function initAdmin() {
      try {
        const adminUser = await getUserInfo();        
        if (!adminUser) {
          throw new Error('You are not logged in. Please log in or sign up to access this page.');
        }
        if (!adminUser.roles?.includes('ROLE_ADMIN') && !adminUser.roles?.includes('ROLE_TEAM_ADMIN')) {
          throw new Error('You do not have sufficient privileges to access the Admin Panel.');
        }
        setUser(adminUser);

        if (adminUser.roles?.includes('ROLE_ADMIN')) {
          const [userList, teamList] = await Promise.all([
            getAdminUsers(),
            getAdminTeams(),
          ]);
          setUsers(userList);
          setTeams(teamList);
        } else if (adminUser.roles?.includes('ROLE_TEAM_ADMIN')) {
          setViewMode('teams');
          const teamList = await getAdminTeams();
          setTeams(teamList);
        }
      } catch (e) {
        console.error('Fetch failed:', e);
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
        setThemeOptionsOpen(false);
      }
    };

    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [dropdownOpen]);

  useEffect(() => {
    if (feedbackRef.current) {
      feedbackRef.current.style.maxHeight = collapsedFeedback ? '0px' : `${feedbackRef.current.scrollHeight}px`;
    }
  }, [collapsedFeedback, latestFeedback]);

  const handleSend = async () => {
    const text = chatInput.trim();
    if (!text) return;

    setChatMessages((prev) => [...prev, { sender: 'user', text }]);
    setChatInput('');
    const history = [...chatMessages.map((msg) => ({
      role: msg.sender === 'user' ? 'user' : 'assistant',
      content: msg.text,
    })), { role: 'user', content: text }];

    try {
      const aiModel = user?.aiModel;
      if (!aiModel) throw new Error('No AI model available');
      const aiResponse = await sendChat(aiModel.ai, aiModel.model, history);
      setChatMessages((prev) => [...prev, { sender: 'ai', text: aiResponse }]);
    } catch (err) {
      setChatMessages((prev) => [...prev, { sender: 'ai', text: '😢 Error in chat.' }]);
    }
  };

  const handleClearChat = () => {
    setChatMessages([]);
    localStorage.removeItem('chatMessages');
  };

  const handleUserSelect = async (user, teamId = null) => {
    setSelectedUser(user);
    setStats(null);
    setLatestFeedback(null);
    setCollapsedFeedback(true);
    setLoadingStats(true);

    try {
      const feedbacks = await getAdminFeedbacksByUser(user.username);
      setLatestFeedback(feedbacks.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0] || null);

      const userStats = await getUserStats(teamId, user.username);
      setStats(userStats);
    } catch (err) {
      console.error('Error fetching user data:', err);
      setError(`Failed to fetch user stats or feedback: ${err.message}`);
    } finally {
      setLoadingStats(false);
    }
  };

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
      document.cookie = 'JSESSIONID=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
      navigate('/');
    }
  };

  // Chart configurations
  const baseChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      title: { display: true, font: { size: 16, family: 'Gabarito' }, padding: 12 },
      tooltip: { enabled: true, bodyFont: { size: 14 } },
    },
  };

  const distinctReposChart = stats
    ? {
        labels: Array.from({ length: stats.distinctRepoCount }, (_, i) => `Repo ${i + 1}`),
        datasets: [
          {
            data: Array.from({ length: stats.distinctRepoCount }, () => 1),
            backgroundColor: [
              theme === 'light' ? 'rgba(34, 97, 197, 0.7)' : 'rgba(168, 85, 247, 0.7)',
              theme === 'light' ? 'rgba(239, 68, 68, 0.7)' : 'rgba(236, 72, 153, 0.7)',
              theme === 'light' ? 'rgba(59, 130, 246, 0.7)' : 'rgba(99, 102, 241, 0.7)',
              theme === 'light' ? 'rgba(249, 115, 22, 0.7)' : 'rgba(250, 204, 21, 0.7)',
              theme === 'light' ? 'rgba(147, 51, 234, 0.7)' : 'rgba(34, 197, 94, 0.7)',
            ].slice(0, stats.distinctRepoCount),
            borderColor: [
              theme === 'light' ? 'rgb(230, 230, 230)' : 'rgba(168, 85, 247, 1)',
              theme === 'light' ? 'rgba(239, 68, 68, 1)' : 'rgba(236, 72, 153, 1)',
              theme === 'light' ? 'rgba(59, 130, 246, 1)' : 'rgba(99, 102, 241, 1)',
              theme === 'light' ? 'rgba(249, 115, 22, 1)' : 'rgba(250, 204, 21, 1)',
              theme === 'light' ? 'rgba(147, 51, 234, 1)' : 'rgba(34, 197, 94, 1)',
            ].slice(0, stats.distinctRepoCount),
            borderWidth: 2,
            hoverOffset: 20,
          },
        ],
      }
    : null;

  const distinctReposOptions = {
    ...baseChartOptions,
    plugins: {
      ...baseChartOptions.plugins,
      title: { display: true, text: 'Distinct Repos' },
      centerText: {
        text: stats ? `${stats.distinctRepoCount}` : '',
        fontSize: 24,
        color: theme === 'light' ? 'rgba(0, 0, 0, 0.9)' : 'rgba(255, 255, 255, 0.9)',
      },
    },
  };

  const avgRateChart = stats
    ? {
        labels: ['Rate', 'Remaining'],
        datasets: [
          {
            data: [stats.avgRate, 100 - stats.avgRate],
            backgroundColor: [
              theme === 'light' ? 'rgba(59, 130, 246, 0.7)' : 'rgba(168, 85, 247, 0.7)',
              theme === 'light' ? 'rgba(229, 231, 235, 0.4)' : 'rgba(55, 65, 81, 0.4)',
            ],
            borderColor: [
              theme === 'light' ? 'rgba(59, 130, 246, 1)' : 'rgba(168, 85, 247, 1)',
              theme === 'light' ? 'rgba(229, 231, 235, 1)' : 'rgba(55, 65, 81, 1)',
            ],
            borderWidth: 2,
            circumference: 180,
            rotation: 270,
            hoverOffset: 20,
          },
        ],
      }
    : null;

  const avgRateOptions = {
    ...baseChartOptions,
    plugins: {
      ...baseChartOptions.plugins,
      title: { display: true, text: 'Avg Rate (%)' },
    },
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
        <div className={`relative z-10 ${theme === 'light' ? 'bg-white/80' : 'bg-black/80'} border border-${theme === 'light' ? 'black/10' : 'white/10'} rounded-2xl p-6 text-center`}>
          <h3 className={`text-lg font-semibold mb-4 ${theme === 'light' ? 'text-black' : 'text-white'}`}>Authentication Required</h3>
          <p className={`mb-4 ${theme === 'light' ? 'text-black' : 'text-white'}`}>{error}</p>
          {error.includes('You are not logged in') ? (
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
      <nav className="relative z-50 px-6 py-4 flex justify-between items-center">
        <Link to="/" className={`text-2xl font-bold ${theme === 'light' ? 'text-black' : 'text-white'} tracking-wider hover:underline`}>
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
                {user?.name?.[0] || 'U'}
              </div>
            )}
            <FaCaretDown className={theme === 'light' ? 'text-black' : 'text-white'} />
          </div>
          {dropdownOpen && (
            <div className={`absolute right-0 mt-2 w-48 ${theme === 'light' ? 'bg-white/80' : 'bg-black/80'} border border-${theme === 'light' ? 'black/10' : 'white/10'} rounded-lg shadow-lg z-50`}>
              {(isSuperAdmin || user?.roles?.includes('ROLE_TEAM_ADMIN')) && (
                <button
                  onClick={() => {
                    handleSwitchToUser();
                    setDropdownOpen(false);
                  }}
                  className={`w-full text-left px-4 py-2 ${theme === 'light' ? 'text-black hover:bg-blue-200' : 'text-white hover:bg-purple-600'} rounded-t-lg`}
                >
                  Switch to User
                </button>
              )}
              <button
                onClick={handleToggleTheme}
                className={`w-full text-left px-4 py-2 ${theme === 'light' ? 'text-black hover:bg-blue-200' : 'text-white hover:bg-purple-600'}`}
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
                  <label className="flex items-center cursor-pointer mt-2">
                    <input
                      type="radio"
                      name="theme"
                      checked={theme === 'dark'}
                      onChange={() => handleThemeSelect('dark')}
                      className="mr-2"
                    />
                    <FaMoon className="mr-2 text-blue-600" />
                    Dark
                  </label>
                </div>
              )}
              <button
                onClick={() => {
                  handleLogout();
                  setDropdownOpen(false);
                }}
                className={`w-full text-left px-4 py-2 ${theme === 'light' ? 'text-black hover:bg-blue-200' : 'text-white hover:bg-purple-600'} rounded-b-lg`}
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </nav>

      {/* Main Content */}
      <main className="relative z-40 px-6 py-6 flex-grow">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="md:col-span-1 space-y-8">
            <div className={`bg-${theme === 'light' ? 'white/80' : 'transparent'} border border-${theme === 'light' ? 'black/10' : 'white/10'} rounded-3xl p-4 md:p-6 shadow-xl transition-all duration-300 hover:shadow-2xl`}>
              {isSuperAdmin && (
                <div className="mb-4 flex flex-col md:flex-row gap-2 sidebar-buttons-container">
                  <button
                    className={`px-4 py-2 rounded-full text-base ${viewMode === 'users' ? (theme === 'light' ? 'bg-blue-600 text-white' : 'bg-purple-600 text-white') : (theme === 'light' ? 'bg-gray-200' : 'bg-gray-700')} flex-1`}
                    onClick={() => setViewMode('users')}
                  >
                    All Users
                  </button>
                  <button
                    className={`px-4 py-2 rounded-full text-base ${viewMode === 'teams' ? (theme === 'light' ? 'bg-blue-600 text-white' : 'bg-purple-600 text-white') : (theme === 'light' ? 'bg-gray-200' : 'bg-gray-700')} flex-1`}
                    onClick={() => setViewMode('teams')}
                  >
                    All Teams
                  </button>
                </div>
              )}
              <h5 className={`mb-4 text-lg md:text-xl font-semibold ${theme === 'light' ? 'text-black' : 'text-white'} sidebar-title`}>{viewMode === 'users' ? 'All Users' : 'All Teams'}</h5>
              <div className="space-y-3">
                {viewMode === 'users' ? (
                  users.map((u) => (
                    <div
                      key={u.username}
                      className={`p-3 rounded-xl cursor-pointer flex items-center ${selectedUser?.username === u.username ? (theme === 'light' ? 'bg-blue-100/50' : 'bg-purple-600/30') : (theme === 'light' ? 'hover:bg-blue-100/40' : 'hover:bg-black/40')} transition-all duration-200 sidebar-user-item`}
                      onClick={() => handleUserSelect(u)}
                    >
                      {u.avatar ? (
                        <img
                          src={u.avatar}
                          alt="Avatar"
                          className="w-8 md:w-10 h-8 md:h-10 rounded-full object-cover mr-3"
                        />
                      ) : (
                        <div className={`w-8 md:w-10 h-8 md:h-10 bg-${theme === 'light' ? 'blue-600' : 'purple-600'} text-white rounded-full flex items-center justify-center mr-3 text-sm md:text-lg`}>
                          {(u.name || u.username)?.[0]?.toUpperCase() || 'U'}
                        </div>
                      )}
                      <span className={`text-base md:text-lg ${theme === 'light' ? 'text-black' : 'text-white'}`}>{u.name || u.username}</span>
                    </div>
                  ))
                ) : (
                  teams.map((team) => (
                    <div key={team.id}>
                      <div
                        className={`p-3 rounded-xl cursor-pointer flex items-center justify-between ${theme === 'light' ? 'hover:bg-blue-100/40' : 'hover:bg-black/40'} transition-all duration-200 sidebar-team-item`}
                        onClick={() => toggleTeamExpand(team.id)}
                      >
                        <span className={`text-base md:text-lg font-semibold ${theme === 'light' ? 'text-black' : 'text-white'}`}>
                          ID: {team.id} | {team.name}
                        </span>
                        {expandedTeams[team.id] ? (
                          <FaChevronUp className={theme === 'light' ? 'text-black' : 'text-white'} />
                        ) : (
                          <FaChevronDown className={theme === 'light' ? 'text-black' : 'text-white'} />
                        )}
                      </div>
                      {expandedTeams[team.id] && teamMembers[team.id] && (
                        <div className="ml-4 md:ml-6 mt-2 space-y-2">
                          {teamMembers[team.id].map((u) => (
                            <div
                              key={u.username}
                              className={`p-2 rounded-xl cursor-pointer flex items-center ${selectedUser?.username === u.username ? (theme === 'light' ? 'bg-blue-100/50' : 'bg-purple-600/30') : (theme === 'light' ? 'hover:bg-blue-100/40' : 'hover:bg-black/40')} transition-all duration-200 sidebar-team-member-item`}
                              onClick={() => handleUserSelect(u, team.id)}
                            >
                              {u.avatar ? (
                                <img
                                  src={u.avatar}
                                  alt="Avatar"
                                  className="w-6 md:w-8 h-6 md:h-8 rounded-full object-cover mr-2"
                                />
                              ) : (
                                <div className={`w-6 md:w-8 h-6 md:h-8 bg-${theme === 'light' ? 'blue-600' : 'purple-600'} text-white rounded-full flex items-center justify-center mr-2 text-xs md:text-sm`}>
                                  {(u.name || u.username)?.[0]?.toUpperCase() || 'U'}
                                </div>
                              )}
                              <span className={`text-sm md:text-base ${theme === 'light' ? 'text-black' : 'text-white'}`}>{u.name || u.username}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Main Panel */}
          <div className="md:col-span-3">
            {!selectedUser ? (
              <div className={`text-center ${theme === 'light' ? 'text-black/60' : 'text-white/60'} mt-12 text-lg md:text-xl`}>
                Select a user to view their statistics and latest feedback.
              </div>
            ) : (
              <div>
                <div className={`bg-${theme === 'light' ? 'white/80' : 'transparent'} border border-${theme === 'light' ? 'black/10' : 'white/10'} rounded-3xl p-6 mb-8 flex items-center shadow-xl transition-all duration-300 hover:shadow-2xl user-info-card`}>
                  {selectedUser.avatar ? (
                    <img
                      src={selectedUser.avatar}
                      alt="Avatar"
                      className="w-24 h-24 rounded-full object-cover mr-5 user-avatar"
                    />
                  ) : (
                    <div className={`w-24 h-24 bg-${theme === 'light' ? 'bg-blue-600' : 'bg-purple-600'} text-white rounded-full flex items-center justify-center mr-5 text-2xl user-avatar`}>
                      {(selectedUser.name || selectedUser.username)?.[0]?.toUpperCase() || 'U'}
                    </div>
                  )}
                  <div>
                    <h5 className={`mb-2 text-2xl font-semibold ${theme === 'light' ? 'text-black' : 'text-white'}`}>{selectedUser.name || selectedUser.username}</h5>
                    <p className={`text-lg font-medium ${theme === 'light' ? 'text-black/70' : 'text-white/70'}`}>@{selectedUser.username} • {selectedUser.email}</p>
                    {selectedUser.teamNames?.length > 0 && (
                      <p className={`text-base font-medium ${theme === 'light' ? 'text-black/70' : 'text-white/70'} mt-1`}>Teams: {selectedUser.teamNames.join(', ')}</p>
                    )}
                  </div>
                </div>

                {loadingStats ? (
                  <div className="flex justify-center">
                    <div className={`animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 ${theme === 'light' ? 'border-blue-600' : 'border-purple-600'}`}></div>
                  </div>
                ) : (
                  <div>
                    <h5 className={`mb-4 text-2xl font-semibold ${theme === 'light' ? 'text-black' : 'text-white'}`}>Latest Feedback</h5>
                    {latestFeedback ? (
                      <div className={`bg-${theme === 'light' ? 'white/80' : 'transparent'} border border-${theme === 'light' ? 'black/10' : 'white/10'} rounded-3xl p-6 mb-8 shadow-xl transition-all duration-300 hover:shadow-2xl latest-feedback-card`}>
                   <div className="flex flex-col sm:flex-row sm:justify-between feedback-actions">
                    <div className="flex justify-between items-center w-full">
                      <div className="feedback-header-container flex flex-col">
                        <span className={`desktop-title font-semibold ${theme === 'light' ? 'text-blue-500' : 'text-purple-400'} feedback-title truncate`}>
                          Pull Request #{latestFeedback.prId} – {latestFeedback.repoFullName}
                        </span>
                        <div className="mobile-title-container flex flex-col items-start">
                          <span className={`mobile-title font-semibold ${theme === 'light' ? 'text-blue-500' : 'text-purple-400'} truncate`}>
                            PR #{latestFeedback.prId}
                          </span>
                          <span className={`mobile-repo text-sm ${theme === 'light' ? 'text-blue-500' : 'text-purple-400'} truncate`}>
                            {latestFeedback.repoFullName}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={toggleCollapse}
                        className={`p-2 ${theme === 'light' ? 'text-blue-600 hover:text-blue-500' : 'text-purple-600 hover:text-purple-500'}`}
                        aria-label={`Toggle feedback for PR ${latestFeedback.prId}`}
                        aria-expanded={!collapsedFeedback}
                      >
                        {collapsedFeedback ? <FaChevronDown size={20} /> : <FaChevronUp size={20} />}
                      </button>
                    </div>
                    <div className="mt-2 sm:mt-0 sm:flex sm:justify-end">
                      <button
                        className={`px-4 py-1.5 bg-red-600 text-white rounded-full hover:bg-red-500 transition text-base font-medium max-[576px]:px-3 max-[576px]:py-1 max-[576px]:text-sm feedback-delete-btn`}
                        onClick={() => deleteMemberFeedback(latestFeedback.teamId || null, selectedUser.username, latestFeedback.id).then(() => handleUserSelect(selectedUser, latestFeedback.teamId || null))}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                        <div
                          className="transition-all duration-300 overflow-hidden"
                          ref={feedbackRef}
                        >
                          <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            components={{
                              p: ({ className, ...props }) => (
                                <p className={`text-sm sm:text-lg ${theme === 'light' ? 'text-black/90' : 'text-white/90'} mb-2 ${className || ''}`} {...props} />
                              ),
                            }}
                          >
                            {latestFeedback.comment}
                          </ReactMarkdown>
                        </div>
                      </div>
                    ) : (
                      <div className={`bg-${theme === 'light' ? 'white/80' : 'transparent'} border border-${theme === 'light' ? 'black/10' : 'white/10'} rounded-3xl p-6 mb-8 ${theme === 'light' ? 'text-black/60' : 'text-white/60'} text-lg shadow-xl transition-all duration-300 hover:shadow-xl`}>
                        No feedback available for this user.
                      </div>
                    )}

                    <h5 className={`mb-4 text-2xl font-semibold ${theme === 'light' ? 'text-black' : 'text-white'}`}>User Statistics</h5>
                    {stats && (
                      <div className={`bg-${theme === 'light' ? 'white/80' : 'transparent'} border border-${theme === 'light' ? 'black/10' : 'white/10'} rounded-3xl p-6 mb-8 shadow-2xl transition-all duration-300 hover:shadow-3xl`}>
                        <div className="grid grid-cols-1 sm:grid-cols-6 gap-6">
                          <div className={`h-24 flex flex-col items-center justify-center ${theme === 'light' ? 'bg-blue-200' : 'bg-purple-900/50'} rounded-2xl shadow-lg transition-all duration-200 hover:scale-105 hover:shadow-xl sm:col-span-2`}>
                            <p className={`text-base ${theme === 'light' ? 'text-blue-800' : 'text-purple-300'}`}>Total Feedbacks</p>
                            <p className={`text-2xl font-semibold ${theme === 'light' ? 'text-blue-700' : 'text-purple-200'}`}>{stats.totalFeedbacks}</p>
                          </div>
                          <div className={`h-24 flex flex-col items-center justify-center ${theme === 'light' ? 'bg-cyan-100' : 'bg-pink-900/50'} rounded-2xl shadow-lg transition-all duration-200 hover:scale-105 hover:shadow-xl sm:col-span-2`}>
                            <p className={`text-xs md:text-sm ${theme === 'light' ? 'text-blue-800' : 'text-pink-300'}`}>Avg Comment Length</p>
                            <p className={`text-base md:text-lg font-semibold ${theme === 'light' ? 'text-blue-800' : 'text-pink-200'}`}>{stats.avgCommentLength?.toFixed(2)} chars</p>
                          </div>
                          <div className={`h-24 flex flex-col items-center justify-center ${theme === 'light' ? 'bg-white-100' : 'bg-pink-400/50'} rounded-2xl shadow-lg transition-all duration-200 hover:scale-105 hover:shadow-xl sm:col-span-2`}>
                            <p className={`text-xs md:text-sm ${theme === 'light' ? 'text-blue-800' : 'text-pink-300'}`}>Last Feedback At</p>
                            <p className={`text-sm md:text-base font-semibold ${theme === 'light' ? 'text-blue-800' : 'text-pink-200'}`}>{new Date(stats.lastFeedbackAt).toLocaleString()}</p>
                          </div>
                          <div className={`h-56 bg-transparent border ${theme === 'light' ? 'border-gray-300' : 'border-gray-700'} rounded-2xl shadow-lg p-4 pt-8 transition-all duration-200 hover:scale-105 hover:shadow-xl sm:col-span-3`}>
                            <Doughnut data={distinctReposChart} options={distinctReposOptions} />
                          </div>
                          <div className={`h-56 bg-transparent border ${theme === 'light' ? 'border-gray-300' : 'border-gray-700'} rounded-2xl shadow-lg p-4 pt-8 transition-all duration-200 hover:scale-105 hover:shadow-xl sm:col-span-3`}>
                            <div className="w-full h-4/5">
                              <Doughnut data={avgRateChart} options={avgRateOptions} />
                            </div>
                            <p className={`text-xl font-semibold text-center ${theme === 'light' ? 'text-blue-600' : 'text-purple-400'}`}>{stats.avgRate}%</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>

{/* Chat Button */}
      <button
        className={`fixed bottom-6 right-6 w-16 h-16 rounded-full ${theme === 'light' ? 'bg-blue-600' : 'bg-purple-600'} text-white flex items-center justify-center shadow-xl z-50 transition-all duration-200 hover:scale-110`}
        onClick={() => setChatOpen(!chatOpen)}
        title="Chat with AI Assistant"
      >
        <FaRobot size={28} />
      </button>

      {chatOpen && (
        <div className={`fixed bottom-24 right-5 w-80 h-96 ${theme === 'light' ? 'bg-white text-black' : 'bg-gray-900 text-white'} rounded-xl shadow-2xl z-50 flex flex-col overflow-hidden`}>
          <div className={`px-4 py-2 ${theme === 'light' ? 'bg-blue-600' : 'bg-purple-600'} text-white flex justify-between items-center`}>
            <span className="font-semibold">AI Assistant</span>
            <div className="flex gap-2">
              <button 
                onClick={handleClearChat} 
                className="text-sm hover:bg-white/20 rounded px-2 py-1 transition-colors"
                title="Clear chat history"
              >
                Clear Chat
              </button>
              <button onClick={() => setChatOpen(false)}>✕</button>
            </div>
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

      {/* Footer */}
      <footer className={`relative z-40 ${theme === 'light' ? 'bg-white/80' : 'bg-black/80'} border-t border-${theme === 'light' ? 'black/10' : 'white/10'} py-8`}>
        <div className={`text-center ${theme === 'light' ? 'text-black/50' : 'text-white/50'} text-base font-semibold`}>
          © {new Date().getFullYear()} Code Review Hub. All rights reserved.
        </div>
      </footer>

      <style jsx global>{`
        @keyframes gradient-x {
          0%, 100% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
        }
        .animate-gradient-x {
          animation: gradient-x 15s ease infinite;
          background-size: 200% 200%;
        }
        .shadow-3xl {
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
        }

        /* Desktop - Larger font size for PR id and repoFullName */
        @media (min-width: 1024px) {
          .latest-feedback-card .desktop-title {
              font-size: 1.25rem; /* text-xl */
              display: block;
            }
            .latest-feedback-card .mobile-title-container {
              display: none;
            }
          }

          /* Tablet and smaller - Show mobile title, hide desktop title */
          @media (max-width: 1023px) {
            .latest-feedback-card .desktop-title {
              display: none;
            }
            .latest-feedback-card .mobile-title-container {
              display: flex;
            }
            .latest-feedback-card .mobile-title,
            .latest-feedback-card .mobile-repo {
              font-size: 0.875rem; /* text-sm */
            }
            @media (min-width: 768px) {
              .latest-feedback-card .mobile-title,
              .latest-feedback-card .mobile-repo {
                font-size: 1rem; /* text-base */
              }
            }
          }

        /* Tablet - Arrange All Users and All Teams buttons vertically and reduce sidebar font sizes */
        @media (max-width: 1023px) and (min-width: 768px) {
          .sidebar-buttons-container {
            flex-direction: column;
          }

          .sidebar-buttons-container button {
            width: 100%;
            font-size: 0.875rem; /* text-sm */
          }

          .sidebar-title {
            font-size: 1rem; /* text-base */
          }

          .sidebar-user-item,
          .sidebar-team-item,
          .sidebar-team-member-item {
            font-size: 0.875rem; /* text-sm */
          }

          /* Make AI chat window wider and shorter */
          .ai-chat-popup {
            width: 90%;
            height: 60%;
          }
        }

        /* Mobile M (375px) - Smaller text in user info card, smaller AI chat window, smaller Delete button */
        @media (max-width: 375px) {
          .feedback-actions {
            flex-direction: column;
            align-items: flex-start;
          }
          .feedback-actions .flex.items-center {
            margin-top: 0.5rem; /* Space between PR info and buttons */
          }
          .latest-feedback-card .transition-all {
            margin-top: 1rem; /* Extra space between buttons and expanded feedback text */
          }
        }

          .user-info-card p {
            font-size: 0.875rem; /* text-sm */
          }

          .ai-chat-popup {
            width: 85%;
            height: 50%;
          }

          .feedback-delete-btn {
            font-size: 0.75rem; /* text-xs */
            padding: 0.25rem 0.5rem;
          }
        }

        /* Mobile S (320px) - Even smaller text in user info card, smaller AI chat window, Delete button below PR info */
        @media (max-width: 320px) {
          .user-info-card h5 {
            font-size: 0.875rem; /* text-sm */
          }

          .user-info-card p {
            font-size: 0.75rem; /* text-xs */
          }

          .ai-chat-popup {
            width: 80%;
            height: 45%;
          }

          .feedback-delete-btn {
            font-size: 0.75rem; /* text-xs */
            padding: 0.25rem 0.5rem;
          }

          .feedback-actions {
            flex-direction: column;
            align-items: flex-start;
          }

          .feedback-delete-btn {
            margin-top: 0.5rem;
          }
        }
      `}</style>
    </div>
  );
}