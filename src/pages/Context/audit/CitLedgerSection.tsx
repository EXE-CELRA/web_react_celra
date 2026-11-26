import React from 'react';
import { Upload, Button, Select, Input, Radio, Alert, Table, Tabs, Tooltip } from 'antd';
import {
  DownloadOutlined,
  FileExcelOutlined,
  CompassOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  CheckSquareOutlined,
  InfoCircleOutlined,
} from '@ant-design/icons';
import {
  Plus,
  Upload as UploadIcon,
} from 'lucide-react';
import {
  downloadRevenueExcelTemplate,
  downloadExpenseExcelTemplate,
} from '../../../utils/excelTaxTemplate';
import type { CitCalculationResult } from '../../../utils/citTaxCalculator';
import type { CitTaxTierResult } from '../../../utils/taxRateChecker';
import {
  type CitSummaryData,
  type CitRevenueRecord,
  type CitExpenseRecord,
  getQuarterDeadline,
} from './audit.constants';
import { buildRevenueColumns, buildExpenseColumns } from './citTableColumns';

interface CitLedgerSectionProps {
  taxQuarter: number | 'ALL';
  taxYear: number;
  dynamicYearOptions: Array<{ value: number; label: string }>;
  citTierResult: CitTaxTierResult;
  citSummary: CitSummaryData;
  citCalcResult: CitCalculationResult | null;
  financialTab: 'revenue' | 'expense';
  isExcelUploading: boolean;
  showNextActionSteps?: boolean;

  revenuesData: CitRevenueRecord[];
  revenuesTotal: number;
  revenuePage: number;
  revenueLimit: number;
  revenueSearch: string;
  isRevenueLoading: boolean;

  expensesData: CitExpenseRecord[];
  expensesTotal: number;
  expensePage: number;
  expenseLimit: number;
  expenseSearch: string;
  expenseFilterB4: 'ALL' | 'DISALLOWED' | 'DEDUCTIBLE';
  isExpenseLoading: boolean;

  onQuarterChange: (val: number | 'ALL') => void;
  onYearChange: (val: number) => void;
  onChangeFinancialTab: (tab: 'revenue' | 'expense') => void;
  onOpenChecklistModal: () => void;
  onOpenEtaxModal: () => void;
  onNavigateContext: () => void;

  onRevenueSearchChange: (val: string) => void;
  onRevenueSearchSubmit: () => void;
  onRevenuePageChange: (page: number, pageSize: number) => void;
  onOpenAddRevenue: () => void;
  onOpenEditRevenue: (record: CitRevenueRecord) => void;
  onDeleteRevenue: (id: string) => void;
  onUploadRevenueExcel: (file: File) => Promise<boolean>;

  onExpenseSearchChange: (val: string) => void;
  onExpenseSearchSubmit: () => void;
  onExpenseFilterB4Change: (filter: 'ALL' | 'DISALLOWED' | 'DEDUCTIBLE') => void;
  onExpensePageChange: (page: number, pageSize: number) => void;
  onOpenAddExpense: () => void;
  onOpenEditExpense: (record: CitExpenseRecord) => void;
  onDeleteExpense: (id: string) => void;
  onUploadExpenseExcel: (file: File) => Promise<boolean>;
}

