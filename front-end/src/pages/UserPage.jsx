import React, { useEffect, useState, useRef } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { getUserInfo, getUserFeedbacks, enableWebhookToken, disableWebhookToken, getUserRepos, getUserReviewAspects, updateUserReviewAspects, getUserTeams, createTeam, joinTeam, leaveTeam, deleteTeam, getTeamMembers } from '../api/user';
import { sendChat } from '../api/chat';
import { Link, useNavigate } from 'react-router-dom';
import { FaRobot, FaCaretDown, FaSun, FaMoon, FaCheckCircle, FaChevronDown, FaChevronUp, FaUsers, FaPlus, FaSignInAlt, FaSignOutAlt, FaTrash } from 'react-icons/fa';
import { DropdownButton, Dropdown, Spinner, Alert, Modal } from 'react-bootstrap';
import Switch from 'react-switch';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

export default function UserPage() {
  const [user, setUser] = useState(null);
  const [feedbacks, setFeedbacks] = useState([]);
  const [allFeedbacks, setAllFeedbacks] = useState([]);
  const [repos, setRepos] = useState(['all']);
  const [selectedRepo, setSelectedRepo] = useState('all');
  const [searchId, setSearchId] = useState('');
  const [showRepoWarning, setShowRepoWarning] = useState(false);
  const [aspectWarningPopup, setAspectWarningPopup] = useState({ visible: false, message: null });
  const [teamErrorPopup, setTeamErrorPopup] = useState({ visible: false, message: null });
  const [teamSuccessPopup, setTeamSuccessPopup] = useState({ visible: false, message: null });
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
  const [reviewAspects, setReviewAspects] = useState([]);
  const [selectedAspects, setSelectedAspects] = useState([]);
  const [aspectsDropdownOpen, setAspectsDropdownOpen] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [teams, setTeams] = useState([]);
  const [newTeamName, setNewTeamName] = useState('');
  const [joinTeamId, setJoinTeamId] = useState('');
  const [showTeamMembersModal, setShowTeamMembersModal] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [teamMembers, setTeamMembers] = useState([]);
  const [newTeamPassword, setNewTeamPassword] = useState('');
  const [joinTeamPassword, setJoinTeamPassword] = useState('');
  const [isTeamManagementCollapsed, setIsTeamManagementCollapsed] = useState(false);
  const feedbackRefs = useRef({});
  const aspectsDropdownRef = useRef(null);
  const teamDropdownRef = useRef(null);
  const teamManagementRef = useRef(null);
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

  const allReviewAspects = [
    'Summary',
    'Syntax & Style',
    'Correctness & Logic',
    'Potential Bugs',
    'Security Considerations',
    'Performance & Scalability',
    'Maintainability & Readability',
    'Documentation & Comments',
    'Best Practices & Design Principles',
    'Recommendations'
  ];

  // Groups feedbacks by repoFullName, prioritizes searchId match, and sorts by createdAt (or id) in descending order
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

  // Toggle the collapse state for the Team Management card
  const toggleTeamManagement = () => {
    setIsTeamManagementCollapsed(!isTeamManagementCollapsed);
  };

  // Handle aspect selection
  const handleAspectChange = async (aspect) => {
    let updatedAspects;
    if (selectedAspects.includes(aspect)) {
      updatedAspects = selectedAspects.filter(a => a !== aspect);
      if (updatedAspects.length === 0) {
        setAspectWarningPopup({ visible: true, message: 'You must keep at least one aspect.' });
        setTimeout(() => setAspectWarningPopup({ visible: false, message: null }), 3000);
        return;
      }
    } else {
      updatedAspects = [...selectedAspects, aspect];
    }
    updatedAspects = updatedAspects.sort((a, b) => 
      allReviewAspects.indexOf(a) - allReviewAspects.indexOf(b)
    );
    setSelectedAspects(updatedAspects);
    try {
      await updateUserReviewAspects(user.username, updatedAspects);
    } catch (error) {
      setError('Eroare la actualizarea aspectelor. Încercați din nou.');
      setTimeout(() => setError(null), 3000);
    }
  };

  // Handle token copy to clipboard
  const handleCopyToken = async () => {
    try {
      await navigator.clipboard.writeText(token);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      setError('Failed to copy token. Please try again.');
    }
  };

  // Handle search by PR ID
  // Înlocuiește funcția handleSearchId existentă cu aceasta:
const handleSearchId = (e) => {
  const value = e.target.value.replace(/[^0-9]/g, '');
  setSearchId(value); // Corectat de la setbxId la setSearchId

  if (!value) {
    setFeedbacks(allFeedbacks);
    return;
  }

  const searchNum = parseInt(value, 10);
  if (isNaN(searchNum)) {
    setFeedbacks(allFeedbacks);
    return;
  }

  const filteredFeedbacks = allFeedbacks.filter(fb =>
    fb.prId === searchNum &&
    (selectedRepo === 'all' || fb.repoFullName === selectedRepo)
  );
  setFeedbacks(filteredFeedbacks);
};

  // Handle team creation
  const handleCreateTeam = async () => {
    if (!newTeamName.trim()) {
      setTeamErrorPopup({ visible: true, message: 'Team name cannot be empty.' });
      setTimeout(() => setTeamErrorPopup({ visible: false, message: null }), 3000);
      return;
    }
    if (!newTeamPassword.trim()) {
      setTeamErrorPopup({ visible: true, message: 'Team password cannot be empty.' });
      setTimeout(() => setTeamErrorPopup({ visible: false, message: null }), 3000);
      return;
    }
    try {
      const newTeam = await createTeam(newTeamName.trim(), newTeamPassword.trim());
      setTeams(prev => [...prev, newTeam]);
      setNewTeamName('');
      setNewTeamPassword('');
      const updatedUser = await getUserInfo();
      setUser(updatedUser);
      setTeamSuccessPopup({ visible: true, message: 'Team created successfully!' });
      setTimeout(() => setTeamSuccessPopup({ visible: false, message: null }), 3000);
    } catch (error) {
      let errorMessage = 'Failed to create team. Please try again.';
      if (error.message.includes('400')) {
        errorMessage = 'Invalid team name or password.';
      } else if (error.message.includes('409')) {
        errorMessage = 'Team name already exists.';
      }
      setTeamErrorPopup({ visible: true, message: errorMessage });
      setTimeout(() => setTeamErrorPopup({ visible: false, message: null }), 3000);
    }
  };

  // Handle joining a team
  const handleJoinTeam = async () => {
    if (!joinTeamId.trim() || isNaN(parseInt(joinTeamId, 10))) {
      setTeamErrorPopup({ visible: true, message: 'Please enter a valid team ID.' });
      setTimeout(() => setTeamErrorPopup({ visible: false, message: null }), 3000);
      return;
    }
    if (!joinTeamPassword.trim()) {
      setTeamErrorPopup({ visible: true, message: 'Please enter the team password.' });
      setTimeout(() => setTeamErrorPopup({ visible: false, message: null }), 3000);
      return;
    }
    try {
      await joinTeam(parseInt(joinTeamId, 10), joinTeamPassword.trim());
      const updatedTeams = await getUserTeams();
      setTeams(updatedTeams);
      const updatedUser = await getUserInfo();
      setUser(updatedUser);
      setJoinTeamId('');
      setJoinTeamPassword('');
      setTeamSuccessPopup({ visible: true, message: 'Successfully joined the team!' });
      setTimeout(() => setTeamSuccessPopup({ visible: false, message: null }), 3000);
    } catch (error) {
      let errorMessage = 'Failed to join team. Please try again.';
      if (error.message.includes('404')) {
        errorMessage = 'Team not found. Check the team ID.';
      } else if (error.message.includes('409')) {
        errorMessage = 'You are already a member of this team.';
      } else if (error.message.includes('403')) {
        errorMessage = 'Incorrect password or no permission to join.';
      } else if (error.message.includes('400')) {
        errorMessage = 'Invalid team ID or password.';
      }
      setTeamErrorPopup({ visible: true, message: errorMessage });
      setTimeout(() => setTeamErrorPopup({ visible: false, message: null }), 3000);
    }
  };

  // Handle leaving a team
  const handleLeaveTeam = async (teamId) => {
    try {
      await leaveTeam(teamId);
      const updatedTeams = await getUserTeams();
      setTeams(updatedTeams);
      const updatedUser = await getUserInfo();
      setUser(updatedUser);
      if (selectedTeam?.id === teamId) {
        setSelectedTeam(null);
        setShowTeamMembersModal(false);
      }
    } catch (error) {
      setTeamErrorPopup({ visible: true, message: error.message || 'Failed to leave team.' });
      setTimeout(() => setTeamErrorPopup({ visible: false, message: null }), 3000);
    }
  };

  // Handle deleting a team
  const handleDeleteTeam = async (teamId) => {
    try {
      await deleteTeam(teamId);
      const updatedTeams = await getUserTeams();
      setTeams(updatedTeams);
      const updatedUser = await getUserInfo();
      setUser(updatedUser);
      if (selectedTeam?.id === teamId) {
        setSelectedTeam(null);
        setShowTeamMembersModal(false);
      }
    } catch (error) {
      setTeamErrorPopup({ visible: true, message: error.message || 'Failed to delete team.' });
      setTimeout(() => setTeamErrorPopup({ visible: false, message: null }), 3000);
    }
  };

  // Handle viewing team members
  const handleViewTeamMembers = async (team) => {
    try {
      const members = await getTeamMembers(team.id);
      setTeamMembers(members);
      setSelectedTeam(team);
      setShowTeamMembersModal(true);
    } catch (error) {
      setTeamErrorPopup({ visible: true, message: error.message || 'Failed to fetch team members.' });
      setTimeout(() => setTeamErrorPopup({ visible: false, message: null }), 3000);
    }
  };

  // Load user, feedbacks, repositories, review aspects, webhook status, and teams
  useEffect(() => {
    if (didFetchRef.current) return;
    didFetchRef.current = true;

    async function load() {
      try {
        const u = await getUserInfo();
        setUser(u);
        try {
          const fbs = await getUserFeedbacks(u.username);
          setAllFeedbacks(fbs);
          setFeedbacks(fbs);
          setCollapsedFeedbacks(
            fbs.reduce((acc, fb) => ({ ...acc, [fb.id]: true }), {})
          );
        } catch (fbErr) {
          console.error('Failed to load feedbacks:', fbErr);
          setAllFeedbacks([]);
          setFeedbacks([]);
          setCollapsedFeedbacks({});
        }
        try {
          const userRepos = await getUserRepos(u.username);
          setRepos(['all', ...userRepos]);
        } catch (repoErr) {
          console.error('Failed to load repositories:', repoErr);
          setRepos(['all']);
        }
        try {
          const aspects = await getUserReviewAspects(u.username);
          setReviewAspects(aspects);
          setSelectedAspects(aspects);
        } catch (aspectErr) {
          console.error('Failed to load review aspects:', aspectErr);
          setReviewAspects(allReviewAspects);
          setSelectedAspects([]);
        }
        
        try {
          const response = await fetch(
            `${process.env.REACT_APP_BACKEND_URL}/api/user/webhook-token`,
            {
              method: 'GET',
              credentials: 'include',
              headers: { 'Content-Type': 'application/json' }
            }
          );

          if (response.status === 200) {
            const contentType = response.headers.get('Content-Type') || '';
            if (contentType.includes('application/json')) {
              const result = await response.json();
              setToken(result.token);
              setWebhookEnabled(true);
            } else {
              console.warn(
                'Așteptat JSON de la /webhook-token, dar Content-Type nu e JSON:', 
                contentType
              );
              setWebhookEnabled(false);
              setToken(null);
            }

          } else if (response.status === 204) {
            setWebhookEnabled(false);
            setToken(null);

          } else {
            console.warn(`/webhook-token returned ${response.status}, tratăm ca no token.`);
            setWebhookEnabled(false);
            setToken(null);
          }

        } catch (tokenErr) {
          console.error('Failed to check webhook status:', tokenErr);
          setWebhookEnabled(false);
          setToken(null);
        }
        try {
          const userTeams = await getUserTeams();
          setTeams(userTeams);
        } catch (teamErr) {
          console.error('Failed to load teams:', teamErr);
          setTeams([]);
        }
      } catch (e) {
        console.error('Error loading user data:', e);
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

  // Close dropdowns on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
        setThemeOptionsOpen(false);
      }
      if (aspectsDropdownRef.current && !aspectsDropdownRef.current.contains(event.target)) {
        setAspectsDropdownOpen(false);
      }
      if (teamDropdownRef.current && !teamDropdownRef.current.contains(event.target)) {
        // Add if you implement a team dropdown
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // WebSocket for feedback stages and PR creation
  useEffect(() => {
    if (!user || error || loading || !webhookEnabled) return;

    const socket = new SockJS(`${process.env.REACT_APP_BACKEND_URL}/ws-feedback`);
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
            setAllFeedbacks(fbs);
            setFeedbacks(searchId ? fbs.filter(fb =>
              fb.prId === parseInt(searchId, 10) &&
              (selectedRepo === 'all' || fb.repoFullName === selectedRepo)
            ) : fbs);
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
  }, [user, error, loading, webhookEnabled, searchId, selectedRepo]);

  // Update feedback and team management content heights for animation
  useEffect(() => {
    Object.keys(feedbackRefs.current).forEach(id => {
      const el = feedbackRefs.current[id];
      if (el) {
        el.style.maxHeight = collapsedFeedbacks[id]
          ? '0px'
          : `${el.scrollHeight}px`;
      }
    });
    const teamEl = teamManagementRef.current;
    if (teamEl) {
      teamEl.style.maxHeight = isTeamManagementCollapsed
        ? '0px'
        : `${teamEl.scrollHeight}px`;
    }
  }, [collapsedFeedbacks, feedbacks, isTeamManagementCollapsed]);

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

  const handleClearChat = () => {
    setChatMessages([]);
    localStorage.removeItem('chatMessages');
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

  const handleSwitchToAdmin = () => navigate('/admin');
  const handleToggleTheme = () => setThemeOptionsOpen(!themeOptionsOpen);
  const handleThemeSelect = (selectedTheme) => {
    setTheme(selectedTheme);
    setThemeOptionsOpen(false);
  };

  const handleModelChange = async (ai, model) => {
    try {
      await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/user/ai?ai=${encodeURIComponent(ai)}&model=${encodeURIComponent(model)}`, { method: 'POST', credentials: 'include' });
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

      {/* Pop-up Notification for Webhook Stages */}
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

      {/* Pop-up Notification for Repository Warning */}
      {showRepoWarning && (
        <div
          className={`fixed top-5 left-50% w-64 bg-${theme === 'light' ? 'white/90' : 'black/90'} border border-${theme === 'light' ? 'black/10' : 'white/10'} rounded-lg shadow-xl p-4 z-50 animate-fade-in`}
          style={{ left: '50%', transform: 'translateX(-50%)' }}
        >
          <div className="flex items-center justify-center">
            <span className={`text-${theme === 'light' ? 'black' : 'white'}`}>Choose the repository first</span>
          </div>
        </div>
      )}

      {/* Pop-up Notification for Aspect Warning */}
      {aspectWarningPopup.visible && (
        <div
          className={`fixed top-5 left-50% w-64 bg-${theme === 'light' ? 'white/90' : 'black/90'} border border-${theme === 'light' ? 'black/10' : 'white/10'} rounded-lg shadow-xl p-4 z-50 animate-fade-in`}
          style={{ left: '50%', transform: 'translateX(-50%)' }}
        >
          <div className="flex items-center justify-center">
            <span className={`text-${theme === 'light' ? 'black' : 'white'}`}>{aspectWarningPopup.message}</span>
          </div>
        </div>
      )}

      {/* Pop-up Notification for Team Errors */}
      {teamErrorPopup.visible && (
        <div
          className={`fixed top-5 left-50% w-64 bg-${theme === 'light' ? 'white/90' : 'black/90'} border border-red-500 rounded-lg shadow-xl p-4 z-50 animate-fade-in`}
          style={{ left: '50%', transform: 'translateX(-50%)' }}
          aria-live="polite"
        >
          <div className="flex items-center justify-center">
            <span className="text-red-500">{teamErrorPopup.message}</span>
          </div>
        </div>
      )}

      {teamSuccessPopup.visible && (
        <div
          className={`fixed top-5 left-1/2 w-64 bg-${theme === 'light' ? 'white/90' : 'black/90'}
                      border border-green-500 rounded-lg shadow-xl p-4 z-50 animate-fade-in`}
          style={{ transform: 'translateX(-50%)' }}
          aria-live="polite"
        >
          <div className="flex items-center justify-center">
            <FaCheckCircle className="text-green-600" />
            <span className="text-green-500">{teamSuccessPopup.message}</span>
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
              {user.teamNames?.length > 0 && (
                <p className={`text-${theme === 'light' ? 'black/70' : 'white/70'} text-sm mt-2`}>
                  Teams: {user.teamNames.join(', ')}
                </p>
              )}
            </div>

              <div className={`relative rounded-2xl border border-${theme === 'light' ? 'black/10' : 'white/10'} ${theme === 'light' ? 'bg-white/80' : 'bg-transparent from-purple-900/60 via-indigo-900/60 to-blue-900/60'} backdrop-blur-md shadow-xl p-6`}>
                <div className="flex items-center justify-between">
                  <div >
                    <h4 className={`text-lg font-semibold text-${theme === 'light' ? 'black' : 'white'} leading-none team-management-title`}>
                      Team Management
                    </h4>
                  </div>
                  <button
                    onClick={toggleTeamManagement}
                    className={`p-2 ${theme === 'light' ? 'text-blue-600 hover:text-blue-500' : 'text-purple-600 hover:text-purple-500'}`}
                    aria-label={isTeamManagementCollapsed ? 'Expand Team Management' : 'Collapse Team Management'}
                    aria-expanded={!isTeamManagementCollapsed}
                  >
                    {isTeamManagementCollapsed ? <FaChevronDown /> : <FaChevronUp />}
                  </button>
                </div>
                <div
                  ref={teamManagementRef}
                  className={`overflow-hidden transition-all duration-300 ease-in-out`}
                  style={{ maxHeight: isTeamManagementCollapsed ? '0px' : teamManagementRef.current?.scrollHeight || 'auto' }}
                >
                <div className="mt-4">
                  <h5 className={`text-sm font-medium mb-2 text-${theme === 'light' ? 'black' : 'white'}`}>Your Teams</h5>
                  {teams.length === 0 ? (
                    <p className={`text-sm text-${theme === 'light' ? 'black/70' : 'white/70'}`}>No teams joined.</p>
                  ) : (
                    <div className="space-y-2">
                      {teams.map(team => (
                        <div key={team.id} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <FaUsers className={`text-${theme === 'light' ? 'blue-600' : 'purple-600'}`} />
                            <div className="flex items-center gap-1">
                              <span 
                                className={`text-sm cursor-pointer ${theme === 'light' ? 'text-black hover:text-blue-600' : 'text-white hover:text-purple-600'}`} 
                                onClick={() => handleViewTeamMembers(team)}
                              >
                                {team.name}
                              </span>
                              {team.createdByUsername === user.username && (
                                <span className={`text-xs px-1.5 py-0.5 rounded ${theme === 'light' ? 'bg-green-500 text-white' : 'bg-green-600 text-white'} ml-1`}>
                                  Admin
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleLeaveTeam(team.id)}
                              className={`text-sm ${theme === 'light' ? 'text-blue-600 hover:text-blue-500' : 'text-purple-600 hover:text-purple-500'}`}
                              title="Leave Team"
                            >
                              <FaSignOutAlt />
                            </button>
                            {team.createdByUsername === user.username && (
                              <button
                                onClick={() => handleDeleteTeam(team.id)}
                                className={`text-sm ${theme === 'light' ? 'text-red-600 hover:text-red-500' : 'text-red-400 hover:text-red-300'}`}
                                title="Delete Team"
                              >
                                <FaTrash />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="mb-4 mt-4">
                  <h5 className={`text-sm font-medium mb-2 text-${theme === 'light' ? 'black' : 'white'}`}>Create Team</h5>
                  <div className="flex flex-row gap-2 team-input-group">
                    <div className="flex flex-col gap-2 flex-1">
                      <input
                        type="text"
                        placeholder="Team name"
                        value={newTeamName}
                        onChange={(e) => setNewTeamName(e.target.value)}
                        className={`w-full px-2 py-1 h-8 text-sm border border-${theme === 'light' ? 'gray-300' : 'gray-600'} rounded ${theme === 'light' ? 'bg-white text-black' : 'bg-gray-700 text-white'}`}
                      />
                      <input
                        type="password"
                        placeholder="Team password"
                        value={newTeamPassword}
                        onChange={(e) => setNewTeamPassword(e.target.value)}
                        className={`w-full px-2 py-1 h-8 text-sm border border-${theme === 'light' ? 'gray-300' : 'gray-600'} rounded ${theme === 'light' ? 'bg-white text-black' : 'bg-gray-700 text-white'}`}
                      />
                    </div>
                    <button
                      onClick={handleCreateTeam}
                      className={`w-20 h-[72px] text-sm ${theme === 'light' ? 'bg-blue-600 text-white hover:bg-blue-500' : 'bg-purple-600 text-white hover:bg-purple-500'} rounded flex items-center justify-center team-button`}
                    >
                      <div className="flex flex-col items-center">
                        <FaPlus className="mb-1" />
                        <span>Create</span>
                      </div>
                    </button>
                  </div>
                </div>
                <div>
                  <h5 className={`text-sm font-medium mb-2 text-${theme === 'light' ? 'black' : 'white'}`}>Join Team</h5>
                  <div className="flex flex-row gap-2 team-input-group">
                    <div className="flex flex-col gap-2 flex-1">
                      <input
                        type="text"
                        placeholder="Team ID"
                        value={joinTeamId}
                        onChange={(e) => setJoinTeamId(e.target.value.replace(/[^0-9]/g, ''))}
                        className={`w-full px-2 py-1 h-8 text-sm border border-${theme === 'light' ? 'gray-300' : 'gray-600'} rounded ${theme === 'light' ? 'bg-white text-black' : 'bg-gray-700 text-white'}`}
                      />
                      <input
                        type="password"
                        placeholder="Team password"
                        value={joinTeamPassword}
                        onChange={(e) => setJoinTeamPassword(e.target.value)}
                        className={`w-full px-2 py-1 h-8 text-sm border border-${theme === 'light' ? 'gray-300' : 'gray-600'} rounded ${theme === 'light' ? 'bg-white text-black' : 'bg-gray-700 text-white'}`}
                      />
                    </div>
                    <button
                      onClick={handleJoinTeam}
                      className={`w-20 h-[72px] text-sm ${theme === 'light' ? 'bg-blue-600 text-white hover:bg-blue-500' : 'bg-purple-600 text-white hover:bg-purple-500'} rounded flex items-center justify-center team-button`}
                    >
                      <div className="flex flex-col items-center">
                        <FaSignInAlt className="mb-1" />
                        <span>Join</span>
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className={`relative ${aspectsDropdownOpen ? 'z-[1000]' : 'z-80'} rounded-2xl border border-${theme === 'light' ? 'black/10' : 'white/10'} ${theme === 'light' ? 'bg-white/80' : 'bg-transparent from-purple-900/60 via-indigo-900/60 to-blue-900/60'} backdrop-blur-md shadow-xl p-3 text-center`}>
              <h4 className={`text-lg font-semibold mb-2 text-${theme === 'light' ? 'black' : 'white'}`}>Current AI Model:</h4>
              <p className={`text-sm ${theme === 'light' ? 'text-black' : 'text-white'}`}>
                <strong>{user.aiModel.ai} - {user.aiModel.model}</strong>
              </p>
              <div className="relative mt-2" ref={aspectsDropdownRef}>
                <div
                  className="flex items-center justify-center gap-2 cursor-pointer"
                  onClick={() => setAspectsDropdownOpen(!aspectsDropdownOpen)}
                >
                  <span className={`text-sm ${theme === 'light' ? 'text-black' : 'text-white'}`}>
                    Choose Aspects for Your AI
                  </span>
                  <FaCaretDown className={theme === 'light' ? 'text-black' : 'text-white'} />
                </div>
                {error && (
                  <div className={`mt-2 text-sm text-red-500 text-center`}>
                    {error}
                  </div>
                )}
                {aspectsDropdownOpen && (
                  <div className={`aspects-dropdown-list absolute left-1/2 transform -translate-x-1/2 mt-2 w-64 max-h-48 overflow-y-auto ${theme === 'light' ? 'bg-white/90' : 'bg-black/80'} border border-${theme === 'light' ? 'black/10' : 'white/10'} rounded-lg shadow-lg p-4`}>
                    {allReviewAspects.map(aspect => (
                      <label key={aspect} className="flex items-center cursor-pointer mb-2 justify-start">
                        <input
                          type="checkbox"
                          checked={selectedAspects.includes(aspect)}
                          onChange={() => handleAspectChange(aspect)}
                          className="mr-2"
                        />
                        <span className={`text-sm text-left ${theme === 'light' ? 'text-black' : 'text-white'}`}>{aspect}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className={`relative rounded-2xl border border-${theme === 'light' ? 'black/10' : 'white/10'} ${theme === 'light' ? 'bg-white/80' : 'bg-transparent from-purple-900/60 via-indigo-900/60 to-blue-900/60'} backdrop-blur-md shadow-xl p-6 flex flex-col`}>
              <h4 className={`text-lg font-semibold mb-4 text-${theme === 'light' ? 'black' : 'white'} text-center`}>
                Choose Your AI Model
              </h4>
              <div className="flex flex-col gap-3">
                {uniqueAis.map(ai => (
                  <div key={ai} className="relative w-full">
                    <DropdownButton
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
                            className={`text-${theme === 'light' ? 'black' : 'white'} text-sm`}
                          >
                            {model.label}
                          </Dropdown.Item>
                        ))}
                    </DropdownButton>
                    <FaCaretDown className={`absolute right-3 top-1/2 transform -translate-y-1/2 ${theme === 'light' ? 'text-black' : 'text-white'}`} />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Main content */}
          <div className="lg:col-span-3">
            <div className="flex flex-col lg:flex-row justify-between items-center mb-6 gap-4">
              <div className="flex items-center gap-4">
                <h2 className="text-2xl font-bold feedback-header">Your AI Feedbacks 🧠</h2>
                <input
                  type="text"
                  placeholder="Search by ID"
                  value={searchId}
                  onChange={handleSearchId}
                  className={`w-32 px-2 py-1 text-sm border border-${theme === 'light' ? 'gray-300' : 'gray-600'} rounded ${theme === 'light' ? 'bg-white text-black' : 'bg-gray-700 text-white'}`}
                />
              </div>
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
                <div className={`bg-${theme === 'light' ? 'white/60' : 'black/60'} border border-${theme === 'light' ? 'black/10' : 'white/10'} rounded px-4 py-2 text-sm text-center relative`}>
                  {webhookEnabled ? (
                    <span>
                      Active Token:{' '}
                      <code
                        className={`bg-${theme === 'light' ? 'black/20' : 'black/90'} px-1.5 py-0.5 rounded cursor-pointer hover:bg-${theme === 'light' ? 'black/30' : 'black/70'}`}
                        onClick={handleCopyToken}
                        title="Click to copy"
                      >
                        {token}
                      </code>
                      {isCopied && (
                        <span className={`absolute bottom-[-1.5rem] left-1/2 transform -translate-x-1/2 text-xs ${theme === 'light' ? 'text-blue-600' : 'text-purple-600'}`}>
                          Copied!
                        </span>
                      )}
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
              <div className="repo-dropdown-wrapper">
                <DropdownButton
                  id="repo-dropdown"
                  title={selectedRepo === 'all' ? 'All Repositories' : selectedRepo}
                  variant="secondary"
                  className="mb-2 text-sm"
                  onSelect={(repo) => setSelectedRepo(repo)}
                >
                  {repos.map(repo => (
                    <Dropdown.Item
                      key={repo}
                      eventKey={repo}
                      className={`text-${theme === 'light' ? 'black' : 'black'} text-m`}
                    >
                      {repo === 'all' ? 'All Repositories' : repo}
                    </Dropdown.Item>
                  ))}
                </DropdownButton>
              </div>
              {Object.entries(grouped).length === 0 ? (
                <div className={`text-${theme === 'light' ? 'black/60' : 'white/60'}`}>
                  No feedback found.
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
                             <div className="feedback-header-container flex items-center justify-between">
                                {/* VARIANTA DESKTOP */}
                                <span
                                  className={`desktop-title font-semibold ${theme === 'light' ? 'text-blue-400' : 'text-purple-400'} feedback-title truncate`}
                                >
                                  Pull Request #{fb.prId} – {fb.model}
                                </span>

                                {/* VARIANTA MOBILE (ascunsă implicit pe desktop) */}
                                <div className="mobile-title-container flex flex-col items-start">
                                  <span className={`mobile-title font-semibold ${theme === 'light' ? 'text-blue-400' : 'text-purple-400'} truncate`}>
                                    PR #{fb.prId}
                                  </span>
                                  {/* Aici poți lăsa modelul (– {fb.model}) sau să-l muți într-un rând secundar */}
                                  <span className={`mobile-model text-sm ${theme === 'light' ? 'text-gray-500' : 'text-gray-400'} truncate`}>
                                    – {fb.model}
                                  </span>
                                </div>

                                {/* REPOSITORY – de la început, plasat într-un span separat */}
                                <span className={`feedback-repo text-sm ${theme === 'light' ? 'text-gray-500' : 'text-gray-400'} ml-2 truncate`}>
                                  {fb.repoFullName}
                                </span>

                                {/* Butonul de collapse/rândul cu iconiță */}
                                <button
                                  onClick={() => toggleCollapse(fb.id)}
                                  className={`p-2 ${theme === 'light' ? 'text-blue-600 hover:text-blue-500' : 'text-purple-600 hover:text-purple-500'}`}
                                  aria-label={`Toggle feedback for PR ${fb.prId}`}
                                  aria-expanded={!collapsedFeedbacks[fb.id]}
                                >
                                  {collapsedFeedbacks[fb.id] ? <FaChevronDown /> : <FaChevronUp />}
                                </button>
                              </div>
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

      {/* Team Members Modal */}
      <Modal
        show={showTeamMembersModal}
        onHide={() => setShowTeamMembersModal(false)}
        centered
        dialogClassName="team-members-modal"
        aria-labelledby="team-members-modal-title"
      >
        <Modal.Header className={`team-members-modal-header ${theme === 'light' ? 'bg-gray-50 text-gray-900' : 'bg-gradient-to-r from-[#1e2533] to-[#2a3344] text-gray-100'} border-b border-${theme === 'light' ? 'gray-200' : 'gray-700'}`}>
          <Modal.Title id="team-members-modal-title" className="text-lg font-semibold">
            {selectedTeam?.name} Members
          </Modal.Title>
          <button
            type="button"
            className={`team-members-modal-close ${theme === 'light' ? 'text-gray-500 hover:text-gray-700' : 'text-gray-400 hover:text-gray-200'}`}
            onClick={() => setShowTeamMembersModal(false)}
            aria-label="Close"
          >
            ✕
          </button>
        </Modal.Header>
        <Modal.Body className={`team-members-modal-body ${theme === 'light' ? 'bg-white' : 'bg-[#1e2533]'} py-4 px-6 max-h-[60vh] overflow-y-auto`}>  
          {teamMembers.length === 0 ? (
            <p className={`text-center text-sm ${theme === 'light' ? 'text-gray-500' : 'text-gray-400'}`} aria-live="polite">
              No members found.
            </p>
          ) : (
            <div className="space-y-3" role="list" aria-label="Team members">
              {teamMembers.map(member => (
                <div
                  key={member.username}
                  className={`team-member-card flex items-center gap-2 p-2 rounded-lg border ${theme === 'light' ? 'border-gray-200 bg-gray-50 hover:bg-gray-100' : 'border-gray-700 bg-[#2a3344] hover:bg-[#353f55]'} transition-all duration-200 hover:shadow-sm`}
                  role="listitem"
                >
                  {member.avatar ? (
                    <img
                      src={member.avatar}
                      alt={`${member.name}'s avatar`}
                      className={`w-10 h-10 rounded-full object-cover ring-1 ring-offset-1 ring-offset-transparent ring-${theme === 'light' ? 'blue-500' : 'purple-500'}`}
                    />
                  ) : (
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-base font-medium ${theme === 'light' ? 'bg-blue-600 text-white' : 'bg-purple-600 text-white'} ring-2 ring-offset-2 ring-offset-transparent ring-${theme === 'light' ? 'blue-500' : 'purple-500'}`}
                    >
                      {member.name[0]}
                    </div>
                  )}
                  <div className="flex-1">
                    <p className={`text-sm font-medium ${theme === 'light' ? 'text-gray-900' : 'text-gray-100'}`} aria-label={`Member name: ${member.name}`}>
                      {member.name}
                    </p>
                    <p className={`text-xs ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`} aria-label={`Member email: ${member.email}`}>
                      {member.email}
                    </p>
                    {selectedTeam?.createdBy?.username === member.username && (
                      <span className={`inline-block mt-1 px-2 py-0.5 text-xs font-semibold rounded-full ${theme === 'light' ? 'bg-blue-100 text-blue-700' : 'bg-purple-900 text-purple-300'}` }>
                        Team Admin
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Modal.Body>
      </Modal>

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
    will-change: opacity, margin-top;
  }
  @keyframes slide-toggle {
    0% { max-height: 0; opacity: 0; }
    100% { max-height: var(--target-height); opacity: 1; }
  }
  .team-management-content {
    animation: slide-toggle 0.3s ease-in-out forwards;
  }
  @keyframes modal-slide-in {
    0% { opacity: 0; transform: translateY(20px); }
    100% { opacity: 1; transform: translateY(0); }
  }
  .team-members-modal .modal-dialog {
    max-width: 500px;
    animation: modal-slide-in 0.3s ease-out;
  }
  .team-members-modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1.5rem 2rem;
    border-radius: 1rem 1rem 0 0;
  }
  .team-members-modal-close {
    background: none;
    border: none;
    font-size: 1.25rem;
    line-height: 1;
    cursor: pointer;
    transition: color 0.2s ease;
  }
  .team-members-modal-body {
    padding: 2rem;
  }
  .team-member-card {
    cursor: default;
  }
  .team-members-modal-footer {
    padding: 1.5rem 2rem;
    border-radius: 0 0 1rem 1rem;
    display: flex;
    justify-content: flex-end;
  }
  .team-members-modal-button {
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  }
  .team-members-modal-button:hover {
    box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15);
  }
  .ai-dropdown .btn {
    background-color: transparent;
    border-color: ${theme === 'light' ? 'rgba(0, 0, 0, 0.2)' : 'rgba(255, 255, 255, 0.2)'};
    color: ${theme === 'light' ? 'black' : 'white'};
    padding: 0.5rem 1rem;
    font-size: 1rem;
    line-height: 1.5rem;
    height: 2.5rem;
    width: 100%;
    text-align: left;
    position: relative;
    padding-right: 2.5rem;
  }
  .ai-dropdown .btn:hover {
    background-color: ${theme === 'light' ? 'rgba(0, 0, 0, 0.1)' : 'rgba(255, 255, 255, 0.1)'};
  }
  .ai-dropdown .dropdown-menu {
    background-color: ${theme === 'light' ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.8)'};
    border: 1px solid ${theme === 'light' ? 'rgba(0, 0, 0, 0.1)' : 'rgba(255, 255, 255, 0.1)'};
    font-size: 0.875rem;
    width: auto;
    min-width: 100%;
    max-width: 500px;
    z-index: 60;
  }
  .ai-dropdown .dropdown-item {
    color: ${theme === 'light' ? 'black' : 'white'};
    padding: 0.5rem 1rem;
    white-space: normal;
    word-break: break-word;
  }
  .ai-dropdown .dropdown-item:hover {
    background-color: ${theme === 'light' ? 'rgba(59, 130, 246, 0.5)' : 'rgba(147, 51, 234, 0.5)'};
  }
  .ai-dropdown .dropdown-item.active {
    background-color: ${theme === 'light' ? 'rgba(59, 130, 246, 0.7)' : 'rgba(147, 51, 234, 0.7)'};
  }
  #repo-dropdown {
    display: inline-flex;
    align-items: center;
    max-width: 220px;
    padding: 0.375rem 0.75rem;
    font-size: 0.875rem;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  #repo-dropdown .btn {
    display: inline-block;
    width: auto;
    min-width: 100px;
    max-width: 100px;
    padding: 0.5rem 1rem;
  }
  #repo-dropdown .dropdown-menu {
    min-width: 220px;
    max-width: 280px;
    white-space: normal;
    word-break: break-word;
    z-index: 70;
  }
  .repo-dropdown-wrapper {
    display: inline-block;
    width: auto;
    max-width: 200px;
  }
  .aspects-dropdown-list {
    z-index: 1000;
  }
  .team-input-group {
    align-items: flex-start;
  }
  .team-button {
    width: 80px;
    height: 72px;
    display: flex;
    align-items: center;
    justify-content: center;
  }


  /*RESPONSIVE*/

/* Tablet (768px) */
@media (max-width: 768px) {
  /* Ajustări fereastră AI Assistant */
  div[class*="fixed bottom-24 right-5 wquestrian-80 h-96"] {
    width: 70vw !important;
    height: 70vh !important;
    max-width: 500px;
    max-height: 400px;
    right: 1rem !important;
    bottom: 5rem !important;
  }
}

/* Desktop și Tablet (≥768px) */
@media (min-width: 768px) {
  .feedback-header-container {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
    position: relative;
    padding-right: 0; /* nu e nevoie de spațiu extra */
  }
  .desktop-title {
    font-size: 1.25rem;
    display: inline; /* titlu desktop vizibil */
  }
  .mobile-title-container {
    display: none;  /* ascuns pe desktop */
  }
  .feedback-repo {
    font-size: 1rem;
    margin-left: 0;
    margin-right: 1rem;
    order: 2; /* apare între titlu și buton */
  }
  .feedback-header-container > button {
    order: 3;
    position: static;
    margin-left: 0;
  }
}

/* Mobile (≤576px) – orice mobil, inclusiv L/M/S/XS */
@media (max-width: 576px) {
  /* Container header: mutăm în column, pentru a lăsa spațiu butonului poziționat absolut */
  .feedback-header-container {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    width: 100%;
    position: relative;       /* pentru button: absolute */
    padding-right: 2.5rem;    /* spațiu pentru butonul plasat absolut în dreapta */
  }

  /* Titlu desktop invizibil, folosim doar varianta mobile */
  .desktop-title {
    display: none !important;
  }

  /* Container titlu mobil: arată “PR #123 – model” pe un singur rând */
  .mobile-title-container {
    display: flex !important;
    flex-direction: row;
    align-items: center;
    gap: 0.5rem;
    font-size: 1.25rem;
    line-height: 1.3;
    order: 1;
    width: 100%;        /* ocupă toată lățimea rămasă */
    white-space: nowrap;
  }
  /* Dacă vrei să afișezi “PR #123” și “– model” într-o singură linie, asigură-te că .mobile-model e pe același rând */
  .mobile-model {
    font-size: 1rem;
    color: var(--text-secondary);
  }

  /* Butonul de toggle: poziționat absolut în colțul dreapta-sus al containerului */
  .feedback-header-container > button {
    position: absolute;
    top: 0;
    right: 0;
    order: 2;
    flex-shrink: 0;
    background: none; /* păstrează stilul tău actual */
  }

  /* Numele repo pe rând nou, font-size mai mic */
  .feedback-repo {
    display: block;
    order: 3;
    margin-top: 0.25rem;
    font-size: 0.75rem;
    color: var(--text-secondary);
    width: 100%;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
}

/* Mobile S/M (≤375px) */
@media (max-width: 375px) {
  /* Ajustări fereastră AI Assistant */
  div[class*="fixed bottom-24 right-5 w-80 h-96"] {
    width: 92vw !important;
    max-width: 340px;
    max-height: 320px;
  }

  .feedback-header-container {
    padding-right: 2.5rem;  /* spațiu buton */
  }

  .mobile-title-container {
    font-size: 1.125rem;
  }
  .mobile-model {
    font-size: 0.875rem;
  }
  .feedback-repo {
    font-size: 0.75rem;
  }
}

/* Mobile XS (≤320px) */
@media (max-width: 320px) {
  /* Ajustări fereastră AI Assistant */
  div[class*="fixed bottom-24 right-5 w-80 h-96"] {
    width: 95vw !important;
    max-width: 300px;
    max-height: 300px;
  }

  .feedback-header-container {
    padding-right: 2.5rem;
  }

  .mobile-title-container {
    font-size: 1rem;
  }
  .mobile-model {
    font-size: 0.75rem;
  }
  .feedback-repo {
    font-size: 0.75rem;
  }
}

/* Implicit (desktop) */
.mobile-title-container {
  display: none;
}
.desktop-title {
  display: inline;
}

`}</style>
    </div>
  );
}