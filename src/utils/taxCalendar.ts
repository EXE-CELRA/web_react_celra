import type { StatutoryCycleType, StatutoryPeriodMeta } from '../interfaces';

export interface StatutoryHolidayItem {
  date: string;
  name: string;
  isCompensatory?: boolean;
  legalBasis: string;
  legalDocUrl?: string;
}

export const STATUTORY_HOLIDAYS_MAP: Record<string, StatutoryHolidayItem> = {
  // ── NĂM 2026 ─────────────────────────────────────────────────────────────
  '2026-01-01': {
    date: '2026-01-01',
    name: 'Tết Dương lịch 2026',
    legalBasis: 'Điểm a Khoản 1 Điều 112 Bộ luật Lao động 2019',
    legalDocUrl: 'https://dulieuphapluat.vn/van-ban/lao-dong-van-ban/bo-luat-lao-dong-2019-45716.html',
  },
  '2026-02-16': {
    date: '2026-02-16',
    name: 'Tết Âm lịch Bính Ngọ (29 Tháng Chạp)',
    legalBasis: 'Điểm b Khoản 1 Điều 112 Bộ luật Lao động 2019',
    legalDocUrl: 'https://dulieuphapluat.vn/van-ban/lao-dong-van-ban/bo-luat-lao-dong-2019-45716.html',
  },
  '2026-02-17': {
    date: '2026-02-17',
    name: 'Tết Âm lịch Bính Ngọ (Mùng 1 Tết)',
    legalBasis: 'Điểm b Khoản 1 Điều 112 Bộ luật Lao động 2019',
    legalDocUrl: 'https://dulieuphapluat.vn/van-ban/lao-dong-van-ban/bo-luat-lao-dong-2019-45716.html',
  },
  '2026-02-18': {
    date: '2026-02-18',
    name: 'Tết Âm lịch Bính Ngọ (Mùng 2 Tết)',
    legalBasis: 'Điểm b Khoản 1 Điều 112 Bộ luật Lao động 2019',
    legalDocUrl: 'https://dulieuphapluat.vn/van-ban/lao-dong-van-ban/bo-luat-lao-dong-2019-45716.html',
  },
  '2026-02-19': {
    date: '2026-02-19',
    name: 'Tết Âm lịch Bính Ngọ (Mùng 3 Tết)',
    legalBasis: 'Điểm b Khoản 1 Điều 112 Bộ luật Lao động 2019',
    legalDocUrl: 'https://dulieuphapluat.vn/van-ban/lao-dong-van-ban/bo-luat-lao-dong-2019-45716.html',
  },
  '2026-02-20': {
    date: '2026-02-20',
    name: 'Tết Âm lịch Bính Ngọ (Mùng 4 Tết)',
    legalBasis: 'Điểm b Khoản 1 Điều 112 Bộ luật Lao động 2019',
    legalDocUrl: 'https://dulieuphapluat.vn/van-ban/lao-dong-van-ban/bo-luat-lao-dong-2019-45716.html',
  },
  '2026-04-26': {
    date: '2026-04-26',
    name: 'Giỗ Tổ Hùng Vương (10/3 Âm lịch)',
    legalBasis: 'Điểm e Khoản 1 Điều 112 Bộ luật Lao động 2019',
    legalDocUrl: 'https://dulieuphapluat.vn/van-ban/lao-dong-van-ban/bo-luat-lao-dong-2019-45716.html',
  },
  '2026-04-27': {
    date: '2026-04-27',
    name: 'Nghỉ bù Giỗ Tổ Hùng Vương (do trùng Chủ Nhật 26/04)',
    isCompensatory: true,
    legalBasis: 'Khoản 3 Điều 111 Bộ luật Lao động 2019',
    legalDocUrl: 'https://dulieuphapluat.vn/van-ban/lao-dong-van-ban/bo-luat-lao-dong-2019-45716.html',
  },
  '2026-04-30': {
    date: '2026-04-30',
    name: 'Ngày Chiến thắng 30/4',
    legalBasis: 'Điểm c Khoản 1 Điều 112 Bộ luật Lao động 2019',
    legalDocUrl: 'https://dulieuphapluat.vn/van-ban/lao-dong-van-ban/bo-luat-lao-dong-2019-45716.html',
  },
  '2026-05-01': {
    date: '2026-05-01',
    name: 'Ngày Quốc tế Lao động 1/5',
    legalBasis: 'Điểm d Khoản 1 Điều 112 Bộ luật Lao động 2019',
    legalDocUrl: 'https://dulieuphapluat.vn/van-ban/lao-dong-van-ban/bo-luat-lao-dong-2019-45716.html',
  },
  '2026-09-01': {
    date: '2026-09-01',
    name: 'Nghỉ kề Quốc khánh 2/9',
    legalBasis: 'Điểm đ Khoản 1 Điều 112 Bộ luật Lao động 2019',
    legalDocUrl: 'https://dulieuphapluat.vn/van-ban/lao-dong-van-ban/bo-luat-lao-dong-2019-45716.html',
  },
  '2026-09-02': {
    date: '2026-09-02',
    name: 'Ngày Quốc khánh 2/9',
    legalBasis: 'Điểm đ Khoản 1 Điều 112 Bộ luật Lao động 2019',
    legalDocUrl: 'https://dulieuphapluat.vn/van-ban/lao-dong-van-ban/bo-luat-lao-dong-2019-45716.html',
  },

  // ── NĂM 2027 ─────────────────────────────────────────────────────────────
  '2027-01-01': {
    date: '2027-01-01',
    name: 'Tết Dương lịch 2027',
    legalBasis: 'Điểm a Khoản 1 Điều 112 Bộ luật Lao động 2019',
    legalDocUrl: 'https://dulieuphapluat.vn/van-ban/lao-dong-van-ban/bo-luat-lao-dong-2019-45716.html',
  },
};

