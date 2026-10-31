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
 * 🛠️ CHUẨN HÓA TIÊU ĐỀ HOẶC TÊN SHEET ĐỂ TÌM KIẾM KHÔNG PHÂN BIỆT DẤU / CÁCH / CHỮ HOA THƯỜNG
 */
export function normalizeKey(str: unknown): string {
  return String(str || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9]/g, '');
}

/**
 * 🛠️ XÂY DỰNG OBJECT VỚI TẤT CẢ CÁC KEY ĐÃ ĐƯỢC CHUẨN HÓA
 */
export function buildNormalizedRow(row: Record<string, unknown>): Record<string, unknown> {
  const normMap: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(row || {})) {
    normMap[normalizeKey(key)] = value;
  }
  return normMap;
}

/**
 * 🛠️ LẤY GIÁ TRỊ TỪ DÒNG DỰA TRÊN DANH SÁCH KEY ỨNG VIÊN
 */
export function findRowValue(rowMap: Record<string, unknown>, candidateKeys: string[]): unknown {
  for (const k of candidateKeys) {
    const norm = normalizeKey(k);
    if (rowMap[norm] !== undefined && rowMap[norm] !== null && String(rowMap[norm]).trim() !== '') {
      return rowMap[norm];
    }
  }
  return undefined;
}

/**
 * 🔍 TÌM SHEET TRONG FILE EXCEL VỚI ĐỘ LINH HOẠT CAO
 */
export function findSheetByName(sheetNames: string[], targets: string[], fallbackIndex = 0): string {
  if (!sheetNames || sheetNames.length === 0) return '';
  for (const target of targets) {
    const normTarget = normalizeKey(target);
    const found = sheetNames.find((name) => normalizeKey(name).includes(normTarget));
    if (found) return found;
  }
  return sheetNames[fallbackIndex] || sheetNames[0];
}

/**
 * 💰 CHUYỂN ĐỔI SỐ TIỀN TỪ MỌI ĐỊNH DẠNG (VNĐ CHẤM, PHẨY, DẤU CÁCH, CHỮ Đ, VNĐ, V.V.)
 */
export function parseAmount(val: unknown): number {
  if (val === null || val === undefined || val === '') return NaN;
  if (typeof val === 'number') return isNaN(val) ? NaN : val;

  let s = String(val).trim();
  if (!s) return NaN;

  // Loại bỏ các ký hiệu tiền tệ
  s = s.replace(/(?:VNĐ|VND|đồng|đ|\$)\s*$/i, '').trim();

  // Xử lý số âm trong kế toán (ví dụ: (100.000))
  let isNegative = false;
  if (s.startsWith('(') && s.endsWith(')')) {
    isNegative = true;
    s = s.slice(1, -1).trim();
  } else if (s.startsWith('-')) {
    isNegative = true;
    s = s.slice(1).trim();
  }

  // 1. Định dạng kiểu Việt Nam: 120.000.000 hoặc 120.000.000,50 (dấu chấm phân cách ngàn, dấu phẩy thập phân)
  if (/^\d{1,3}(?:\.\d{3})+(?:,\d+)?$/.test(s)) {
    s = s.replace(/\./g, '').replace(',', '.');
  }
  // 2. Định dạng kiểu Quốc tế: 120,000,000 hoặc 120,000,000.50 (dấu phẩy phân cách ngàn, dấu chấm thập phân)
  else if (/^\d{1,3}(?:,\d{3})+(?:\.\d+)?$/.test(s)) {
    s = s.replace(/,/g, '');
  }
  // 3. Phân cách ngàn bằng dấu phẩy không có thập phân: 120,000,000
  else if (/^\d+(?:,\d{3})*$/.test(s)) {
    s = s.replace(/,/g, '');
  }
  // 4. Phân cách ngàn bằng dấu chấm không có thập phân: 120.000.000
  else if (/^\d+(?:\.\d{3})*$/.test(s)) {
    s = s.replace(/\./g, '');
  }
  // 5. Loại bỏ khoảng trắng giữa các chữ số: 120 000 000
  else {
    s = s.replace(/\s+/g, '');
  }

  const num = Number(s);
  if (isNaN(num)) return NaN;
  return isNegative ? -num : num;
}

