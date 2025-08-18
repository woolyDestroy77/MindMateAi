import React, { useState, useEffect, useRef } from "react";
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
  Settings,
  Image,
  BookOpen,
  Users,
  Shield,
  Calendar
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import Button from "../ui/Button";
import AuthModal from "../auth/AuthModal";
import UserProfileModal from "../profile/UserProfileModal";
import NotificationCenter from "../notifications/NotificationCenter";
import NotificationSettingsModal from "../notifications/NotificationSettings";
import { useAuth } from "../../hooks/useAuth";

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
  const [showNotificationSettings, setShowNotificationSettings] = useState(false);
  const isDashboard = location.pathname === "/dashboard";
  const isChat = location.pathname === "/chat";
  const isAddictionSupport = location.pathname === "/addiction-support";
  const isAnxietySupport = location.pathname === "/anxiety-support";
  const isBlog = location.pathname.startsWith("/blog");
  const isTherapistDashboard = location.pathname === "/therapist-dashboard";
  const isTherapist = user?.user_metadata?.user_type === 'therapist' || user?.user_metadata?.is_therapist;
  const [streak, setStreak] = useState(0);

  // Load streak from localStorage or calculate it
  useEffect(() => {
    const calculateStreak = () => {
      if (!user) return;
      
      try {
        // Get today's date
        const today = new Date();
        const todayStr = today.toISOString().split('T')[0]; // YYYY-MM-DD format
        
        // Get stored login history
        let loginHistory = JSON.parse(localStorage.getItem('loginHistory') || '[]');
        
        // Add today to login history if not already present
        if (!loginHistory.includes(todayStr)) {
          loginHistory.push(todayStr);
          localStorage.setItem('loginHistory', JSON.stringify(loginHistory));
        }
        
        // Sort login history by date (oldest first)
        loginHistory.sort();
        
        // Calculate streak
        let currentStreak = 1; // Start with today
        
        // Start from the most recent date (excluding today) and work backwards
        for (let i = loginHistory.length - 2; i >= 0; i--) {
          const currentDate = new Date(loginHistory[i]);
          const nextDate = new Date(loginHistory[i + 1]);
          
          // Calculate difference in days
          const diffTime = Math.abs(nextDate.getTime() - currentDate.getTime());
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          
          if (diffDays === 1) {
            // Consecutive day
            currentStreak++;
          } else if (diffDays > 1) {
            // Streak broken
            break;
          }
        }
        
        // Update streak in localStorage
        localStorage.setItem('dailyStreak', currentStreak.toString());
        setStreak(currentStreak);
        
        console.log('Calculated streak:', currentStreak, 'Login history:', loginHistory);
      } catch (error) {
        console.error('Error calculating streak:', error);
        setStreak(0);
      }
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

  const renderAuthButtons = () => {
    if (user) {
      return (
        <div className="flex items-center space-x-2">
          <NotificationCenter />
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

    if (!isDashboard && !isChat && !isAddictionSupport && !isAnxietySupport && !isBlog) {
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
        </div>
      );
    }

    return null;
  };

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled || isDashboard || isChat || isAddictionSupport || isAnxietySupport || isBlog
            ? "bg-white/80 supports-[backdrop-filter]:bg-white/60 backdrop-blur-lg shadow-sm"
            : "bg-transparent"
        }`}
        style={{
          WebkitBackdropFilter:
            isScrolled || isDashboard || isChat || isAddictionSupport || isAnxietySupport || isBlog ? "blur(8px)" : "none",
          backdropFilter:
            isScrolled || isDashboard || isChat || isAddictionSupport || isAnxietySupport || isBlog ? "blur(8px)" : "none",
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Link
                  to={user ? (
                    user.user_metadata?.user_type === 'therapist' || user.user_metadata?.is_therapist 
                      ? "/therapist-dashboard" 
                      : "/dashboard"
                  ) : "/"}
                  className="text-2xl font-bold bg-gradient-to-r from-lavender-600 to-sage-500 bg-clip-text text-transparent"
                >
                  PureMind AI
                </Link>
              </div>
            </div>

            <div className="hidden md:block">
              <div className="ml-10 flex items-center space-x-3">
                {!isDashboard && !isChat && !isAddictionSupport && !isAnxietySupport && !isBlog && !user ? (
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
                      {isTherapist ? (
                        // Therapist Navigation
                        <>
                          <Link
                            to="/therapist-dashboard"
                            className={`relative transition-all duration-300 px-3 py-2 rounded-md font-medium group ${
                              isTherapistDashboard
                                ? "text-blue-600"
                                : "text-gray-700 hover:text-blue-600"
                            }`}
                          >
                            <span className="relative z-10">Dashboard</span>
                            <span
                              className={`absolute inset-0 bg-blue-50 rounded-md transition-transform duration-300 -z-0 ${
                                isTherapistDashboard
                                  ? "scale-100"
                                  : "scale-0 group-hover:scale-100"
                              }`}
                            ></span>
                          </Link>
                          
                          <Link
                            to="/therapist-sessions"
                            className="relative text-gray-700 hover:text-blue-600 transition-all duration-300 px-3 py-2 rounded-md font-medium group"
                          >
                            <span className="relative z-10">Sessions</span>
                            <span className="absolute inset-0 bg-blue-50 rounded-md scale-0 group-hover:scale-100 transition-transform duration-300 -z-0"></span>
                          </Link>
                          
                          <Link
                            to="/therapist-clients"
                            className="relative text-gray-700 hover:text-blue-600 transition-all duration-300 px-3 py-2 rounded-md font-medium group"
                          >
                            <span className="relative z-10">Clients</span>
                            <span className="absolute inset-0 bg-blue-50 rounded-md scale-0 group-hover:scale-100 transition-transform duration-300 -z-0"></span>
                          </Link>
                          
                          <Link
                            to="/therapist-schedule"
                            className="relative text-gray-700 hover:text-blue-600 transition-all duration-300 px-3 py-2 rounded-md font-medium group"
                          >
                            <span className="relative z-10">Schedule</span>
                            <span className="absolute inset-0 bg-blue-50 rounded-md scale-0 group-hover:scale-100 transition-transform duration-300 -z-0"></span>
                          </Link>
                          
                          <Link
                            to="/therapist-earnings"
                            className="relative text-gray-700 hover:text-blue-600 transition-all duration-300 px-3 py-2 rounded-md font-medium group"
                          >
                            <span className="relative z-10">Earnings</span>
                            <span className="absolute inset-0 bg-blue-50 rounded-md scale-0 group-hover:scale-100 transition-transform duration-300 -z-0"></span>
                          </Link>
                          
                          {/* Admin Panel for authorized users */}
                          {user?.email === 'youssef.arafat09@gmail.com' && (
                            <Link
                              to="/admin"
                              className="relative text-gray-700 hover:text-red-600 transition-all duration-300 px-3 py-2 rounded-md font-medium group"
                            >
                              <span className="relative z-10">Admin</span>
                              <span className="absolute inset-0 bg-red-50 rounded-md scale-0 group-hover:scale-100 transition-transform duration-300 -z-0"></span>
                            </Link>
                          )}
                        </>
                      ) : (
                        // Patient Navigation
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
                          
                          {/* Support Dropdown */}
                          <div className="relative group">
                            <button className="relative text-gray-700 hover:text-lavender-600 transition-all duration-300 px-3 py-2 rounded-md font-medium flex items-center space-x-1">
                              <span className="relative z-10">Support</span>
                              <span className="text-xs">▼</span>
                              <span className="absolute inset-0 bg-lavender-50 rounded-md scale-0 group-hover:scale-100 transition-transform duration-300 -z-0"></span>
                            </button>
                            <div className="absolute top-full left-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                              <Link
                                to="/addiction-support"
                                className="flex items-center space-x-2 px-4 py-3 text-sm text-gray-700 hover:bg-lavender-50 hover:text-lavender-600 first:rounded-t-lg"
                              >
                                <Heart size={16} />
                                <span>Recovery Support</span>
                              </Link>
                              <Link
                                to="/anxiety-support"
                                className="flex items-center space-x-2 px-4 py-3 text-sm text-gray-700 hover:bg-lavender-50 hover:text-lavender-600"
                              >
                                <Brain size={16} />
                                <span>Anxiety Support</span>
                              </Link>
                              <Link
                                to="/therapists"
                                className="flex items-center space-x-2 px-4 py-3 text-sm text-gray-700 hover:bg-lavender-50 hover:text-lavender-600"
                              >
                                <Users size={16} />
                                <span>Find Therapists</span>
                              </Link>
                              <Link
                                to="/my-therapy-sessions"
                                className="flex items-center space-x-2 px-4 py-3 text-sm text-gray-700 hover:bg-lavender-50 hover:text-lavender-600 last:rounded-b-lg"
                              >
                                <Calendar size={16} />
                                <span>My Sessions</span>
                              </Link>
                            </div>
                          </div>
                          
                          {/* Tools Dropdown */}
                          <div className="relative group">
                            <button className="relative text-gray-700 hover:text-lavender-600 transition-all duration-300 px-3 py-2 rounded-md font-medium flex items-center space-x-1">
                              <span className="relative z-10">Tools</span>
                              <span className="text-xs">▼</span>
                              <span className="absolute inset-0 bg-lavender-50 rounded-md scale-0 group-hover:scale-100 transition-transform duration-300 -z-0"></span>
                            </button>
                            <div className="absolute top-full left-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                              <Link
                                to="/journal"
                                className="flex items-center space-x-2 px-4 py-3 text-sm text-gray-700 hover:bg-lavender-50 hover:text-lavender-600 first:rounded-t-lg"
                              >
                                <Image size={16} />
                                <span>Journal</span>
                              </Link>
                              <Link
                                to="/blog"
                                className="flex items-center space-x-2 px-4 py-3 text-sm text-gray-700 hover:bg-lavender-50 hover:text-lavender-600 last:rounded-b-lg"
                              >
                                <BookOpen size={16} />
                                <span>Blog</span>
                              </Link>
                            </div>
                          </div>
                          
                          {/* Admin Panel for authorized users */}
                          {user?.email === 'youssef.arafat09@gmail.com' && (
                            <Link
                              to="/admin"
                              className="relative text-gray-700 hover:text-red-600 transition-all duration-300 px-3 py-2 rounded-md font-medium group"
                            >
                              <span className="relative z-10">Admin</span>
                              <span className="absolute inset-0 bg-red-50 rounded-md scale-0 group-hover:scale-100 transition-transform duration-300 -z-0"></span>
                            </Link>
                          )}
                        </>
                      )}
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
                  
                  {user && (
                    <button
                      onClick={() => setShowNotificationSettings(true)}
                      className="p-2 rounded-full text-gray-600 hover:text-lavender-600 transition-all duration-300 hover:bg-lavender-50 focus:outline-none"
                      aria-label="Notification settings"
                    >
                      <Settings size={20} />
                    </button>
                  )}
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
              
              {/* Mobile Notification Center */}
              {user && <NotificationCenter />}
              
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
            {!isDashboard && !isChat && !isAddictionSupport && !isAnxietySupport && !isBlog && !user ? (
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
                  {isTherapist ? (
                    // Therapist Mobile Navigation
                    <>
                      <Link
                        to="/therapist-dashboard"
                        className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-blue-50 transition-all duration-300"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        Dashboard
                      </Link>
                      <Link
                        to="/therapist-sessions"
                        className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-blue-50 transition-all duration-300"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        Sessions
                      </Link>
                      <Link
                        to="/therapist-clients"
                        className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-blue-50 transition-all duration-300"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        Clients
                      </Link>
                      <Link
                        to="/therapist-schedule"
                        className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-blue-50 transition-all duration-300"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        Schedule
                      </Link>
                      <Link
                        to="/therapist-earnings"
                        className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-blue-50 transition-all duration-300"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        Earnings
                      </Link>
                      {user?.email === 'youssef.arafat09@gmail.com' && (
                        <Link
                          to="/admin"
                          className="flex items-center space-x-2 px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-red-600 hover:bg-red-50 transition-all duration-300"
                          onClick={() => setIsMenuOpen(false)}
                        >
                          <Settings size={16} />
                          <span>Admin Panel</span>
                        </Link>
                      )}
                    </>
                  ) : (
                    // Patient Mobile Navigation
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
                      <Link
                        to="/blog"
                        className="flex items-center space-x-2 px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-lavender-600 hover:bg-lavender-50 transition-all duration-300"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <BookOpen size={16} />
                        <span>Blog</span>
                      </Link>
                      <Link
                        to="/therapists"
                        className="flex items-center space-x-2 px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-lavender-600 hover:bg-lavender-50 transition-all duration-300"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <Users size={16} />
                        <span>Find Therapists</span>
                      </Link>
                      <Link
                        to="/my-therapy-sessions"
                        className="flex items-center space-x-2 px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-lavender-600 hover:bg-lavender-50 transition-all duration-300"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <Calendar size={16} />
                        <span>My Sessions</span>
                      </Link>
                      {user?.email === 'youssef.arafat09@gmail.com' && (
                        <Link
                          to="/admin"
                          className="flex items-center space-x-2 px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-red-600 hover:bg-red-50 transition-all duration-300"
                          onClick={() => setIsMenuOpen(false)}
                        >
                          <Settings size={16} />
                          <span>Admin Panel</span>
                        </Link>
                      )}
                    </>
                  )}
                  <button
                    onClick={() => {
                      setShowNotificationSettings(true);
                      setIsMenuOpen(false);
                    }}
                    className="flex items-center space-x-2 px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-lavender-600 hover:bg-lavender-50 transition-all duration-300 w-full text-left"
                  >
                    <Settings size={16} />
                    <span>Notification Settings</span>
                  </button>
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
              !isAnxietySupport &&
              !isBlog && (
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
      
      {/* Notification Settings Modal */}
      <NotificationSettingsModal
        isOpen={showNotificationSettings}
        onClose={() => setShowNotificationSettings(false)}
      />
    </>
  );
};

export default Navbar;