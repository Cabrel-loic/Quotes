const weekdays = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
const months = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];

export function todayKey(date = new Date()): string {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

export function epochDay(date = new Date()): number {
  return Math.floor(date.getTime() / 86_400_000);
}

export function getDateChrome(date = new Date()) {
  const start = new Date(date.getFullYear(), 0, 0);
  const day = Math.floor((date.getTime() - start.getTime()) / 86_400_000);
  const year = date.getFullYear();
  const days = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0) ? 366 : 365;

  return {
    stamp: `${weekdays[date.getDay()]} · ${months[date.getMonth()]} ${date.getDate()}`,
    badge: `DAY ${day}/${days}`,
  };
}