export const CitLedgerSection: React.FC<CitLedgerSectionProps> = ({
  taxQuarter,
  taxYear,
  dynamicYearOptions,
  citTierResult,
  citSummary,
  citCalcResult,
  financialTab,
  isExcelUploading,
  showNextActionSteps = false,
  revenuesData,
  revenuesTotal,
  revenuePage,
  revenueLimit,
  revenueSearch,
  isRevenueLoading,
  expensesData,
  expensesTotal,
  expensePage,
  expenseLimit,
  expenseSearch,
  expenseFilterB4,
  isExpenseLoading,
  onQuarterChange,
  onYearChange,
  onChangeFinancialTab,
  onOpenChecklistModal,
  onOpenEtaxModal,
  onNavigateContext,
  onRevenueSearchChange,
  onRevenueSearchSubmit,
  onRevenuePageChange,
  onOpenAddRevenue,
  onOpenEditRevenue,
  onDeleteRevenue,
  onUploadRevenueExcel,
  onExpenseSearchChange,
  onExpenseSearchSubmit,
  onExpenseFilterB4Change,
  onExpensePageChange,
  onOpenAddExpense,
  onOpenEditExpense,
  onDeleteExpense,
  onUploadExpenseExcel,
}) => {
  const revenueColumns = buildRevenueColumns({
    revenuePage,
    revenueLimit,
    taxQuarter,
    onOpenEditRevenue,
    onDeleteRevenue,
  });

  const expenseColumns = buildExpenseColumns({
    expensePage,
    expenseLimit,
    taxQuarter,
    onOpenEditExpense,
    onDeleteExpense,
  });

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-2xs">
      {/* HEADER PHÂN HỆ DOANH NGHIỆP */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-3 border-b border-slate-100">
        <div className="space-y-2">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center shrink-0 border border-teal-100/70">
              <FileExcelOutlined className="text-base" />
            </div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight m-0">
              Sổ Kê Khai Thu Chi &amp; Dự Tính Thuế TNDN
            </h3>
          </div>

          <div className="inline-flex flex-wrap items-center gap-2 text-xs bg-slate-50 border border-slate-200/90 rounded-lg px-3 py-1.5 shadow-2xs">
            <CompassOutlined className="text-slate-400" />
            <span className="text-slate-500 font-medium">Thuế suất áp dụng:</span>
            <span className="font-semibold text-slate-800">{citTierResult.title}</span>
            <span
              className={`font-mono font-bold px-1.5 py-0.5 rounded text-[11px] border ${citTierResult.badgeColor}`}
            >
              {citTierResult.taxRatePercentText}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <div className="bg-slate-50 border border-slate-200/90 rounded-lg px-3.5 py-2 flex items-center gap-2 shadow-2xs">
            <ClockCircleOutlined className="text-slate-400" />
            <span className="text-slate-500 font-medium">Hạn nộp:</span>
            <span className="font-mono font-bold text-slate-900 text-xs">
              {getQuarterDeadline(taxQuarter, taxYear)}
            </span>
          </div>
        </div>
      </div>

      {/* 🎯 KHỐI: HÀNH ĐỘNG TIẾP THEO DÀNH CHO DOANH NGHIỆP (mặc định đã chuyển sang ComplianceAuditReportView) */}
      {showNextActionSteps && (
      <div className="bg-gradient-to-br from-slate-900 to-teal-950 text-white rounded-2xl p-5 shadow-sm space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-white/10">
          <div className="flex items-center gap-2">
            <CheckSquareOutlined className="text-teal-400 text-base" />
            <h4 className="text-sm font-extrabold text-white m-0 tracking-wide">
              Các Bước Hành Động Tiếp Theo Dành Cho Bạn
            </h4>
          </div>
          <span className="text-[11px] text-teal-300 font-medium">
            Thao tác nhanh để tối ưu thuế &amp; tránh bị xử phạt
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          <div className="bg-white/5 border border-white/10 rounded-xl p-3.5 space-y-1.5 flex flex-col justify-between">
            <div>
              <div className="text-teal-300 font-extrabold text-[11px] uppercase tracking-wider">
                Bước 1: Chứng từ B4
              </div>
              <div className="text-white font-bold text-xs mt-0.5">
                Bổ sung hóa đơn / ủy nhiệm chi
              </div>
              <p className="text-slate-300 text-[11px] m-0 mt-1 leading-relaxed">
                {citSummary.disallowedCount > 0
                  ? `Phát hiện ${citSummary.disallowedCount} khoản chi bị loại B4. Hãy liên hệ nhà cung cấp lấy hóa đơn hoặc chứng từ chuyển khoản.`
                  : 'Hiện chưa phát hiện khoản chi vi phạm Mục B4. Tiếp tục duy trì lưu trữ chứng từ đầy đủ.'}
              </p>
            </div>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-xl p-3.5 space-y-1.5 flex flex-col justify-between">
            <div>
              <div className="text-teal-300 font-extrabold text-[11px] uppercase tracking-wider">
                Bước 2: Quản lý hạn
              </div>
              <div className="text-white font-bold text-xs mt-0.5">
                Tạo Checklist nhắc hạn nộp
              </div>
              <p className="text-slate-300 text-[11px] m-0 mt-1 leading-relaxed">
                Kích hoạt nhiệm vụ theo dõi hạn nộp thuế Quý{' '}
                {taxQuarter === 'ALL' ? 'cả năm' : taxQuarter}/{taxYear} để nhận nhắc nhở trước 7
                ngày.
              </p>
            </div>
            <Button
              size="small"
              onClick={onOpenChecklistModal}
              className="bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold border-none text-[11px] h-7 rounded-lg mt-2 w-full"
            >
              Tạo Checklist Ngay
            </Button>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-xl p-3.5 space-y-1.5 flex flex-col justify-between">
            <div>
              <div className="text-teal-300 font-extrabold text-[11px] uppercase tracking-wider">
                Bước 3: Nộp thuế điện tử
              </div>
              <div className="text-white font-bold text-xs mt-0.5">Hướng dẫn kê khai eTax</div>
              <p className="text-slate-300 text-[11px] m-0 mt-1 leading-relaxed">
                Xem quy trình 6 bước nộp tờ khai và tạm nộp tiền thuế qua Cổng Thuế Điện Tử
                (thuedientu.gdt.gov.vn).
              </p>
            </div>
            <Button
              size="small"
              onClick={onOpenEtaxModal}
              className="bg-white/10 hover:bg-white/20 text-white font-semibold border-white/20 text-[11px] h-7 rounded-lg mt-2 w-full"
            >
              Xem Hướng Dẫn eTax
            </Button>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-xl p-3.5 space-y-1.5 flex flex-col justify-between">
            <div>
              <div className="text-teal-300 font-extrabold text-[11px] uppercase tracking-wider">
                Bước 4: Xác thực bối cảnh
              </div>
              <div className="text-white font-bold text-xs mt-0.5">Kiểm tra thông tin ưu đãi</div>
              <p className="text-slate-300 text-[11px] m-0 mt-1 leading-relaxed">
                Cập nhật doanh thu năm trước hoặc địa bàn ưu đãi để hệ thống xếp bậc thuế suất (0%,
                15%, 17%) chính xác.
              </p>
            </div>
            <Button
              size="small"
              onClick={onNavigateContext}
              className="bg-white/10 hover:bg-white/20 text-white font-semibold border-white/20 text-[11px] h-7 rounded-lg mt-2 w-full"
            >
              Kiểm Tra Bối Cảnh
            </Button>
          </div>
        </div>
      </div>
      )}

      {/* 📅 BỘ CHỌN KỲ TÍNH THUẾ */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50/70 border border-slate-200/80 rounded-xl px-4 py-2.5">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
            <CalendarOutlined className="text-slate-400" />
            Kỳ tính thuế:
          </span>
          <div className="flex items-center gap-2">
            <Select
              value={taxQuarter}
              onChange={onQuarterChange}
              className="w-32"
              size="middle"
              options={[
                { value: 1, label: 'Quý 1 (Q1)' },
                { value: 2, label: 'Quý 2 (Q2)' },
                { value: 3, label: 'Quý 3 (Q3)' },
                { value: 4, label: 'Quý 4 (Q4)' },
                { value: 'ALL', label: 'Cả năm' },
              ]}
            />
            <Select
              value={taxYear}
              onChange={onYearChange}
              className="w-36"
              size="middle"
              showSearch
              options={dynamicYearOptions}
              placeholder="Chọn năm"
            />
          </div>
        </div>
      </div>

      {/* 🌟 4 THẺ CHỈ SỐ KPI - Phong cách tối giản (Minimalist, border trái) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}
        className="max-xl:!grid-cols-2 max-md:!grid-cols-1"
      >
        {/* Card 1: Tổng doanh thu */}
        <div style={{
          background: '#ffffff', borderRadius: 14,
          border: '1px solid #bbf7d0', borderLeft: '5px solid #0d9488',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)', padding: '16px 20px',
          display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
          transition: 'all 0.2s ease', minHeight: 112,
        }}>
          <div>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Tổng doanh thu
            </span>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', lineHeight: 1.2, marginTop: 4 }}>
              {citSummary.totalRevenue.toLocaleString('vi-VN')} đ
            </div>
          </div>
          {/* Phần dưới: Dòng thông tin phụ */}
          <div style={{ fontSize: 11, color: '#64748b', paddingTop: 8, marginTop: 8, borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
            <span>{citSummary.revenueCount} khoản thu</span>
            <span style={{ fontWeight: 600, color: '#0d9488', background: '#f0fdfa', padding: '1px 6px', borderRadius: 4, fontSize: 10.5 }}>
              100% doanh thu
            </span>
          </div>
        </div>

        {/* Card 2: Tổng chi phí kế toán */}
        <div style={{
          background: '#ffffff', borderRadius: 14,
          border: '1px solid #bfdbfe', borderLeft: '5px solid #2563eb',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)', padding: '16px 20px',
          display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
          transition: 'all 0.2s ease', minHeight: 112,
        }}>
          <div>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: 4 }}>
              Tổng chi phí kế toán
              <Tooltip title="Tổng các khoản chi phí ghi nhận trên sổ sách. Hệ thống sẽ tự động bóc tách chi phí hợp lý được trừ và các khoản có nguy cơ bị cơ quan thuế loại trừ (Mục B4).">
                <InfoCircleOutlined className="text-slate-400 hover:text-blue-600 cursor-pointer text-[12px]" />
              </Tooltip>
            </span>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', lineHeight: 1.2, marginTop: 4 }}>
              {citSummary.totalAccountingExpense.toLocaleString('vi-VN')} đ
            </div>
          </div>
          {/* Phần dưới: Dòng thông tin phụ */}
          <div style={{ fontSize: 11, color: '#64748b', paddingTop: 8, marginTop: 8, borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 4, width: '100%' }}>
            <span style={{ color: '#16a34a', fontWeight: 600 }}>
              Được trừ: {citSummary.totalDeductibleExpense.toLocaleString('vi-VN')} đ
            </span>
            {citSummary.totalDisallowedExpense > 0 && (
              <span style={{ color: '#dc2626', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 2 }}>
                Bị loại: -{citSummary.totalDisallowedExpense.toLocaleString('vi-VN')} đ
                <Tooltip title="Chi phí bị loại B4: Khoản chi có dấu hiệu không đáp ứng điều kiện được trừ khi tính thuế TNDN (ví dụ: thiếu hóa đơn hợp pháp, thanh toán tiền mặt từ 5 triệu đồng trở lên, thù lao chủ công ty TNHH 1TV). Cần kiểm tra lại theo hồ sơ thực tế trước khi quyết toán.">
                  <InfoCircleOutlined className="text-rose-400 hover:text-rose-600 cursor-pointer text-[11px]" />
                </Tooltip>
              </span>
            )}
          </div>
        </div>

        {/* Card 3: Thuế TNDN dự kiến */}
        <div style={{
          background: '#ffffff', borderRadius: 14,
          border: citSummary.estimatedTaxAmount > 0 ? '1px solid #fde68a' : '1px solid #e2e8f0',
          borderLeft: citSummary.estimatedTaxAmount > 0 ? '5px solid #d97706' : '5px solid #94a3b8',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)', padding: '16px 20px',
          display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
          transition: 'all 0.2s ease', minHeight: 112,
        }}>
          <div>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: 4 }}>
              Thuế TNDN dự kiến
              <Tooltip title="Số tiền thuế Thu nhập doanh nghiệp ước tính phải nộp cho kỳ tính thuế hiện tại = (Doanh thu - Chi phí được trừ thực tế) * Thuế suất áp dụng.">
                <InfoCircleOutlined className="text-slate-400 hover:text-amber-600 cursor-pointer text-[12px]" />
              </Tooltip>
            </span>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', lineHeight: 1.2, marginTop: 4 }}>
              {citSummary.estimatedTaxAmount.toLocaleString('vi-VN')} đ
            </div>
          </div>
          {/* Phần dưới: Dòng thông tin phụ */}
          <div style={{ fontSize: 11, color: '#64748b', paddingTop: 8, marginTop: 8, borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 4, width: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, whiteSpace: 'nowrap' }}>
              <span>Tạm nộp 80%:</span>
              <strong style={{ color: '#334155' }}>
                {(citCalcResult?.statutoryPrepayment80 || citSummary.statutoryPrepayment80).toLocaleString('vi-VN')} đ
              </strong>
              <Tooltip title="Theo Khoản 3 Điều 1 Nghị định 91/2022/NĐ-CP: Tổng số thuế TNDN tạm nộp của 4 quý không được thấp hơn 80% số thuế TNDN phải nộp theo quyết toán năm.">
                <InfoCircleOutlined className="text-slate-400 hover:text-amber-600 cursor-pointer text-[11px]" />
              </Tooltip>
            </div>
            <span className={`font-bold text-[10px] px-1.5 py-0.5 rounded border whitespace-nowrap ${citTierResult.badgeColor}`}>
              {citTierResult.taxRatePercentText}
            </span>
          </div>
        </div>

        {/* Card 4: Lợi nhuận ròng sau thuế */}
        <div style={{
          background: '#ffffff', borderRadius: 14,
          border: citSummary.netProfitAfterTax >= 0 ? '1px solid #bbf7d0' : '1px solid #fecaca',
          borderLeft: citSummary.netProfitAfterTax >= 0 ? '5px solid #16a34a' : '5px solid #dc2626',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)', padding: '16px 20px',
          display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
          transition: 'all 0.2s ease', minHeight: 112,
        }}>
          <div>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: 4 }}>
              Lợi nhuận ròng sau thuế
              <Tooltip title="Khoản lợi nhuận thực tế doanh nghiệp giữ lại sau khi đã khấu trừ toàn bộ chi phí hoạt động và hoàn thành nghĩa vụ nộp thuế TNDN cho Nhà nước.">
                <InfoCircleOutlined className="text-slate-400 hover:text-emerald-600 cursor-pointer text-[12px]" />
              </Tooltip>
            </span>
            <div style={{
              fontSize: 22, fontWeight: 800, lineHeight: 1.2, marginTop: 4,
              color: citSummary.netProfitAfterTax >= 0 ? '#16a34a' : '#dc2626',
            }}>
              {citSummary.netProfitAfterTax.toLocaleString('vi-VN')} đ
            </div>
          </div>
          {/* Phần dưới: Dòng thông tin phụ */}
          <div style={{ fontSize: 11, color: '#64748b', paddingTop: 8, marginTop: 8, borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 4, width: '100%' }}>
            <span style={{ color: '#94a3b8', whiteSpace: 'nowrap' }}>= Thu - Chi - Thuế</span>
            <span style={{ fontWeight: 600, color: '#065f46', background: '#ecfdf5', padding: '1px 6px', borderRadius: 4, border: '1px solid #d1fae5', fontSize: 10.5, display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
              {citSummary.totalRevenue > 0
                ? `${((citSummary.netProfitAfterTax / citSummary.totalRevenue) * 100).toFixed(1)}% ROS`
                : '0% ROS'}
              <Tooltip title="ROS (Return on Sales): Tỷ suất lợi nhuận ròng trên doanh thu = (Lợi nhuận sau thuế / Tổng doanh thu) * 100%.">
                <InfoCircleOutlined className="text-emerald-600 hover:text-emerald-800 cursor-pointer text-[11px]" />
              </Tooltip>
            </span>
          </div>
        </div>
      </div>

      {/* THÔNG BÁO CHẾ ĐỘ CẢ NĂM */}
      {taxQuarter === 'ALL' && (
        <Alert
          message={`Chế Độ Tổng Hợp Quyết Toán Cả Năm ${taxYear} (Chuẩn Kế Toán)`}
          description={
            <div className="space-y-1 text-xs text-blue-900">
              <p className="m-0 font-medium">
                Bảng số liệu dưới đây đang{' '}
                <strong>tự động gộp dữ liệu từ 4 Quý (Q1, Q2, Q3, Q4)</strong> của năm tài chính{' '}
                {taxYear} để tính nghĩa vụ quyết toán thuế TNDN và Lợi nhuận ròng cả năm.
              </p>
              <p className="m-0 text-slate-500 italic">
                * Chế độ Cả năm là chế độ xem tổng hợp. Để thêm mới, chỉnh sửa hoặc nạp file Excel
                cho từng giao dịch, vui lòng chọn Quý cụ thể (Quý 1, 2, 3 hoặc 4) ở thanh chọn phía
                trên.
              </p>
            </div>
          }
          type="info"
          showIcon
          className="rounded-2xl border-blue-200 bg-blue-50/70"
        />
      )}

      {/* 📋 2 TABS SỔ THU CHI */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
        <Tabs
          activeKey={financialTab}
          onChange={(k) => onChangeFinancialTab(k as 'revenue' | 'expense')}
          className="px-4 pt-1"
          items={[
            {
              key: 'revenue',
              label: (
                <span className="font-semibold text-xs sm:text-sm text-slate-800 flex items-center gap-1.5">
                  Doanh thu ghi nhận
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-mono font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                    {citSummary.revenueCount}
                  </span>
                </span>
              ),
              children: (
                <div className="space-y-3 pb-4">
                  <div className="flex flex-wrap items-center justify-between gap-2.5 bg-slate-50/70 p-2.5 rounded-xl border border-slate-200/70">
                    <div className="flex items-center gap-2 flex-1 min-w-[260px] max-w-[380px]">
                      <Input.Search
                        placeholder="Tìm theo Số HĐ hoặc Diễn giải..."
                        allowClear
                        value={revenueSearch}
                        onChange={(e) => onRevenueSearchChange(e.target.value)}
                        onSearch={onRevenueSearchSubmit}
                        size="middle"
                        className="w-full text-xs"
                      />
                    </div>
                    <div className="flex items-center gap-2 flex-nowrap shrink-0 overflow-x-auto">
                      <Button
                        type="primary"
                        size="middle"
                        icon={<Plus className="w-3.5 h-3.5 inline mr-1" />}
                        onClick={onOpenAddRevenue}
                        disabled={taxQuarter === 'ALL'}
                        className="bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs rounded-lg border-none shadow-xs whitespace-nowrap"
                        title={
                          taxQuarter === 'ALL'
                            ? 'Chế độ Cả năm chỉ xem. Chọn từng Quý để thêm mới'
                            : 'Thêm khoản thu'
                        }
                      >
                        Thêm khoản thu
                      </Button>
                      <Upload
                        accept=".xlsx, .xls"
                        showUploadList={false}
                        beforeUpload={onUploadRevenueExcel}
                        disabled={isExcelUploading || taxQuarter === 'ALL'}
                      >
                        <Button
                          size="middle"
                          icon={<UploadIcon className="w-3.5 h-3.5 inline mr-1 text-slate-500" />}
                          loading={isExcelUploading}
                          disabled={taxQuarter === 'ALL'}
                          className="text-xs font-medium rounded-lg border-slate-300 text-slate-700 hover:border-slate-400 hover:text-slate-900 shadow-2xs whitespace-nowrap"
                          title={
                            taxQuarter === 'ALL'
                              ? 'Chế độ Cả năm chỉ xem. Chọn từng Quý để nạp file'
                              : 'Nạp file Excel Doanh thu'
                          }
                        >
                          Import Excel
                        </Button>
                      </Upload>
                      <Button
                        size="middle"
                        icon={<DownloadOutlined className="text-emerald-600" />}
                        onClick={() => downloadRevenueExcelTemplate(taxQuarter, taxYear)}
                        className="text-xs font-medium rounded-lg border-slate-300 text-slate-700 hover:border-emerald-500 hover:text-emerald-700 shadow-2xs whitespace-nowrap"
                        title="Tải tệp mẫu Excel doanh thu chuẩn luật"
                      >
                        Tải mẫu Excel
                      </Button>
                    </div>
                  </div>

                  <Table
                    dataSource={revenuesData}
                    rowKey="id"
                    loading={isRevenueLoading}
                    columns={revenueColumns}
                    pagination={{
                      current: revenuePage,
                      pageSize: revenueLimit,
                      total: revenuesTotal,
                      showSizeChanger: true,
                      pageSizeOptions: ['10', '20', '50', '100'],
                      showTotal: (total, range) =>
                        `${range[0]}-${range[1]} trên tổng số ${total} khoản thu`,
                      onChange: onRevenuePageChange,
                    }}
                    className="border border-slate-200 rounded-xl overflow-hidden"
                    size="small"
                  />
                </div>
              ),
            },
            {
              key: 'expense',
              label: (
                <span className="font-semibold text-xs sm:text-sm text-slate-800 flex items-center gap-1.5">
                  Rà soát chi phí được trừ khi tính thuế TNDN (Mục B4)
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-mono font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                    {citSummary.expenseCount}
                  </span>
                  {citSummary.disallowedCount > 0 && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                      {citSummary.disallowedCount} bị loại B4
                    </span>
                  )}
                </span>
              ),
              children: (
                <div className="space-y-3 pb-4">
                  <div className="flex flex-wrap items-center justify-between gap-2.5 bg-slate-50/70 p-2.5 rounded-xl border border-slate-200/70">
                    <div className="flex flex-wrap items-center gap-2 flex-1 min-w-[280px]">
                      <Input.Search
                        placeholder="Tìm theo Khoản mục chi hoặc Ghi chú..."
                        allowClear
                        value={expenseSearch}
                        onChange={(e) => onExpenseSearchChange(e.target.value)}
                        onSearch={onExpenseSearchSubmit}
                        size="middle"
                        className="w-full sm:w-56 text-xs"
                      />
                      <Radio.Group
                        value={expenseFilterB4}
                        onChange={(e) => onExpenseFilterB4Change(e.target.value)}
                        size="middle"
                        optionType="button"
                        buttonStyle="solid"
                      >
                        <Radio.Button value="ALL">Tất cả ({citSummary.expenseCount})</Radio.Button>
                        <Radio.Button value="DISALLOWED" className="text-rose-600 font-semibold">
                          Bị loại B4 ({citSummary.disallowedCount})
                        </Radio.Button>
                        <Radio.Button value="DEDUCTIBLE" className="text-emerald-700 font-semibold">
                          Được trừ ({citSummary.expenseCount - citSummary.disallowedCount})
                        </Radio.Button>
                      </Radio.Group>
                    </div>
                    <div className="flex items-center gap-2 flex-nowrap shrink-0 overflow-x-auto">
                      <Button
                        type="primary"
                        size="middle"
                        icon={<Plus className="w-3.5 h-3.5 inline mr-1" />}
                        onClick={onOpenAddExpense}
                        disabled={taxQuarter === 'ALL'}
                        className="bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs rounded-lg border-none shadow-xs whitespace-nowrap"
                        title={
                          taxQuarter === 'ALL'
                            ? 'Chế độ Cả năm chỉ xem. Chọn từng Quý để thêm mới'
                            : 'Thêm khoản chi'
                        }
                      >
                        Thêm khoản chi
                      </Button>
                      <Upload
                        accept=".xlsx, .xls"
                        showUploadList={false}
                        beforeUpload={onUploadExpenseExcel}
                        disabled={isExcelUploading || taxQuarter === 'ALL'}
                      >
                        <Button
                          size="middle"
                          icon={<UploadIcon className="w-3.5 h-3.5 inline mr-1 text-slate-500" />}
                          loading={isExcelUploading}
                          disabled={taxQuarter === 'ALL'}
                          className="text-xs font-medium rounded-lg border-slate-300 text-slate-700 hover:border-slate-400 hover:text-slate-900 shadow-2xs whitespace-nowrap"
                          title={
                            taxQuarter === 'ALL'
                              ? 'Chế độ Cả năm chỉ xem. Chọn từng Quý để nạp file'
                              : 'Nạp file Excel Chi phí'
                          }
                        >
                          Import Excel
                        </Button>
                      </Upload>
                      <Button
                        size="middle"
                        icon={<DownloadOutlined className="text-emerald-600" />}
                        onClick={() => downloadExpenseExcelTemplate(taxQuarter, taxYear)}
                        className="text-xs font-medium rounded-lg border-slate-300 text-slate-700 hover:border-emerald-500 hover:text-emerald-700 shadow-2xs whitespace-nowrap"
                        title="Tải tệp mẫu Excel chi phí chuẩn luật"
                      >
                        Tải mẫu Excel
                      </Button>
                    </div>
                  </div>

                  <Table
                    dataSource={expensesData}
                    rowKey="id"
                    loading={isExpenseLoading}
                    columns={expenseColumns}
                    pagination={{
                      current: expensePage,
                      pageSize: expenseLimit,
                      total: expensesTotal,
                      showSizeChanger: true,
                      pageSizeOptions: ['10', '20', '50', '100'],
                      showTotal: (total, range) =>
                        `${range[0]}-${range[1]} trên tổng số ${total} khoản chi`,
                      onChange: onExpensePageChange,
                    }}
                    rowClassName={(record) =>
                      record.isDisallowedB4
                        ? 'bg-rose-50/20 hover:bg-rose-50/40 border-l-2 border-l-rose-400'
                        : 'hover:bg-slate-50/70 border-l-2 border-l-transparent'
                    }
                    className="border border-slate-200 rounded-xl overflow-hidden"
                    size="small"
                  />
                </div>
              ),
            },
          ]}
        />
      </div>
    </div>
  );
};
