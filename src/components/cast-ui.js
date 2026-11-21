import { raw } from "../lib/dom.js";
import { CAST } from "./cast.js";

// Een figuurtje als geneste SVG binnen een andere SVG (viewBox van de bron: -30 -10 260 280).
export const cast = (key, x, y, w, h) =>
  raw(`<svg x="${x}" y="${y}" width="${w}" height="${h}" viewBox="-30 -10 260 280" overflow="visible">${CAST[key]}</svg>`);

// Een figuurtje als losse SVG, alleen als versiering.
export const figuur = (key, cls = "") =>
  raw(`<svg class="cast-fig ${cls}" viewBox="-30 -10 260 280" aria-hidden="true" focusable="false">${CAST[key]}</svg>`);
