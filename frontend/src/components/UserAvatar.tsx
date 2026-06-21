import { gold } from '../styles/design-tokens';

interface UserAvatarProps {
  name?: string;
  firstName?: string | null;
  lastName?: string | null;
  avatarUrl?: string | null;
  size?: number;
  fontSize?: number;
}

export function UserAvatar({
  name,
  firstName,
  lastName,
  avatarUrl,
  size = 44,
  fontSize,
}: UserAvatarProps) {
  const displayName =
    name ?? ([firstName, lastName].filter(Boolean).join(' ') || '?');
  const initials = displayName
    .split(/\s+/)
    .map((part) => part.charAt(0))
    .join('')
    .slice(0, 2)
    .toUpperCase();

  if (avatarUrl) {
    const isDataUrl = avatarUrl.startsWith('data:');
    const isThirdParty = avatarUrl.includes('googleusercontent.com') || avatarUrl.includes('facebook.com');
    // Always bust cache for our own storage URLs so the new photo shows immediately
    const displayUrl = (isDataUrl || isThirdParty)
      ? avatarUrl
      : `${avatarUrl.split('?')[0]}?t=${Date.now()}`;
    return (
      <img
        src={displayUrl}
        alt=""
        style={{
          width: size,
          height: size,
          borderRadius: '50%',
          objectFit: 'cover',
          flexShrink: 0,
          border: '2px solid rgba(217,179,140,0.25)',
        }}
      />
    );
  }

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: gold,
        color: '#1F2F3F',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 800,
        fontSize: fontSize ?? Math.round(size * 0.38),
        flexShrink: 0,
      }}
    >
      {initials}
    </div>
  );
}
