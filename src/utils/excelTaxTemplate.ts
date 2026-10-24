import * as XLSX from 'xlsx';

export interface RevenueRow {
  date: string;
  invoiceNo: string;
  description: string;
  amount: number;
}

export interface ExpenseRow {
  date: string;
  category: string;
  amount: number;
  paymentMethod: string; // 'Chuyển khoản' | 'Tiền mặt'
  hasInvoice: string;    // 'Có' | 'Không'
  note?: string;
}

export interface ParsedCitData {
  revenues: RevenueRow[];
  expenses: ExpenseRow[];
  fileName: string;
  totalRawRevenue: number;
  totalRawExpense: number;
}

/**
 * 📥 TẠO VÀ TẢI FILE EXCEL MẪU CHUẨN CỦA CELRA
 * Gồm đúng 2 Sheet: DOANH_THU và CHI_PHI
 */
export function downloadCitExcelTemplate(quarter: number | 'ALL' = 1, year: number = new Date().getFullYear()): void {
  const wb = XLSX.utils.book_new();

  // Tạo tháng mẫu theo quý được chọn
  let m1 = '01', m2 = '02', m3 = '03';
  if (quarter === 2) {
    m1 = '04'; m2 = '05'; m3 = '06';
  } else if (quarter === 3) {
    m1 = '07'; m2 = '08'; m3 = '09';
  } else if (quarter === 4) {
    m1 = '10'; m2 = '11'; m3 = '12';
  } else if (quarter === 'ALL') {
    m1 = '02'; m2 = '06'; m3 = '10';
  }

  // 1. Dữ liệu Sheet DOANH_THU
  const revenueData = [
    {
      'Ngày ghi nhận (DD/MM/YYYY)': `15/${m1}/${year}`,
      'Số hóa đơn': 'HD000128',
      'Diễn giải / Khách hàng': 'Cung cấp dịch vụ tư vấn doanh nghiệp cho Cty An Bình',
      'Doanh thu chưa thuế (VNĐ)': 120000000,
    },
    {
      'Ngày ghi nhận (DD/MM/YYYY)': `28/${m2}/${year}`,
      'Số hóa đơn': 'HD000129',
      'Diễn giải / Khách hàng': 'Thực hiện hợp đồng cung ứng gói phần mềm số đợt 1',
      'Doanh thu chưa thuế (VNĐ)': 250000000,
    },
    {
      'Ngày ghi nhận (DD/MM/YYYY)': `20/${m3}/${year}`,
      'Số hóa đơn': 'HD000130',
      'Diễn giải / Khách hàng': 'Bán lẻ hàng hóa qua kênh thương mại điện tử',
      'Doanh thu chưa thuế (VNĐ)': 85000000,
    },
  ];

  // 2. Dữ liệu Sheet CHI_PHI (Gồm cả chi phí chuẩn và các chi phí mẫu để test rủi ro)
  const expenseData = [
    {
      'Ngày chi (DD/MM/YYYY)': `10/${m1}/${year}`,
      'Khoản mục chi': 'Tiền thuê mặt bằng văn phòng làm việc',
      'Số tiền (VNĐ)': 30000000,
      'Phương thức thanh toán': 'Chuyển khoản',
      'Có hóa đơn GTGT?': 'Có',
      'Ghi chú': 'Hóa đơn tiền thuê nhà số 00412 chuyển khoản qua NH Vietcombank',
    },
    {
      'Ngày chi (DD/MM/YYYY)': `18/${m1}/${year}`,
      'Khoản mục chi': 'Lương Chủ tịch kiêm Giám đốc (Công ty TNHH 1TV)',
      'Số tiền (VNĐ)': 25000000,
      'Phương thức thanh toán': 'Chuyển khoản',
      'Có hóa đơn GTGT?': 'Không',
      'Ghi chú': 'Thù lao điều hành của chủ sở hữu cá nhân (Rủi ro bị loại B4)',
    },
    {
      'Ngày chi (DD/MM/YYYY)': `05/${m2}/${year}`,
      'Khoản mục chi': 'Mua thiết bị máy tính văn phòng',
      'Số tiền (VNĐ)': 22000000,
      'Phương thức thanh toán': 'Tiền mặt',
      'Có hóa đơn GTGT?': 'Có',
      'Ghi chú': 'Hóa đơn > 20 triệu nhưng trả tiền mặt (Rủi ro bị loại B4)',
    },
    {
      'Ngày chi (DD/MM/YYYY)': `15/${m2}/${year}`,
      'Khoản mục chi': 'Chi phí quảng cáo Facebook Ads trực tiếp qua thẻ',
      'Số tiền (VNĐ)': 15000000,
      'Phương thức thanh toán': 'Chuyển khoản',
      'Có hóa đơn GTGT?': 'Không',
      'Ghi chú': 'Dịch vụ nước ngoài xuyên biên giới (Cần nộp thuế nhà thầu FCT)',
    },
    {
      'Ngày chi (DD/MM/YYYY)': `22/${m2}/${year}`,
      'Khoản mục chi': 'Mua văn phòng phẩm, giấy in lặt vặt tiếp khách',
      'Số tiền (VNĐ)': 4500000,
      'Phương thức thanh toán': 'Tiền mặt',
      'Có hóa đơn GTGT?': 'Không',
      'Ghi chú': 'Chi phí không có hóa đơn chứng từ hợp lệ (Rủi ro bị loại B4)',
    },
    {
      'Ngày chi (DD/MM/YYYY)': `10/${m3}/${year}`,
      'Khoản mục chi': 'Thanh toán cước Internet và điện thoại công ty',
      'Số tiền (VNĐ)': 3500000,
      'Phương thức thanh toán': 'Chuyển khoản',
      'Có hóa đơn GTGT?': 'Có',
      'Ghi chú': 'Hóa đơn điện tử VNPT đầy đủ',
    },
  ];

  const wsRevenue = XLSX.utils.json_to_sheet(revenueData);
  const wsExpense = XLSX.utils.json_to_sheet(expenseData);

  // Đặt độ rộng cột tự động đẹp mắt
  wsRevenue['!cols'] = [
    { wch: 25 }, // Ngày
    { wch: 15 }, // Số HĐ
    { wch: 45 }, // Diễn giải
    { wch: 25 }, // Doanh thu
  ];

  wsExpense['!cols'] = [
    { wch: 22 }, // Ngày
    { wch: 40 }, // Khoản mục
    { wch: 20 }, // Số tiền
    { wch: 25 }, // Thanh toán
    { wch: 20 }, // Hóa đơn
    { wch: 45 }, // Ghi chú
  ];

  XLSX.utils.book_append_sheet(wb, wsRevenue, 'DOANH_THU');
  XLSX.utils.book_append_sheet(wb, wsExpense, 'CHI_PHI');

  const filePeriod = quarter === 'ALL' ? `Nam_${year}` : `Q${quarter}_${year}`;
  XLSX.writeFile(wb, `CELRA_Mau_Du_Toan_Thu_Chi_TNDN_${filePeriod}.xlsx`);
}

