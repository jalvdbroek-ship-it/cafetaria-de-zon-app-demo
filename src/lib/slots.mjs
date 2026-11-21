import { amsterdamParts, windowFor, addDays, zonedToDate, formatMinutes, dayName } from "./hours.mjs";

const DEFAULTS = { intervalMin: 15, leadMin: 15, lastBeforeCloseMin: 15 };

const keyOf = (d) => `${d.y}-${String(d.m).padStart(2, "0")}-${String(d.d).padStart(2, "0")}`;

function collect(day, w, earliest, o) {
  const first = Math.ceil(earliest / o.intervalMin) * o.intervalMin;
  const last = w[1] - o.lastBeforeCloseMin;
  const slots = [];
  for (let min = Math.max(first, w[0]); min <= last; min += o.intervalMin) {
    slots.push({ minutes: min, label: formatMinutes(min), at: zonedToDate(day.y, day.m, day.d, min).toISOString() });
  }
  return slots.length ? slots : null;
}

// Afhaalmomenten voor vandaag, of de eerstvolgende dag met ruimte. Slots staan op hele intervallen vanaf middernacht.
export function buildSlots(now, hours, options = {}) {
  const o = { ...DEFAULTS, ...options };
  const t = amsterdamParts(now);
  const yest = windowFor(hours, t.dow - 1);
  if (yest && yest[1] > 1440 && t.minutes + 1440 < yest[1]) {
    const r = collect(addDays(t, 0), [yest[0] - 1440, yest[1] - 1440], t.minutes + o.leadMin, o);
    if (r) return { offset: 0, dow: t.dow, dayLabel: "vandaag", dateKey: keyOf(t), asap: t.minutes + o.leadMin <= yest[1] - 1440 - o.lastBeforeCloseMin, slots: r };
  }
  for (let offset = 0; offset < 8; offset++) {
    const day = addDays(t, offset);
    const w = windowFor(hours, day.dow);
    if (!w) continue;
    const earliest = offset === 0 ? Math.max(w[0], t.minutes + o.leadMin) : w[0];
    const slots = collect(day, w, earliest, o) || [];
    if (!slots.length) continue;
    const openNow = offset === 0 && t.minutes >= w[0] && t.minutes + o.leadMin <= w[1] - o.lastBeforeCloseMin;
    return {
      offset, dow: day.dow, dayLabel: offset === 0 ? "vandaag" : offset === 1 ? "morgen" : dayName(day.dow),
      dateKey: keyOf(day),
      asap: openNow, slots,
    };
  }
  return { offset: null, dayLabel: "", asap: false, slots: [] };
}
