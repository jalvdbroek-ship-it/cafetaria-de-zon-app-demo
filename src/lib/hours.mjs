// Openingstijden in Nederlandse tijd. hours: { "0".."6": ["HH:MM","HH:MM"] | null }, 0 = zondag.
// Een sluitingstijd vroeger dan of gelijk aan de opening telt als "na middernacht".
const TZ = "Europe/Amsterdam";
const DAGEN = ["zondag", "maandag", "dinsdag", "woensdag", "donderdag", "vrijdag", "zaterdag"];
const DOW = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

const partsFmt = new Intl.DateTimeFormat("en-GB", {
  timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit", weekday: "short", hour: "2-digit", minute: "2-digit", hourCycle: "h23",
});

export const dayName = (dow) => DAGEN[((dow % 7) + 7) % 7];

export function amsterdamParts(date) {
  const p = Object.fromEntries(partsFmt.formatToParts(date).map((x) => [x.type, x.value]));
  return { y: +p.year, m: +p.month, d: +p.day, dow: DOW[p.weekday], minutes: +p.hour * 60 + +p.minute };
}

export const toMinutes = (hhmm) => { const [h, m] = hhmm.split(":").map(Number); return h * 60 + m; };
export const formatMinutes = (min) => {
  const t = ((min % 1440) + 1440) % 1440;
  return `${String(Math.floor(t / 60)).padStart(2, "0")}:${String(t % 60).padStart(2, "0")}`;
};

// [openMin, closeMin] met closeMin > 1440 als de zaak na middernacht sluit; null als gesloten.
export function windowFor(hours, dow) {
  const h = hours?.[String(((dow % 7) + 7) % 7)];
  if (!h) return null;
  const open = toMinutes(h[0]);
  let close = toMinutes(h[1]);
  if (close <= open) close += 1440;
  return [open, close];
}

// Nederlandse klok (jaar, maand 1-12, dag, minuten sinds middernacht, mag > 1440) naar een Date.
export function zonedToDate(y, m, d, minutes) {
  const guess = Date.UTC(y, m - 1, d, 0, minutes);
  let utc = guess;
  for (let i = 0; i < 2; i++) {
    const p = amsterdamParts(new Date(utc));
    const got = Date.UTC(p.y, p.m - 1, p.d, 0, p.minutes);
    utc += guess - got;
  }
  return new Date(utc);
}

export function addDays({ y, m, d }, n) {
  const t = new Date(Date.UTC(y, m - 1, d + n));
  return { y: t.getUTCFullYear(), m: t.getUTCMonth() + 1, d: t.getUTCDate(), dow: t.getUTCDay() };
}

export function openStatus(date, hours) {
  const now = amsterdamParts(date);
  const today = windowFor(hours, now.dow);
  if (today && now.minutes >= today[0] && now.minutes < today[1]) {
    return { open: true, closesAt: today[1], opensAt: today[0], next: null };
  }
  const yest = windowFor(hours, now.dow - 1);
  if (yest && yest[1] > 1440 && now.minutes + 1440 < yest[1]) {
    return { open: true, closesAt: yest[1] - 1440, opensAt: yest[0] - 1440, next: null };
  }
  for (let offset = 0; offset < 8; offset++) {
    const dow = (now.dow + offset) % 7;
    const w = windowFor(hours, dow);
    if (!w) continue;
    if (offset === 0 && now.minutes >= w[0]) continue;
    return { open: false, closesAt: null, next: { offset, dow, minutes: w[0] } };
  }
  return { open: false, closesAt: null, next: null };
}

// 0 bij opening tot 1 bij sluiting; null als gesloten.
export function sunFraction(date, hours) {
  const s = openStatus(date, hours);
  if (!s.open) return null;
  const now = amsterdamParts(date).minutes;
  const open = s.opensAt, close = s.closesAt;
  const at = now < open ? now + 1440 : now;
  return Math.min(1, Math.max(0, (at - open) / (close - open)));
}

export function weekRows(hours) {
  return [1, 2, 3, 4, 5, 6, 0].map((dow) => {
    const w = hours?.[String(dow)];
    return { dow, dag: dayName(dow), open: w ? w[0] : null, close: w ? w[1] : null };
  });
}
