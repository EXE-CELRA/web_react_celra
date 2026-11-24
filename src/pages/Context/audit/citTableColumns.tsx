import { Button, Popconfirm } from 'antd';
import { WarningOutlined } from '@ant-design/icons';
import { Check, Trash2, Edit3 } from 'lucide-react';
import type { CitRevenueRecord, CitExpenseRecord } from './audit.constants';

interface BuildRevenueColumnsParams {
  revenuePage: number;
  revenueLimit: number;
  taxQuarter: number | 'ALL';
  onOpenEditRevenue: (record: CitRevenueRecord) => void;
  onDeleteRevenue: (id: string) => void;
}

export function buildRevenueColumns({
  revenuePage,
  revenueLimit,
  taxQuarter,
  onOpenEditRevenue,
  onDeleteRevenue,
}: BuildRevenueColumnsParams) {
  return [
    {
      title: '#',
      key: 'index',
      width: 55,
      align: 'center' as const,
      render: (_: unknown, __: CitRevenueRecord, index: number) => (
        <span className="font-mono text-slate-400 font-semibold text-xs">
          {(revenuePage - 1) * revenueLimit + index + 1}
        </span>
      ),
    },
    {
      title: 'Ngày ghi nhận',
      dataIndex: 'date',
      key: 'date',
      width: 120,
      render: (val: string) => (
        <span className="text-slate-700 font-medium text-xs whitespace-nowrap">{val}</span>
      ),
    },
    {
      title: 'Số hóa đơn',
      dataIndex: 'invoiceNo',
      key: 'invoiceNo',
      width: 120,
      render: (val: string) =>
        val ? (
          <span className="font-mono text-xs font-semibold text-slate-700">{val}</span>
        ) : (
          <span className="text-slate-400 italic text-xs">—</span>
        ),
    },
    {
      title: 'Diễn giải / Khách hàng',
      dataIndex: 'description',
      key: 'description',
      render: (val: string) => <span className="text-slate-800 font-medium text-xs">{val}</span>,
    },
    {
      title: 'Doanh thu chưa thuế (VNĐ)',
      dataIndex: 'amount',
      key: 'amount',
      width: 180,
      align: 'right' as const,
      render: (val: number) => (
        <span className="font-mono font-bold text-slate-900 whitespace-nowrap text-xs">
          {Number(val || 0).toLocaleString('vi-VN')} đ
        </span>
      ),
    },
    {
      title: 'Thao tác',
      key: 'actions',
      width: 90,
      align: 'center' as const,
      render: (_: unknown, record: CitRevenueRecord) => (
        <div className="flex items-center justify-center gap-1">
          <Button
            type="text"
            size="small"
            icon={<Edit3 className="w-3.5 h-3.5 text-blue-600" />}
            onClick={() => onOpenEditRevenue(record)}
            disabled={taxQuarter === 'ALL'}
            className="hover:bg-blue-50 disabled:opacity-30 disabled:cursor-not-allowed p-1 h-7 w-7"
            title={
              taxQuarter === 'ALL'
                ? 'Chế độ Cả năm chỉ xem. Chọn từng Quý để sửa'
                : 'Sửa khoản thu'
            }
          />
          <Popconfirm
            title="Xác nhận xóa"
            description="Bạn có chắc chắn muốn xóa khoản thu này không?"
            onConfirm={() => onDeleteRevenue(record.id)}
            okText="Xóa"
            cancelText="Hủy"
            okButtonProps={{ danger: true }}
            disabled={taxQuarter === 'ALL'}
          >
            <Button
              type="text"
              size="small"
              icon={<Trash2 className="w-3.5 h-3.5 text-rose-500" />}
              disabled={taxQuarter === 'ALL'}
              className="hover:bg-rose-50 disabled:opacity-30 disabled:cursor-not-allowed p-1 h-7 w-7"
              title={
                taxQuarter === 'ALL'
                  ? 'Chế độ Cả năm chỉ xem. Chọn từng Quý để xóa'
                  : 'Xóa khoản thu'
              }
            />
          </Popconfirm>
        </div>
      ),
    },
  ];
}

interface BuildExpenseColumnsParams {
  expensePage: number;
  expenseLimit: number;
  taxQuarter: number | 'ALL';
  onOpenEditExpense: (record: CitExpenseRecord) => void;
  onDeleteExpense: (id: string) => void;
}

