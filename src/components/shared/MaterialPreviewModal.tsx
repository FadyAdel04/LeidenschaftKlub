import { FiDownload, FiExternalLink, FiFileText, FiVideo, FiX } from 'react-icons/fi';

type MaterialLike = {
  title: string;
  file_url: string;
};

interface MaterialPreviewModalProps {
  open: boolean;
  material: MaterialLike | null;
  onClose: () => void;
}

function getFileType(url: string): 'pdf' | 'video' | 'other' {
  const cleanUrl = url.split('?')[0].toLowerCase();
  if (cleanUrl.endsWith('.pdf')) return 'pdf';
  if (cleanUrl.endsWith('.mp4') || cleanUrl.endsWith('.webm') || cleanUrl.endsWith('.ogg') || cleanUrl.endsWith('.mov')) return 'video';
  return 'other';
}

export default function MaterialPreviewModal({ open, material, onClose }: MaterialPreviewModalProps) {
  if (!open || !material) return null;

  const fileType = getFileType(material.file_url);

  return (
    <div className="fixed inset-0 z-[120]">
      <button
        type="button"
        aria-label="Close preview"
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      />

      <div className="absolute inset-4 md:inset-8 xl:inset-12 bg-white rounded-3xl shadow-2xl border border-[#1A1A1A]/10 overflow-hidden flex flex-col">
        <div className="px-5 md:px-8 py-4 md:py-5 border-b border-[#1A1A1A]/10 flex items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[9px] font-black uppercase tracking-[0.35em] text-[#D4A373] mb-1">Material Preview</p>
            <h3 className="text-base md:text-lg font-black text-[#1A1A1A] tracking-tight truncate">{material.title}</h3>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <a
              href={material.file_url}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#F5F5F0] text-[#1A1A1A] text-[10px] font-black uppercase tracking-widest hover:bg-[#1A1A1A] hover:text-white transition-all"
            >
              <FiExternalLink className="w-3.5 h-3.5" />
              Open
            </a>
            <a
              href={material.file_url}
              download
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#C62828] text-white text-[10px] font-black uppercase tracking-widest hover:brightness-95 transition-all"
            >
              <FiDownload className="w-3.5 h-3.5" />
              Download
            </a>
            <button
              type="button"
              onClick={onClose}
              className="w-9 h-9 rounded-xl bg-[#F5F5F0] text-[#1A1A1A]/60 hover:text-[#C62828] transition-colors flex items-center justify-center"
            >
              <FiX className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 bg-[#F5F5F0]">
          {fileType === 'pdf' && (
            <iframe
              src={material.file_url}
              title={material.title}
              className="w-full h-full"
            />
          )}

          {fileType === 'video' && (
            <div className="w-full h-full flex items-center justify-center p-4 md:p-8">
              <video src={material.file_url} controls className="w-full h-full max-h-full rounded-2xl bg-black" />
            </div>
          )}

          {fileType === 'other' && (
            <div className="w-full h-full flex flex-col items-center justify-center text-center p-8">
              <div className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center mb-4 text-[#C62828] shadow-sm">
                <FiFileText className="w-7 h-7" />
              </div>
              <h4 className="text-lg font-black text-[#1A1A1A] mb-2">Preview not available</h4>
              <p className="text-sm text-[#1A1A1A]/50 mb-6">This file type cannot be previewed inline yet.</p>
              <a
                href={material.file_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-[#1A1A1A] text-white text-xs font-black uppercase tracking-widest hover:bg-[#C62828] transition-all"
              >
                <FiExternalLink className="w-4 h-4" />
                Open File
              </a>
            </div>
          )}
        </div>

        <div className="px-5 md:px-8 py-3 border-t border-[#1A1A1A]/10 bg-white text-[9px] font-black uppercase tracking-widest text-[#1A1A1A]/30 flex items-center gap-2">
          {fileType === 'pdf' ? <FiFileText className="w-3.5 h-3.5" /> : <FiVideo className="w-3.5 h-3.5" />}
          <span>{fileType === 'pdf' ? 'PDF document' : fileType === 'video' ? 'Video file' : 'File'}</span>
        </div>
      </div>
    </div>
  );
}
