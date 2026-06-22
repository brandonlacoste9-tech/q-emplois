import { gold } from '../styles/design-tokens';

export function UnreadBadge({ count }: { count: number }) {
  if (count <= 0) return null;
  const label = count > 99 ? '99+' : String(count);
  return (
    <span
      style={{
        marginLeft: 6,
        minWidth: 18,
        height: 18,
        padding: '0 5px',
        borderRadius: 999,
        background: gold,
        color: '#1F2F3F',
        fontSize: 10,
        fontWeight: 800,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        lineHeight: 1,
      }}
    >
      {label}
    </span>
  );
}