import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getUserInfo } from '../api/user';
import { Code, BookOpen, Users, Menu, X } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { FaSun, FaMoon } from 'react-icons/fa';

export default function HomePage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    async function fetchUser() {
      try {
        const u = await getUserInfo();
        setUser(u);
      } catch {
        setUser(null);
      } finally {
        setLoading(false);
      }
    }
    fetchUser();

    const sectionInterval = setInterval(() => {
      setActiveSection(prev => (prev + 1) % 3);
    }, 5000);

    return () => clearInterval(sectionInterval);
  }, []);

  useEffect(() => {
    // Apply theme to body to ensure global consistency
    document.body.className = theme === 'light' ? 'bg-white text-black' : 'bg-black text-white';
  }, [theme]);

  const handleLogout = async () => {
    try {
      await fetch('/logout', { method: 'POST', credentials: 'include' });
    } catch (err) {
      console.error('Logout failed', err);
    } finally {
      setUser(null);
      navigate('/');
    }
  };

  const handleThemeToggle = (selectedTheme) => {
    setTheme(selectedTheme);
  };

  const toggleMenu = () => {
    setMenuOpen(prev => !prev);
  };

  if (loading) {
    return (
      <div className={`fixed inset-0 ${theme === 'light' ? 'bg-white text-black' : 'bg-black text-white'} flex items-center justify-center`}>
        <div className="animate-pulse text-3xl sm:text-4xl md:text-5xl font-bold">
          Code Review Hub
        </div>
      </div>
    );
  }

  const heroSections = [
    { title: "Welcome to Code Review Hub", description: "Collaborate, review, and improve your code with our community.", active: activeSection === 0 },
    { title: "Real-Time Collaboration", description: "Seamless code sharing and instant feedback from peers.", active: activeSection === 1 },
    { title: "Learn & Grow Together", description: "Enhance your skills through collaborative code reviews.", active: activeSection === 2 }
  ];

  return (
    <div className={`relative min-h-screen ${theme === 'light' ? 'bg-white text-black' : 'bg-black text-white'} overflow-hidden font-['Gabarito']`}>
      {/* Animated Background (only for dark theme) */}
      {theme === 'dark' && (
        <div className="absolute inset-0 z-0 opacity-30">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900 animate-gradient-x"></div>
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-transparent via-black/50 to-black opacity-70"></div>
        </div>
      )}

      {/* Navigation */}
      <nav className={`relative z-50 px-4 sm:px-8 py-4 sm:py-6 flex justify-between items-center`}>
        <Link to="/" className={`text-2xl sm:text-3xl font-bold ${theme === 'light' ? 'text-black' : 'text-white'} tracking-wider hover:scale-105 transition-transform`}>
          Code Review Hub
        </Link>
        {/* Desktop Navbar */}
        <div className="hidden sm:flex items-center space-x-6">
          <div className="flex space-x-2">
            <button
              onClick={() => handleThemeToggle('light')}
              className={`p-2 rounded-full ${theme === 'light' ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'} transition-colors`}
              title="Switch to Light Theme"
            >
              <FaSun size={20} />
            </button>
            <button
              onClick={() => handleThemeToggle('dark')}
              className={`p-2 rounded-full ${theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-blue-600 text-gray-300 hover:bg-blue-500'} transition-colors`}
              title="Switch to Dark Theme"
            >
              <FaMoon size={20} />
            </button>
          </div>
          {user ? (
            <div className="flex items-center space-x-4">
              <Link to="/user" className="flex-shrink-0">
                {user.avatar ? (
                  <img
                    src={user.avatar}
                    alt="User avatar"
                    className={`w-10 h-10 rounded-full object-cover border-2 ${theme === 'light' ? 'border-blue-600 hover:border-blue-400' : 'border-purple-600 hover:border-purple-400'} transition-colors`}
                  />
                ) : (
                  <div className={`w-10 h-10 ${theme === 'light' ? 'bg-blue-600 hover:bg-blue-500' : 'bg-purple-600 hover:bg-purple-500'} text-white rounded-full flex items-center justify-center text-lg font-bold transition-all`}>
                    {user.name[0].toUpperCase()}
                  </div>
                )}
              </Link>
              <button onClick={handleLogout} className={`px-4 py-2 border ${theme === 'light' ? 'border-blue-600 hover:bg-blue-600 text-black hover:text-white' : 'border-purple-600 hover:bg-purple-600 text-white'} rounded-full transition-colors`}>
                Logout
              </button>
            </div>
          ) : (
            <>
              <Link to="/login" className={`text-center ${theme === 'light' ? 'text-black/80 hover:text-black' : 'text-white/80 hover:text-white'} transition-colors`}>
                Login
              </Link>
              <Link to="/signup" className={`px-6 py-3 ${theme === 'light' ? 'bg-blue-600 hover:bg-blue-500 text-white' : 'bg-purple-600 text-white hover:bg-purple-500'} rounded-full transition-all`}>
                Sign Up
              </Link>
            </>
          )}
        </div>
        {/* Mobile Burger Button */}
        <button className="sm:hidden p-2" onClick={toggleMenu}>
          {menuOpen ? <X size={24} className={theme === 'light' ? 'text-black' : 'text-white'} /> : <Menu size={24} className={theme === 'light' ? 'text-black' : 'text-white'} />}
        </button>
      </nav>

      {/* Mobile Burger Menu */}
      {menuOpen && (
        <div className={`sm:hidden relative z-50 ${theme === 'light' ? 'bg-white/90' : 'bg-black/90'} px-4 py-4 border-t border-${theme === 'light' ? 'black/10' : 'white/10'}`}>
          <div className="flex flex-col space-y-4">
            <div className="flex justify-center space-x-2">
              <button
                onClick={() => handleThemeToggle('light')}
                className={`p-2 rounded-full ${theme === 'light' ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'} transition-colors`}
                title="Switch to Light Theme"
              >
                <FaSun size={20} />
              </button>
              <button
                onClick={() => handleThemeToggle('dark')}
                className={`p-2 rounded-full ${theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-blue-600 text-gray-300 hover:bg-blue-500'} transition-colors`}
                title="Switch to Dark Theme"
              >
                <FaMoon size={20} />
              </button>
            </div>
            {user ? (
              <div className="flex flex-col items-center space-y-4">
                <Link to="/user" className="flex-shrink-0" onClick={toggleMenu}>
                  {user.avatar ? (
                    <img
                      src={user.avatar}
                      alt="User avatar"
                      className={`w-10 h-10 rounded-full object-cover border-2 ${theme === 'light' ? 'border-blue-600 hover:border-blue-400' : 'border-purple-600 hover:border-purple-400'} transition-colors`}
                    />
                  ) : (
                    <div className={`w-10 h-10 ${theme === 'light' ? 'bg-blue-600 hover:bg-blue-500' : 'bg-purple-600 hover:bg-purple-500'} text-white rounded-full flex items-center justify-center text-lg font-bold transition-all`}>
                      {user.name[0].toUpperCase()}
                    </div>
                  )}
                </Link>
                <button onClick={() => { handleLogout(); toggleMenu(); }} className={`w-full px-4 py-2 border ${theme === 'light' ? 'border-blue-600 hover:bg-blue-600 text-black hover:text-white' : 'border-purple-600 hover:bg-purple-600 text-white'} rounded-full transition-colors`}>
                  Logout
                </button>
              </div>
            ) : (
              <>
                <Link to="/login" className={`w-full text-center ${theme === 'light' ? 'text-black/80 hover:text-black' : 'text-white/80 hover:text-white'} transition-colors`} onClick={toggleMenu}>
                  Login
                </Link>
                <Link to="/signup" className={`w-full px-6 py-3 ${theme === 'light' ? 'bg-blue-600 hover:bg-blue-500 text-white' : 'bg-purple-600 text-white hover:bg-purple-500'} rounded-full transition-all text-center`} onClick={toggleMenu}>
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      )}

      {/* Hero Section */}
      <main className={`relative z-40 container mx-auto px-4 sm:px-8 py-12 sm:py-16 grid grid-cols-1 md:grid-cols-2 gap-8 items-start`}>
        <div className="space-y-6 relative h-[22rem] sm:h-96 md:h-80 lg:h-64 overflow-hidden">
          {heroSections.map((section, idx) => (
            <div key={idx} className={`absolute inset-x-0 ${section.active ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-20 pointer-events-none'} transition-all duration-700 ease-in-out`}>              
              <h1 className={`text-3xl sm:text-4xl md:text-5xl font-bold mb-4 sm:mb-6 text-transparent bg-clip-text bg-gradient-to-r ${theme === 'light' ? 'from-blue-400 to-blue-600' : 'from-purple-400 to-blue-500'}`}>
                {section.title}
              </h1>
              <p className={`text-base sm:text-lg md:text-xl ${theme === 'light' ? 'text-black/80' : 'text-white/80'} mb-6`}>
                {section.description}
              </p>
            </div>
          ))}
          <div className="absolute bottom-0 left-0 w-full flex flex-col sm:flex-row gap-4 lg:gap-6 xl:gap-4">
            <Link to="/signup" className={`w-full sm:w-auto px-6 py-3 xl:px-6 xl:py-3 lg:px-5 lg:py-2.5 md:px-4 md:py-2 text-sm md:text-sm lg:text-base ${theme === 'light' ? 'bg-blue-600 text-white hover:bg-blue-500' : 'bg-purple-600 text-white hover:bg-purple-500'} rounded-full transition-colors text-center`}>
              Sign Up
            </Link>
            <Link to="/login" className={`w-full sm:w-auto px-6 py-3 xl:px-6 xl:py-3 lg:px-5 lg:py-2.5 md:px-4 md:py-2 text-sm md:text-sm lg:text-base border-2 ${theme === 'light' ? 'border-black/20 text-black hover:bg-black/10' : 'border-white/20 text-white hover:bg-white/10'} rounded-full transition-colors text-center`}>
              Login
            </Link>
          </div>
        </div>

        <div className="hidden lg:block relative">
          <div className={`absolute -inset-2 ${theme === 'light' ? 'bg-blue-600/30' : 'bg-purple-600/30'} rounded-3xl blur-2xl animate-pulse`}></div>
          <div className={`relative ${theme === 'light' ? 'bg-white/70' : 'bg-black/70'} backdrop-blur-lg border border-${theme === 'light' ? 'black/10' : 'white/10'} rounded-3xl p-6 sm:p-8 shadow-2xl`}>
            <pre className={`font-mono text-sm sm:text-base ${theme === 'light' ? 'text-black/80' : 'text-white/80'}`}>
              <code>
{`// Collaborative Code Review Magic
function reviewCode(pullRequest) {
  const insights = analyze(pullRequest);
  insights.forEach(insight => {
    const feedback = generateFeedback(insight);
    notifyDevelopers(feedback);
  });
  return improvedCode();
}`}              </code>
            </pre>
          </div>
        </div>
      </main>

      {/* Features Section */}
      <section className={`relative z-40 container mx-auto px-4 sm:px-8 py-12 sm:py-16`}>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
          {[
            { icon: Code, title: "Code Collaboration", description: "Work together on projects with real-time code review tools.", bgColor: theme === 'light' ? 'bg-blue-100/30' : 'bg-purple-900/30' },
            { icon: BookOpen, title: "Learn & Grow", description: "Get feedback from experienced developers to improve your skills.", bgColor: theme === 'light' ? 'bg-blue-100/30' : 'bg-blue-900/30' },
            { icon: Users, title: "Community Support", description: "Join discussions and share knowledge with our vibrant community.", bgColor: theme === 'light' ? 'bg-blue-100/30' : 'bg-indigo-900/30' }
          ].map((feature, i) => {
            const Icon = feature.icon;
            return (
              <div key={i} className={`${feature.bgColor} backdrop-blur-lg border border-${theme === 'light' ? 'black/10' : 'white/10'} rounded-3xl p-6 sm:p-8 text-center relative group overflow-hidden transform transition-all duration-500 ease-in-out hover:scale-[1.03] hover:shadow-2xl`}>
                <div className={`absolute -inset-2 ${theme === 'light' ? 'bg-blue-600/20' : 'bg-purple-600/20'} rounded-3xl opacity-0 group-hover:opacity-100 blur-2xl transition-all duration-500 ease-in-out`}></div>
                <div className="mb-4 sm:mb-6 flex items-center justify-center">
                  <Icon className={`text-6xl sm:text-7xl md:text-8xl opacity-80 ${theme === 'light' ? 'text-black' : 'text-white'}`} strokeWidth={1.5} />
                </div>
                <h3 className={`text-xl sm:text-2xl md:text-2xl font-bold mb-2 sm:mb-4 text-transparent bg-clip-text bg-gradient-to-r ${theme === 'light' ? 'from-blue-400 to-blue-600' : 'from-purple-400 to-blue-500'}`}>
                  {feature.title}
                </h3>
                <p className={`text-sm sm:text-base ${theme === 'light' ? 'text-black/80' : 'text-white/80'}`}>
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>
      </section>

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

      {/* Custom Tailwind Animations */}
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