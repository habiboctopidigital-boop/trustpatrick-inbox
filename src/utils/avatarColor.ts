// Deterministic, pleasant avatar background color per name — same palette
// family as Gmail/Google Workspace contact avatars.
const PALETTE = [
  '#1a73e8', // blue
  '#188038', // green
  '#e37400', // orange
  '#9334e6', // purple
  '#d93025', // red
  '#12805c', // teal
  '#c5221f', // deep red
  '#1967d2', // blue 2
  '#8430ce', // violet
];

export function avatarColor(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  return PALETTE[Math.abs(hash) % PALETTE.length];
}

export function initials(name: string): string {
  return (
    name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase())
      .join('') || '?'
  );
}