/**
 * 🛑 NHẬN DIỆN DÒNG TỔNG CỘNG / CỘNG CUỐI FILE EXCEL CỦA KẾ TOÁN ĐỂ BỎ QUA AN TOÀN
 */
export function isSummaryRow(row: Record<string, unknown>, normMap: Record<string, unknown>): boolean {
  const allValues = [...Object.values(row || {}), ...Object.values(normMap || {})];
  for (const val of allValues) {
    const s = String(val ?? '').trim().toLowerCase();
    if (
      s === 'tổng cộng' ||
      s === 'tong cong' ||
      s === 'tổng' ||
      s === 'tong' ||
      s === 'cộng' ||
      s === 'cong' ||
      s === 'total' ||
      s.startsWith('tổng cộng') ||
      s.startsWith('tong cong') ||
      s.startsWith('cộng:') ||
      s.startsWith('tổng:')
    ) {
      return true;
    }
  }
  return false;
}

/**
 * 🛠️ CHUẨN HÓA VÀ BÓC TÁCH NGÀY THÁNG THÀNH QUÝ & NĂM CHÍNH XÁC
 * Hỗ trợ các định dạng: Date object, DD/MM/YYYY, DD-MM-YYYY, DD.MM.YYYY, YYYY-MM-DD, MM/DD/YYYY, Excel Serial Number
 */