/**
 * Điều chỉnh ngày deadline về ngày làm việc liền kề tiếp theo nếu rơi vào Thứ Bảy, Chủ Nhật hoặc Ngày Nghỉ Lễ.
 * Căn cứ:
 * - Khoản 7 Điều 3 Nghị định 252/2026/NĐ-CP
 * - Điều 112 Bộ luật Lao động 2019
 */
export function adjustForWeekendAndHolidays(
  date: Date,
  customHolidays?: Record<string, StatutoryHolidayItem>,
): Date {
  const d = new Date(date);
  const holidays = customHolidays || STATUTORY_HOLIDAYS_MAP;

  while (true) {
    const dow = d.getDay();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const isoDate = `${y}-${m}-${day}`;
    const isHoliday = Boolean(holidays[isoDate]);

    if (dow === 6 || dow === 0 || isHoliday) {
      d.setDate(d.getDate() + 1);
    } else {
      break;
    }
  }

  return d;
}

export function adjustForWeekend(date: Date): Date {
  return adjustForWeekendAndHolidays(date);
}




export const STATUTORY_PERIOD_METAS: Record<StatutoryCycleType, StatutoryPeriodMeta> = {
  MONTHLY: {
    code: 'MONTHLY',
    label: 'Hàng tháng (Hạn ngày 20)',
    badge: 'Hàng tháng (Hạn ngày 20)',
    color: 'blue',
    legalBasis: 'Khoản 1 Điều 44 Luật Quản lý thuế 38/2019/QH14',
    description: 'Thuế GTGT, TNCN với DN doanh thu > 50 tỷ; Trích nộp BHXH bắt buộc cuối tháng.',
  },
  QUARTERLY: {
    code: 'QUARTERLY',
    label: 'Hàng quý (30/04, 31/07, 31/10, 30/01)',
    badge: 'Hàng quý (30/04, 31/07...)',
    color: 'purple',
    legalBasis: 'Khoản 1 Điều 44 Luật QLT 38/2019 & NĐ 91/2022/NĐ-CP',
    description: 'Thuế GTGT, TNCN DN ≤ 50 tỷ hoặc mới thành lập; Tạm nộp TNDN 4 quý đạt tối thiểu 80%. Nếu ngày hạn trùng T7/CN, chuyển sang ngày làm việc liền kề theo NĐ 252/2026.',
  },
  BIANNUAL_6M: {
    code: 'BIANNUAL_6M',
    label: '6 Tháng / Bán niên (05/06, 05/12)',
    badge: '6 Tháng / Bán niên (05/06, 05/12)',
    color: 'orange',
    legalBasis: 'Khoản 2 Điều 4 Nghị định 145/2020/NĐ-CP & NĐ 139/2016/NĐ-CP',
    description: 'Báo cáo định kỳ tình hình sử dụng lao động 6 tháng đầu năm và cả năm; Môn bài thành lập 6 tháng cuối năm.',
  },
  ANNUAL: {
    code: 'ANNUAL',
    // Từ 01/01/2026: Lệ phí môn bài bãi bỏ hoàn toàn (NQ 198/2025/QH15 & NĐ 362/2025/NĐ-CP)
    // Label mới chỉ còn "Quyết toán thuế năm"
    label: 'Quyết toán thuế năm (Hạn 31/03)',
    badge: 'Quyết toán thuế năm',
    color: 'red',
    legalBasis: 'Điểm a Khoản 2 Điều 44 Luật QLT 38/2019 & Khoản 7 Điều 10 NQ 198/2025/QH15',
    description: 'Nộp BCTC, Quyết toán thuế TNDN, TNCN trước 31/03. Lưu ý: Từ 01/01/2026, lệ phí môn bài đã bãi bỏ theo NQ 198/2025/QH15 & NĐ 362/2025/NĐ-CP.',
  },
  EVENT_10D: {
    code: 'EVENT_10D',
    label: 'Từng lần phát sinh 10 ngày (Thuế nhà thầu FCT, ĐK NQLĐ)',
    badge: 'Từng lần 10 ngày (FCT, NQLĐ)',
    color: 'cyan',
    legalBasis: 'Khoản 3 Điều 44 Luật QLT 38/2019 & Điều 119 BLLĐ 2019',
    description: 'Khai nộp thuế nhà thầu FCT chạy Ads Facebook/Google/TikTok; Thuế chuyển nhượng vốn; ĐK Nội quy LĐ.',
  },
  EVENT_20D: {
    code: 'EVENT_20D',
    label: 'Đợt 20 ngày (Chuyển kỳ kê khai theo NĐ 126/2020)',
    badge: 'Đợt 20 ngày (Kỳ kê khai NĐ 126)',
    color: 'geekblue',
    legalBasis: 'Điều 9 Nghị định 126/2020/NĐ-CP',
    description: 'Nộp mẫu văn bản thông báo chuyển đổi kỳ kê khai thuế từ Quý sang Tháng khi vượt ngưỡng doanh thu 50 tỷ.',
  },
  EVENT_45D: {
    code: 'EVENT_45D',
    label: 'Đợt 45 ngày (Quyết toán giải thể, chia tách)',
    badge: 'Đợt 45 ngày (QT giải thể, chia tách)',
    color: 'magenta',
    legalBasis: 'Khoản 4 Điều 44 Luật Quản lý thuế số 38/2019/QH14',
    description: 'Quyết toán thuế dứt điểm khi giải thể, phá sản, chia tách, sáp nhập hoặc chấm dứt hoạt động.',
  },
  EVENT_3D: {
    code: 'EVENT_3D',
    label: '03 Ngày làm việc (Tạm ngừng / HĐĐT sai sót)',
    badge: '03 Ngày làm việc (Tạm ngừng / HĐĐT)',
    color: 'orange',
    legalBasis: 'Khoản 1 Điều 66 Nghị định 01/2021/NĐ-CP & Điều 19 Nghị định 123/2020/NĐ-CP',
    description: 'Thông báo tạm ngừng / tiếp tục kinh doanh trước 03 ngày làm việc; Giải trình hóa đơn sai sót Mẫu 04/SS-HĐĐT.',
  },
  EVENT_10D_BIZ: {
    code: 'EVENT_10D_BIZ',
    label: '10 Ngày làm việc (Đổi ĐKKD & Thông tin thuế)',
    badge: '10 Ngày làm việc (Đổi ĐKKD & Thuế)',
    color: 'gold',
    legalBasis: 'Điều 30 Luật Doanh nghiệp 2020 & Khoản 2 Điều 36 Luật Quản lý thuế số 38/2019/QH14',
    description: 'Đăng ký thay đổi nội dung ĐKKD (địa chỉ, đại diện pháp luật, ngành nghề, vốn); Thông báo tài khoản ngân hàng.',
  },
  EVENT_90D: {
    code: 'EVENT_90D',
    label: 'Đợt 90 ngày (Hạn góp đủ vốn điều lệ ban đầu)',
    badge: 'Đợt 90 ngày (Góp đủ vốn ĐL)',
    color: 'volcano',
    legalBasis: 'Khoản 2 Điều 47 & Khoản 2 Điều 75 Luật Doanh nghiệp 2020',
    description: 'Thời hạn tối đa để các thành viên góp đủ 100% số vốn điều lệ đã đăng ký cam kết kể từ ngày cấp GCN ĐKDN.',
  },
  EVENT_30D_CAPITAL: {
    code: 'EVENT_30D_CAPITAL',
    label: 'Đợt 30 ngày (Đăng ký giảm vốn điều lệ sau 90 ngày)',
    badge: 'Đợt 30 ngày (ĐK giảm vốn)',
    color: 'purple',
    legalBasis: 'Khoản 3 Điều 47 & Khoản 3 Điều 75 Luật Doanh nghiệp 2020',
    description: 'Thủ tục đăng ký điều chỉnh giảm vốn điều lệ bằng số vốn thực góp nếu sau 90 ngày chưa góp đủ vốn.',
  },
};

