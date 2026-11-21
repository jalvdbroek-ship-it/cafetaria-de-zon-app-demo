import { raw } from "../lib/dom.js";

// Decoratieve code in QR-stijl, afgeleid van het kaartnummer. Dit is GEEN echte QR-code en niet scanbaar.
export function demoCode(seed, size = 25) {
  let h = 2166136261;
  for (const c of seed) h = Math.imul(h ^ c.charCodeAt(0), 16777619) >>> 0;
  const rnd = () => (h = (Math.imul(h, 1664525) + 1013904223) >>> 0) / 4294967296;
  const finder = (x, y) => (x < 8 && y < 8) || (x >= size - 8 && y < 8) || (x < 8 && y >= size - 8);
  let d = "";
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    if (finder(x, y)) continue;
    if (rnd() > 0.5) d += `M${x} ${y}h1v1h-1z`;
  }
  const eye = (x, y) => `<path d="M${x} ${y}h7v7h-7zM${x + 1} ${y + 1}v5h5v-5z" fill-rule="evenodd"/><rect x="${x + 2}" y="${y + 2}" width="3" height="3"/>`;
  return raw(`<svg class="demo-code" viewBox="-1 -1 ${size + 2} ${size + 2}" role="img" aria-label="Demo-code, geen echte QR-code" shape-rendering="crispEdges"><rect x="-1" y="-1" width="${size + 2}" height="${size + 2}" fill="var(--paper)"/><g fill="var(--ink)"><path d="${d}"/>${eye(0, 0)}${eye(size - 7, 0)}${eye(0, size - 7)}</g></svg>`);
}
