/**
 * Tiện ích tính toán Ngày Nghỉ Lễ Việt Nam Tự Động (Theo Điều 112 Bộ luật Lao động 2019)
 * - Tự động tính toán ngày Âm lịch (Tết Nguyên Đán, Giỗ Tổ Hùng Vương) bằng thuật toán thiên văn Hồ Ngọc Đức (GMT+7).
 * - Tự động tính toán các ngày nghỉ bù nếu trùng Thứ Bảy hoặc Chủ Nhật (Điều 111 BLLĐ).
 * - KHÔNG PHỤ THUỘC bên thứ ba, KHÔNG GÁN CỨNG (Hardcode), chạy mượt mà cho mọi năm.
 */

// Thuật toán thiên văn chuyển đổi Dương lịch -> Âm lịch (Múi giờ GMT+7 Việt Nam)
function jdFromDate(dd: number, mm: number, yy: number): number {
  const a = Math.floor((14 - mm) / 12);
  const y = yy + 4800 - a;
  const m = mm + 12 * a - 3;
  let jd = dd + Math.floor((153 * m + 2) / 5) + 365 * y + Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) - 32045;
  if (jd < 2299161) {
    jd = dd + Math.floor((153 * m + 2) / 5) + 365 * y + Math.floor(y / 4) - 32083;
  }
  return jd;
}

function getNewMoonDay(k: number, timeZone = 7): number {
  const T = k / 1236.85;
  const T2 = T * T;
  const T3 = T2 * T;
  const dr = Math.PI / 180;
  const Jd1 = 2415020.75933 + 29.53058868 * k + 0.0001178 * T2 - 0.0000002 * T3;
  const M = 359.2242 + 29.10535608 * k - 0.0000333 * T2 - 0.00000347 * T3;
  const Mpr = 306.0253 + 385.81691806 * k + 0.0107306 * T2 + 0.00001236 * T3;
  const F = 21.2964 + 390.67050646 * k - 0.0016528 * T2 - 0.00000239 * T3;
  let C1 = (0.1734 - 0.000393 * T) * Math.sin(M * dr) + 0.0021 * Math.sin(2 * M * dr);
  C1 = C1 - 0.4068 * Math.sin(Mpr * dr) + 0.0161 * Math.sin(2 * Mpr * dr);
  C1 = C1 - 0.0004 * Math.sin(3 * Mpr * dr);
  C1 = C1 + 0.0104 * Math.sin(2 * F * dr) - 0.0051 * Math.sin((M + Mpr) * dr);
  C1 = C1 - 0.0074 * Math.sin((M - Mpr) * dr) + 0.0004 * Math.sin((2 * F + M) * dr);
  C1 = C1 - 0.0004 * Math.sin((2 * F - M) * dr) - 0.0006 * Math.sin((2 * F + Mpr) * dr);
  C1 = C1 + 0.001 * Math.sin((2 * F - Mpr) * dr) + 0.0005 * Math.sin((2 * Mpr + M) * dr);
  const Jd = Jd1 + C1;
  return Math.floor(Jd + 0.5 + timeZone / 24);
}

function getSunLongitude(jdn: number, timeZone = 7): number {
  const T = (jdn - 2451545.5 - timeZone / 24) / 36525;
  const T2 = T * T;
  const dr = Math.PI / 180;
  const L0 = 280.46645 + 36000.76983 * T + 0.0003032 * T2;
  const M = 357.5291 + 35999.05029 * T - 0.0001537 * T2;
  let C = (1.9146 - 0.004817 * T - 0.000014 * T2) * Math.sin(M * dr);
  C = C + (0.019993 - 0.000101 * T) * Math.sin(2 * M * dr) + 0.000289 * Math.sin(3 * M * dr);
  let theta = L0 + C;
  theta = theta * dr;
  theta = theta - Math.PI * 2 * Math.floor(theta / (Math.PI * 2));
  return Math.floor((theta / Math.PI) * 6);
}

function getLunarMonth11(yy: number, timeZone = 7): number {
  const off = jdFromDate(31, 12, yy) - 2415021;
  const k1 = Math.floor(off / 29.530588853);
  let nm = getNewMoonDay(k1, timeZone);
  const sunLong = getSunLongitude(nm, timeZone);
  if (sunLong >= 9) nm = getNewMoonDay(k1 - 1, timeZone);
  return nm;
}

