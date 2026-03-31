import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, FileText, Music, Video, X } from 'lucide-react';

type MaterialLike = {
  title: string;
  file_url: string;
  watermarkText?: string;
};

interface MaterialPreviewModalProps {
  open: boolean;
  material: MaterialLike | null;
  onClose: () => void;
}

function getFileType(url: string): 'pdf' | 'video' | 'audio' | 'other' {
  const cleanUrl = url.split('?')[0].toLowerCase();
  if (cleanUrl.endsWith('.pdf')) return 'pdf';
  if (cleanUrl.endsWith('.mp4') || cleanUrl.endsWith('.webm') || cleanUrl.endsWith('.ogg') || cleanUrl.endsWith('.mov')) return 'video';
  if (cleanUrl.endsWith('.mp3') || cleanUrl.endsWith('.wav') || cleanUrl.endsWith('.m4a') || cleanUrl.endsWith('.aac')) return 'audio';
  return 'other';
}

export default function MaterialPreviewModal({ open, material, onClose }: MaterialPreviewModalProps) {
  const [screenHidden, setScreenHidden] = useState(false);

  useEffect(() => {
    if (!open) return undefined;
    const onVisibility = () => setScreenHidden(document.hidden);
    const preventDefault = (event: Event) => event.preventDefault();
    document.addEventListener('visibilitychange', onVisibility);
    document.addEventListener('contextmenu', preventDefault);
    document.addEventListener('dragstart', preventDefault);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      document.removeEventListener('contextmenu', preventDefault);
      document.removeEventListener('dragstart', preventDefault);
      setScreenHidden(false);
    };
  }, [open]);

  const watermark = useMemo(() => material?.watermarkText || 'Protected Content', [material?.watermarkText]);

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
            <span className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-amber-50 text-amber-700 text-[10px] font-black uppercase tracking-widest">
              <AlertTriangle className="w-3.5 h-3.5" />
              Preview only
            </span>
            <button
              type="button"
              onClick={onClose}
              className="w-9 h-9 rounded-xl bg-[#F5F5F0] text-[#1A1A1A]/60 hover:text-[#F97316] transition-colors flex items-center justify-center"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="relative flex-1 bg-[#F5F5F0] select-none">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 z-20 opacity-20"
            style={{
              backgroundImage: `repeating-linear-gradient(-25deg, transparent, transparent 30px, rgba(198,40,40,0.35) 30px, rgba(198,40,40,0.35) 33px)`,
            }}
          />
          <div className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center text-[#1A1A1A]/20 text-lg font-black uppercase tracking-[0.35em]">
            {watermark}
          </div>
          {fileType === 'pdf' && (
            <div className="w-full h-full relative group/pdf">
              <iframe
                src={`${material.file_url}#toolbar=0&navpanes=0&scrollbar=1`}
                title={material.title}
                className="w-full h-full pointer-events-auto"
              />
              <div className="absolute top-0 right-0 left-0 h-14 bg-transparent z-10 pointer-events-auto" onContextMenu={e => e.preventDefault()} />
            </div>
          )}

          {fileType === 'video' && (
            <div className="w-full h-full flex items-center justify-center p-4 md:p-8">
              <video src={material.file_url} controls controlsList="nodownload noplaybackrate" className="w-full h-full max-h-full rounded-2xl bg-black" />
            </div>
          )}

          {fileType === 'audio' && (
            <div className="w-full h-full flex items-center justify-center p-6 md:p-10">
              <div className="w-full max-w-2xl bg-white border border-[#1A1A1A]/10 rounded-2xl p-6">
                <p className="text-[10px] font-black uppercase tracking-[0.35em] text-[#D4A373] mb-4">Audio Preview</p>
                <audio src={material.file_url} controls controlsList="nodownload noplaybackrate" className="w-full" />
              </div>
            </div>
          )}

          {fileType === 'other' && (
            <div className="w-full h-full flex flex-col items-center justify-center text-center p-8">
              <div className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center mb-4 text-[#F97316] shadow-sm">
                <FileText className="w-7 h-7" />
              </div>
              <h4 className="text-lg font-black text-[#1A1A1A] mb-2">Preview not available</h4>
              <p className="text-sm text-[#1A1A1A]/50 mb-6">This file type cannot be previewed inline yet.</p>
              <p className="text-xs font-bold text-[#1A1A1A]/60">Only PDF, video, and audio files can be previewed inline.</p>
            </div>
          )}
          {screenHidden && (
            <div className="absolute inset-0 z-40 bg-[#1A1A1A] flex items-center justify-center">
              <p className="text-white font-black uppercase tracking-[0.3em] text-xs">Preview paused while tab is inactive</p>
            </div>
          )}
        </div>

        <div className="px-5 md:px-8 py-3 border-t border-[#1A1A1A]/10 bg-white text-[9px] font-black uppercase tracking-widest text-[#1A1A1A]/30 flex items-center gap-2">
          {fileType === 'pdf' ? <FileText className="w-3.5 h-3.5" /> : fileType === 'audio' ? <Music className="w-3.5 h-3.5" /> : <Video className="w-3.5 h-3.5" />}
          <span>
            {fileType === 'pdf' ? 'PDF document' : fileType === 'video' ? 'Video file' : fileType === 'audio' ? 'Audio file' : 'file'}
          </span>
          <span className="ml-auto normal-case tracking-normal text-[10px]">
            Browser restrictions reduce casual downloads, but full screenshot prevention is NOT 100% possible in browsers.
          </span>
        </div>
      </div>
    </div>
  );
}
