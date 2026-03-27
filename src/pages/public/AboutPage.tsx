import { motion } from 'framer-motion';
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import TopNavBar from '../../components/layout/TopNavBar';
import Footer from '../../components/layout/Footer';

import about from '../../assets/10.jpg';
import teach from '../../assets/11.jpg';
import map from '../../assets/location.png';
import work from '../../assets/12.jpg';
import privacy from '../../assets/13.jpg';
import terms from '../../assets/14.jpg';
import accessibility from '../../assets/15.jpg';

const cv = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.08 } } };
const ci = { hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0 } };

function scrollToId(id: string) {
  const el = document.getElementById(id);
  if (!el) return;
  const y = el.getBoundingClientRect().top + window.scrollY - 96;
  window.scrollTo({ top: y, behavior: 'smooth' });
}

function SectionCard({
  id,
  eyebrow,
  title,
  copy,
  imageSrc,
  imageAlt,
  flip,
  tone = 'light',
}: {
  id: string;
  eyebrow: string;
  title: string;
  copy: React.ReactNode;
  imageSrc?: string | null;
  imageAlt?: string;
  flip?: boolean;
  tone?: 'light' | 'dark';
}) {
  const base = tone === 'dark' ? 'bg-[#1A1A1A] text-white' : 'bg-white text-[#1A1A1A]';
  const sub = tone === 'dark' ? 'text-white/60' : 'text-[#1A1A1A]/60';
  const eyebrowClr = tone === 'dark' ? 'text-[#D4A373]' : 'text-[#D4A373]';
  const border = tone === 'dark' ? 'border-white/10' : 'border-[#1A1A1A]/10';
  const imgBg = tone === 'dark' ? 'bg-white/5' : 'bg-[#F5F5F0]';

  return (
    <section id={id} className={`scroll-mt-28 ${base} py-16 sm:py-24 px-4 sm:px-6 md:px-10`}>
      <div className="max-w-6xl mx-auto">
        <div className={`grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center ${flip ? '' : ''}`}>
          <div className={`lg:col-span-6 ${flip ? 'lg:order-2' : ''}`}>
            <p className={`text-[10px] font-black uppercase tracking-[0.5em] ${eyebrowClr}`}>{eyebrow}</p>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tighter uppercase mt-3 leading-tight">
              {title}
            </h2>
            <div className={`mt-6 text-sm sm:text-base font-bold leading-relaxed space-y-4 ${sub}`}>
              {copy}
            </div>
          </div>

          <div className={`lg:col-span-6 ${flip ? 'lg:order-1' : ''}`}>
            <div className={`rounded-4xl border ${border} overflow-hidden shadow-2xl ${imgBg}`}>
              {imageSrc ? (
                <img src={imageSrc} alt={imageAlt ?? title} className="w-full h-[260px] sm:h-[360px] lg:h-[420px] object-cover" />
              ) : (
                <div className="w-full h-[260px] sm:h-[360px] lg:h-[420px] flex items-center justify-center">
                  <div className={`w-[92%] h-[88%] rounded-4xl border-4 border-dashed ${tone === 'dark' ? 'border-white/20' : 'border-[#1A1A1A]/15'} flex items-center justify-center`}>
                    <div className="text-center px-6">
                      <p className={`text-xs font-black uppercase tracking-[0.35em] ${tone === 'dark' ? 'text-white/40' : 'text-[#1A1A1A]/40'}`}>
                        Image placeholder
                      </p>
                      <p className={`mt-3 text-sm font-bold ${tone === 'dark' ? 'text-white/60' : 'text-[#1A1A1A]/60'}`}>
                        You can add your image later.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function AboutPage() {
  const location = useLocation();

  useEffect(() => {
    if (!location.hash) return;
    const id = location.hash.replace('#', '');
    // allow layout to paint rst
    const t = window.setTimeout(() => scrollToId(id), 0);
    return () => window.clearTimeout(t);
  }, [location.hash]);

  return (
    <motion.div initial="hidden" animate="visible" variants={cv} className="min-h-screen bg-[#F5F5F0]">
      <TopNavBar />

      <motion.div variants={ci} className="pt-24 sm:pt-28 md:pt-32 pb-14 px-4 sm:px-6 md:px-10 bg-[#F5F5F0]">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-end">
            <div className="lg:col-span-7">
              <p className="text-[#C62828] font-black tracking-[0.5em] text-[10px] uppercase italic">Institutional</p>
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tighter text-[#1A1A1A] leading-none uppercase mt-4">
                About<br />
                <span className="text-[#C62828]">Leidenschaft Klub.</span>
              </h1>
              <p className="mt-6 max-w-2xl text-sm sm:text-base font-bold text-[#1A1A1A]/70 leading-relaxed">
                A single place for institutional information, methodology, locations, and policies used across the platform.
              </p>
            </div>
            <div className="lg:col-span-5">
              <div className="bg-white rounded-4xl border border-[#1A1A1A]/10 shadow-xl p-6 sm:p-8">
                <p className="text-[10px] font-black uppercase tracking-[0.5em] text-[#D4A373]">Quick links</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {[
                    { label: 'About', id: 'about' },
                    { label: 'Methodology', id: 'methodology' },
                    { label: 'Locations', id: 'locations' },
                    { label: 'Careers', id: 'careers' },
                    { label: 'Privacy', id: 'privacy' },
                    { label: 'Terms', id: 'terms' },
                    { label: 'Accessibility', id: 'accessibility' },
                  ].map((x) => (
                    <button
                      key={x.id}
                      onClick={() => scrollToId(x.id)}
                      className="px-4 py-2 rounded-2xl bg-[#F5F5F0] border border-[#1A1A1A]/5 text-[10px] font-black uppercase tracking-widest text-[#1A1A1A]/70 hover:text-[#C62828] hover:border-[#C62828]/30 transition-all"
                    >
                      {x.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      <SectionCard
        id="about"
        eyebrow="About Us"
        title="Who we are"
        copy={
          <>
            <p>
              Leidenschaft Klub is a learning space focused on building a strong foundation for communication through structured practice,
              consistency, and a supportive community.
            </p>
            <p>
              We focus on real-world outcomes: clear progress, reliable routines, and measurable improvement.
            </p>
          </>
        }
        imageSrc={about}
        imageAlt="About Leidenschaft Klub"
      />

      <SectionCard
        id="methodology"
        eyebrow="Methodology"
        title="How we teach"
        flip
        copy={
          <>
            <p>
              Our approach is structured, practice-forward, and aligned with level progression. We combine guided lessons, targeted
              exercises, and continuous feedback to keep students moving forward.
            </p>
            <p>
              The platform supports this workflow with materials, assignments, exams, and feedback loops between students and admins.
            </p>
          </>
        }
        imageSrc={teach}
        imageAlt="Methodology"
      />

      <SectionCard
        id="locations"
        eyebrow="Locations"
        title="Where to nd us"
        tone="dark"
        copy={
          <>
            <p>
              <span className="font-black text-white">Address:</span> 261 Portsaid street Cleopatra, Sidi Gaber, Alexandria, Egypt
            </p>
            <p>
              <span className="font-black text-white">Contact:</span> +20 15 15638830 • leidenschaftklub@gmail.com
            </p>
            <p>
              For events and updates, follow our handles: <span className="font-black text-white">leidenschaft.klub</span>.
            </p>
          </>
        }
        imageSrc={map}
        imageAlt="Our location"
      />

      <SectionCard
        id="careers"
        eyebrow="Career Portal"
        title="Work with us"
        flip
        copy={
          <>
            <p>
              If you want to collaborate or join our team, contact us at <span className="font-black text-[#1A1A1A]">leidenschaftklub@gmail.com</span>{' '}
              with your CV and a short note about the role you’re looking for.
            </p>
          </>
        }
        imageSrc={work}
        imageAlt="Careers"
      />

      <SectionCard
        id="privacy"
        eyebrow="Privacy Policy"
        title="Privacy"
        copy={
          <>
            <p>
              We collect only what we need to provide our services (account information, learning activity, and bookings). We do not sell
              your personal data.
            </p>
            <p>
              If you want your data removed, contact us via email and we will process your request according to applicable rules.
            </p>
          </>
        }
        imageSrc={privacy}
        imageAlt="Privacy policy"
      />

      <SectionCard
        id="terms"
        eyebrow="Institutional Terms"
        title="Terms"
        flip
        copy={
          <>
            <p>
              By using the platform, you agree to follow community guidelines and use the learning materials for personal educational
              purposes.
            </p>
            <p>
              Access to content may be limited by level and enrollment. We may update the platform to improve reliability and security.
            </p>
          </>
        }
        imageSrc={terms}
        imageAlt="Terms"
      />

      <SectionCard
        id="accessibility"
        eyebrow="Accessibility"
        title="Accessibility"
        copy={
          <>
            <p>
              We aim to make the platform usable for everyone. If you face any accessibility barriers, please contact us and we will
              prioritize improvements.
            </p>
          </>
        }
        imageSrc={accessibility}
        imageAlt="Accessibility"
      />

      <Footer />
    </motion.div>
  );
}

