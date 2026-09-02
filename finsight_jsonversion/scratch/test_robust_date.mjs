function safeNormalizeDate(rawDate) {
  if (!rawDate) return new Date().toISOString().split('T')[0];
  const str = String(rawDate).trim();

  // Check ISO YYYY-MM-DD
  const iso = str.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (iso) {
    const [, y, m, d] = iso;
    const mo = parseInt(m, 10);
    const day = parseInt(d, 10);
    if (mo >= 1 && mo <= 12 && day >= 1 && day <= 31) {
      return `${y}-${String(mo).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    }
  }

  // Check Named Month: "16 Jan 2026" or "Jan 16, 2026" or "16-Jan-2026"
  const monthMap = {
    jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06',
    jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12'
  };

  const namedMatch = str.match(/([A-Za-z]{3,9})\s+(\d{1,2}),?\s*(\d{4})?/) || str.match(/(\d{1,2})[\s\/-]([A-Za-z]{3,9})[\s\/-]?(\d{2,4})?/);
  if (namedMatch) {
    let dayStr, monthName, yearStr;
    if (isNaN(parseInt(namedMatch[1], 10))) {
      monthName = namedMatch[1];
      dayStr = namedMatch[2];
      yearStr = namedMatch[3] || String(new Date().getFullYear());
    } else {
      dayStr = namedMatch[1];
      monthName = namedMatch[2];
      yearStr = namedMatch[3] || String(new Date().getFullYear());
    }
    const mKey = monthName.toLowerCase().slice(0, 3);
    const mo = monthMap[mKey] || '01';
    let y = yearStr;
    if (y.length === 2) y = '20' + y;
    const d = parseInt(dayStr, 10);
    if (d >= 1 && d <= 31) {
      return `${y}-${mo}-${String(d).padStart(2, '0')}`;
    }
  }

  // Check DD/MM/YYYY or DD-MM-YYYY
  const dmy = str.match(/(\d{1,2})[\/\.-](\d{1,2})[\/\.-](\d{2,4})/);
  if (dmy) {
    let [, dStr, mStr, yStr] = dmy;
    let d = parseInt(dStr, 10);
    let m = parseInt(mStr, 10);
    let y = yStr;
    if (y.length === 2) y = '20' + y;

    // Swap if month/day reversed
    if (m > 12 && d <= 12) {
      const temp = m; m = d; d = temp;
    }

    if (m >= 1 && m <= 12 && d >= 1 && d <= 31) {
      return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    }
  }

  const parsed = new Date(str);
  if (!isNaN(parsed.getTime())) {
    return parsed.toISOString().split('T')[0];
  }

  return new Date().toISOString().split('T')[0];
}

console.log('Testing safeNormalizeDate:');
console.log('Jan 16, 2026, 4:48 PM ->', safeNormalizeDate('Jan 16, 2026, 4:48 PM'));
console.log('22 Feb 2026 ->', safeNormalizeDate('22 Feb 2026'));
console.log('01/02/2026 ->', safeNormalizeDate('01/02/2026'));
console.log('2026-01-64 (bad) ->', safeNormalizeDate('2026-01-64'));