/**
 * 🛠️ CHUẨN HÓA VÀ BÓC TÁCH NGÀY THÁNG THÀNH QUÝ & NĂM CHÍNH XÁC
 * Hỗ trợ các định dạng: DD/MM/YYYY, DD-MM-YYYY, YYYY-MM-DD, Excel Serial Number
 */
export function parseRowQuarterYear(dateRaw: any): { quarter: number; year: number; rawFormatted: string } | null {
  if (dateRaw === null || dateRaw === undefined || dateRaw === '') return null;
  let s = String(dateRaw).trim();

  // Xử lý trường hợp số Serial Date của Excel (ví dụ 45312)
  if (typeof dateRaw === 'number' || (!isNaN(Number(s)) && Number(s) > 30000 && Number(s) < 65000)) {
    const num = Number(dateRaw);
    const dateObj = new Date(Math.round((num - 25569) * 86400 * 1000));
    if (!isNaN(dateObj.getTime())) {
      const d = String(dateObj.getDate()).padStart(2, '0');
      const m = String(dateObj.getMonth() + 1).padStart(2, '0');
      const y = dateObj.getFullYear();
      const monthNum = dateObj.getMonth() + 1;
      return {
        quarter: Math.floor((monthNum - 1) / 3) + 1,
        year: y,
        rawFormatted: `${d}/${m}/${y}`,
      };
    }
  }

  // DD/MM/YYYY hoặc DD-MM-YYYY (hoặc D/M/YYYY)
  const dmy = s.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})/);
  if (dmy) {
    const d = parseInt(dmy[1], 10);
    const m = parseInt(dmy[2], 10);
    const y = parseInt(dmy[3], 10);
    if (m >= 1 && m <= 12 && y >= 1900 && y <= 2100) {
      return {
        quarter: Math.floor((m - 1) / 3) + 1,
        year: y,
        rawFormatted: `${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}/${y}`,
      };
    }
  }

  // YYYY-MM-DD hoặc YYYY/MM/DD
  const ymd = s.match(/^(\d{4})[/-](\d{1,2})[/-](\d{1,2})/);
  if (ymd) {
    const y = parseInt(ymd[1], 10);
    const m = parseInt(ymd[2], 10);
    const d = parseInt(ymd[3], 10);
    if (m >= 1 && m <= 12 && y >= 1900 && y <= 2100) {
      return {
        quarter: Math.floor((m - 1) / 3) + 1,
        year: y,
        rawFormatted: `${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}/${y}`,
      };
    }
  }

  return null;
}

/**
 * 📂 ĐỌC VÀ BÓC TÁCH FILE EXCEL UPLOAD
 */
