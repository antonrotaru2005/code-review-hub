import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';

export default function SignUpPage() {
  const [userExists, setUserExists] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('error') === 'user_exists') {
      setUserExists(true);
    }
  }, [location]);

  const handleSignUp = () => {
    window.location.href = 'http://localhost:8080/oauth2/authorization/bitbucket-signup';
  };

  return (
    <div className="relative min-h-screen bg-black text-white overflow-hidden font-['Gabarito']">
      {/* Animated Background */}
      <div className="absolute inset-0 z-0 opacity-30">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900 animate-gradient-x"></div>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-transparent via-black/50 to-black opacity-70"></div>
      </div>

      {/* Navbar */}
      <nav className="relative z-50 px-4 sm:px-8 py-4 sm:py-6 flex flex-col sm:flex-row justify-between items-center gap-4 sm:gap-6">
                  <Link
                    to="/"
                    className="text-2xl sm:text-3xl font-bold text-white tracking-wider hover:scale-105 transition-transform"
                  >
                    Code Review Hub
                  </Link>
                  <div className="flex flex-col sm:flex-row items-center sm:space-x-4 space-y-2 sm:space-y-0 w-full sm:w-auto">
                    <Link
                      to="/login"
                      className="w-full sm:w-auto text-center px-2 py-2 text-white/80 hover:text-white transition-colors rounded-full text-sm sm:text-base"
                    >
                      Login
                    </Link>
                    <Link
                      to="/signup"
                      className="w-full sm:w-auto px-6 py-3 bg-purple-600 text-white rounded-full hover:bg-purple-500 transition-all"
                    >
                      Sign Up
                    </Link>
                  </div>
                </nav>

      {/* Main SignUp Card */}
      <main className="relative z-40 flex flex-col items-center justify-center px-4 sm:px-8 py-20">
        <div className="bg-black/70 backdrop-blur-lg border border-white/10 rounded-3xl p-8 sm:p-10 shadow-2xl w-full max-w-md">
          <h2 className="text-center text-3xl sm:text-4xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-500">
            Sign Up
          </h2>
          {userExists && (
            <div className="mb-4 p-4 bg-red-700 text-white-100 rounded-lg text-center">
              An account with this Bitbucket user already exists.{' '}
              <Link to="/login" className="underline text-white">
                Please log in instead
              </Link>.
            </div>
          )}
          <p className="text-center text-white/80 mb-6">
            Create an account using your Bitbucket credentials
          </p>
          <button
            onClick={handleSignUp}
            disabled={userExists}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-500 rounded-full text-white font-medium transition-colors mb-4 text-base sm:text-lg"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              fill="currentColor"
              className="bi bi-person-plus"
              viewBox="0 0 16 16"
            >
              <path d="M6 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm2-3a2 2 0 1 1-4 0 2 2 0 0 1 4 0z" />
              <path d="M13.5 5a.5.5 0 0 1 .5.5V7h1.5a.5.5 0 0 1 0 1H14v1.5a.5.5 0 0 1-1 0V8h-1.5a.5.5 0 0 1 0-1H13V5.5a.5.5 0 0 1 .5-.5z" />
              <path d="M12 13c0 1-1 1-1 1H1s-1 0-1-1 1-4 6-4 6 3 6 4z" />
            </svg>
            Sign Up with Bitbucket
          </button>
          <p className="text-center text-white/60">
            Already have an account?{' '}
            <Link to="/login" className="text-white underline">
              Log In
            </Link>
          </p>
        </div>
      </main>

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