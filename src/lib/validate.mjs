export function normalizePhone(input) {
  let s = String(input ?? "").replace(/[\s\-().]/g, "");
  if (s.startsWith("+31")) s = "0" + s.slice(3);
  else if (s.startsWith("0031")) s = "0" + s.slice(4);
  return s;
}

export function validateCheckout({ naam = "", telefoon = "", email = "", opmerking = "" }) {
  const errors = {};
  const n = naam.trim();
  if (!n) errors.naam = "Vul je naam in.";
  else if (n.length > 60) errors.naam = "Gebruik maximaal 60 tekens.";
  const t = normalizePhone(telefoon);
  if (!t) errors.telefoon = "Vul een telefoonnummer in zodat De Zon je kan bereiken.";
  else if (!/^0\d{9}$/.test(t)) errors.telefoon = "Dit lijkt geen Nederlands telefoonnummer (10 cijfers, bijvoorbeeld 06 12345678).";
  const e = email.trim();
  if (e && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e)) errors.email = "Dit e-mailadres lijkt niet te kloppen.";
  if (opmerking.length > 140) errors.opmerking = "Maximaal 140 tekens.";
  return errors;
}
