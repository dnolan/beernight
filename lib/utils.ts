// Utility functions

export function getRatingColor(rating: number): string {
  const colors = [
    "#a10808", // 1 – red
    "#ff9838", // 2 – orange
    "#ffee00", // 3 – yellow
    "#9dc219", // 4 – green
    "#2a9641", // 5 – dark green
  ];
  const idx = Math.max(0, Math.min(4, Math.round(rating) - 1));
  return colors[idx] || colors[4];
}