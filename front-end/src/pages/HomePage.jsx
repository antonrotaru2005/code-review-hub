import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getUserInfo } from '../api/user';
import { Code, BookOpen, Users } from 'lucide-react';

export default function HomePage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState(0);
  const navigate = useNavigate();

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

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center">
        <div className="animate-pulse text-3xl sm:text-4xl md:text-5xl text-white font-bold">
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
    <div className="relative min-h-screen bg-black text-white overflow-hidden font-['Gabarito']">
      {/* Animated Background */}
      <div className="absolute inset-0 z-0 opacity-30">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900 animate-gradient-x"></div>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-transparent via-black/50 to-black opacity-70"></div>
      </div>

      {/* Navigation */}
      <nav className="relative z-50 px-4 sm:px-8 py-4 sm:py-6 flex flex-col sm:flex-row justify-between items-center gap-4 sm:gap-6">
        <Link to="/" className="text-2xl sm:text-3xl font-bold text-white tracking-wider hover:scale-105 transition-transform">
          Code Review Hub
        </Link>
        <div className="flex flex-col sm:flex-row items-center sm:space-x-6 space-y-2 sm:space-y-0 w-full sm:w-auto">
          {user ? (
            <>
              <div className="flex items-center w-full sm:w-auto justify-between sm:justify-start space-x-4">
              <Link to="/user" className="flex-shrink-0">
                  {user.avatar ? (
                    <img
                      src={user.avatar}
                      alt="User avatar"
                      className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover border-2 border-purple-600 hover:border-purple-400 transition-colors"
                    />
                  ) : (
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-600 text-white rounded-full flex items-center justify-center text-lg sm:text-xl font-bold hover:bg-purple-500 transition-all">
                      {user.name[0].toUpperCase()}
                    </div>
                  )}
              </Link>
                <button onClick={handleLogout} className="w-full sm:w-auto px-4 py-2 text-white border border-purple-600 rounded-full hover:bg-purple-600 transition-colors">
                  Logout
                </button>
              </div>
            </>
          ) : (
            <>
              <Link to="/login" className="w-full sm:w-auto text-center text-white/80 hover:text-white transition-colors">
                Login
              </Link>
              <Link to="/signup" className="w-full sm:w-auto px-6 py-3 bg-purple-600 text-white rounded-full hover:bg-purple-500 transition-all">
                Sign Up
              </Link>
            </>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <main className="relative z-40 container mx-auto px-4 sm:px-8 py-12 sm:py-16 grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
        <div className="space-y-6 relative h-64 sm:h-64 overflow-hidden">
          {heroSections.map((section, idx) => (
            <div key={idx} className={`absolute inset-x-0 ${section.active ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-20 pointer-events-none'} transition-all duration-700 ease-in-out`}>              
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 sm:mb-6 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-500">
                {section.title}
              </h1>
              <p className="text-base sm:text-lg md:text-xl text-white/80 mb-6">
                {section.description}
              </p>
            </div>
          ))}
          <div className="absolute bottom-0 left-0 w-full flex flex-col sm:flex-row gap-4">
            <Link to="/signup" className="w-full sm:w-auto px-6 py-3 bg-purple-600 text-white rounded-full hover:bg-purple-500 transition-colors text-center">
              Sign Up
            </Link>
            <Link to="/login" className="w-full sm:w-auto px-6 py-3 border-2 border-white/20 text-white rounded-full hover:bg-white/10 transition-colors text-center">
              Login
            </Link>
          </div>
        </div>

        <div className="hidden lg:block relative">
          <div className="absolute -inset-2 bg-purple-600/30 rounded-3xl blur-2xl animate-pulse"></div>
          <div className="relative bg-black/70 backdrop-blur-lg border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl">
            <pre className="text-white/80 font-mono text-sm sm:text-base">
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
      <section className="relative z-40 container mx-auto px-4 sm:px-8 py-12 sm:py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
          {[
            { icon: Code, title: "Code Collaboration", description: "Work together on projects with real-time code review tools.", bgColor: "bg-purple-900/30" },
            { icon: BookOpen, title: "Learn & Grow", description: "Get feedback from experienced developers to improve your skills.", bgColor: "bg-blue-900/30" },
            { icon: Users, title: "Community Support", description: "Join discussions and share knowledge with our vibrant community.", bgColor: "bg-indigo-900/30" }
          ].map((feature, i) => {
            const Icon = feature.icon;
            return (
              <div key={i} className={`${feature.bgColor} backdrop-blur-lg border border-white/10 rounded-3xl p-6 sm:p-8 text-center relative group overflow-hidden transform transition-all duration-500 ease-in-out hover:scale-[1.03] hover:shadow-2xl`}>
                <div className="absolute -inset-2 bg-purple-600/20 rounded-3xl opacity-0 group-hover:opacity-100 blur-2xl transition-all duration-500 ease-in-out"></div>
                <div className="mb-4 sm:mb-6 flex items-center justify-center">
                  <Icon className="text-6xl sm:text-7xl md:text-8xl opacity-80 text-white" strokeWidth={1.5} />
                </div>
                <h3 className="text-xl sm:text-2xl md:text-2xl font-bold mb-2 sm:mb-4 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-500">
                  {feature.title}
                </h3>
                <p className="text-sm sm:text-base text-white/80">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>
      </section>

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
