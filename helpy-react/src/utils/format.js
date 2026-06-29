export const MN_MONTHS = [
  '', '1-р сар', '2-р сар', '3-р сар', '4-р сар', '5-р сар', '6-р сар',
  '7-р сар', '8-р сар', '9-р сар', '10-р сар', '11-р сар', '12-р сар',
];

export function fmt(n) {
  if (n === null || n === undefined) return '—';
  return Number(n).toLocaleString('mn-MN') + '₮';
}

export function fmtN(n) {
  if (n === null || n === undefined) return '—';
  return Number(n).toLocaleString('mn-MN');
}

export function currentMonthLabel() {
  const d = new Date();
  return `${d.getFullYear()} оны ${MN_MONTHS[d.getMonth() + 1]}`;
}

export function currentYM() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

/** Backend нь зарим талбарыг ALL CAPS (Oracle), зарим talбарыг lower case буцаадаг тул хоёр аль алийг шалгана */
export function pick(row, upperKey, lowerKey) {
  return row[upperKey] ?? row[lowerKey];
}
