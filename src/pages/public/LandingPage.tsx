import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, MapPin, Mail, Calendar, Users, ChevronRight } from 'lucide-react';
import TopNavBar from '../../components/layout/TopNavBar';
import Footer from '../../components/layout/Footer';
import logo from '../../assets/logo.jpg';
import { fetchAllLevels, type Level } from '../../services/adminService';
import { bookWebsiteEvent, fetchWebsiteEvents, fetchWebsiteSpaces, publicAssetUrl, type WebsiteEvent, type WebsiteSpace } from '../../services/websiteService';
import { useAuth } from '../../context/AuthContext';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
      delayChildren: 0.1,
    },
  },
};
export default function LandingPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [spaces, setSpaces] = useState<WebsiteSpace[]>([]);
  const [events, setEvents] = useState<WebsiteEvent[]>([]);
  const [levels, setLevels] = useState<Level[]>([]);
  const [bookingOpen, setBookingOpen] = useState(false);
  const [bookingEvent, setBookingEvent] = useState<WebsiteEvent | null>(null);
  const [bName, setBName] = useState('');
  const [bEmail, setBEmail] = useState('');
  const [bSeats, setBSeats] = useState('1');
  const [bookingError, setBookingError] = useState('');
  const [bookingSuccess, setBookingSuccess] = useState('');
  const [bookingSubmitting, setBookingSubmitting] = useState(false);

  const scrollToId = (id: string) => {
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
    }
  };

  useEffect(() => {
    if (location.hash) {
      scrollToId(location.hash.replace('#', ''));
    }
  }, [location]);

  useEffect(() => {
    let cancelled = false;
    async function loadLandingContent() {
      try {
        const [s, e, l] = await Promise.all([
          fetchWebsiteSpaces(),
          fetchWebsiteEvents(),
          fetchAllLevels(),
        ]);
        if (cancelled) return;
        setSpaces(s);
        setEvents(e);
        setLevels(l);
      } catch {
        // silently fallback: keep landing page usable even if CMS is empty
      }
    }
    loadLandingContent();
    return () => { cancelled = true; };
  }, []);

  const curatedPath = useMemo(() => {
    const sorted = [...levels].sort((a, b) => a.name.localeCompare(b.name));
    const cols = ['lg:col-span-1', 'lg:col-span-1', 'lg:col-span-2', 'lg:col-span-1', 'lg:col-span-1', 'lg:col-span-2'];
    return sorted.slice(0, 6).map((lv, idx) => ({
      tag: lv.name,
      title: lv.description || 'CEFR-aligned progression',
      col: cols[idx] ?? 'lg:col-span-1',
    }));
  }, [levels]);

  const fallbackSpaces: WebsiteSpace[] = useMemo(() => ([
    {
      id: 'fallback-1',
      image_path: "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=800&h=600&fit=crop",
      title: "Main Classroom",
      description: "Spacious learning environment with modern equipment",
      category: "Classroom",
      order_index: 0,
    },
    {
      id: 'fallback-2',
      image_path: "https://images.unsplash.com/photo-1577896851231-70ef18881754?w=800&h=600&fit=crop",
      title: "Study Lounge",
      description: "Cozy area for self-study and collaboration",
      category: "Lounge",
      order_index: 1,
    },
    {
      id: 'fallback-3',
      image_path: "https://images.unsplash.com/photo-1523580494863-6f3031224c94?w=800&h=600&fit=crop",
      title: "Library",
      description: "Extensive collection of German literature",
      category: "Library",
      order_index: 2,
    },
    {
      id: 'fallback-4',
      image_path: "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=800&h=600&fit=crop",
      title: "Conference Room",
      description: "Professional space for workshops and events",
      category: "Meeting",
      order_index: 3,
    },
    {
      id: 'fallback-5',
      image_path: "https://images.unsplash.com/photo-1509062522246-3755977927d7?w=800&h=600&fit=crop",
      title: "Outdoor Terrace",
      description: "Relaxing space with city views",
      category: "Outdoor",
      order_index: 4,
    },
    {
      id: 'fallback-6',
      image_path: "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=800&h=600&fit=crop",
      title: "Digital Lab",
      description: "Tech-enabled learning experience",
      category: "Technology",
      order_index: 5,
    },
  ]), []);

  const fallbackEvents: WebsiteEvent[] = useMemo(() => ([
    {
      id: 'fallback-e1',
      title: "German Language Workshop",
      description: "A focused workshop to boost your German speaking confidence.",
      starts_at: new Date('2026-03-25T10:00:00Z').toISOString(),
      ends_at: null,
      location: "Main Hall, Berlin Campus",
      type: "Workshop",
      image_path: "https://images.unsplash.com/photo-1556761175-b413da4baf72?w=800&h=500&fit=crop",
      capacity: 25,
      price: "Free",
      is_active: true,
    },
    {
      id: 'fallback-e2',
      title: "Cultural Exchange Night",
      description: "Meet fellow learners and native speakers for an immersive night.",
      starts_at: new Date('2026-04-05T18:00:00Z').toISOString(),
      ends_at: null,
      location: "Event Space, Munich Campus",
      type: "Social",
      image_path: "https://images.unsplash.com/photo-1523580494863-6f3031224c94?w=800&h=500&fit=crop",
      capacity: 50,
      price: "€15",
      is_active: true,
    },
    {
      id: 'fallback-e3',
      title: "Goethe Exam Preparation",
      description: "Intensive practice and strategy session for your upcoming exam.",
      starts_at: new Date('2026-04-12T09:00:00Z').toISOString(),
      ends_at: null,
      location: "Online & In-Person",
      type: "Intensive",
      image_path: "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=800&h=500&fit=crop",
      capacity: 15,
      price: "€89",
      is_active: true,
    },
    {
      id: 'fallback-e4',
      title: "Networking Stammtisch",
      description: "A relaxed meetup to practice German and grow your network.",
      starts_at: new Date('2026-04-20T19:00:00Z').toISOString(),
      ends_at: null,
      location: "Berlin Cultural Center",
      type: "Networking",
      image_path: "https://images.unsplash.com/photo-1515187029135-8ee3e6d4d4a1?w=800&h=500&fit=crop",
      capacity: 40,
      price: "Free",
      is_active: true,
    },
  ]), []);

  const openBooking = (event: WebsiteEvent) => {
    setBookingEvent(event);
    setBookingOpen(true);
    setBookingError('');
    setBookingSuccess('');
    setBSeats('1');
    setBName(user?.name ?? '');
    setBEmail(user?.email ?? '');
  };

  const handleBook = async () => {
    if (!bookingEvent) return;
    const seats = Number(bSeats);
    if (!bName.trim() || !bEmail.trim()) { setBookingError('Name and email are required.'); return; }
    if (Number.isNaN(seats) || seats < 1 || seats > 10) { setBookingError('Seats must be between 1 and 10.'); return; }
    setBookingSubmitting(true);
    setBookingError('');
    try {
      await bookWebsiteEvent({ eventId: bookingEvent.id, userId: user?.id ?? null, name: bName.trim(), email: bEmail.trim(), seats });
      setBookingSuccess('Booking confirmed. See you there!');
    } catch (e: unknown) {
      setBookingError(e instanceof Error ? e.message : 'Booking failed');
    } finally {
      setBookingSubmitting(false);
    }
  };

  return (
    <motion.div 
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="min-h-screen bg-[#F5F5F0] text-[#1A1A1A] overflow-x-hidden"
    >
      <TopNavBar />
      
      <main>
        {/* Hero Section with Enhanced Background Effects */}
        <section id="hero" className="relative pt-20 sm:pt-24 md:pt-32 min-h-screen flex flex-col items-center justify-center px-4 sm:px-6 md:px-8 overflow-hidden bg-white">
          {/* Animated Background with Image Overlay */}
          <div className="absolute inset-0 z-0">
            {/* Background Image with Parallax Effect */}
            <motion.div 
              initial={{ scale: 1.1 }}
              animate={{ scale: 1 }}
              transition={{ duration: 1.5 }}
              className="absolute inset-0 bg-cover bg-center opacity-100"
              style={{
                backgroundImage: "url('https://www.tripsavvy.com/thmb/2y4rC2mDASnHyTWwRDFIp9lyoYE=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc()/Brandenburg-Gate-at-sunset-58c5ca2c5f9b58af5c254f8a.jpg')",
              }}
            />
            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-linear-to-br from-white via-white/65 to-[#F5F5F0]/90" />
            
            {/* Animated Particles - using percentage-based positioning */}
            <div className="absolute inset-0 overflow-hidden">
              {[...Array(20)].map((_, i) => (
                <motion.div
                  key={i}
                  initial={{
                    x: `${Math.random() * 100}%`,
                    y: `${Math.random() * 100}%`,
                    scale: Math.random() * 0.5 + 0.2
                  }}
                  animate={{
                    y: [null, -30, 30, -30],
                    x: [null, 20, -20, 20],
                  }}
                  transition={{
                    duration: Math.random() * 10 + 15,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                  className="absolute w-1 h-1 bg-[#C62828]/30 rounded-full"
                />
              ))}
            </div>
            
            {/* Decorative Elements */}
            <div className="absolute top-[10%] left-[5%] w-[20rem] md:w-160 h-80 md:h-160 bg-[#C62828]/5 rounded-full blur-[120px] animate-pulse" />
            <div className="absolute bottom-[10%] right-[5%] w-[20rem] md:w-160 h-80 md:h-160 bg-[#D4A373]/10 rounded-full blur-[120px] animate-pulse delay-1000" />
          </div>

          <motion.div 
            variants={containerVariants}
            className="z-10 text-center max-w-5xl w-full"
          >
            <motion.div
              initial={{ rotate: -10, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              transition={{ duration: 0.8 }}
              className="inline-block"
            >
              <img 
                alt="Logo" 
                className="mx-auto mb-2 hover:rotate-12 transition-transform duration-500"
                src={logo}
              />
            </motion.div>
            
            <motion.h1 
              variants={containerVariants}
              className="text-4xl sm:text-5xl md:text-7xl lg:text-9xl font-black text-[#1A1A1A] tracking-tighter leading-[0.85] mb-4 sm:mb-6 md:mb-8"
            >
              Leidenschaft <br className="sm:hidden" /> <span className="text-[#C62828]">Klub</span>
            </motion.h1>
            
            <motion.p 
              variants={containerVariants}
              className="text-base sm:text-lg md:text-2xl lg:text-3xl text-[#1A1A1A]/60 font-medium tracking-tight mb-8 sm:mb-10 md:mb-16 max-w-3xl mx-auto px-2 sm:px-4"
            >
              Experience the precision and heart of German language mastery. From passion to professionalism.
            </motion.p>
            
            <motion.div variants={containerVariants} className="flex flex-col sm:flex-row gap-3 sm:gap-4 md:gap-6 justify-center px-2 sm:px-4 w-full max-w-md mx-auto sm:max-w-none">
              <button 
                onClick={() => navigate('/register')}
                className="w-full sm:w-auto bg-[#C62828] text-white px-6 sm:px-8 md:px-12 py-3 sm:py-4 md:py-5 rounded-2xl font-black text-base sm:text-lg md:text-xl hover:shadow-[0_20px_40px_rgba(198,40,40,0.25)] hover:-translate-y-1 transition-all active:scale-95 shadow-xl shadow-[#C62828]/20"
              >
                Join the Klub
              </button>
              <button 
                onClick={() => scrollToId('courses')}
                className="w-full sm:w-auto bg-white border-2 border-[#1A1A1A] text-[#1A1A1A] px-6 sm:px-8 md:px-12 py-3 sm:py-4 md:py-5 rounded-2xl font-black text-base sm:text-lg md:text-xl hover:bg-[#1A1A1A] hover:text-white transition-all active:scale-95"
              >
                Explore Courses
              </button>
            </motion.div>
          </motion.div>
        </section>

        {/* Philosophy Section */}
        <section id="philosophy" className="py-16 sm:py-20 md:py-32 lg:py-40 px-4 sm:px-6 md:px-8 bg-[#F5F5F0]">
          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-10 sm:gap-12 md:gap-16 lg:gap-24 items-center">
            <motion.div 
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 1 }}
              className="relative"
            >
              <div className="aspect-4/5 bg-white rounded-3xl sm:rounded-4xl overflow-hidden shadow-2xl relative z-10">
                <img 
                  alt="Community" 
                  className="w-full h-full object-cover "
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuBAxHLgRUfbhMq9lSE9Hj37KROGE2JRw-ofTOrW6J2SwQdtBxQplSODlzVK2QEjyym-q7hh3a2MpEH8U5NKREKj1nKQAhcLw7VMP35po1CwGwMcYrVYeq2cHS0J4E0CClb26BHjAftWsdeIId9K9j3S8EMVf5yAb_qLA2wpJiFoxySh8eyvgcT-_IwyBS7pTrNVx0r3PfFtPHgA7Jcrisov_vmNTqBdtcjxIJWdfCGUWHJhW_dCFfaMYLv_qB2RY-1QltfOOO3M1g"
                />
              </div>
              <motion.div 
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.5 }}
                className="absolute -bottom-8 -right-4 sm:-bottom-12 sm:-right-12 bg-[#D4A373] p-6 sm:p-8 md:p-12 rounded-3xl sm:rounded-4xl text-white hidden md:block max-w-xs sm:max-w-sm shadow-2xl z-20"
              >
                <div className="text-4xl sm:text-6xl font-serif mb-3 sm:mb-6 opacity-30">"</div>
                <p className="text-lg sm:text-xl md:text-2xl leading-relaxed font-bold italic">
                  Language is the road map of a culture.
                </p>
              </motion.div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 1 }}
            >
              <h4 className="text-[#D4A373] font-black uppercase tracking-[0.3em] text-xs md:text-sm mb-4 md:mb-6">Our Philosophy</h4>
              <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-[#1A1A1A] tracking-tighter mb-6 sm:mb-8 md:mb-10 leading-tight">
                A community where <br/><span className="text-[#C62828]">language meets culture.</span>
              </h2>
              <div className="space-y-4 sm:space-y-6 md:space-y-8 text-base sm:text-lg md:text-xl text-[#1A1A1A]/70 leading-relaxed font-medium">
                <p>
                  At Leidenschaft Klub, we believe learning German is more than memorizing grammar rules. It's about unlocking a new worldview.
                </p>
                <p>
                  Our philosophy centers on <span className="text-[#1A1A1A] font-bold underline decoration-[#C62828] decoration-4 underline-offset-4">'Leidenschaft'</span> — the passionate pursuit of excellence. transform enthusiasm into expertise.
                </p>
              </div>
              
              <div className="mt-10 sm:mt-14 md:mt-20 flex flex-wrap gap-6 sm:gap-8 md:gap-12">
                {[
                  { val: "12+", label: "Experts" },
                  { val: "500+", label: "Students" },
                  { val: "98%", label: "Success" }
                ].map((stat, i) => (
                  <motion.div 
                    key={i}
                    whileHover={{ scale: 1.1, color: "#C62828" }}
                    className="transition-colors"
                  >
                    <div className="text-3xl sm:text-4xl md:text-5xl font-black text-[#1A1A1A]">{stat.val}</div>
                    <div className="text-xs uppercase tracking-widest font-black text-[#D4A373] mt-2">{stat.label}</div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </section>

        {/* Levels Section */}
        <section id="courses" className="py-16 sm:py-24 md:py-32 lg:py-40 px-4 sm:px-6 md:px-8 bg-white overflow-hidden">
          <div className="max-w-7xl mx-auto">
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mb-10 sm:mb-16 md:mb-24 text-center"
            >
              <h2 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black tracking-tighter text-[#1A1A1A]">Curated Path</h2>
              <div className="h-2 w-20 sm:w-24 md:w-32 bg-[#C62828] mt-4 sm:mt-6 md:mt-8 mx-auto rounded-full"></div>
            </motion.div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 md:gap-8">
              {(curatedPath.length ? curatedPath : [
                { tag: "A1", title: "Discovery", col: "lg:col-span-1" },
                { tag: "A2", title: "Waystage", col: "lg:col-span-1" },
                { tag: "B1", title: "Threshold", col: "lg:col-span-2" },
                { tag: "B2", title: "Vantage", col: "lg:col-span-1" },
                { tag: "C1", title: "Advanced", col: "lg:col-span-1" },
                { tag: "C2", title: "Mastery", col: "lg:col-span-2" }
              ]).map((lvl, idx) => (
                <motion.div 
                  key={idx}
                  whileHover={{ y: -10 }}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 }}
                  onClick={() => navigate(`/levels/${encodeURIComponent(lvl.tag)}`)}
                  className={`${lvl.col} bg-[#F5F5F0] p-6 sm:p-8 md:p-10 rounded-3xl sm:rounded-4xl border-l-8 border-[#C62828] group cursor-pointer transition-all hover:bg-[#1A1A1A] hover:border-[#D4A373] hover:shadow-2xl hover:shadow-[#1A1A1A]/20`}
                >
                  <div className="flex justify-between items-start mb-4 sm:mb-6 md:mb-8">
                    <span className="text-4xl sm:text-5xl md:text-6xl font-black text-[#1A1A1A]/10 group-hover:text-white/20 transition-colors">{lvl.tag}</span>
                    <ArrowRight className="text-[#C62828] group-hover:text-[#D4A373] group-hover:translate-x-2 transition-all w-6 h-6 sm:w-8 sm:h-8" />
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-black mb-2 sm:mb-4 group-hover:text-white transition-colors">{lvl.tag}</h3>
                  <p className="text-sm sm:text-base text-[#1A1A1A]/60 group-hover:text-white/60 transition-colors font-medium">Standardized excellence based on CEFR frameworks.</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        
        {/* Place Gallery Section - Creative Masonry Layout */}
        <section id="spaces" className="py-16 sm:py-24 md:py-32 px-4 sm:px-6 md:px-8 bg-linear-to-b from-white to-[#F5F5F0]">
          <div className="max-w-7xl mx-auto">
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-10 sm:mb-16"
            >
              <h4 className="text-[#D4A373] font-black uppercase tracking-[0.3em] text-[10px] md:text-sm mb-3 sm:mb-4">Our Spaces</h4>
              <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-black tracking-tighter text-[#1A1A1A] mb-4 sm:mb-6">
                Where Learning <span className="text-[#C62828]">Comes Alive</span>
              </h2>
              <p className="text-base sm:text-lg md:text-xl text-[#1A1A1A]/60 max-w-3xl mx-auto px-2 sm:px-4">
                Discover our state-of-the-art facilities designed for immersive language learning
              </p>
            </motion.div>

            {/* Masonry Grid Gallery */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 auto-rows-min">
              {(spaces.length ? spaces : fallbackSpaces).map((image, idx) => (
                <motion.div
                  key={image.id}
                  initial={{ opacity: 0, y: 50 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1, duration: 0.6 }}
                  whileHover={{ y: -10 }}
                  className={`group relative overflow-hidden rounded-2xl sm:rounded-3xl cursor-pointer ${
                    idx === 0 ? 'sm:row-span-2 sm:col-span-2 lg:row-span-2 lg:col-span-2' : 
                    idx === 3 ? 'lg:row-span-2' : ''
                  }`}
                >
                  <div className="relative aspect-4/3 overflow-hidden">
                    <img 
                      src={publicAssetUrl(image.image_path) ?? ''}
                      alt={image.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    
                    {/* Image Overlay Content */}
                    <div className="absolute inset-0 p-4 sm:p-6 flex flex-col justify-end transform translate-y-full group-hover:translate-y-0 transition-transform duration-500">
                      <div className="bg-white/90 backdrop-blur-sm p-3 sm:p-4 rounded-xl sm:rounded-2xl">
                        <span className="text-xs font-black text-[#C62828] uppercase tracking-wider">{image.category}</span>
                        <h3 className="text-lg sm:text-xl font-bold text-[#1A1A1A] mt-1">{image.title}</h3>
                        <p className="text-xs sm:text-sm text-[#1A1A1A]/60 mt-1 sm:mt-2">{image.description}</p>
                        <div className="flex items-center gap-2 mt-2 sm:mt-3 text-[#C62828] text-sm font-semibold">
                          Explore <ChevronRight className="w-4 h-4" />
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Gallery CTA - Removed Separate Page Link */}
          </div>
        </section>

        {/* Upcoming Events Section - Modern Card Layout */}
        <section id="events" className="py-16 sm:py-24 md:py-32 px-4 sm:px-6 md:px-8 bg-[#1A1A1A] text-white relative overflow-hidden">
          <div className="absolute inset-0 opacity-5">
            <div className="absolute top-0 left-0 w-full h-full bg-linear-to-br from-[#C62828] to-[#D4A373]" />
          </div>
          
          <div className="max-w-7xl mx-auto relative z-10">
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-10 sm:mb-16"
            >
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full mb-4 sm:mb-6">
                <Calendar className="w-4 h-4 text-[#D4A373]" />
                <span className="text-xs font-black uppercase tracking-wider">Don't Miss Out</span>
              </div>
              <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-black tracking-tighter mb-4 sm:mb-6 px-2 sm:px-4">
                Upcoming <span className="text-[#C62828]">Events</span>
              </h2>
              <p className="text-base sm:text-lg md:text-xl text-white/60 max-w-3xl mx-auto px-4 sm:px-6">
                Join our community events and take your language journey to the next level
              </p>
            </motion.div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {(events.length ? events : fallbackEvents).map((event, idx) => (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, y: 50 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 }}
                  whileHover={{ y: -8 }}
                  className="group bg-white/5 backdrop-blur-sm rounded-2xl overflow-hidden hover:bg-white/10 transition-all cursor-pointer"
                >
                  <div className="relative h-40 sm:h-48 overflow-hidden">
                    <img 
                      src={publicAssetUrl(event.image_path) ?? ''}
                      alt={event.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    <div className="absolute top-3 left-3 sm:top-4 sm:left-4 bg-[#C62828] text-white px-2 sm:px-3 py-1 rounded-full text-xs font-black uppercase">
                      {event.type ?? 'Event'}
                    </div>
                    <div className="absolute top-3 right-3 sm:top-4 sm:right-4 bg-black/50 backdrop-blur-sm px-2 sm:px-3 py-1 rounded-full text-xs font-bold">
                      {event.price ?? '—'}
                    </div>
                  </div>
                  
                  <div className="p-4 sm:p-6">
                    <h3 className="text-lg sm:text-xl font-bold mb-2 sm:mb-3 group-hover:text-[#D4A373] transition-colors">
                      {event.title}
                    </h3>
                    {event.description && (
                      <p className="text-xs sm:text-sm text-white/60 mb-3 line-clamp-2">{event.description}</p>
                    )}
                    
                    <div className="space-y-1.5 sm:space-y-2 mb-3 sm:mb-4">
                      <div className="flex items-center gap-2 text-xs sm:text-sm text-white/60">
                        <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                        <span className="truncate">
                          {new Date(event.starts_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs sm:text-sm text-white/60">
                        <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                        <span className="truncate">{event.location ?? '—'}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs sm:text-sm text-white/60">
                        <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                        <span>{event.capacity ?? 0} spots available</span>
                      </div>
                    </div>
                    
                    <button
                      onClick={() => openBooking(event)}
                      className="w-full mt-2 sm:mt-4 bg-white/10 hover:bg-[#C62828] py-2.5 sm:py-3 rounded-xl font-bold text-xs sm:text-sm transition-all group-hover:translate-x-1"
                    >
                      Enroll Now
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* View All Events CTA - Removed Separate Page Link */}
          </div>
        </section>

        {/* Call to Action Section */}
        <section  id="contact" className="py-16 sm:py-24 md:py-32 lg:py-40 px-4 sm:px-6 md:px-8 bg-[#1A1A1A] text-white relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
            <div className="absolute -top-1/2 -left-1/4 w-full h-full bg-[#C62828] rounded-full blur-[200px]"></div>
          </div>
          
          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-10 sm:gap-12 md:gap-16 lg:gap-24 relative z-10">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="px-0 sm:px-2 md:px-4"
            >
              <h2 className="text-4xl sm:text-5xl md:text-6xl lg:text-8xl font-black tracking-tighter mb-6 sm:mb-8 md:mb-10 leading-[0.85]">
                Start your <br/>journey <span className="text-[#C62828]">today.</span>
              </h2>
              <p className="text-white/60 text-lg sm:text-xl md:text-2xl mb-8 sm:mb-10 md:mb-12 lg:mb-16 max-w-lg font-medium">
                Our advisors are ready to help you find the perfect path for your linguistic ambitions.
              </p>
              
              <div className="space-y-6 sm:space-y-8 md:space-y-10">
                {[
                  { icon: MapPin, title: "261 Portsaid street Cleopatra, Sidi Gaber", detail: "Alexandria, Egypt" },
                  { icon: Mail, title: "Email", detail: "leidenschaftklub@gmail.com" }
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-4 sm:gap-6 md:gap-8 group">
                    <div className="bg-white/5 p-4 sm:p-5 md:p-6 rounded-xl sm:rounded-2xl group-hover:bg-[#C62828] transition-colors shrink-0">
                      <item.icon className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 group-hover:scale-110 transition-transform" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-bold text-lg sm:text-xl">{item.title}</h4>
                      <p className="text-white/40 text-sm sm:text-base truncate">{item.detail}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="bg-white/5 p-5 sm:p-6 md:p-8 lg:p-12 rounded-3xl sm:rounded-4xl md:rounded-[2.5rem] backdrop-blur-xl border border-white/10 shadow-2xl"
            >
              <div className="flex items-center justify-between gap-4 mb-5">
                <div>
                  <p className="text-xs uppercase font-black tracking-[0.2em] text-[#D4A373]">Find us</p>
                  <p className="text-2xl md:text-3xl font-black tracking-tighter">Alexandria, Egypt</p>
                  <p className="text-white/60 text-sm md:text-base font-bold mt-1">
                    261 Portsaid street Cleopatra, Sidi Gaber
                  </p>
                </div>
                <div className="hidden sm:flex items-center gap-2 bg-white/10 px-4 py-3 rounded-2xl border border-white/10">
                  <MapPin className="w-5 h-5 text-[#D4A373]" />
                  <span className="text-[10px] font-black uppercase tracking-[0.25em] text-white/70">Google Maps</span>
                </div>
              </div>

              <div className="rounded-4xl overflow-hidden border border-white/10 shadow-2xl bg-black/20">
                <iframe
                  title="Leidenschaft Klub Alexandria location"
                  src="https://www.google.com/maps?q=261%20Portsaid%20street%20Cleopatra%2C%20Sidi%20Gaber%2C%20Alexandria%2C%20Egypt&output=embed"
                  className="w-full h-[360px] md:h-[440px]"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>




            </motion.div>
          </div>
        </section>
      </main>

      <Footer />

        {bookingOpen && bookingEvent && (
        <div className="fixed inset-0 z-120 flex items-center justify-center p-4">
          <button className="absolute inset-0 bg-black/60" onClick={() => setBookingOpen(false)} />
          <div className="relative w-full max-w-lg bg-white rounded-3xl p-6 sm:p-8 border border-[#1A1A1A]/10 shadow-2xl">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <p className="text-[9px] font-black uppercase tracking-[0.35em] text-[#D4A373]">Event booking</p>
                <h3 className="text-2xl font-black tracking-tight text-[#1A1A1A]">{bookingEvent.title}</h3>
              </div>
              <button className="w-10 h-10 rounded-xl bg-[#F5F5F0]" onClick={() => setBookingOpen(false)}>✕</button>
            </div>

            <div className="space-y-3">
              <input value={bName} onChange={e => setBName(e.target.value)} placeholder="Full name"
                className="w-full px-4 py-3 rounded-2xl bg-[#F5F5F0] font-black text-sm outline-none" />
              <input value={bEmail} onChange={e => setBEmail(e.target.value)} placeholder="Email"
                className="w-full px-4 py-3 rounded-2xl bg-[#F5F5F0] font-black text-sm outline-none" />
              <input type="number" value={bSeats} onChange={e => setBSeats(e.target.value)} min={1} max={10} placeholder="Seats"
                className="w-full px-4 py-3 rounded-2xl bg-[#F5F5F0] font-black text-sm outline-none" />
            </div>

            {bookingError && <p className="mt-4 text-sm font-bold text-[#C62828]">{bookingError}</p>}
            {bookingSuccess && <p className="mt-4 text-sm font-bold text-green-700">{bookingSuccess}</p>}

            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => setBookingOpen(false)} className="px-5 py-3 rounded-2xl bg-[#F5F5F0] font-black text-xs uppercase tracking-widest">Cancel</button>
              <button onClick={handleBook} disabled={bookingSubmitting}
                className="px-6 py-3 rounded-2xl bg-[#C62828] text-white font-black text-xs uppercase tracking-widest disabled:opacity-60">
                {bookingSubmitting ? 'Booking…' : 'Confirm booking'}
              </button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}