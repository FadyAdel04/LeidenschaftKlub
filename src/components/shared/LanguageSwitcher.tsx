import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAutoTranslate } from 'react-autolocalise';
import { Globe, ChevronDown, Check } from 'lucide-react';

const languages = [
  { code: 'en', label: 'English', flag: '🇺🇸', dir: 'ltr' },
  { code: 'ar', label: 'Arabic', flag: '🇪🇬', dir: 'rtl' },
  { code: 'de', label: 'German', flag: '🇩🇪', dir: 'ltr' },
];

export default function LanguageSwitcher() {
  const { loading } = useAutoTranslate();
  const [currentLangCode, setCurrentLangCode] = useState(localStorage.getItem('selected_language') || 'en');
  const [isOpen, setIsOpen] = useState(false);

  const currentLang = languages.find(l => l.code === currentLangCode) || languages[0];

  useEffect(() => {
    document.documentElement.dir = currentLang.dir;
    localStorage.setItem('selected_language', currentLangCode);
    
    // Check if the applied language matches the selected one
    const appliedLang = localStorage.getItem('selected_language_applied');
    if (currentLangCode !== appliedLang) {
       localStorage.setItem('selected_language_applied', currentLangCode);
       window.location.reload(); // Force reload to apply new targetLocale in Provider
    }
  }, [currentLangCode, currentLang.dir]);

  const handleLanguageChange = (code: string) => {
    if (code === currentLangCode) return;
    setCurrentLangCode(code);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 sm:px-4 sm:py-2.5 bg-white/40 backdrop-blur-md rounded-xl border border-[#1A1A1A]/5 hover:bg-white transition-all text-[#1A1A1A] font-black text-[10px] sm:text-[11px] uppercase tracking-widest shadow-sm group"
      >
        <Globe className={`w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#C62828] group-hover:rotate-12 transition-transform ${loading ? 'animate-spin' : ''}`} />
        <span className="hidden sm:inline">{currentLang.flag}</span>
        <span>{currentLang.code}</span>
        <ChevronDown className={`w-3 h-3 sm:w-3.5 sm:h-3.5 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div 
              className="fixed inset-0 z-10" 
              onClick={() => setIsOpen(false)} 
            />
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute right-0 mt-2 w-48 bg-white/95 backdrop-blur-xl rounded-2xl border border-[#1A1A1A]/10 shadow-2xl z-20 overflow-hidden"
            >
              <div className="p-2 space-y-1">
                {languages.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => handleLanguageChange(lang.code)}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all ${
                        currentLangCode === lang.code 
                        ? 'bg-[#C62828] text-white shadow-lg shadow-[#C62828]/20' 
                        : 'hover:bg-[#F5F5F0] text-[#1A1A1A]/60 hover:text-[#1A1A1A]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-base">{lang.flag}</span>
                      <span className="font-black text-[11px] uppercase tracking-widest">{lang.label}</span>
                    </div>
                    {currentLangCode === lang.code && <Check className="w-3.5 h-3.5" />}
                  </button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