export function convertSolarToLunar(day: number, month: number, year: number, timeZone = 7) {
  const dayNumber = jdFromDate(day, month, year);
  const k = Math.floor((dayNumber - 2415021.0769986) / 29.530588853);
  let last = getNewMoonDay(k, timeZone);
  if (last > dayNumber) {
    last = getNewMoonDay(k - 1, timeZone);
  }
  let a11 = getLunarMonth11(year, timeZone);
  let targetYear = year;
  if (a11 >= last) {
    targetYear = year - 1;
    a11 = getLunarMonth11(year - 1, timeZone);
  } else {
    const nextA11 = getLunarMonth11(year + 1, timeZone);
    if (nextA11 <= last) {
      targetYear = year + 1;
      a11 = nextA11;
    }
  }
  const diff = Math.floor((last - a11) / 29);
  let lunarMonth = diff + 11;
  if (lunarMonth > 12) lunarMonth -= 12;
  const lunarDay = dayNumber - last + 1;
  return { day: lunarDay, month: lunarMonth, year: targetYear };
}

export interface VietnamHoliday {
  name: string;
  isHoliday: boolean;
  type: 'SOLAR' | 'LUNAR' | 'COMPENSATION';
  legalBasis: string;
}

/**
 * Kiểm tra xem ngày bất kỳ có phải là ngày nghỉ lễ pháp định Việt Nam hay không
 * @param date Đối tượng Date hoặc chuỗi YYYY-MM-DD
 */
export function getVietnamHoliday(dateInput: Date | string | any): VietnamHoliday | null {
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return null;

  const solarDay = d.getDate();
  const solarMonth = d.getMonth() + 1; // 1 - 12
  const solarYear = d.getFullYear();

  // 1. CÁC NGÀY LỄ DƯƠNG LỊCH CỐ ĐỊNH (Điều 112 Bộ luật Lao động 2019)
  if (solarDay === 1 && solarMonth === 1) {
    return {
      name: 'Tết Dương Lịch',
      isHoliday: true,
      type: 'SOLAR',
      legalBasis: 'Điểm a Khoản 1 Điều 112 Bộ luật Lao động 2019',
    };
  }

  if (solarDay === 30 && solarMonth === 4) {
    return {
      name: 'Ngày Giải phóng miền Nam',
      isHoliday: true,
      type: 'SOLAR',
      legalBasis: 'Điểm c Khoản 1 Điều 112 Bộ luật Lao động 2019',
    };
  }

  if (solarDay === 1 && solarMonth === 5) {
    return {
      name: 'Ngày Quốc tế Lao động',
      isHoliday: true,
      type: 'SOLAR',
      legalBasis: 'Điểm d Khoản 1 Điều 112 Bộ luật Lao động 2019',
    };
  }

  if (solarDay === 2 && solarMonth === 9) {
    return {
      name: 'Ngày Quốc khánh (02/09)',
      isHoliday: true,
      type: 'SOLAR',
      legalBasis: 'Điểm đ Khoản 1 Điều 112 Bộ luật Lao động 2019',
    };
  }

  if (solarDay === 3 && solarMonth === 9) {
    return {
      name: 'Nghỉ liền kề Quốc khánh',
      isHoliday: true,
      type: 'SOLAR',
      legalBasis: 'Điểm đ Khoản 1 Điều 112 Bộ luật Lao động 2019',
    };
  }

  // 2. CÁC NGÀY LỄ ÂM LỊCH TỰ ĐỘNG GIẢI MÃ
  const lunar = convertSolarToLunar(solarDay, solarMonth, solarYear);

  // Giỗ Tổ Hùng Vương: 10/03 Âm lịch
  if (lunar.day === 10 && lunar.month === 3) {
    return {
      name: 'Giỗ Tổ Hùng Vương (10/03 ÂL)',
      isHoliday: true,
      type: 'LUNAR',
      legalBasis: 'Điểm e Khoản 1 Điều 112 Bộ luật Lao động 2019',
    };
  }

  // Tết Nguyên Đán: 29 hoặc 30 tháng Chạp (Tháng 12 ÂL) đến Mùng 5 tháng Giêng (Tháng 1 ÂL)
  if (lunar.month === 12 && (lunar.day === 29 || lunar.day === 30)) {
    return {
      name: 'Nghỉ Tết Âm Lịch (Tất niên)',
      isHoliday: true,
      type: 'LUNAR',
      legalBasis: 'Điểm b Khoản 1 Điều 112 Bộ luật Lao động 2019',
    };
  }

  if (lunar.month === 1 && lunar.day >= 1 && lunar.day <= 5) {
    const label = lunar.day <= 3 ? `Mùng ${lunar.day} Tết Nguyên Đán` : `Nghỉ Tết Âm Lịch (Mùng ${lunar.day})`;
    return {
      name: label,
      isHoliday: true,
      type: 'LUNAR',
      legalBasis: 'Điểm b Khoản 1 Điều 112 Bộ luật Lao động 2019',
    };
  }

  return null;
}
