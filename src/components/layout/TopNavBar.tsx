import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X } from 'lucide-react';
import logo from '../../assets/logo.jpg';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import ToastStack from '../shared/ToastStack';
import { usePWAInstall } from '../../hooks/usePWAInstall';

export default function TopNavBar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('hero');
  const [dbRole, setDbRole] = useState<'student' | 'admin' | 'instructor' | null>(null);
  const { deferredPrompt, installApp: handleInstallApp } = usePWAInstall();

  const navItems = [
    { name: 'Home', id: 'hero' },
    { name: 'Philosophy', id: 'philosophy' },
    { name: 'Courses', id: 'courses' },
    { name: 'Our Spaces', id: 'spaces' },
    { name: 'Events', id: 'events' },
    { name: 'Contact', id: 'contact' },
  ];

  useEffect(() => {
    // Only track active landing sections on the landing page.
    if (location.pathname !== '/') return;
    const handleScrollTracking = () => {
      const sections = navItems.map(item => document.getElementById(item.id));
      const scrollPosition = window.scrollY + 100;

      sections.forEach((section, index) => {
        if (section) {
          const sectionTop = section.offsetTop;
          const sectionHeight = section.offsetHeight;
          if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
            setActiveSection(navItems[index].id);
          }
        }
      });
    };

    window.addEventListener('scroll', handleScrollTracking);
    return () => window.removeEventListener('scroll', handleScrollTracking);
  }, [location.pathname]);

  useEffect(() => {
    let cancelled = false;

    async function loadRoleFromDb() {
      if (!user) {
        setDbRole(null);
        return;
      }

      const { data } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .maybeSingle();

      if (cancelled) return;

      const role = data?.role;
      if (role === 'student' || role === 'admin' || role === 'instructor') {
        setDbRole(role);
      } else {
        setDbRole(user.role);
      }
    }

    loadRoleFromDb();
    return () => {
      cancelled = true;
    };
  }, [user]);

  const resolvedRole = dbRole ?? user?.role ?? null;
  const isSignedIn = Boolean(user);
  
  let portalLabel = 'Student Portal';
  let portalPath = '/student';

  if (resolvedRole === 'admin') {
    portalLabel = 'Admin Dashboard';
    portalPath = '/admin';
  } else if (resolvedRole === 'instructor') {
    portalLabel = 'Instructor Dashboard';
    portalPath = '/instructor';
  }

  const handleScroll = (id: string) => {
    setIsOpen(false);
    if (location.pathname === '/') {
      const element = document.getElementById(id);
      if (element) {
        const offset = 80;
        const bodyRect = document.body.getBoundingClientRect().top;
        const elementRect = element.getBoundingClientRect().top;
        const elementPosition = elementRect - bodyRect;
        const offsetPosition = elementPosition - offset;

        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth'
        });
        setActiveSection(id);
      }
    } else {
      navigate('/#' + id);
    }
  };

  return (
    <nav className="fixed top-0 left-0 right-0 w-full z-100 bg-[#F5F5F0]/80 backdrop-blur-xl border-b border-[#1A1A1A]/5">
      <div className="max-w-[1440px] mx-auto px-4 md:px-12 h-16 md:h-20 lg:h-24 flex justify-between items-center relative">
        {/* Logo with background image effect */}
        <motion.div 
          whileHover={{ scale: 1.02 }}
          className="relative flex items-center cursor-pointer group"
          onClick={() => navigate('/')}
        >
          {/* Background Logo with Opacity */}
          <div 
            className="absolute inset-0 w-full h-full bg-cover bg-center opacity-20 group-hover:opacity-30 transition-opacity duration-500 rounded-full"
            style={{ 
              backgroundImage: `url(${logo})`,
              backgroundSize: 'contain',
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'center'
            }}
          />
          
          {/* Text with Logo as Background */}
          <div className="hidden md:flex items-center ml-3 lg:ml-4 relative">
            <div className="relative px-4 py-2 rounded-2xl overflow-hidden">
              {/* Background logo overlay for text */}
              <div 
                className="absolute inset-0 bg-cover bg-center opacity-10 group-hover:opacity-20 transition-all duration-500 blur-[1px]"
                style={{ 
                  backgroundImage: `url(${logo})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center'
                }}
              />
              <span className="relative z-10 text-[#C62828] text-xl lg:text-2xl font-black tracking-tighter drop-shadow-sm">
                Leidenschaft
              </span>
              <span className="relative z-10 text-[#1A1A1A] ml-1 lg:ml-2 text-xl lg:text-2xl font-black tracking-tighter drop-shadow-sm">
                Klub
              </span>
            </div>
          </div>
          
          {/* Mobile: Just logo image with subtle effect */}
          <div className="md:hidden relative">
            <div className="w-10 h-10 rounded-full overflow-hidden shadow-md group-hover:shadow-lg transition-all">
              <img 
                src={logo} 
                alt="Leidenschaft Klub" 
                width={40}
                height={40}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
              />
            </div>
          </div>
        </motion.div>
        
        {/* Desktop Nav Items */}
        <div className="hidden lg:flex gap-8 items-center bg-white/40 backdrop-blur-md px-8 py-3 rounded-full border border-[#1A1A1A]/5 shadow-sm">
          {navItems.map((item) => (
            <button 
              key={item.id}
              onClick={() => handleScroll(item.id)} 
              className={`font-black text-[11px] uppercase tracking-[0.2em] transition-all relative py-1 px-1 group ${
                location.pathname === '/' && activeSection === item.id ? 'text-[#C62828]' : 'text-[#1A1A1A]/40'
              } hover:text-[#C62828]`}
            >
              {item.name}
              {location.pathname === '/' && activeSection === item.id && (
                <motion.div 
                  layoutId="activeTab"
                  className="absolute -bottom-1 left-0 right-0 h-0.5 bg-[#C62828] rounded-full"
                />
              )}
            </button>
          ))}
        </div>

        {/* Right Side - Auth Actions (Desktop) + Mobile Toggle */}
        <div className="flex items-center gap-4">
          {/* Auth Actions - Desktop only */}
          <div className="hidden lg:flex items-center gap-6">
            {deferredPrompt && (
              <button
                onClick={handleInstallApp}
                className="hidden xl:flex items-center gap-2 text-[#C62828] font-black text-[10px] uppercase tracking-[0.2em] border border-[#C62828]/20 px-4 py-2 rounded-xl hover:bg-[#C62828] hover:text-white transition-all"
              >
                Install App
              </button>
            )}
            {isSignedIn ? (
              <button
                onClick={() => navigate(portalPath)}
                className="bg-[#C62828] text-white px-8 py-3 rounded-xl font-black text-[11px] uppercase tracking-[0.2em] hover:shadow-2xl hover:shadow-[#C62828]/20 hover:-translate-y-0.5 active:scale-95 transition-all shadow-xl shadow-[#C62828]/10"
              >
                {portalLabel}
              </button>
            ) : (
              <>
                <button
                  onClick={() => navigate('/login')}
                  className="text-[#1A1A1A] font-black text-[11px] uppercase tracking-[0.2em] hover:text-[#C62828] transition-all"
                >
                  Sign In
                </button>
                <button
                  onClick={() => navigate('/register')}
                  className="bg-[#C62828] text-white px-8 py-3 rounded-xl font-black text-[11px] uppercase tracking-[0.2em] hover:shadow-2xl hover:shadow-[#C62828]/20 hover:-translate-y-0.5 active:scale-95 transition-all shadow-xl shadow-[#C62828]/10"
                >
                  Apply Now
                </button>
              </>
            )}
          </div>

          {/* Mobile Toggle - Always visible on mobile, properly positioned */}
          <button 
            onClick={() => setIsOpen(!isOpen)}
            className="lg:hidden relative w-10 h-10 flex items-center justify-center bg-white/80 backdrop-blur-sm rounded-xl border border-[#1A1A1A]/10 hover:bg-white hover:shadow-lg transition-all z-20"
            aria-label="Toggle Menu"
          >
            <AnimatePresence mode="wait">
              {isOpen ? (
                <motion.div
                  key="close"
                  initial={{ rotate: -90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: 90, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <X className="w-5 h-5 text-[#C62828]" />
                </motion.div>
              ) : (
                <motion.div
                  key="menu"
                  initial={{ rotate: 90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: -90, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <Menu className="w-5 h-5 text-[#1A1A1A]" />
                </motion.div>
              )}
            </AnimatePresence>
          </button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="lg:hidden fixed top-0 left-0 right-0 bottom-0 w-full h-screen bg-[#F5F5F0] pt-20 px-6 z-99 flex flex-col items-center gap-6 overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Mobile Menu Header with Logo Background */}
            <div className="w-full flex justify-between items-center pb-4 border-b border-[#1A1A1A]/10 mb-4 relative">
              <div className="flex items-center gap-3 relative">
                {/* Background logo for mobile menu header */}
                <div 
                  className="absolute inset-0 w-full h-full bg-cover bg-center opacity-10 rounded-2xl"
                  style={{ 
                    backgroundImage: `url(${logo})`,
                    backgroundSize: 'contain',
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'left center'
                  }}
                />
                <div className="w-12 h-12 rounded-full overflow-hidden bg-[#F5F5F0] shadow-md relative z-10">
                  <img src={logo} alt="" width={48} height={48} className="w-full h-full object-cover" />
                </div>
                <div className="relative z-10">
                  <span className="text-base font-black text-[#C62828] block">Leidenschaft</span>
                  <span className="text-sm font-black text-[#1A1A1A]">Klub</span>
                </div>
              </div>
              {/* Close button inside menu */}
              <button 
                onClick={() => setIsOpen(false)}
                className="w-10 h-10 flex items-center justify-center bg-white rounded-xl border border-[#1A1A1A]/10 hover:bg-[#C62828] hover:text-white transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Navigation Items */}
            <div className="w-full space-y-1">
              {navItems.map((item) => (
                <motion.button 
                  key={item.id}
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: navItems.indexOf(item) * 0.05 }}
                  onClick={() => handleScroll(item.id)} 
                  className={`w-full text-left px-6 py-4 rounded-xl font-black text-base uppercase tracking-tight transition-all relative ${
                    activeSection === item.id 
                      ? 'text-[#C62828] bg-[#C62828]/5' 
                      : 'text-[#1A1A1A]/60 hover:text-[#C62828] hover:bg-[#C62828]/5'
                  }`}
                >
                  {item.name}
                  {activeSection === item.id && (
                    <motion.div 
                      layoutId="mobileActiveTab"
                      className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-[#C62828] rounded-r-full"
                    />
                  )}
                </motion.button>
              ))}
            </div>

            {/* Auth Actions - Mobile */}
            <div className="w-full pt-6 mt-4 border-t border-[#1A1A1A]/10 space-y-3">
              {deferredPrompt && (
                <motion.button
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.25 }}
                  onClick={handleInstallApp}
                  className="w-full py-4 text-[#C62828] font-black uppercase tracking-wider text-sm border-2 border-[#C62828] rounded-2xl hover:bg-[#C62828] hover:text-white transition-all flex items-center justify-center gap-2"
                >
                  Download Mobile App
                </motion.button>
              )}
              {isSignedIn ? (
                <motion.button
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  onClick={() => { navigate(portalPath); setIsOpen(false); }}
                  className="w-full py-4 bg-[#C62828] text-white font-black uppercase tracking-wider text-sm rounded-2xl shadow-xl shadow-[#C62828]/20 hover:shadow-2xl hover:-translate-y-0.5 transition-all"
                >
                  {portalLabel}
                </motion.button>
              ) : (
                <>
                  <motion.button
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    onClick={() => { navigate('/login'); setIsOpen(false); }}
                    className="w-full py-4 text-[#1A1A1A] font-black uppercase tracking-wider text-sm border-2 border-[#1A1A1A] rounded-2xl hover:bg-[#1A1A1A] hover:text-white transition-all"
                  >
                    Sign In
                  </motion.button>
                  <motion.button
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.35 }}
                    onClick={() => { navigate('/register'); setIsOpen(false); }}
                    className="w-full py-4 bg-[#C62828] text-white font-black uppercase tracking-wider text-sm rounded-2xl shadow-xl shadow-[#C62828]/20 hover:shadow-2xl hover:-translate-y-0.5 transition-all"
                  >
                    Apply Now
                  </motion.button>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <ToastStack />
    </nav>
  );
}