export function buildExpenseColumns({
  expensePage,
  expenseLimit,
  taxQuarter,
  onOpenEditExpense,
  onDeleteExpense,
}: BuildExpenseColumnsParams) {
  return [
    {
      title: '#',
      key: 'index',
      width: 55,
      align: 'center' as const,
      render: (_: unknown, __: CitExpenseRecord, index: number) => (
        <span className="font-mono text-slate-400 font-semibold text-xs">
          {(expensePage - 1) * expenseLimit + index + 1}
        </span>
      ),
    },
    {
      title: 'Ngày chi',
      dataIndex: 'date',
      key: 'date',
      width: 110,
      render: (val: string) => (
        <span className="text-slate-700 font-medium text-xs whitespace-nowrap">{val}</span>
      ),
    },
    {
      title: 'Khoản mục chi',
      dataIndex: 'category',
      key: 'category',
      minWidth: 180,
      render: (val: string, record: CitExpenseRecord) => (
        <div>
          <span className="font-semibold text-slate-800 text-xs block">{val}</span>
          {record.note && (
            <span className="text-[11px] text-slate-400 italic block mt-0.5">{record.note}</span>
          )}
        </div>
      ),
    },
    {
      title: 'Thanh toán',
      dataIndex: 'paymentMethod',
      key: 'paymentMethod',
      width: 125,
      align: 'center' as const,
      render: (val: string) => {
        const isCash =
          (val || '').toLowerCase().includes('tiền mặt') ||
          (val || '').toLowerCase().includes('cash');
        return isCash ? (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-amber-50 text-amber-800 border border-amber-200/80 whitespace-nowrap">
            Tiền mặt
          </span>
        ) : (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200 whitespace-nowrap">
            Chuyển khoản
          </span>
        );
      },
    },
    {
      title: 'Hóa đơn',
      dataIndex: 'hasInvoice',
      key: 'hasInvoice',
      width: 110,
      align: 'center' as const,
      render: (val: string) => {
        const hasInv =
          (val || '').toLowerCase().includes('có') || (val || '').toLowerCase().includes('yes');
        return hasInv ? (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200/80 whitespace-nowrap">
            Có HĐ
          </span>
        ) : (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-rose-50 text-rose-700 border border-rose-200/80 whitespace-nowrap">
            Không HĐ
          </span>
        );
      },
    },
    {
      title: 'Số tiền (VNĐ)',
      dataIndex: 'amount',
      key: 'amount',
      width: 160,
      align: 'right' as const,
      render: (val: number, record: CitExpenseRecord) => (
        <span
          className={`font-mono font-bold whitespace-nowrap text-xs ${
            record.isDisallowedB4 ? 'text-rose-600' : 'text-slate-900'
          }`}
        >
          {Number(val || 0).toLocaleString('vi-VN')} đ
        </span>
      ),
    },
    {
      title: 'Rà soát chi phí được trừ khi tính thuế TNDN (Mục B4)',
      key: 'b4Evaluation',
      minWidth: 280,
      render: (_: unknown, record: CitExpenseRecord) =>
        record.isDisallowedB4 ? (
          <div className="space-y-1.5 py-1">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10.5px] font-semibold bg-rose-50 text-rose-700 border border-rose-200 whitespace-nowrap">
              <WarningOutlined /> Bị loại trừ (Mục B4)
            </span>
            <p className="text-xs text-slate-800 m-0 font-medium leading-snug">
              {record.disallowedReason || 'Chi phí bị loại trừ theo luật thuế.'}
            </p>
            <div className="bg-amber-50/80 border border-amber-200/60 rounded px-2 py-1 text-[11px] text-amber-900 leading-tight">
              <strong>💡 Cần bổ sung:</strong>{' '}
              {String(record.disallowedReason || '').includes('tiền mặt')
                ? 'Ủy nhiệm chi hoặc chứng từ chuyển khoản qua tài khoản ngân hàng của doanh nghiệp.'
                : String(record.disallowedReason || '').includes('hóa đơn')
                  ? 'Hóa đơn điện tử GTGT / hóa đơn bán hàng hợp pháp từ người bán.'
                  : 'Hồ sơ chứng từ kế toán hợp lệ chứng minh chi phí phục vụ hoạt động SXKD.'}
            </div>
            {record.legalBasis && (
              <p className="text-[10.5px] text-slate-400 italic m-0">
                Căn cứ: {record.legalBasis}
              </p>
            )}
          </div>
        ) : (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 whitespace-nowrap">
            <Check className="w-3 h-3 text-emerald-600" /> Được trừ hợp lệ
          </span>
        ),
    },
    {
      title: 'Thao tác',
      key: 'actions',
      width: 90,
      align: 'center' as const,
      render: (_: unknown, record: CitExpenseRecord) => (
        <div className="flex items-center justify-center gap-1">
          <Button
            type="text"
            size="small"
            icon={<Edit3 className="w-3.5 h-3.5 text-blue-600" />}
            onClick={() => onOpenEditExpense(record)}
            disabled={taxQuarter === 'ALL'}
            className="hover:bg-blue-50 disabled:opacity-30 disabled:cursor-not-allowed p-1 h-7 w-7"
            title={
              taxQuarter === 'ALL'
                ? 'Chế độ Cả năm chỉ xem. Chọn từng Quý để sửa'
                : 'Sửa khoản chi'
            }
          />
          <Popconfirm
            title="Xác nhận xóa"
            description="Bạn có chắc chắn muốn xóa khoản chi này không?"
            onConfirm={() => onDeleteExpense(record.id)}
            okText="Xóa"
            cancelText="Hủy"
            okButtonProps={{ danger: true }}
            disabled={taxQuarter === 'ALL'}
          >
            <Button
              type="text"
              size="small"
              icon={<Trash2 className="w-3.5 h-3.5 text-rose-500" />}
              disabled={taxQuarter === 'ALL'}
              className="hover:bg-rose-50 disabled:opacity-30 disabled:cursor-not-allowed p-1 h-7 w-7"
              title={
                taxQuarter === 'ALL'
                  ? 'Chế độ Cả năm chỉ xem. Chọn từng Quý để xóa'
                  : 'Xóa khoản chi'
              }
            />
          </Popconfirm>
        </div>
      ),
    },
  ];
}
