import React, { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { getAdminUsers, getAdminFeedbacksByUser, deleteFeedback } from '../api/admin';
import { Link, useNavigate } from 'react-router-dom';
import { FaCaretDown } from 'react-icons/fa';

export default function AdminPage() {
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [feedbacks, setFeedbacks] = useState([]);
  const [loadingFeedbacks, setLoadingFeedbacks] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    async function initAdmin() {
      try {
        const list = await getAdminUsers();
        setUsers(list);
      } catch (e) {
        console.error('Fetch failed:', e, { message: e.message, status: e.status });
        if (e.message.includes('403')) {
          setError(`You are not authorized to access the admin panel. Error: ${e.message}`);
        } else {
          setError(`Failed to load admin panel: ${e.message}`);
        }
      } finally {
        setLoading(false);
      }
    }
    initAdmin();
  }, []);

  const handleUserSelect = async (user) => {
    setSelectedUser(user);
    console.log('Selected user attributes:', user);
    setFeedbacks([]);
    setLoadingFeedbacks(true);
    try {
      const fbs = await getAdminFeedbacksByUser(user.username);
      setFeedbacks(fbs);
    } catch (e) {
      setError(e.message);
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
      <div className="min-h-screen flex items-center justify-center text-white text-xl">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-600"></div>
        <span className="ml-2">Loading Admin Panel...</span>
    </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-red-900/70 border border-red-500 rounded-2xl p-6 text-white">
          <h3 className="text-lg font-semibold">Error</h3>
          <p className="mt-2">{error}</p>
          <Link to="/user" className="mt-4 inline-block px-4 py-2 bg-purple-600 text-white rounded-full hover:bg-purple-500 transition">
            Return to User Page
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-black text-white overflow-hidden font-['Gabarito'] flex flex-col">
      {/* Background */}
      <div className="absolute inset-0 z-0 opacity-30">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900 animate-gradient-x"></div>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-transparent via-black/50 to-black opacity-70"></div>
      </div>

      {/* Navbar */}
      <nav className="relative z-50 px-6 py-4 flex justify-between items-center">
        <Link to="/" className="text-2xl font-bold text-white tracking-wider hover:scale-105 transition-transform no-underline">
          Code Review Hub - Admin
        </Link>
        <div className="relative">
          <span
            className="text-white/80 hover:text-white transition-colors cursor-pointer"
            onClick={handleLogout}
          >
            Log Out
          </span>
        </div>
      </nav>

      <main className="relative z-40 px-6 py-6 flex-grow">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="md:col-span-1 space-y-6">
            <div className="bg-black/70 border border-white/10 rounded-2xl p-4">
              <h5 className="mb-3 text-lg font-semibold">All Users</h5>
              <div className="space-y-2">
                {users.map(u => (
                  <div
                    key={u.username}
                    className={`p-2 rounded-lg cursor-pointer flex items-center ${selectedUser?.username === u.username ? 'bg-purple-600/30' : 'hover:bg-black/40'}`}
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
                        className="bg-purple-600 text-white w-8 h-8 rounded-full flex items-center justify-center mr-2 text-sm"
                      >
                        {(u.name || u.username)?.[0]?.toUpperCase() || 'U'}
                      </div>
                    )}
                    <span>{u.name || u.username}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="md:col-span-3">
            {!selectedUser ? (
              <div className="text-center text-white/60 mt-10">
                Select a user to view details and feedbacks.
              </div>
            ) : (
              <>
                <div className="bg-black/70 border border-white/10 rounded-2xl p-4 mb-6 flex items-center">
                  {selectedUser.avatar ? (
                    <img
                      src={selectedUser.avatar}
                      alt="Avatar"
                      className="w-20 h-20 rounded-full object-cover mr-4"
                      onError={(e) => (e.target.src = '')}
                    />
                  ) : (
                    <div
                      className="bg-purple-600 text-white w-20 h-20 rounded-full flex items-center justify-center mr-4 text-2xl"
                    >
                      {(selectedUser.name || selectedUser.username)?.[0]?.toUpperCase() || 'U'}
                    </div>
                  )}
                  <div>
                    <h5 className="mb-1 text-xl font-semibold">{selectedUser.name || selectedUser.username}</h5>
                    <p className="text-white/70 text-sm">@{selectedUser.username} • {selectedUser.email}</p>
                  </div>
                </div>

                <h5 className="mb-3 text-lg font-semibold">Feedbacks</h5>
                {loadingFeedbacks ? (
                  <div className="flex justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-600"></div>
                  </div>
                ) : feedbacks.length === 0 ? (
                  <div className="bg-black/60 border border-white/10 rounded-2xl p-4 text-white/60">
                    No feedbacks for this user.
                  </div>
                ) : (
                  feedbacks.map(fb => (
                    <div key={fb.id} className="bg-black/60 border border-white/10 rounded-2xl p-4 mb-3">
                      <h5 className="font-semibold text-purple-400 mb-2">
                        PR #{fb.prId} • <span className="text-white">{fb.repoFullName}</span>
                      </h5>
                      <ReactMarkdown remarkPlugins={[remarkGfm]} className="text-white/90">
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

      {/* Footer */}
      <footer className="relative z-40 bg-black/70 backdrop-blur-lg border-t border-white/10 py-6 sm:py-8">
        <div className="text-center mt-4 sm:mt-6 text-white/50 text-xs sm:text-sm">
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