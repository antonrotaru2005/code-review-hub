import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';

export default function LoginPage() {
  const [userNotFound, setUserNotFound] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('error') === 'user_not_found') {
      setUserNotFound(true);
    }
  }, [location]);

  const handleLogin = () => {
    window.location.href = "http://localhost:8080/oauth2/authorization/bitbucket-login";
  };

  return (
    <div className="relative min-h-screen bg-black text-white overflow-hidden font-['Gabarito']">
      {/* Animated Background */}
      <div className="absolute inset-0 z-0 opacity-30">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900 animate-gradient-x"></div>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-transparent via-black/50 to-black opacity-70"></div>
      </div>

      {/* Navbar */}
      <nav className="relative z-50 px-6 py-4 flex justify-between items-center">
        <Link to="/" className="text-2xl sm:text-3xl font-bold text-white tracking-wider hover:scale-105 transition-transform">
          Code Review Hub
        </Link>
        <div className="flex space-x-4">
          <Link
            to="/login"
            className="px-6 py-3 text-white/80 hover:text-white transition-colors rounded-full text-base sm:text-lg"
          >
            Login
          </Link>
          <Link
            to="/signup"
            className="px-6 py-3 bg-purple-600 text-white rounded-full hover:bg-purple-500 transition-all shadow-lg hover:shadow-purple-500/50 text-base sm:text-lg"
          >
            Sign Up
          </Link>
        </div>
      </nav>

      {/* Main Login Card */}
      <main className="relative z-40 flex flex-col items-center justify-center px-4 sm:px-8 py-20">
        <div className="bg-black/70 backdrop-blur-lg border border-white/10 rounded-3xl p-8 sm:p-10 shadow-2xl w-full max-w-md">
          <h2 className="text-center text-3xl sm:text-4xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-500">
            Login to Code Review Hub
          </h2>
          {userNotFound && (
            <div className="mb-4 p-4 bg-red-700 text-red-100 rounded-lg text-center">
              This user does not exist.{' '}
              <Link to="/signup" className="underline text-white">
                Sign up instead
              </Link>.
            </div>
          )}
          <p className="text-center text-white/80 mb-6">
            Sign in with your Bitbucket account to continue
          </p>
          <button
            onClick={handleLogin}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-500 rounded-full text-white font-medium transition-colors mb-4 text-base sm:text-lg"
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
          <p className="text-center text-white/60">
            Don't have an account?{' '}
            <Link to="/signup" className="text-white underline">
              Sign Up
            </Link>
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-40 bg-black/70 backdrop-blur-lg border-t border-white/10 py-8">
        <div className="container mx-auto px-6 grid grid-cols-1 sm:grid-cols-3 gap-8">
          <div>
            <h5 className="text-lg sm:text-xl font-bold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-500">
              Code Review Hub
            </h5>
            <p className="text-white/80 text-sm">
              Empowering developers through collaboration and code review.
            </p>
          </div>
          <div>
            <h5 className="text-lg sm:text-xl font-bold mb-2 text-white">Quick Links</h5>
            <ul className="space-y-2 text-sm text-white/80">
              {['About', 'Contact', 'FAQ'].map((link, idx) => (
                <li key={idx}>
                  <Link to={`/${link.toLowerCase()}`} className="hover:text-white transition-colors">
                    {link}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h5 className="text-lg sm:text-xl font-bold mb-2 text-white">Connect</h5>
            <ul className="flex space-x-4 text-white/80">
              {['Twitter', 'GitHub', 'LinkedIn'].map((platform, idx) => (
                <li key={idx}>
                  <a href="#" className="hover:text-white transition-colors text-sm">
                    {platform}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="text-center mt-6 text-white/50 text-xs">
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
      `}</style>
    </div>
  );
}