/**
 * Tính số ngày làm việc thực tế (bỏ qua Thứ Bảy & Chủ Nhật)
 */
export function addBusinessDays(startDate: Date, businessDays: number): Date {
  const result = new Date(startDate);
  let added = 0;
  while (added < businessDays) {
    result.setDate(result.getDate() + 1);
    const dayOfWeek = result.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      added++;
    }
  }
  return result;
}

/**
 * Tính toán hạn chót pháp lý gần nhất (Legal Due Date) theo quy định pháp luật
 * @param cycle Loại kỳ hạn
 * @param refDate Ngày mốc tính toán (mặc định là thời điểm hiện tại)
 */
export function calculateLegalDueDate(cycle: StatutoryCycleType, refDate: Date = new Date()): Date {
  const d = new Date(refDate);
  const currentYear = d.getFullYear();
  const currentMonth = d.getMonth(); // 0 - 11
  const currentDate = d.getDate();

  switch (cycle) {
    case 'MONTHLY': {
      const nextMonthYear = currentMonth === 11 ? currentYear + 1 : currentYear;
      const nextMonth = (currentMonth + 1) % 12;
      // Áp dụng chuyển ngày khi trùng cuối tuần (NĐ 252/2026 K7 Điều 3)
      return adjustForWeekend(new Date(nextMonthYear, nextMonth, 20, 23, 59, 59));
    }

    case 'QUARTERLY': {
      // Mốc cơ sở luật định:
      // Q1: 30/04 -> Nghỉ lễ 30/4, 1/5 và T7/CN -> chuyển thành 04/05/2026
      // Q2: 31/07 -> Thứ Sáu -> giữ nguyên 31/07/2026
      // Q3: 31/10 -> Thứ Bảy, CN 01/11 -> chuyển thành 02/11/2026
      // Q4: 31/01 năm sau -> Chủ Nhật -> chuyển thành 01/02/2027
      const rawQuarterDeadlines = [
        new Date(currentYear, 3, 30, 23, 59, 59),
        new Date(currentYear, 6, 31, 23, 59, 59),
        new Date(currentYear, 9, 31, 23, 59, 59),
        new Date(currentYear + 1, 0, 31, 23, 59, 59),
      ];
      const quarterDeadlines = rawQuarterDeadlines.map((dl) => adjustForWeekendAndHolidays(dl));

      for (const deadline of quarterDeadlines) {
        if (deadline.getTime() >= d.getTime()) {
          return deadline;
        }
      }
      return quarterDeadlines[0];
    }

    case 'BIANNUAL_6M': {
      const junDeadline = new Date(currentYear, 5, 5, 23, 59, 59); // 05/06
      const decDeadline = new Date(currentYear, 11, 5, 23, 59, 59); // 05/12

      if (d.getTime() <= junDeadline.getTime()) {
        return junDeadline;
      }
      if (d.getTime() <= decDeadline.getTime()) {
        return decDeadline;
      }
      return new Date(currentYear + 1, 5, 5, 23, 59, 59);
    }

    case 'ANNUAL': {
      // Từ 01/01/2026: Lệ phí môn bài bãi bỏ (NQ 198/2025/QH15 & NĐ 362/2025/NĐ-CP)
      // Hàm này chỉ tính deadline quyết toán TNDN/BCTC (31/03)
      const bctcDeadline = adjustForWeekend(new Date(currentYear, 2, 31, 23, 59, 59));

      if (d.getTime() <= bctcDeadline.getTime()) {
        return bctcDeadline;
      }
      return adjustForWeekend(new Date(currentYear + 1, 2, 31, 23, 59, 59));
    }

    case 'EVENT_10D': {
      const res = new Date(d);
      res.setDate(res.getDate() + 10);
      return res;
    }

    case 'EVENT_20D': {
      const res = new Date(d);
      res.setDate(res.getDate() + 20);
      return res;
    }

    case 'EVENT_45D': {
      const res = new Date(d);
      res.setDate(res.getDate() + 45);
      return res;
    }

    case 'EVENT_3D': {
      return addBusinessDays(d, 3);
    }

    case 'EVENT_10D_BIZ': {
      return addBusinessDays(d, 10);
    }

    case 'EVENT_90D': {
      const res = new Date(d);
      res.setDate(res.getDate() + 90);
      return res;
    }

    case 'EVENT_30D_CAPITAL': {
      const res = new Date(d);
      res.setDate(res.getDate() + 30);
      return res;
    }

    default: {
      const res = new Date(d);
      res.setDate(res.getDate() + 15);
      return res;
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  void currentDate; // suppress unused warning
}

/**
 * Trả về chuỗi ngày chuẩn YYYY-MM-DD
 */
export function formatISODate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Trả về chuỗi định dạng tiếng Việt: DD/MM/YYYY
 */
export function formatVNCalendarDate(date: Date | string): string {
  if (!date) return 'Định kỳ theo luật';
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return String(date);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * YÊU CẦU #3: CHÍNH SÁCH GIA HẠN NỘP THUẾ TNDN
 * Danh sách các chính sách gia hạn hiện hành năm 2026.
 * Không tự động áp dụng — chỉ hiển thị thông tin khi org đủ điều kiện và xác nhận.
 * ─────────────────────────────────────────────────────────────────────────────
 */
export interface TaxExtensionPolicy {
  /** Quyết TNDN / loại nghĩa vụ được gia hạn */
  label: string;
  /** Deadline thông thường (trước gia hạn) */
  normalDeadline: string; // YYYY-MM-DD
  /** Deadline sau khi được gia hạn */
  extendedDeadline: string; // YYYY-MM-DD
  /** Căn cứ pháp lý */
  legalBasis: string;
  /** Điều kiện gia hạn */
  conditions: string;
  /** Mã quy tắc liên quan */
  ruleCode?: string;
}

/**
 * Danh sách chính sách gia hạn năm 2026 theo Nghị định 245/2026/NĐ-CP.
 * NOTE: Số Nghị định này cần xác nhận chính thức từ team nghiệp vụ trước khi sử dụng.
 */
export const TAX_EXTENSION_POLICIES_2026: TaxExtensionPolicy[] = [
  {
    label: 'Tạm nộp TNDN Quý II/2026',
    normalDeadline: '2026-07-31',  // 31/07/2026 (Thứ Sáu)
    extendedDeadline: '2026-11-02', // 02/11/2026 (Thứ Hai, sau khi điều chỉnh cuối tuần)
    legalBasis: 'Nghị định 245/2026/NĐ-CP — Gia hạn nộp thuế TNDN tạm tính Quý II và III/2026',
    conditions:
      'Doanh nghiệp đáp ứng điều kiện theo Nghị định 245/2026 và đã nộp hồ sơ gia hạn đày đủ trước hạn chính thức.',
    ruleCode: 'RULE-TAX-TNDN-80',
  },
  {
    label: 'Tạm nộp TNDN Quý III/2026',
    normalDeadline: '2026-10-30',  // 30/10/2026 (Thứ Sáu)
    extendedDeadline: '2026-12-30', // 30/12/2026
    legalBasis: 'Nghị định 245/2026/NĐ-CP — Gia hạn nộp thuế TNDN tạm tính Quý II và III/2026',
    conditions:
      'Doanh nghiệp đáp ứng điều kiện theo Nghị định 245/2026 và đã nộp hồ sơ gia hạn đầy đủ trước hạn chính thức.',
    ruleCode: 'RULE-TAX-TNDN-80',
  },
];

/**
 * Kiểm tra và trả về thông tin gia hạn áp dụng cho một task cụ thể.
 * Không tự động gia hạn — chỉ gợi ý thông tin khi đáp ứng điều kiện.
 *
 * @param ruleCode Mã quy tắc của task
 * @param normalDueDateStr Hạn thông thường của task (YYYY-MM-DD hoặc ISO string)
 * @param orgHasAppliedExtension Org đã được xác nhận gia hạn chưa? (bước xác nhận thủ công)
 */
export function getExtensionInfo(
  ruleCode: string | undefined,
  normalDueDateStr: string | Date,
  orgHasAppliedExtension: boolean = false,
): {
  hasExtension: boolean;
  policy: TaxExtensionPolicy | null;
  extendedDueDate: Date | null;
  extensionStatus: 'NOT_APPLICABLE' | 'PENDING_VERIFICATION' | 'ELIGIBLE' | 'NOT_ELIGIBLE';
} {
  if (!ruleCode) {
    return { hasExtension: false, policy: null, extendedDueDate: null, extensionStatus: 'NOT_APPLICABLE' };
  }

  const normalDate = typeof normalDueDateStr === 'string' ? new Date(normalDueDateStr) : normalDueDateStr;
  if (isNaN(normalDate.getTime())) {
    return { hasExtension: false, policy: null, extendedDueDate: null, extensionStatus: 'NOT_APPLICABLE' };
  }

  // Tìm chính sách gia hạn phù hợp: cùng ruleCode và deadline thông thường khớp
  const normalDateStr = formatISODate(normalDate);
  const matchingPolicy = TAX_EXTENSION_POLICIES_2026.find(
    (p) => p.ruleCode === ruleCode && p.normalDeadline === normalDateStr,
  );

  if (!matchingPolicy) {
    return { hasExtension: false, policy: null, extendedDueDate: null, extensionStatus: 'NOT_APPLICABLE' };
  }

  // Có chính sách gia hạn áp dụng
  const extendedDueDate = new Date(matchingPolicy.extendedDeadline + 'T23:59:59');

  if (!orgHasAppliedExtension) {
    // Chưa xác nhận — cần kiểm tra hồ sơ
    return {
      hasExtension: true,
      policy: matchingPolicy,
      extendedDueDate,
      extensionStatus: 'PENDING_VERIFICATION',
    };
  }

  return {
    hasExtension: true,
    policy: matchingPolicy,
    extendedDueDate,
    extensionStatus: 'ELIGIBLE',
  };
}

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * YÊU CẦU #4: DEADLINE STATUS — Độc lập với Task Status
 * Tính toán động ở frontend, không cần cột DB.
 * ─────────────────────────────────────────────────────────────────────────────
 */
export type DeadlineStatusType = 'ON_TIME' | 'DUE_SOON' | 'OVERDUE_BY_CALENDAR' | 'EXTENDED';

export interface DeadlineStatusResult {
  deadlineStatus: DeadlineStatusType;
  /** Hạn thực tế áp dụng (gốc hoặc gia hạn) */
  effectiveDueDate: Date;
  /** Hạn gốc ban đầu (không thay đổi) */
  originalDueDate: Date;
  daysLeft: number;
  /** Số ngày quá hạn gốc (nếu được gia hạn) */
  daysOverOriginal: number;
  label: string;
  tagColor: string;
  iconType: 'clock' | 'clock-warning' | 'exclamation' | 'calendar' | 'check';
  isUsingExtension: boolean;
}

/**
 * Tính trạng thái thời hạn (deadline status) hoàn toàn độc lập với trạng thái công việc.
 *
 * Logic:
 * 1. Nếu task đã hoàn thành (isCompleted=true) → không hiển thị cảnh báo.
 * 2. Nếu có extensionDueDate và đang trong hạn gia hạn → status = EXTENDED.
 * 3. Nếu quá dueDate nhưng còn trong extensionDueDate → EXTENDED + hiển thị nhắc nhở.
 * 4. Nếu quá cả dueDate lẫn extensionDueDate (hoặc không có gia hạn) → OVERDUE_BY_CALENDAR.
 */
export function getDeadlineStatus(
  dueDate: string | Date,
  extensionDueDate?: string | Date | null,
  isCompleted?: boolean,
): DeadlineStatusResult {
  const now = new Date();
  const original = typeof dueDate === 'string' ? new Date(dueDate) : dueDate;
  const ext = extensionDueDate
    ? (typeof extensionDueDate === 'string' ? new Date(extensionDueDate) : extensionDueDate)
    : null;

  // 1. Trường hợp: Đã hoàn thành
  if (isCompleted) {
    const daysLeft = Math.ceil((original.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return {
      deadlineStatus: 'ON_TIME',
      effectiveDueDate: original,
      originalDueDate: original,
      daysLeft,
      daysOverOriginal: 0,
      label: 'Đã hoàn thành',
      tagColor: '#52c41a',
      iconType: 'check',
      isUsingExtension: false,
    };
  }

  const nowTs = now.getTime();
  const originalTs = original.getTime();
  const extTs = ext ? ext.getTime() : null;

  // 2. Trường hợp: Được gia hạn
  if (extTs && nowTs <= extTs) {
    const daysLeft = Math.ceil((extTs - nowTs) / (1000 * 60 * 60 * 24));
    const daysOverOriginal = nowTs > originalTs ? Math.ceil((nowTs - originalTs) / (1000 * 60 * 60 * 24)) : 0;

    return {
      deadlineStatus: 'EXTENDED',
      effectiveDueDate: ext!,
      originalDueDate: original,
      daysLeft,
      daysOverOriginal,
      label: `Được gia hạn đến ${formatVNCalendarDate(ext!)}`,
      tagColor: '#52c41a',
      iconType: 'calendar',
      isUsingExtension: true,
    };
  }

  // 3. Trường hợp: Đã quá hạn (theo lịch)
  if (nowTs > originalTs) {
    const daysOver = Math.ceil((nowTs - originalTs) / (1000 * 60 * 60 * 24));
    return {
      deadlineStatus: 'OVERDUE_BY_CALENDAR',
      effectiveDueDate: original,
      originalDueDate: original,
      daysLeft: -daysOver,
      daysOverOriginal: daysOver,
      label: 'Quá hạn theo lịch – Chưa xác nhận hoàn thành',
      tagColor: '#ff4d4f',
      iconType: 'exclamation',
      isUsingExtension: false,
    };
  }

  // Còn hạn
  const daysLeft = Math.ceil((originalTs - nowTs) / (1000 * 60 * 60 * 24));

  // 4. Trường hợp: Sắp đến hạn (còn <= 7 ngày)
  if (daysLeft <= 7) {
    return {
      deadlineStatus: 'DUE_SOON',
      effectiveDueDate: original,
      originalDueDate: original,
      daysLeft,
      daysOverOriginal: 0,
      label: `Còn ${daysLeft} ngày – Sắp đến hạn`,
      tagColor: '#fa541c',
      iconType: 'clock-warning',
      isUsingExtension: false,
    };
  }

  // 5. Trường hợp: Còn nhiều thời gian (còn > 7 ngày)
  return {
    deadlineStatus: 'ON_TIME',
    effectiveDueDate: original,
    originalDueDate: original,
    daysLeft,
    daysOverOriginal: 0,
    label: `Còn ${daysLeft} ngày`,
    tagColor: '#1677ff',
    iconType: 'clock',
    isUsingExtension: false,
  };
}

/**
 * Tương thích ngược — Tính số ngày còn lại đến hạn (API cũ).
 * Các component hiện tại dùng hàm này có thể nâng cấp dần sang getDeadlineStatus().
 */
export function getRemainingDaysInfo(dueDateStr: string | Date): {
  daysLeft: number;
  status: 'EXPIRED' | 'CRITICAL' | 'WARNING' | 'NORMAL';
  label: string;
  tagColor: string;
} {
  const result = getDeadlineStatus(dueDateStr);
  const { daysLeft, label, tagColor, deadlineStatus } = result;

  let status: 'EXPIRED' | 'CRITICAL' | 'WARNING' | 'NORMAL' = 'NORMAL';
  if (deadlineStatus === 'OVERDUE_BY_CALENDAR') status = 'EXPIRED';
  else if (daysLeft <= 3) status = 'CRITICAL';
  else if (daysLeft <= 7) status = 'WARNING';

  return { daysLeft, status, label, tagColor };
}

/**
 * Điều chỉnh ngày đến hạn nếu rơi vào Thứ 7, Chủ Nhật hoặc ngày nghỉ lễ theo Luật Quản lý Thuế.
 * Chuyển tự động sang Ngày làm việc tiếp theo (Thứ 2).
 */
export function adjustDeadlineForWeekendAndHoliday(targetDate: Date): { adjustedDate: Date; wasAdjusted: boolean; originalFormatted: string; explanation?: string } {
  const original = new Date(targetDate);
  const originalFormatted = formatVNCalendarDate(original);
  const adjusted = adjustForWeekendAndHolidays(targetDate);
  const wasAdjusted = adjusted.getTime() !== original.getTime();
  const explanation = wasAdjusted
    ? `Ngày gốc (${originalFormatted}) rơi vào ngày nghỉ/ngày lễ, hạn luật định tự động dời sang ngày làm việc tiếp theo (${formatVNCalendarDate(adjusted)}).`
    : undefined;

  return {
    adjustedDate: adjusted,
    wasAdjusted,
    originalFormatted,
    explanation,
  };
}

/**
 * Hàm tính hạn tạm nộp thuế Quý & Năm chuẩn xác, tự động dời ngày nếu rơi vào ngày nghỉ
 */
export function getCalculatedQuarterDeadline(quarter: number | 'ALL', year: number): {
  formattedDate: string;
  rawDate: Date;
  wasAdjusted: boolean;
  explanation?: string;
} {
  let target: Date;
  switch (quarter) {
    case 1:
      target = new Date(year, 3, 30, 23, 59, 59); // 30/04
      break;
    case 2:
      target = new Date(year, 6, 31, 23, 59, 59); // 31/07
      break;
    case 3:
      target = new Date(year, 9, 31, 23, 59, 59); // 31/10
      break;
    case 4:
      target = new Date(year + 1, 0, 31, 23, 59, 59); // 31/01 năm sau
      break;
    case 'ALL':
    default:
      target = new Date(year + 1, 2, 31, 23, 59, 59); // 31/03 năm sau (Quyết toán)
      break;
  }

  const { adjustedDate, wasAdjusted, explanation } = adjustDeadlineForWeekendAndHoliday(target);
  return {
    formattedDate: formatVNCalendarDate(adjustedDate),
    rawDate: adjustedDate,
    wasAdjusted,
    explanation: wasAdjusted ? `${explanation} (Căn cứ Luật Quản lý thuế số 38/2019/QH14 & Luật số 108/2025/QH15).` : undefined,
  };
}

/**
 * Helper tính hạn nộp tờ khai và tiền thuế các Quý có điều chỉnh ngày nghỉ lễ (NĐ 126/2020)
 * và chính sách gia hạn cho doanh nghiệp đủ điều kiện.
 */
export function getQuarterDeadline(quarter: number | 'ALL' | string, year: number, isExtensionEligible = false): string {
  if (isExtensionEligible) {
    if (String(quarter) === '2') {
      const { adjustedDate } = adjustDeadlineForWeekendAndHoliday(new Date(year, 9, 31, 23, 59, 59));
      return formatVNCalendarDate(adjustedDate);
    }
    if (String(quarter) === '3') {
      const { adjustedDate } = adjustDeadlineForWeekendAndHoliday(new Date(year, 11, 30, 23, 59, 59));
      return formatVNCalendarDate(adjustedDate);
    }
  }
  const q = quarter === 'ALL' ? 'ALL' : Number(quarter);
  return getCalculatedQuarterDeadline(q as number | 'ALL', year).formattedDate;
}

export function getQuarterReminderDate(quarter: number | 'ALL' | string, year: number, isExtensionEligible = false): string {
  const deadlineStr = getQuarterDeadline(quarter, year, isExtensionEligible);
  const [d, m, y] = deadlineStr.split('/').map(Number);
  const reminder = new Date(y, m - 1, d);
  reminder.setDate(reminder.getDate() - 7);
  return formatVNCalendarDate(reminder);
}