export function parseRowQuarterYear(dateRaw: unknown): { quarter: number; year: number; rawFormatted: string } | null {
  if (dateRaw === null || dateRaw === undefined || dateRaw === '') return null;

  // 1. Trường hợp là JavaScript Date object
  if (dateRaw instanceof Date && !isNaN(dateRaw.getTime())) {
    const d = String(dateRaw.getDate()).padStart(2, '0');
    const m = String(dateRaw.getMonth() + 1).padStart(2, '0');
    const y = dateRaw.getFullYear();
    const monthNum = dateRaw.getMonth() + 1;
    return {
      quarter: Math.floor((monthNum - 1) / 3) + 1,
      year: y,
      rawFormatted: `${d}/${m}/${y}`,
    };
  }

  const s = String(dateRaw).trim();
  if (!s) return null;

  // 2. Xử lý trường hợp số Serial Date của Excel (ví dụ 45312) bằng bộ phân tích SSF chuẩn của thư viện xlsx
  const isAllDigitsOrFloat = /^\d+(\.\d+)?$/.test(s);
  if (
    (typeof dateRaw === 'number' && !isNaN(dateRaw) && dateRaw >= 30000 && dateRaw <= 65000) ||
    (isAllDigitsOrFloat && Number(s) >= 30000 && Number(s) <= 65000)
  ) {
    const num = Number(dateRaw);
    try {
      const parsed = XLSX.SSF.parse_date_code(num);
      if (parsed && parsed.y && parsed.m && parsed.d) {
        const d = String(parsed.d).padStart(2, '0');
        const m = String(parsed.m).padStart(2, '0');
        const y = parsed.y;
        return {
          quarter: Math.floor((parsed.m - 1) / 3) + 1,
          year: y,
          rawFormatted: `${d}/${m}/${y}`,
        };
      }
    } catch {
      // Fallback nếu SSF parse gặp sự cố
      const dateObj = new Date(Math.round((num - 25569) * 86400 * 1000));
      if (!isNaN(dateObj.getTime())) {
        const d = String(dateObj.getUTCDate()).padStart(2, '0');
        const m = String(dateObj.getUTCMonth() + 1).padStart(2, '0');
        const y = dateObj.getUTCFullYear();
        const monthNum = dateObj.getUTCMonth() + 1;
        return {
          quarter: Math.floor((monthNum - 1) / 3) + 1,
          year: y,
          rawFormatted: `${d}/${m}/${y}`,
        };
      }
    }
  }

  // 3. DD/MM/YYYY hoặc DD-MM-YYYY hoặc DD.MM.YYYY
  const dmy = s.match(/^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{4})/);
  if (dmy) {
    const p1 = parseInt(dmy[1], 10);
    const p2 = parseInt(dmy[2], 10);
    const y = parseInt(dmy[3], 10);

    let d = p1;
    let m = p2;
    // Nếu p1 <= 12 và p2 > 12 và p2 <= 31: Đây là định dạng US MM/DD/YYYY
    if (p1 <= 12 && p2 > 12 && p2 <= 31) {
      m = p1;
      d = p2;
    }

    if (m >= 1 && m <= 12 && d >= 1 && d <= 31 && y >= 1900 && y <= 2100) {
      return {
        quarter: Math.floor((m - 1) / 3) + 1,
        year: y,
        rawFormatted: `${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}/${y}`,
      };
    }
  }

  // 4. YYYY-MM-DD hoặc YYYY/MM/DD hoặc YYYY.MM.DD (kể cả kèm chuỗi giờ ISO)
  const ymd = s.match(/^(\d{4})[/\-.](\d{1,2})[/\-.](\d{1,2})/);
  if (ymd) {
    const y = parseInt(ymd[1], 10);
    const m = parseInt(ymd[2], 10);
    const d = parseInt(ymd[3], 10);
    if (m >= 1 && m <= 12 && d >= 1 && d <= 31 && y >= 1900 && y <= 2100) {
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
 * 📥 TẠO VÀ TẢI FILE EXCEL MẪU CHUẨN CỦA CELRA
 * Gồm đúng 2 Sheet: DOANH_THU và CHI_PHI
 */
export function downloadCitExcelTemplate(quarter: number | 'ALL' = 1, year: number = new Date().getFullYear()): void {
  const wb = XLSX.utils.book_new();
  const qNum = typeof quarter === 'number' ? quarter : (quarter === 'ALL' ? 'ALL' : Number(quarter) || 1);

  // Tạo tháng mẫu theo quý được chọn
  let m1 = '01', m2 = '02', m3 = '03';
  if (qNum === 2) {
    m1 = '04'; m2 = '05'; m3 = '06';
  } else if (qNum === 3) {
    m1 = '07'; m2 = '08'; m3 = '09';
  } else if (qNum === 4) {
    m1 = '10'; m2 = '11'; m3 = '12';
  } else if (qNum === 'ALL') {
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
      'Ghi chú': 'Hóa đơn > 5 triệu nhưng trả tiền mặt (Rủi ro bị loại B4 Luật 48/2024 & TT 96/2015)',
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

  wsRevenue['!cols'] = [
    { wch: 25 },
    { wch: 15 },
    { wch: 45 },
    { wch: 25 },
  ];

  wsExpense['!cols'] = [
    { wch: 22 },
    { wch: 40 },
    { wch: 20 },
    { wch: 25 },
    { wch: 20 },
    { wch: 45 },
  ];

  XLSX.utils.book_append_sheet(wb, wsRevenue, 'DOANH_THU');
  XLSX.utils.book_append_sheet(wb, wsExpense, 'CHI_PHI');

  const filePeriod = qNum === 'ALL' ? `Nam_${year}` : `Q${qNum}_${year}`;
  XLSX.writeFile(wb, `CELRA_Mau_Du_Toan_Thu_Chi_TNDN_${filePeriod}.xlsx`);
}

/**
 * 📥 TẢI FILE MẪU EXCEL RIÊNG CHO DOANH THU
 */
export function downloadRevenueExcelTemplate(quarter: number | 'ALL' = 1, year: number = new Date().getFullYear()): void {
  const wb = XLSX.utils.book_new();
  const qNum = typeof quarter === 'number' ? quarter : (quarter === 'ALL' ? 'ALL' : Number(quarter) || 1);

  let m1 = '01', m2 = '02', m3 = '03';
  if (qNum === 2) { m1 = '04'; m2 = '05'; m3 = '06'; }
  else if (qNum === 3) { m1 = '07'; m2 = '08'; m3 = '09'; }
  else if (qNum === 4) { m1 = '10'; m2 = '11'; m3 = '12'; }
  else if (qNum === 'ALL') { m1 = '02'; m2 = '06'; m3 = '10'; }

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

  const wsRevenue = XLSX.utils.json_to_sheet(revenueData);
  wsRevenue['!cols'] = [{ wch: 25 }, { wch: 15 }, { wch: 45 }, { wch: 25 }];
  XLSX.utils.book_append_sheet(wb, wsRevenue, 'DOANH_THU');

  const filePeriod = qNum === 'ALL' ? `Nam_${year}` : `Q${qNum}_${year}`;
  XLSX.writeFile(wb, `CELRA_Mau_Doanh_Thu_TNDN_${filePeriod}.xlsx`);
}

/**
 * 📥 TẢI FILE MẪU EXCEL RIÊNG CHO CHI PHÍ
 */
export function downloadExpenseExcelTemplate(quarter: number | 'ALL' = 1, year: number = new Date().getFullYear()): void {
  const wb = XLSX.utils.book_new();
  const qNum = typeof quarter === 'number' ? quarter : (quarter === 'ALL' ? 'ALL' : Number(quarter) || 1);

  let m1 = '01', m2 = '02', m3 = '03';
  if (qNum === 2) { m1 = '04'; m2 = '05'; m3 = '06'; }
  else if (qNum === 3) { m1 = '07'; m2 = '08'; m3 = '09'; }
  else if (qNum === 4) { m1 = '10'; m2 = '11'; m3 = '12'; }
  else if (qNum === 'ALL') { m1 = '02'; m2 = '06'; m3 = '10'; }

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
      'Ghi chú': 'Hóa đơn > 5 triệu nhưng trả tiền mặt (Rủi ro bị loại B4 Luật Thuế GTGT 48/2024 & TT 96/2015)',
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

  const wsExpense = XLSX.utils.json_to_sheet(expenseData);
  wsExpense['!cols'] = [
    { wch: 22 }, { wch: 40 }, { wch: 20 }, { wch: 25 }, { wch: 20 }, { wch: 45 }
  ];
  XLSX.utils.book_append_sheet(wb, wsExpense, 'CHI_PHI');

  const filePeriod = qNum === 'ALL' ? `Nam_${year}` : `Q${qNum}_${year}`;
  XLSX.writeFile(wb, `CELRA_Mau_Chi_Phi_TNDN_${filePeriod}.xlsx`);
}

/**
 * 📂 ĐỌC VÀ BÓC TÁCH FILE EXCEL CHỨA CẢ DOANH THU & CHI PHÍ
 */
export async function parseCitExcelFile(file: File): Promise<ParsedCitData> {
  const buffer = await file.arrayBuffer();
  const wb = XLSX.read(buffer, { type: 'array' });

  // 1. Tìm sheet Doanh thu thông minh
  const revenueSheetName = findSheetByName(wb.SheetNames, ['doanh_thu', 'doanh thu', 'revenue', 'income', 'thu'], 0);

  // 2. Tìm sheet Chi phí thông minh
  const expenseSheetName = findSheetByName(wb.SheetNames, ['chi_phi', 'chi phi', 'expense', 'cost', 'chi'], 1);

  const rawRevenues = XLSX.utils.sheet_to_json<Record<string, unknown>>(wb.Sheets[revenueSheetName] || {});
  const rawExpenses = XLSX.utils.sheet_to_json<Record<string, unknown>>(wb.Sheets[expenseSheetName] || {});

  // Chuẩn hóa dữ liệu Doanh thu
  const revenues: RevenueRow[] = [];
  for (const row of rawRevenues) {
    const norm = buildNormalizedRow(row);
    if (isSummaryRow(row, norm)) continue;

    const rawDate = findRowValue(norm, [
      'ngayghinhanddmmyyyy', 'ngayghinhan', 'ngaychungtu', 'ngayhd', 'ngayhoadon', 'ngay', 'date'
    ]);
    const parsedDate = parseRowQuarterYear(rawDate);
    const dateFormatted = parsedDate ? parsedDate.rawFormatted : String(rawDate || '');

    const invoiceNo = String(findRowValue(norm, [
      'sohoadon', 'sohd', 'sochungtu', 'soct', 'mahd', 'invoiceno', 'invoice'
    ]) || '').trim();

    const description = String(findRowValue(norm, [
      'diengiaikhachhang', 'diengiai', 'khachhang', 'noidung', 'tenhanghoa', 'hanghoa', 'description'
    ]) || '').trim();

    const rawAmount = findRowValue(norm, [
      'doanhthuchuathuevnd', 'doanhthuchuathue', 'doanhthu', 'sotienvnd', 'sotien', 'tienchuathue', 'thanhtien', 'amount'
    ]);
    const amountVal = parseAmount(rawAmount);
    const amount = isNaN(amountVal) ? 0 : amountVal;

    if (amount > 0) {
      revenues.push({
        date: dateFormatted,
        invoiceNo,
        description,
        amount,
      });
    }
  }

  // Chuẩn hóa dữ liệu Chi phí
  const expenses: ExpenseRow[] = [];
  for (const row of rawExpenses) {
    const norm = buildNormalizedRow(row);
    if (isSummaryRow(row, norm)) continue;

    const rawDate = findRowValue(norm, [
      'ngaychiddmmyyyy', 'ngaychi', 'ngaychungtu', 'ngayhd', 'ngayhoadon', 'ngay', 'date'
    ]);
    const parsedDate = parseRowQuarterYear(rawDate);
    const dateFormatted = parsedDate ? parsedDate.rawFormatted : String(rawDate || '');

    const category = String(findRowValue(norm, [
      'khoanmucchi', 'khoanmuc', 'noidungchi', 'noidung', 'tenchiphi', 'chiphi', 'diengiai', 'category'
    ]) || '').trim();

    const rawAmount = findRowValue(norm, [
      'sotienvnd', 'sotien', 'chiphi', 'thanhtien', 'amount'
    ]);
    const amountVal = parseAmount(rawAmount);
    const amount = isNaN(amountVal) ? 0 : amountVal;

    const paymentMethod = String(findRowValue(norm, [
      'phuongthucthanhtoan', 'hinhthucthanhtoan', 'hinhthuctt', 'ptthanhtoan', 'thanhtoan', 'pttt', 'paymentmethod'
    ]) || 'Chuyển khoản').trim() || 'Chuyển khoản';

    const hasInvoice = String(findRowValue(norm, [
      'cohoadongtgt', 'cohoadon', 'hoadongtgt', 'hoadon', 'hasinvoice', 'invoice'
    ]) || 'Có').trim() || 'Có';

    const noteRaw = findRowValue(norm, ['ghichu', 'note', 'chuthich']);
    const note = noteRaw ? String(noteRaw).trim() : undefined;

    if (amount > 0) {
      expenses.push({
        date: dateFormatted,
        category,
        amount,
        paymentMethod,
        hasInvoice,
        note,
      });
    }
  }

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
    const parsed = parseRowQuarterYear(dateStr);
    if (parsed && parsed.year >= 2000 && parsed.year <= 2100) {
      return { quarter: parsed.quarter, year: parsed.year };
    }
  }
  return {};
}

/**
 * 📂 ĐỌC VÀ BÓC TÁCH FILE EXCEL CHỈ CHỨA DOANH THU (KIỂM TRA CHẶT CHẼ ĐỦ DỮ LIỆU & ĐÚNG KỲ KÊ KHAI)
 */
export async function parseRevenueExcelOnly(
  file: File,
  targetQuarter?: number | 'ALL',
  targetYear?: number
): Promise<RevenueRow[]> {
  const buffer = await file.arrayBuffer();
  const wb = XLSX.read(buffer, { type: 'array' });

  const sheetName = findSheetByName(wb.SheetNames, ['doanh_thu', 'doanh thu', 'revenue', 'income', 'thu'], 0);

  const rawRevenues = XLSX.utils.sheet_to_json<Record<string, unknown>>(wb.Sheets[sheetName] || {});
  if (!rawRevenues || rawRevenues.length === 0) {
    throw new Error('Dữ liệu của bạn còn thiếu không thể import! File Excel không có dòng dữ liệu nào.');
  }

  const results: RevenueRow[] = [];
  const invalidPeriodRows: string[] = [];

  for (let i = 0; i < rawRevenues.length; i++) {
    const row = rawRevenues[i];
    const rowNum = i + 2; // Dòng 1 là tiêu đề

    // Kiểm tra hàng có dữ liệu hay không
    const rowValues = Object.values(row).map((v) => String(v ?? '').trim()).filter(Boolean);
    if (rowValues.length === 0) {
      continue; // Bỏ qua dòng trống
    }

    const norm = buildNormalizedRow(row);

    // Bỏ qua dòng tổng cộng ở cuối bảng nếu kế toán có chèn dòng này
    if (isSummaryRow(row, norm)) {
      continue;
    }

    const missingFields: string[] = [];

    const rawDate = findRowValue(norm, [
      'ngayghinhanddmmyyyy', 'ngayghinhan', 'ngaychungtu', 'ngayhd', 'ngayhoadon', 'ngay', 'date'
    ]);
    const parsedDate = parseRowQuarterYear(rawDate);
    if (!rawDate || !parsedDate) {
      missingFields.push('Ngày ghi nhận (DD/MM/YYYY)');
    }

    const description = String(findRowValue(norm, [
      'diengiaikhachhang', 'diengiai', 'khachhang', 'noidung', 'tenhanghoa', 'hanghoa', 'description'
    ]) || '').trim();
    if (!description) {
      missingFields.push('Diễn giải / Khách hàng');
    }

    const rawAmount = findRowValue(norm, [
      'doanhthuchuathuevnd', 'doanhthuchuathue', 'doanhthu', 'sotienvnd', 'sotien', 'tienchuathue', 'thanhtien', 'amount'
    ]);
    const amountVal = parseAmount(rawAmount);
    if (isNaN(amountVal) || amountVal <= 0) {
      missingFields.push('Doanh thu chưa thuế (phải là số > 0)');
    }

    if (missingFields.length > 0) {
      throw new Error(
        `Dữ liệu của bạn còn thiếu không thể import! Tại dòng #${rowNum} còn thiếu: ${missingFields.join(', ')}.`
      );
    }

    const invoiceNo = String(findRowValue(norm, [
      'sohoadon', 'sohd', 'sochungtu', 'soct', 'mahd', 'invoiceno', 'invoice'
    ]) || '').trim();

    // 🔍 Kiểm tra thời gian hóa đơn có khớp với Quý / Năm đang chọn hay không
    if (targetQuarter !== undefined && targetYear !== undefined && parsedDate) {
      const tQuarter = targetQuarter === 'ALL' ? 'ALL' : Number(targetQuarter);
      const tYear = Number(targetYear);

      if (tQuarter !== 'ALL') {
        if (parsedDate.quarter !== tQuarter || parsedDate.year !== tYear) {
          invalidPeriodRows.push(
            `• Dòng #${rowNum}: Số HĐ "${invoiceNo || 'Không số'}", ngày ${parsedDate.rawFormatted} (thuộc Quý ${parsedDate.quarter}/${parsedDate.year})`
          );
        }
      } else {
        if (parsedDate.year !== tYear) {
          invalidPeriodRows.push(
            `• Dòng #${rowNum}: Số HĐ "${invoiceNo || 'Không số'}", ngày ${parsedDate.rawFormatted} (thuộc năm ${parsedDate.year})`
          );
        }
      }
    }

    results.push({
      date: parsedDate!.rawFormatted,
      invoiceNo,
      description,
      amount: amountVal,
    });
  }

  if (invalidPeriodRows.length > 0) {
    const periodLabel = targetQuarter === 'ALL' ? `năm ${targetYear}` : `Quý ${targetQuarter}/${targetYear}`;
    const displayedErrors = invalidPeriodRows.slice(0, 5).join('\n');
    const extraCount = invalidPeriodRows.length > 5 ? `\n... và còn ${invalidPeriodRows.length - 5} hóa đơn khác.` : '';
    throw new Error(
      `Phát hiện hóa đơn không nằm trong ${periodLabel} đang chọn:\n${displayedErrors}${extraCount}\n\nVui lòng kiểm tra lại ngày trên hóa đơn hoặc chọn đúng kỳ kê khai trước khi nạp file!`
    );
  }

  if (results.length === 0) {
    throw new Error('Dữ liệu của bạn còn thiếu không thể import! Không tìm thấy dòng dữ liệu hợp lệ.');
  }

  return results;
}

/**
 * 📂 ĐỌC VÀ BÓC TÁCH FILE EXCEL CHỈ CHỨA CHI PHÍ (KIỂM TRA CHẶT CHẼ ĐỦ DỮ LIỆU & ĐÚNG KỲ KÊ KHAI)
 */
export async function parseExpenseExcelOnly(
  file: File,
  targetQuarter?: number | 'ALL',
  targetYear?: number
): Promise<ExpenseRow[]> {
  const buffer = await file.arrayBuffer();
  const wb = XLSX.read(buffer, { type: 'array' });

  const sheetName = findSheetByName(wb.SheetNames, ['chi_phi', 'chi phi', 'expense', 'cost', 'chi'], 0);

  const rawExpenses = XLSX.utils.sheet_to_json<Record<string, unknown>>(wb.Sheets[sheetName] || {});
  if (!rawExpenses || rawExpenses.length === 0) {
    throw new Error('Dữ liệu của bạn còn thiếu không thể import! File Excel không có dòng dữ liệu nào.');
  }

  const results: ExpenseRow[] = [];
  const invalidPeriodRows: string[] = [];

  for (let i = 0; i < rawExpenses.length; i++) {
    const row = rawExpenses[i];
    const rowNum = i + 2;

    const rowValues = Object.values(row).map((v) => String(v ?? '').trim()).filter(Boolean);
    if (rowValues.length === 0) {
      continue;
    }

    const norm = buildNormalizedRow(row);

    // Bỏ qua dòng tổng cộng ở cuối bảng nếu có
    if (isSummaryRow(row, norm)) {
      continue;
    }

    const missingFields: string[] = [];

    const rawDate = findRowValue(norm, [
      'ngaychiddmmyyyy', 'ngaychi', 'ngaychungtu', 'ngayhd', 'ngayhoadon', 'ngay', 'date'
    ]);
    const parsedDate = parseRowQuarterYear(rawDate);
    if (!rawDate || !parsedDate) {
      missingFields.push('Ngày chi (DD/MM/YYYY)');
    }

    const category = String(findRowValue(norm, [
      'khoanmucchi', 'khoanmuc', 'noidungchi', 'noidung', 'tenchiphi', 'chiphi', 'diengiai', 'category'
    ]) || '').trim();
    if (!category) {
      missingFields.push('Khoản mục chi');
    }

    const rawAmount = findRowValue(norm, [
      'sotienvnd', 'sotien', 'chiphi', 'thanhtien', 'amount'
    ]);
    const amountVal = parseAmount(rawAmount);
    if (isNaN(amountVal) || amountVal <= 0) {
      missingFields.push('Số tiền chi phí (phải là số > 0)');
    }

    if (missingFields.length > 0) {
      throw new Error(
        `Dữ liệu của bạn còn thiếu không thể import! Tại dòng #${rowNum} còn thiếu: ${missingFields.join(', ')}.`
      );
    }

    // Phương thức thanh toán: Mặc định 'Chuyển khoản' nếu không điền
    const paymentMethodRaw = findRowValue(norm, [
      'phuongthucthanhtoan', 'hinhthucthanhtoan', 'hinhthuctt', 'ptthanhtoan', 'thanhtoan', 'pttt', 'paymentmethod'
    ]);
    let paymentMethod = String(paymentMethodRaw || 'Chuyển khoản').trim();
    if (!paymentMethod) {
      paymentMethod = 'Chuyển khoản';
    }

    // Tình trạng hóa đơn: Mặc định 'Có' nếu không điền
    const hasInvoiceRaw = findRowValue(norm, [
      'cohoadongtgt', 'cohoadon', 'hoadongtgt', 'hoadon', 'hasinvoice', 'invoice'
    ]);
    let hasInvoice = String(hasInvoiceRaw || 'Có').trim();
    if (!hasInvoice) {
      hasInvoice = 'Có';
    }

    const note = String(findRowValue(norm, ['ghichu', 'note', 'chuthich']) || '').trim();

    // 🔍 Kiểm tra thời gian chi phí có khớp với Quý / Năm đang chọn hay không
    if (targetQuarter !== undefined && targetYear !== undefined && parsedDate) {
      const tQuarter = targetQuarter === 'ALL' ? 'ALL' : Number(targetQuarter);
      const tYear = Number(targetYear);

      if (tQuarter !== 'ALL') {
        if (parsedDate.quarter !== tQuarter || parsedDate.year !== tYear) {
          invalidPeriodRows.push(
            `• Dòng #${rowNum}: "${category}", ngày ${parsedDate.rawFormatted} (thuộc Quý ${parsedDate.quarter}/${parsedDate.year})`
          );
        }
      } else {
        if (parsedDate.year !== tYear) {
          invalidPeriodRows.push(
            `• Dòng #${rowNum}: "${category}", ngày ${parsedDate.rawFormatted} (thuộc năm ${parsedDate.year})`
          );
        }
      }
    }

    results.push({
      date: parsedDate!.rawFormatted,
      category,
      amount: amountVal,
      paymentMethod,
      hasInvoice,
      note,
    });
  }

  if (invalidPeriodRows.length > 0) {
    const periodLabel = targetQuarter === 'ALL' ? `năm ${targetYear}` : `Quý ${targetQuarter}/${targetYear}`;
    const displayedErrors = invalidPeriodRows.slice(0, 5).join('\n');
    const extraCount = invalidPeriodRows.length > 5 ? `\n... và còn ${invalidPeriodRows.length - 5} khoản chi khác.` : '';
    throw new Error(
      `Phát hiện khoản chi không nằm trong ${periodLabel} đang chọn:\n${displayedErrors}${extraCount}\n\nVui lòng kiểm tra lại ngày chi hoặc chọn đúng kỳ kê khai trước khi nạp file!`
    );
  }

  if (results.length === 0) {
    throw new Error('Dữ liệu của bạn còn thiếu không thể import! Không tìm thấy dòng dữ liệu hợp lệ.');
  }

  return results;
}
