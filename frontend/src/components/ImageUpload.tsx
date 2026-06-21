import { useRef, useState } from 'react';
import { Camera, Loader2, X } from 'lucide-react';
import { api } from '../services/api';
import { gold } from '../styles/design-tokens';
import { getApiErrorMessage } from '../utils/apiError';

const MAX_BYTES = 2 * 1024 * 1024;

interface ImageUploadProps {
  purpose: 'avatar' | 'task';
  value: string[];
  onChange: (urls: string[]) => void;
  maxFiles?: number;
  /** When false, store data URLs locally (guest booking). */
  uploadImmediately?: boolean;
  label?: string;
  hint?: string;
}

async function compressImage(
  file: File,
  maxWidth = 1024,
  maxHeight = 1024,
  quality = 0.85
): Promise<{ dataUrl: string; size: number; type: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas context not available'));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        const type = file.type || 'image/jpeg';
        const dataUrl = canvas.toDataURL(type, quality);
        
        const base64Length = dataUrl.split(',')[1].length;
        const sizeInBytes = Math.round(base64Length * 0.75);
        
        resolve({ dataUrl, size: sizeInBytes, type });
      };
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

async function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function ImageUpload({
  purpose,
  value,
  onChange,
  maxFiles = purpose === 'avatar' ? 1 : 3,
  uploadImmediately = !!localStorage.getItem('token'),
  label,
  hint,
}: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const handleFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    setError('');

    const remaining = maxFiles - value.length;
    if (remaining <= 0 && purpose !== 'avatar') {
      setError(`Maximum ${maxFiles} photo${maxFiles > 1 ? 's' : ''}.`);
      return;
    }

    const batch = purpose === 'avatar' ? Array.from(files).slice(0, 1) : Array.from(files).slice(0, remaining);
    setUploading(true);

    try {
      const next = [...value];
      for (const file of batch) {
        if (!file.type.startsWith('image/')) {
          setError('Seules les images sont acceptées.');
          continue;
        }

        let dataUrl: string;
        let finalType = file.type || 'image/jpeg';
        
        try {
          const compressed = await compressImage(file);
          dataUrl = compressed.dataUrl;
          finalType = compressed.type;
          
          if (compressed.size > MAX_BYTES) {
            setError('Image trop volumineuse (max 2 Mo) après compression.');
            continue;
          }
        } catch {
          if (file.size > MAX_BYTES) {
            setError('Image trop volumineuse (max 2 Mo).');
            continue;
          }
          dataUrl = await readFileAsDataUrl(file);
        }

        if (uploadImmediately) {
          const res = await api.uploadImage({
            purpose,
            data: dataUrl,
            filename: file.name,
            contentType: finalType,
          });
          if (purpose === 'avatar') {
            onChange([res.url]);
            return;
          }
          next.push(res.url);
        } else {
          next.push(dataUrl);
        }
      }
      onChange(next);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Échec du téléversement.'));
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const removeAt = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  return (
    <div>
      {label && <label className="q-label">{label}</label>}
      {hint && (
        <p className="body-f muted2" style={{ fontSize: 12, marginBottom: 8 }}>
          {hint}
        </p>
      )}

      {value.length > 0 && purpose !== 'avatar' && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 10 }}>
          {value.map((url, index) => (
            <div key={`${url.slice(0, 32)}-${index}`} style={{ position: 'relative' }}>
              <img
                src={url}
                alt=""
                style={{
                  width: 72,
                  height: 72,
                  borderRadius: 8,
                  objectFit: 'cover',
                  border: '2px solid rgba(217,179,140,0.25)',
                }}
              />
              <button
                type="button"
                onClick={() => removeAt(index)}
                aria-label="Retirer"
                style={{
                  position: 'absolute',
                  top: -6,
                  right: -6,
                  width: 22,
                  height: 22,
                  borderRadius: '50%',
                  border: 'none',
                  background: '#C46B6B',
                  color: '#fff',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {(value.length < maxFiles || purpose === 'avatar') && (
        <button
          type="button"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
          className="ghost-btn body-f"
          style={{
            padding: '10px 14px',
            fontSize: 13,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            cursor: uploading ? 'wait' : 'pointer',
          }}
        >
          {uploading ? (
            <Loader2 className="w-4 h-4" style={{ animation: 'spin 0.9s linear infinite' }} />
          ) : (
            <Camera className="w-4 h-4" style={{ color: gold }} />
          )}
          {purpose === 'avatar' ? 'Changer la photo' : 'Ajouter une photo'}
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple={maxFiles > 1}
        hidden
        onChange={(e) => handleFiles(e.target.files)}
      />

      {error && (
        <p className="body-f" style={{ fontSize: 12, color: '#F0B4B4', marginTop: 8 }}>
          {error}
        </p>
      )}
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

export async function uploadDraftPhotos(dataUrls: string[]): Promise<string[]> {
  const urls: string[] = [];
  for (const dataUrl of dataUrls) {
    if (!dataUrl.startsWith('data:')) {
      urls.push(dataUrl);
      continue;
    }
    const match = dataUrl.match(/^data:([^;]+);base64,/);
    const contentType = match?.[1] || 'image/jpeg';
    const ext = contentType.split('/')[1] || 'jpg';
    const res = await api.uploadImage({
      purpose: 'task',
      data: dataUrl,
      filename: `photo.${ext}`,
      contentType,
    });
    urls.push(res.url);
  }
  return urls;
}
