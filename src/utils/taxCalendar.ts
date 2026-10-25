import type { StatutoryCycleType, StatutoryPeriodMeta } from '../interfaces';





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
    label: 'Hàng quý (30/04, 31/07, 31/10, 31/01)',
    badge: 'Hàng quý (30/04, 31/07...)',
    color: 'purple',
    legalBasis: 'Khoản 1 Điều 44 Luật QLT 38/2019 & NĐ 91/2022/NĐ-CP',
    description: 'Thuế GTGT, TNCN DN ≤ 50 tỷ hoặc mới thành lập; Tạm nộp TNDN 4 quý đạt tối thiểu 80%.',
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
    label: 'Cả năm (30/01 môn bài, 31/03 quyết toán BCTC)',
    badge: 'Cả năm (30/01 môn bài, 31/03 QT)',
    color: 'red',
    legalBasis: 'Điểm a Khoản 2 Điều 44 Luật QLT 38/2019 & Khoản 9 Điều 18 NĐ 126/2020',
    description: 'Nộp Lệ phí môn bài trước 30/01; Nộp BCTC, Quyết toán thuế TNDN, TNCN trước 31/03.',
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
      if (currentDate <= 20) {
        return new Date(currentYear, currentMonth, 20, 23, 59, 59);
      }
      return new Date(currentYear, currentMonth + 1, 20, 23, 59, 59);
    }

    case 'QUARTERLY': {
      const quarterDeadlines = [
        new Date(currentYear, 3, 30, 23, 59, 59), // 30/04
        new Date(currentYear, 6, 31, 23, 59, 59), // 31/07
        new Date(currentYear, 9, 31, 23, 59, 59), // 31/10
        new Date(currentYear + 1, 0, 31, 23, 59, 59), // 31/01 năm sau
      ];

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
      const monBaiDeadline = new Date(currentYear, 0, 30, 23, 59, 59);
      const bctcDeadline = new Date(currentYear, 2, 31, 23, 59, 59);

      if (d.getTime() <= monBaiDeadline.getTime()) {
        return monBaiDeadline;
      }
      if (d.getTime() <= bctcDeadline.getTime()) {
        return bctcDeadline;
      }
      return new Date(currentYear + 1, 0, 30, 23, 59, 59);
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
 * Tính số ngày còn lại đến hạn và đánh giá mức độ khẩn cấp
 */
export function getRemainingDaysInfo(dueDateStr: string | Date): {
  daysLeft: number;
  status: 'EXPIRED' | 'CRITICAL' | 'WARNING' | 'NORMAL';
  label: string;
  tagColor: string;
} {
  const target = typeof dueDateStr === 'string' ? new Date(dueDateStr) : dueDateStr;
  const now = new Date();
  const diffTime = target.getTime() - now.getTime();
  const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (daysLeft < 0) {
    return {
      daysLeft,
      status: 'EXPIRED',
      label: `Quá hạn ${Math.abs(daysLeft)} ngày!`,
      tagColor: 'error',
    };
  }
  if (daysLeft === 0) {
    return {
      daysLeft: 0,
      status: 'CRITICAL',
      label: 'Hạn chót hôm nay!',
      tagColor: 'red',
    };
  }
  if (daysLeft <= 3) {
    return {
      daysLeft,
      status: 'CRITICAL',
      label: `Còn ${daysLeft} ngày (Gấp)`,
      tagColor: 'volcano',
    };
  }
  if (daysLeft <= 7) {
    return {
      daysLeft,
      status: 'WARNING',
      label: `Còn ${daysLeft} ngày`,
      tagColor: 'orange',
    };
  }
  return {
    daysLeft,
    status: 'NORMAL',
    label: `Còn ${daysLeft} ngày`,
    tagColor: 'blue',
  };
}
