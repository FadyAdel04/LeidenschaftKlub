import { motion } from 'framer-motion';
import { FaWhatsapp } from 'react-icons/fa';

interface WhatsAppButtonProps {
  phoneNumber?: string;
  message?: string;
  label?: string;
}

export default function WhatsAppButton({ 
  phoneNumber = '+201515638830', 
  message = 'Hello! I have a question about Leidenschaft Klub.',
  label = 'Message us'
}: WhatsAppButtonProps) {
  const whatsappUrl = `https://wa.me/${phoneNumber.replace(/[\s+]/g, '')}?text=${encodeURIComponent(message)}`;

  return (
    <motion.a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      whileHover={{ scale: 1.1, translateY: -5 }}
      whileTap={{ scale: 0.9 }}
      className="fixed bottom-6 right-6 z-[9999] flex items-center gap-3 bg-[#25D366] text-white px-5 py-3 rounded-full shadow-2xl hover:shadow-[#25D366]/40 transition-shadow group no-underline"
    >
      <div className="relative">
        <FaWhatsapp className="w-6 h-6 animate-pulse" />
        <span className="absolute -top-1 -right-1 w-3 h-3 bg-white rounded-full animate-ping opacity-75" />
      </div>
      <span className="font-black text-xs uppercase tracking-widest hidden md:block">
        {label}
      </span>
      
      {/* Tooltip for mobile */}
      <span className="md:hidden absolute bottom-full mb-3 right-0 bg-[#1A1A1A] text-white text-[10px] font-black py-1.5 px-3 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none uppercase tracking-widest">
        {label}
      </span>
    </motion.a>
  );
}
