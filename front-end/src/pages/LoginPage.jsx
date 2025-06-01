import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';

export default function LoginPage() {
  const [userNotFound, setUserNotFound] = useState(false);
  const location = useLocation();
  const { theme } = useTheme();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('error') === 'user_not_found') {
      setUserNotFound(true);
    }
  }, [location]);

  useEffect(() => {
    // Apply theme to body to ensure global consistency
    document.body.className = theme === 'light' ? 'bg-white text-black' : 'bg-black text-white';
  }, [theme]);

  const handleLogin = () => {
    window.location.href = `${process.env.REACT_APP_BACKEND_URL}/oauth2/authorization/bitbucket-login`;
  };

  return (
    <div className={`relative min-h-screen ${theme === 'light' ? 'bg-white text-black' : 'bg-black text-white'} overflow-hidden font-['Gabarito']`}>
      {/* Animated Background (only for dark theme) */}
      {theme === 'dark' && (
        <div className="absolute inset-0 z-0 opacity-30">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900 animate-gradient-x"></div>
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-transparent via-black/50 to-black opacity-70"></div>
        </div>
      )}

      {/* Navbar */}
      <nav className={`relative z-50 px-4 sm:px-8 py-4 sm:py-6 flex flex-col sm:flex-row justify-between items-center gap-4 sm:gap-6`}>
        <Link
          to="/"
          className={`text-2xl sm:text-3xl font-bold ${theme === 'light' ? 'text-black' : 'text-white'} tracking-wider hover:scale-105 transition-transform`}
        >
          Code Review Hub
        </Link>
        <div className="flex flex-col sm:flex-row items-center sm:space-x-4 space-y-2 sm:space-y-0 w-full sm:w-auto">
          <Link
            to="/login"
            className={`w-full sm:w-auto text-center px-2 py-2 ${theme === 'light' ? 'text-black/80 hover:text-black' : 'text-white/80 hover:text-white'} transition-colors rounded-full text-sm sm:text-base`}
          >
            Login
          </Link>
          <Link
            to="/signup"
            className={`w-full sm:w-auto px-6 py-3 ${theme === 'light' ? 'bg-blue-600 hover:bg-blue-500 text-white' : 'bg-purple-600 text-white hover:bg-purple-500'} rounded-full transition-all`}
          >
            Sign Up
          </Link>
        </div>
      </nav>

      {/* Main Login Card */}
      <main className={`relative z-40 flex flex-col items-center justify-center px-4 sm:px-8 py-20`}>
        <div className={`bg-${theme === 'light' ? 'white/70' : 'black/70'} backdrop-blur-lg border border-${theme === 'light' ? 'black/10' : 'white/10'} rounded-3xl p-8 sm:p-10 shadow-2xl w-full max-w-md`}>
          <h2 className={`text-center text-3xl sm:text-4xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r ${theme === 'light' ? 'from-blue-400 to-blue-600' : 'from-purple-400 to-blue-500'}`}>
            Login
          </h2>
          {userNotFound && (
            <div className="mb-4 p-4 bg-red-700 text-white rounded-lg text-center">
              This user does not exist.{' '}
              <Link to="/signup" className="underline text-white">
                Sign up instead
              </Link>.
            </div>
          )}
          <p className={`text-center ${theme === 'light' ? 'text-black/80' : 'text-white/80'} mb-6`}>
            Sign in with your Bitbucket account to continue
          </p>
          <button
            onClick={handleLogin}
            className={`w-full flex items-center justify-center gap-2 px-6 py-3 ${theme === 'light' ? 'bg-blue-600 hover:bg-blue-500' : 'bg-purple-600 hover:bg-purple-500'} rounded-full text-white font-medium transition-colors mb-4 text-base sm:text-lg`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              fill="currentColor"
              className="bi bi-box-arrow-in-right"
              viewBox="0 0 16 16"
            >
              <path
                fillRule="evenodd"
                d="M6 3.5a.5.5 0 0 1 .5-.5h8a.5.5 0 0 1 .5.5v9a.5.5 0 0 1-.5.5h-8a.5.5 0 0 1-.5-.5v-2a.5.5 0 0 0-1 0v2A1.5 1.5 0 0 0 6.5 14h8a1.5 1.5 0 0 0 1.5-1.5v-9A1.5 1.5 0 0 0 14.5 2h-8A1.5 1.5 0 0 0 5 3.5v2a.5.5 0 0 0 1 0v-2z"
              />
              <path
                fillRule="evenodd"
                d="M11.854 8.354a.5.5 0 0 0 0-.708l-3-3a.5.5 0 1 0-.708.708L10.293 7.5H1.5a.5.5 0 0 0 0 1h8.793l-2.147 2.146a.5.5 0 0 0 .708.708l3-3z"
              />
            </svg>
            Login with Bitbucket
          </button>
          <p className={`text-center ${theme === 'light' ? 'text-black/60' : 'text-white/60'}`}>
            Don't have an account?{' '}
            <Link to="/signup" className={`${theme === 'light' ? 'text-black' : 'text-white'} underline`}>
              Sign Up
            </Link>
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className={`relative z-40 ${theme === 'light' ? 'bg-white/70' : 'bg-black/70'} backdrop-blur-lg border-t border-${theme === 'light' ? 'black/10' : 'white/10'} py-12 sm:py-16`}>
        <div className="container mx-auto px-4 sm:px-8 grid grid-cols-1 sm:grid-cols-3 gap-4 justify-center text-center">
          <div>
            <h5 className={`text-xl sm:text-2xl font-bold mb-4 sm:mb-6 text-transparent bg-clip-text bg-gradient-to-r ${theme === 'light' ? 'from-blue-400 to-blue-600' : 'from-purple-400 to-blue-500'}`}>
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
        <div className={`text-center mt-8 sm:mt-12 ${theme === 'light' ? 'text-black/50' : 'text-white/50'} text-xs sm:text-sm`}>
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