import { supabase } from '../lib/supabase';

export const MAX_UPLOAD_BYTES = 200 * 1024 * 1024;

export type UploadStatus = 'idle' | 'uploading' | 'success' | 'error';

export type UploadMetrics = {
  progress: number;
  uploadedBytes: number;
  totalBytes: number;
  speedBytesPerSec: number;
  etaSeconds: number | null;
  status: UploadStatus;
  error?: string;
};

export type UploadOptions = {
  bucket: string;
  path: string;
  file: File;
  upsert?: boolean;
  maxRetries?: number;
  onProgress?: (metrics: UploadMetrics) => void;
};

function emitProgress(
  options: UploadOptions,
  uploadedBytes: number,
  totalBytes: number,
  startedAt: number,
  status: UploadStatus,
  error?: string,
) {
  const elapsedSec = Math.max((Date.now() - startedAt) / 1000, 0.001);
  const speedBytesPerSec = uploadedBytes / elapsedSec;
  const remainingBytes = Math.max(totalBytes - uploadedBytes, 0);
  const etaSeconds = speedBytesPerSec > 0 ? Math.ceil(remainingBytes / speedBytesPerSec) : null;
  options.onProgress?.({
    progress: totalBytes > 0 ? Math.min(100, Math.round((uploadedBytes / totalBytes) * 100)) : 0,
    uploadedBytes,
    totalBytes,
    speedBytesPerSec,
    etaSeconds,
    status,
    error,
  });
}

async function getAccessToken(): Promise<string> {
  const { data, error } = await supabase.auth.getSession();
  if (error || !data.session?.access_token) {
    throw new Error(error?.message ?? 'Missing auth session for upload.');
  }
  return data.session.access_token;
}

function uploadWithXhr(options: UploadOptions, accessToken: string): Promise<void> {
  const projectUrl = import.meta.env.VITE_SUPABASE_URL as string;
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;
  const target = `${projectUrl}/storage/v1/object/${options.bucket}/${options.path}`;
  const total = options.file.size;
  const startedAt = Date.now();

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', target, true);
    xhr.setRequestHeader('Authorization', `Bearer ${accessToken}`);
    xhr.setRequestHeader('apikey', anonKey);
    xhr.setRequestHeader('x-upsert', options.upsert ? 'true' : 'false');

    xhr.upload.onprogress = (event) => {
      if (!event.lengthComputable) return;
      emitProgress(options, event.loaded, event.total || total, startedAt, 'uploading');
    };

    xhr.onerror = () => reject(new Error('Network error while uploading file.'));
    xhr.onabort = () => reject(new Error('Upload aborted.'));
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        emitProgress(options, total, total, startedAt, 'success');
        resolve();
        return;
      }
      reject(new Error(xhr.responseText || `Upload failed with status ${xhr.status}`));
    };

    const formData = new FormData();
    formData.append('', options.file);
    xhr.send(formData);
  });
}

export async function uploadFileWithProgress(options: UploadOptions): Promise<string> {
  if (options.file.size > MAX_UPLOAD_BYTES) {
    throw new Error('File exceeds 200MB limit.');
  }

  const maxRetries = Math.max(0, options.maxRetries ?? 2);
  let attempt = 0;
  let lastError: unknown = null;
  const accessToken = await getAccessToken();
  options.onProgress?.({
    progress: 0,
    uploadedBytes: 0,
    totalBytes: options.file.size,
    speedBytesPerSec: 0,
    etaSeconds: null,
    status: 'uploading',
  });

  while (attempt <= maxRetries) {
    try {
      await uploadWithXhr(options, accessToken);
      return options.path;
    } catch (error) {
      lastError = error;
      attempt += 1;
      if (attempt > maxRetries) break;
      await new Promise((resolve) => setTimeout(resolve, 800 * attempt));
    }
  }

  options.onProgress?.({
    progress: 0,
    uploadedBytes: 0,
    totalBytes: options.file.size,
    speedBytesPerSec: 0,
    etaSeconds: null,
    status: 'error',
    error: lastError instanceof Error ? lastError.message : 'Upload failed',
  });
  throw lastError instanceof Error ? lastError : new Error('Upload failed');
}

export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / 1024 ** index;
  return `${value.toFixed(index === 0 ? 0 : 1)} ${units[index]}`;
}
