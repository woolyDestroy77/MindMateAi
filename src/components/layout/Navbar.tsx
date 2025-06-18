import React, { useState, useEffect } from "react";
import {
  Menu,
  X,
  Moon,
  Sun,
  Globe,
  LogIn,
  UserPlus,
  LogOut,
  Heart,
  Brain,
  Flame,
  User,
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import Button from "../ui/Button";
import AuthModal from "../auth/AuthModal";
import UserProfileModal from "../profile/UserProfileModal";
import { useAuth } from "../../hooks/useAuth";
import { FcGoogle } from "react-icons/fc";

interface NavbarProps {
  onLanguageChange?: (language: string) => void;
  onThemeToggle?: () => void;
  isDarkMode?: boolean;
}

const Navbar: React.FC<NavbarProps> = ({
  onLanguageChange,
  onThemeToggle,
  isDarkMode = false,
}) => {
  const { user, userProfile, signOut, signInWithGoogle } = useAuth();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState<
    "signin" | "signup" | null
  >(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const isDashboard = location.pathname === "/dashboard";
  const isChat = location.pathname === "/chat";
  const isAddictionSupport = location.pathname === "/addiction-support";
  const isAnxietySupport = location.pathname === "/anxiety-support";
  const [streak, setStreak] = useState(0);

  useEffect(() => {
    // Load streak from localStorage or calculate it
    const calculateStreak = () => {
      const today = new Date().toDateString();
      const lastLogin = localStorage.getItem('lastLoginDate');
      let currentStreak = parseInt(localStorage.getItem('dailyStreak') || '0');
      
      if (lastLogin !== today) {
        // New day login
        if (lastLogin) {
          const lastDate = new Date(lastLogin);
          const yesterday = new Date();
          yesterday.setDate(yesterday.getDate() - 1);
          
          if (lastDate.toDateString() === yesterday.toDateString()) {
            // Consecutive day
            currentStreak += 1;
          } else {
            // Streak broken
            currentStreak = 1;
          }
        } else {
          // First login
          currentStreak = 1;
        }
        
        // Save updated streak and login date
        localStorage.setItem('dailyStreak', currentStreak.toString());
        localStorage.setItem('lastLoginDate', today);
      }
      
      setStreak(currentStreak);
    };
    
    if (user) {
      calculateStreak();
    }
  }, [user]);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToSection = (
    e: React.MouseEvent<HTMLAnchorElement>,
    sectionId: string
  ) => {
    e.preventDefault();
    const section = document.getElementById(sectionId);
    if (section) {
      const navHeight = 64;
      const sectionTop = section.offsetTop - navHeight;

      window.scrollTo({
        top: sectionTop,
        behavior: "smooth",
      });

      setIsMenuOpen(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    setIsMenuOpen(false);
  };

  const handleGoogleSignIn = async () => {
    try {
      await signInWithGoogle();
    } catch (error) {
      console.error('Google sign-in error:', error);
    }
  };

  const renderAuthButtons = () => {
    if (user) {
      return (
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowProfileModal(true)}
            className="flex items-center space-x-2 p-1 rounded-full border border-gray-200 hover:bg-lavender-50 transition-colors"
          >
            <div className="w-8 h-8 rounded-full overflow-hidden bg-lavender-100 flex items-center justify-center">
              {userProfile?.avatar_url ? (
                <img 
                  src={userProfile.avatar_url} 
                  alt={userProfile.full_name} 
                  className="w-full h-full object-cover"
                />
              ) : (
                <User size={16} className="text-lavender-600" />
              )}
            </div>
          </button>
          <Button
            variant="primary"
            size="sm"
            className="text-sm px-3 py-1.5 transition-all duration-300"
            onClick={handleSignOut}
            leftIcon={<LogOut size={16} />}
          >
            Sign Out
          </Button>
        </div>
      );
    }

    if (!isDashboard && !isChat && !isAddictionSupport && !isAnxietySupport) {
      return (
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            className="text-sm px-3 py-1.5 transition-all duration-300"
            onClick={() => setShowAuthModal("signin")}
            leftIcon={<LogIn size={16} />}
          >
            Sign In
          </Button>
          <Button
            variant="primary"
            size="sm"
            className="text-sm px-3 py-1.5 transition-all duration-300"
            onClick={() => setShowAuthModal("signup")}
            leftIcon={<UserPlus size={16} />}
          >
            Sign Up
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="text-sm px-3 py-1.5 transition-all duration-300 flex items-center"
            onClick={handleGoogleSignIn}
          >
            <FcGoogle size={16} className="mr-1" />
            Google
          </Button>
        </div>
      );
    }

    return null;
  };

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled || isDashboard || isChat || isAddictionSupport || isAnxietySupport
            ? "bg-white/80 supports-[backdrop-filter]:bg-white/60 backdrop-blur-lg shadow-sm"
            : "bg-transparent"
        }`}
        style={{
          WebkitBackdropFilter:
            isScrolled || isDashboard || isChat || isAddictionSupport || isAnxietySupport ? "blur(8px)" : "none",
          backdropFilter:
            isScrolled || isDashboard || isChat || isAddictionSupport || isAnxietySupport ? "blur(8px)" : "none",
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Link
                  to={user ? "/dashboard" : "/"}
                  className="text-2xl font-bold bg-gradient-to-r from-lavender-600 to-sage-500 bg-clip-text text-transparent"
                >
                  PureMind AI
                </Link>
              </div>
            </div>

            <div className="hidden md:block">
              <div className="ml-10 flex items-center space-x-3">
                {!isDashboard && !isChat && !isAddictionSupport && !isAnxietySupport && !user ? (
                  <>
                    <a
                      href="#features"
                      onClick={(e) => scrollToSection(e, "features")}
                      className="relative text-gray-700 hover:text-lavender-600 transition-all duration-300 px-3 py-2 rounded-md font-medium group"
                    >
                      <span className="relative z-10">Features</span>
                      <span className="absolute inset-0 bg-lavender-50 rounded-md scale-0 group-hover:scale-100 transition-transform duration-300 -z-0"></span>
                    </a>
                    <a
                      href="#how-it-works"
                      onClick={(e) => scrollToSection(e, "how-it-works")}
                      className="relative text-gray-700 hover:text-lavender-600 transition-all duration-300 px-3 py-2 rounded-md font-medium group"
                    >
                      <span className="relative z-10">How It Works</span>
                      <span className="absolute inset-0 bg-lavender-50 rounded-md scale-0 group-hover:scale-100 transition-transform duration-300 -z-0"></span>
                    </a>
                    <a
                      href="#testimonials"
                      onClick={(e) => scrollToSection(e, "testimonials")}
                      className="relative text-gray-700 hover:text-lavender-600 transition-all duration-300 px-3 py-2 rounded-md font-medium group"
                    >
                      <span className="relative z-10">Testimonials</span>
                      <span className="absolute inset-0 bg-lavender-50 rounded-md scale-0 group-hover:scale-100 transition-transform duration-300 -z-0"></span>
                    </a>
                    <a
                      href="#faq"
                      onClick={(e) => scrollToSection(e, "faq")}
                      className="relative text-gray-700 hover:text-lavender-600 transition-all duration-300 px-3 py-2 rounded-md font-medium group"
                    >
                      <span className="relative z-10">FAQ</span>
                      <span className="absolute inset-0 bg-lavender-50 rounded-md scale-0 group-hover:scale-100 transition-transform duration-300 -z-0"></span>
                    </a>
                  </>
                ) : (
                  user && (
                    <>
                      <Link
                        to="/dashboard"
                        className={`relative transition-all duration-300 px-3 py-2 rounded-md font-medium group ${
                          isDashboard
                            ? "text-lavender-600"
                            : "text-gray-700 hover:text-lavender-600"
                        }`}
                      >
                        <span className="relative z-10">Dashboard</span>
                        <span
                          className={`absolute inset-0 bg-lavender-50 rounded-md transition-transform duration-300 -z-0 ${
                            isDashboard
                              ? "scale-100"
                              : "scale-0 group-hover:scale-100"
                          }`}
                        ></span>
                      </Link>
                      <Link
                        to="/journal"
                        className="relative text-gray-700 hover:text-lavender-600 transition-all duration-300 px-3 py-2 rounded-md font-medium group"
                      >
                        <span className="relative z-10">Journal</span>
                        <span className="absolute inset-0 bg-lavender-50 rounded-md scale-0 group-hover:scale-100 transition-transform duration-300 -z-0"></span>
                      </Link>
                      <Link
                        to="/chat"
                        className={`relative transition-all duration-300 px-3 py-2 rounded-md font-medium group ${
                          isChat
                            ? "text-lavender-600"
                            : "text-gray-700 hover:text-lavender-600"
                        }`}
                      >
                        <span className="relative z-10">AI Chat</span>
                        <span
                          className={`absolute inset-0 bg-lavender-50 rounded-md transition-transform duration-300 -z-0 ${
                            isChat
                              ? "scale-100"
                              : "scale-0 group-hover:scale-100"
                          }`}
                        ></span>
                      </Link>
                      <Link
                        to="/addiction-support"
                        className={`relative transition-all duration-300 px-3 py-2 rounded-md font-medium group ${
                          isAddictionSupport
                            ? "text-lavender-600"
                            : "text-gray-700 hover:text-lavender-600"
                        }`}
                      >
                        <span className="relative z-10 flex items-center space-x-1">
                          <Heart size={16} />
                          <span>Recovery</span>
                        </span>
                        <span
                          className={`absolute inset-0 bg-lavender-50 rounded-md transition-transform duration-300 -z-0 ${
                            isAddictionSupport
                              ? "scale-100"
                              : "scale-0 group-hover:scale-100"
                          }`}
                        ></span>
                      </Link>
                      <Link
                        to="/anxiety-support"
                        className={`relative transition-all duration-300 px-3 py-2 rounded-md font-medium group ${
                          isAnxietySupport
                            ? "text-lavender-600"
                            : "text-gray-700 hover:text-lavender-600"
                        }`}
                      >
                        <span className="relative z-10 flex items-center space-x-1">
                          <Brain size={16} />
                          <span>Anxiety</span>
                        </span>
                        <span
                          className={`absolute inset-0 bg-lavender-50 rounded-md transition-transform duration-300 -z-0 ${
                            isAnxietySupport
                              ? "scale-100"
                              : "scale-0 group-hover:scale-100"
                          }`}
                        ></span>
                      </Link>
                    </>
                  )
                )}

                {/* Streak Indicator */}
                {user && streak > 0 && (
                  <div className="flex items-center px-2 py-1 bg-gradient-to-r from-orange-100 to-red-100 rounded-md border border-orange-200">
                    <Flame size={16} className="text-orange-500 mr-1" />
                    <span className="text-sm font-medium text-orange-700">{streak}</span>
                  </div>
                )}

                <div className="flex items-center ml-3 space-x-2">
                  <button
                    onClick={onThemeToggle}
                    className="p-2 rounded-full text-gray-600 hover:text-lavender-600 transition-all duration-300 hover:bg-lavender-50 focus:outline-none"
                    aria-label="Toggle theme"
                  >
                    {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
                  </button>

                  <button
                    onClick={() => onLanguageChange && onLanguageChange("en")}
                    className="p-2 rounded-full text-gray-600 hover:text-lavender-600 transition-all duration-300 hover:bg-lavender-50 focus:outline-none flex items-center"
                    aria-label="Change language"
                  >
                    <Globe size={20} />
                  </button>
                </div>

                {renderAuthButtons()}
              </div>
            </div>

            <div className="md:hidden flex items-center space-x-3">
              {/* Mobile Streak Indicator */}
              {user && streak > 0 && (
                <div className="flex items-center px-2 py-1 bg-gradient-to-r from-orange-100 to-red-100 rounded-md border border-orange-200">
                  <Flame size={14} className="text-orange-500 mr-1" />
                  <span className="text-xs font-medium text-orange-700">{streak}</span>
                </div>
              )}
              
              {/* Mobile Profile Button */}
              {user && (
                <button
                  onClick={() => setShowProfileModal(true)}
                  className="p-1 rounded-full border border-gray-200 overflow-hidden"
                >
                  <div className="w-7 h-7 rounded-full overflow-hidden bg-lavender-100 flex items-center justify-center">
                    {userProfile?.avatar_url ? (
                      <img 
                        src={userProfile.avatar_url} 
                        alt={userProfile.full_name} 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User size={14} className="text-lavender-600" />
                    )}
                  </div>
                </button>
              )}
              
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="inline-flex items-center justify-center p-2 rounded-md text-gray-700 hover:text-lavender-600 transition-all duration-300 hover:bg-lavender-50 focus:outline-none"
                aria-expanded={isMenuOpen}
              >
                <span className="sr-only">Open main menu</span>
                {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        <div
          className={`md:hidden fixed left-0 right-0 transition-all duration-300 ease-in-out ${
            isMenuOpen
              ? "opacity-100 translate-y-0"
              : "opacity-0 -translate-y-full pointer-events-none"
          }`}
        >
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-white/95 supports-[backdrop-filter]:bg-white/80 backdrop-blur-lg shadow-lg">
            {!isDashboard && !isChat && !isAddictionSupport && !isAnxietySupport && !user ? (
              <>
                <a
                  href="#features"
                  onClick={(e) => scrollToSection(e, "features")}
                  className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-lavender-600 hover:bg-lavender-50 transition-all duration-300"
                >
                  Features
                </a>
                <a
                  href="#how-it-works"
                  onClick={(e) => scrollToSection(e, "how-it-works")}
                  className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-lavender-600 hover:bg-lavender-50 transition-all duration-300"
                >
                  How It Works
                </a>
                <a
                  href="#testimonials"
                  onClick={(e) => scrollToSection(e, "testimonials")}
                  className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-lavender-600 hover:bg-lavender-50 transition-all duration-300"
                >
                  Testimonials
                </a>
                <a
                  href="#faq"
                  onClick={(e) => scrollToSection(e, "faq")}
                  className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-lavender-600 hover:bg-lavender-50 transition-all duration-300"
                >
                  FAQ
                </a>
              </>
            ) : (
              user && (
                <>
                  <Link
                    to="/dashboard"
                    className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-lavender-600 hover:bg-lavender-50 transition-all duration-300"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Dashboard
                  </Link>
                  <Link
                    to="/journal"
                    className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-lavender-600 hover:bg-lavender-50 transition-all duration-300"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Journal
                  </Link>
                  <Link
                    to="/chat"
                    className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-lavender-600 hover:bg-lavender-50 transition-all duration-300"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    AI Chat
                  </Link>
                  <Link
                    to="/addiction-support"
                    className="flex items-center space-x-2 px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-lavender-600 hover:bg-lavender-50 transition-all duration-300"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <Heart size={16} />
                    <span>Recovery Support</span>
                  </Link>
                  <Link
                    to="/anxiety-support"
                    className="flex items-center space-x-2 px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-lavender-600 hover:bg-lavender-50 transition-all duration-300"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <Brain size={16} />
                    <span>Anxiety Support</span>
                  </Link>
                </>
              )
            )}

            {user ? (
              <Button
                variant="primary"
                size="sm"
                fullWidth
                className="text-sm transition-all duration-300 mt-2"
                onClick={handleSignOut}
                leftIcon={<LogOut size={16} />}
              >
                Sign Out
              </Button>
            ) : (
              !isDashboard &&
              !isChat &&
              !isAddictionSupport &&
              !isAnxietySupport && (
                <div className="flex flex-col space-y-2 pt-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    fullWidth
                    className="text-sm transition-all duration-300"
                    onClick={() => setShowAuthModal("signin")}
                    leftIcon={<LogIn size={16} />}
                  >
                    Sign In
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    fullWidth
                    className="text-sm transition-all duration-300"
                    onClick={() => setShowAuthModal("signup")}
                    leftIcon={<UserPlus size={16} />}
                  >
                    Sign Up
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    fullWidth
                    className="text-sm transition-all duration-300 flex items-center justify-center"
                    onClick={handleGoogleSignIn}
                  >
                    <FcGoogle size={16} className="mr-2" />
                    Sign in with Google
                  </Button>
                </div>
              )
            )}
          </div>
        </div>
      </nav>

      {/* Auth Modal */}
      {showAuthModal && (
        <AuthModal
          mode={showAuthModal}
          onClose={() => setShowAuthModal(null)}
        />
      )}

      {/* Profile Modal */}
      <UserProfileModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
      />
    </>
  );
};

export default Navbar;