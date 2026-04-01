import { motion } from 'framer-motion';
import { useEffect } from 'react';
import { useAutoTranslate } from 'react-autolocalise';
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
  const { t } = useAutoTranslate();
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
            <p className={`text-[10px] font-black uppercase tracking-[0.5em] ${eyebrowClr}`}>{t(eyebrow)}</p>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tighter uppercase mt-3 leading-tight">
              {t(title)}
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
                        {t('Image placeholder')}
                      </p>
                      <p className={`mt-3 text-sm font-bold ${tone === 'dark' ? 'text-white/60' : 'text-[#1A1A1A]/60'}`}>
                        {t('You can add your image later.')}
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
  const { t } = useAutoTranslate();
  const currentLang = localStorage.getItem('selected_language') || 'en';

  const translations: Record<string, Record<string, any>> = {
    ar: {
      heroTitle: 'عن',
      heroSubtitle: 'كليب لايدنشافت.',
      heroSummary: 'مكان واحد للمعلومات المؤسسية، والمنهجية، والمواقع، والسياسات المستخدمة عبر المنصة.',
      aboutUs: {
        eyebrow: 'عننا',
        title: 'من نحن',
        p1: 'كليب لايدنشافت هو مساحة تعلم تركز على بناء أساس قوي للتواصل من خلال الممارسة المنظمة، والاستمرارية، ومجتمع داعم.',
        p2: 'نحن نركز على النتائج الواقعية: تقدم واضح، وروتين موثوق، وتحسن ملموس.'
      },
      methodology: {
        eyebrow: 'المنهجية',
        title: 'كيف نُدرس',
        p1: 'نهجنا منظم، يركز على الممارسة، ومتوافق مع تدرج المستويات. نحن نجمع بين الدروس الموجهة، والتمارين المستهدفة، والتغذية الراجعة المستمرة للحفاظ على تقدم الطلاب.',
        p2: 'تدعم المنصة سير العمل هذا بالمواد، والواجبات، والامتحانات، وحلقات التغذية الراجعة بين الطلاب والمسؤولين.'
      },
      locations: {
        eyebrow: 'المواقع',
        title: 'أين تجدنا',
        addrLabel: 'العنوان:',
        addrValue: '٢٦١ شارع بورسعيد، كليوباترا، سيدي جابر، الإسكندرية، مصر',
        contactLabel: 'الاتصال:',
        followText: 'للأحداث والتحديثات، تابع حساباتنا:'
      },
      careers: {
        eyebrow: 'بوابة الوظائف',
        title: 'اعمل معنا',
        p1: 'إذا كنت ترغب في التعاون أو الانضمام إلى فريقنا، فاتصل بنا على',
        p2: 'مع سيرتك الذاتية وملاحظة قصيرة حول الدور الذي تبحث عنه.'
      },
      privacy: {
        eyebrow: 'سياسة الخصوصية',
        title: 'الخصوصية',
        p1: 'نحن نجمع فقط ما نحتاجه لتقديم خدماتنا (معلومات الحساب، ونشاط التعلم، والحجوزات). نحن لا نبيع بياناتك الشخصية.',
        p2: 'إذا كنت ترغب في إزالة بياناتك، فاتصل بنا عبر البريد الإلكتروني وسنقوم بمعالجة طلبك وفقًا للقواعد المعمول بها.'
      },
      terms: {
        eyebrow: 'الشروط المؤسسية',
        title: 'الشروط',
        p1: 'باستخدام المنصة، فإنك توافق على اتباع إرشادات المجتمع واستخدام المواد التعليمية لأغراض تعليمية شخصية.',
        p2: 'قد يتم تقييد الوصول إلى المحتوى حسب المستوى والتسجيل. قد نقوم بتحديث المنصة لتحسين الموثوقية والأمان.'
      },
      accessibility: {
        eyebrow: 'إمكانية الوصول',
        title: 'إمكانية الوصول',
        p1: 'نهدف إلى جعل المنصة قابلة للاستخدام للجميع. إذا واجهت أي عوائق في الوصول، يرجى الاتصال بنا وسنعطي الأولوية للتحسينات.'
      }
    },
    de: {
      heroTitle: 'Über',
      heroSubtitle: 'Leidenschaft Klub.',
      heroSummary: 'Ein zentraler Ort für institutionelle Informationen, Methodik, Standorte und Richtlinien, die auf der gesamten Plattform verwendet werden.',
      aboutUs: {
        eyebrow: 'Über uns',
        title: 'Wer wir sind',
        p1: 'Leidenschaft Klub ist ein Lernraum, der sich darauf konzentriert, durch strukturierte Praxis, Beständigkeit und eine unterstützende Gemeinschaft ein starkes Fundament für die Kommunikation aufzubauen.',
        p2: 'Wir konzentrieren uns auf reale Ergebnisse: klare Fortschritte, zuverlässige Routinen und messbare Verbesserungen.'
      },
      methodology: {
        eyebrow: 'Methodik',
        title: 'Wie wir unterrichten',
        p1: 'Unser Ansatz ist strukturiert, praxisorientiert und auf die Progression der Niveaus abgestimmt. Wir kombinieren geführten Unterricht, gezielte Übungen und kontinuierliches Feedback, um die Lernenden voranzubringen.',
        p2: 'Die Plattform unterstützt diesen Arbeitsablauf mit Materialien, Hausaufgaben, Prüfungen und Feedbackschleifen zwischen Lernenden und Administratoren.'
      },
      locations: {
        eyebrow: 'Standorte',
        title: 'Wo Sie uns finden',
        addrLabel: 'Adresse:',
        addrValue: '261 Portsaid street Cleopatra, Sidi Gaber, Alexandria, Ägypten',
        contactLabel: 'Kontakt:',
        followText: 'Folgen Sie unseren Kanälen für Veranstaltungen und Updates:'
      },
      careers: {
        eyebrow: 'Karriereportal',
        title: 'Arbeiten Sie mit uns',
        p1: 'Wenn Sie zusammenarbeiten oder unserem Team beitreten möchten, kontaktieren Sie uns unter',
        p2: 'mit Ihrem Lebenslauf und einer kurzen Notiz zu der von Ihnen gesuchten Rolle.'
      },
      privacy: {
        eyebrow: 'Datenschutz-Bestimmungen',
        title: 'Datenschutz',
        p1: 'Wir sammeln nur das, was wir zur Bereitstellung unserer Dienste benötigen (Kontoinformationen, Lernaktivitäten und Buchungen). Wir verkaufen Ihre persönlichen Daten nicht.',
        p2: 'Wenn Sie möchten, dass Ihre Daten gelöscht werden, kontaktieren Sie uns per E-Mail, und wir werden Ihre Anfrage gemäß den geltenden Regeln bearbeiten.'
      },
      terms: {
        eyebrow: 'Institutionelle Bedingungen',
        title: 'Bedingungen',
        p1: 'Durch die Nutzung der Plattform erklären Sie sich damit einverstanden, die Community-Richtlinien zu befolgen und die Lernmaterialien für persönliche Bildungszwecke zu verwenden.',
        p2: 'Der Zugriff auf Inhalte kann je nach Niveau und Anmeldung eingeschränkt sein. Wir können die Plattform aktualisieren, um die Zuverlässigkeit und Sicherheit zu verbessern.'
      },
      accessibility: {
        eyebrow: 'Barrierefreiheit',
        title: 'Barrierefreiheit',
        p1: 'Wir möchten die Plattform für alle nutzbar machen. Wenn Sie auf Barrieren stoßen, kontaktieren Sie uns bitte, und wir werden Verbesserungen priorisieren.'
      }
    }
  };

  const active = translations[currentLang];

  useEffect(() => {
    if (!location.hash) return;
    const id = location.hash.replace('#', '');
    // allow layout to paint first
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
              <p className="text-[#C62828] font-black tracking-[0.5em] text-[10px] uppercase italic">{t('Institutional')}</p>
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tighter text-[#1A1A1A] leading-none uppercase mt-4">
                {t(active?.heroTitle || 'About')}<br />
                <span className="text-[#C62828]">{t(active?.heroSubtitle || 'Leidenschaft Klub.')}</span>
              </h1>
              <p className="mt-6 max-w-2xl text-sm sm:text-base font-bold text-[#1A1A1A]/70 leading-relaxed">
                {t(active?.heroSummary || 'A single place for institutional information, methodology, locations, and policies used across the platform.')}
              </p>
            </div>
            <div className="lg:col-span-5">
              <div className="bg-white rounded-4xl border border-[#1A1A1A]/10 shadow-xl p-6 sm:p-8">
                <p className="text-[10px] font-black uppercase tracking-[0.5em] text-[#D4A373]">{t('Quick links')}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {[
                    { label: t('About'), id: 'about' },
                    { label: t('Methodology'), id: 'methodology' },
                    { label: t('Locations'), id: 'locations' },
                    { label: t('Careers'), id: 'careers' },
                    { label: t('Privacy'), id: 'privacy' },
                    { label: t('Terms'), id: 'terms' },
                    { label: t('Accessibility'), id: 'accessibility' },
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
        eyebrow={active?.aboutUs?.eyebrow || "About Us"}
        title={active?.aboutUs?.title || "Who we are"}
        copy={
          <>
            <p>
              {t(active?.aboutUs?.p1 || 'Leidenschaft Klub is a learning space focused on building a strong foundation for communication through structured practice, consistency, and a supportive community.')}
            </p>
            <p>
              {t(active?.aboutUs?.p2 || 'We focus on real-world outcomes: clear progress, reliable routines, and measurable improvement.')}
            </p>
          </>
        }
        imageSrc={about}
        imageAlt={t(active?.aboutUs?.title || "About Leidenschaft Klub")}
      />

      <SectionCard
        id="methodology"
        eyebrow={active?.methodology?.eyebrow || "Methodology"}
        title={active?.methodology?.title || "How we teach"}
        flip
        copy={
          <>
            <p>
              {t(active?.methodology?.p1 || 'Our approach is structured, practice-forward, and aligned with level progression. We combine guided lessons, targeted exercises, and continuous feedback to keep students moving forward.')}
            </p>
            <p>
              {t(active?.methodology?.p2 || 'The platform supports this workflow with materials, assignments, exams, and feedback loops between students and admins.')}
            </p>
          </>
        }
        imageSrc={teach}
        imageAlt={t(active?.methodology?.title || "Methodology")}
      />

      <SectionCard
        id="locations"
        eyebrow={active?.locations?.eyebrow || "Locations"}
        title={active?.locations?.title || "Where to find us"}
        tone="dark"
        copy={
          <>
            <p>
              <span className="font-black text-white">{t(active?.locations?.addrLabel || 'Address:')}</span> {t(active?.locations?.addrValue || '261 Portsaid street Cleopatra, Sidi Gaber, Alexandria, Egypt')}
            </p>
            <p>
              <span className="font-black text-white">{t(active?.locations?.contactLabel || 'Contact:')}</span> +20 15 15638830 • leidenschaftklub@gmail.com
            </p>
            <p>
              {t(active?.locations?.followText || 'For events and updates, follow our handles:')} <span className="font-black text-white">leidenschaft.klub</span>.
            </p>
          </>
        }
        imageSrc={map}
        imageAlt={t(active?.locations?.title || "Our location")}
      />

      <SectionCard
        id="careers"
        eyebrow={active?.careers?.eyebrow || "Career Portal"}
        title={active?.careers?.title || "Work with us"}
        flip
        copy={
          <>
            <p>
              {t(active?.careers?.p1 || 'If you want to collaborate or join our team, contact us at')} <span className="font-black text-[#1A1A1A]">leidenschaftklub@gmail.com</span>{' '}
              {t(active?.careers?.p2 || 'with your CV and a short note about the role you’re looking for.')}
            </p>
          </>
        }
        imageSrc={work}
        imageAlt={t(active?.careers?.title || "Careers")}
      />

      <SectionCard
        id="privacy"
        eyebrow={active?.privacy?.eyebrow || "Privacy Policy"}
        title={active?.privacy?.title || "Privacy"}
        copy={
          <>
            <p>
              {t(active?.privacy?.p1 || 'We collect only what we need to provide our services (account information, learning activity, and bookings). We do not sell your personal data.')}
            </p>
            <p>
              {t(active?.privacy?.p2 || 'If you want your data removed, contact us via email and we will process your request according to applicable rules.')}
            </p>
          </>
        }
        imageSrc={privacy}
        imageAlt={t(active?.privacy?.title || "Privacy policy")}
      />

      <SectionCard
        id="terms"
        eyebrow={active?.terms?.eyebrow || "Institutional Terms"}
        title={active?.terms?.title || "Terms"}
        flip
        copy={
          <>
            <p>
              {t(active?.terms?.p1 || 'By using the platform, you agree to follow community guidelines and use the learning materials for personal educational purposes.')}
            </p>
            <p>
              {t(active?.terms?.p2 || 'Access to content may be limited by level and enrollment. We may update the platform to improve reliability and security.')}
            </p>
          </>
        }
        imageSrc={terms}
        imageAlt={t(active?.terms?.title || "Terms")}
      />

      <SectionCard
        id="accessibility"
        eyebrow={active?.accessibility?.eyebrow || "Accessibility"}
        title={active?.accessibility?.title || "Accessibility"}
        copy={
          <>
            <p>
              {t(active?.accessibility?.p1 || 'We aim to make the platform usable for everyone. If you face any accessibility barriers, please contact us and we will prioritize improvements.')}
            </p>
          </>
        }
        imageSrc={accessibility}
        imageAlt={t(active?.accessibility?.title || "Accessibility")}
      />

      <Footer />
    </motion.div>
  );
}