export async function parseCitExcelFile(file: File): Promise<ParsedCitData> {
  const buffer = await file.arrayBuffer();
  const wb = XLSX.read(buffer, { type: 'array' });

  // 1. Tìm sheet Doanh thu
  const revenueSheetName = wb.SheetNames.find(
    (name) => name.toUpperCase().includes('DOANH_THU') || name.toUpperCase().includes('REVENUE')
  ) || wb.SheetNames[0];

  // 2. Tìm sheet Chi phí
  const expenseSheetName = wb.SheetNames.find(
    (name) => name.toUpperCase().includes('CHI_PHI') || name.toUpperCase().includes('EXPENSE')
  ) || wb.SheetNames[1] || wb.SheetNames[0];

  const rawRevenues: any[] = XLSX.utils.sheet_to_json(wb.Sheets[revenueSheetName] || {});
  const rawExpenses: any[] = XLSX.utils.sheet_to_json(wb.Sheets[expenseSheetName] || {});

  // Chuẩn hóa dữ liệu Doanh thu
  const revenues: RevenueRow[] = rawRevenues.map((row: any) => {
    const rawDate = row['Ngày ghi nhận (DD/MM/YYYY)'] || row['Ngày'] || row['Ngay'] || '';
    const parsedDate = parseRowQuarterYear(rawDate);
    const dateFormatted = parsedDate ? parsedDate.rawFormatted : String(rawDate || '');
    const invoiceNo = String(row['Số hóa đơn'] || row['Số HĐ'] || row['So HD'] || '');
    const description = String(row['Diễn giải / Khách hàng'] || row['Diễn giải'] || row['Khách hàng'] || '');
    const amountVal = Number(row['Doanh thu chưa thuế (VNĐ)'] || row['Doanh thu'] || row['Số tiền'] || 0);

    return {
      date: dateFormatted,
      invoiceNo,
      description,
      amount: isNaN(amountVal) ? 0 : amountVal,
    };
  }).filter((r) => r.amount > 0);

  // Chuẩn hóa dữ liệu Chi phí
  const expenses: ExpenseRow[] = rawExpenses.map((row: any) => {
    const rawDate = row['Ngày chi (DD/MM/YYYY)'] || row['Ngày'] || row['Ngay'] || '';
    const parsedDate = parseRowQuarterYear(rawDate);
    const dateFormatted = parsedDate ? parsedDate.rawFormatted : String(rawDate || '');
    const category = String(row['Khoản mục chi'] || row['Nội dung'] || row['Khoản mục'] || '');
    const amountVal = Number(row['Số tiền (VNĐ)'] || row['Số tiền'] || row['Chi phí'] || 0);
    const paymentMethod = String(row['Phương thức thanh toán'] || row['Thanh toán'] || 'Chuyển khoản');
    const hasInvoice = String(row['Có hóa đơn GTGT?'] || row['Có hóa đơn'] || 'Có');
    const note = String(row['Ghi chú'] || '');

    return {
      date: dateFormatted,
      category,
      amount: isNaN(amountVal) ? 0 : amountVal,
      paymentMethod,
      hasInvoice,
      note,
    };
  }).filter((e) => e.amount > 0);

  const totalRawRevenue = revenues.reduce((sum, r) => sum + r.amount, 0);
  const totalRawExpense = expenses.reduce((sum, e) => sum + e.amount, 0);

  return {
    revenues,
    expenses,
    fileName: file.name,
    totalRawRevenue,
    totalRawExpense,
  };
}

/**
 * 🔍 TỰ ĐỘNG BÓC TÁCH KỲ KÊ KHAI (QUÝ & NĂM) TỪ DỮ LIỆU EXCEL UPLOAD
 */
export function detectPeriodFromCitData(
  revenues: RevenueRow[],
  expenses: ExpenseRow[]
): { quarter?: number; year?: number } {
  const sampleDates = [...revenues.map((r) => r.date), ...expenses.map((e) => e.date)].filter(Boolean);
  for (const dateStr of sampleDates) {
    const dStr = String(dateStr).trim();
    // DD/MM/YYYY hoặc DD-MM-YYYY
    const dmy = dStr.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})/);
    if (dmy) {
      const month = parseInt(dmy[2], 10);
      const year = parseInt(dmy[3], 10);
      if (month >= 1 && month <= 12 && year >= 2000 && year <= 2100) {
        return { quarter: Math.floor((month - 1) / 3) + 1, year };
      }
    }
    // YYYY-MM-DD hoặc YYYY/MM/DD
    const ymd = dStr.match(/^(\d{4})[/-](\d{1,2})[/-](\d{1,2})/);
    if (ymd) {
      const year = parseInt(ymd[1], 10);
      const month = parseInt(ymd[2], 10);
      if (month >= 1 && month <= 12 && year >= 2000 && year <= 2100) {
        return { quarter: Math.floor((month - 1) / 3) + 1, year };
      }
    }
  }
  return {};
}
