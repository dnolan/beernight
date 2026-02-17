// Utility functions

// Blue (1) → Teal (2) → Green (3) → Amber (4) → Gold (5)
export function getRatingColor(rating: number): string {
  const colors = [
    "#42a5f5", // 1 – blue
    "#26c6da", // 2 – teal/cyan
    "#66bb6a", // 3 – green
    "#ffa726", // 4 – amber
    "#ffd600", // 5 – gold
  ];
  const idx = Math.max(0, Math.min(4, Math.round(rating) - 1));
  return colors[idx] || colors[4];
}