import { photoUrl } from '../lib/supabase.js';

// Neutral placeholder artwork is used whenever no authorised photograph
// has been uploaded by the owner.
function Placeholder({ type }) {
  if (type === 'lab') {
    return (
      <svg viewBox="0 0 64 64" aria-hidden="true">
        <rect width="64" height="64" fill="#e6f1f0" />
        <path
          d="M26 14h12v3h-2v13l10 17a4 4 0 0 1-3.500 6h-21A4 4 0 0 1 18 47l10-17V17h-2z"
          fill="#9cc5c0"
        />
        <path d="M23 42h18l3 5.500a1.500 1.500 0 0 1-1.300 2.200H21.300a1.500 1.500 0 0 1-1.300-2.200z" fill="#5f9e97" />
      </svg>
    );
  }
  if (type === 'pharmacy') {
    return (
      <svg viewBox="0 0 64 64" aria-hidden="true">
        <rect width="64" height="64" fill="#e6f1f0" />
        <rect x="14" y="14" width="36" height="36" rx="8" fill="#9cc5c0" />
        <path d="M28 21h8v7h7v8h-7v7h-8v-7h-7v-8h7z" fill="#fff" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 64 64" aria-hidden="true">
      <rect width="64" height="64" fill="#e6f1f0" />
      <circle cx="32" cy="25" r="11" fill="#9cc5c0" />
      <path d="M10 64c0-13 10-21 22-21s22 8 22 21z" fill="#9cc5c0" />
    </svg>
  );
}

export default function Avatar({ provider, size = 'md' }) {
  const src = photoUrl(provider.photo_path);
  return (
    <div className={`avatar avatar-${size}`}>
      {src ? (
        <img src={src} alt="" loading="lazy" />
      ) : (
        <Placeholder type={provider.type} />
      )}
    </div>
  );
}
