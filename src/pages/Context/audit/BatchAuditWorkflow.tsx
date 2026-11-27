import React from 'react';
import { Button, Tag } from 'antd';
import {
  ShieldCheck,
  ArrowRight,
  Sparkles,
  PlusCircle,
  ExternalLink,
  Check,
} from 'lucide-react';
import { cleanDLPLUrl, matchCoreLegalDocUrl } from '../../../api/legalApi';
import type { ContextFact, AuditFindingItem } from '../../../interfaces';
import { getModuleTag } from './audit.constants';

interface ContextFactCardsStepProps {
  displayedFacts: ContextFact[];
  selectedCount: number;
  onCancel: () => void;
  onProceed: () => void;
}

export const ContextFactCardsStep: React.FC<ContextFactCardsStepProps> = ({
  displayedFacts,
  selectedCount,
  onCancel,
  onProceed,
}) => (
  <>
    {/* GRID DANH SÁCH THẺ CONTEXT (DÀNH CHO CÁC PHÂN HỆ KHÁC) */}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {displayedFacts.map((fact, idx) => {
        const isConfirmed = fact.status === 'confirmed';

        return (
          <div
            key={fact.id}
            className="p-4.5 rounded-2xl border border-teal-200/80 bg-teal-50/20 shadow-xs space-y-2.5 select-none"
          >
            {/* Top Thẻ */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-teal-600 text-white text-[10px] font-extrabold flex items-center justify-center shrink-0">
                  {idx + 1}
                </span>
                <span className="text-[11px] font-bold text-teal-800 bg-teal-100/80 border border-teal-200 px-2 py-0.5 rounded">
                  {getModuleTag(fact.group)}
                </span>
                <span className="text-[10px] font-semibold text-teal-700 bg-white border border-teal-200 px-1.5 py-0.2 rounded">
                  Trọn gói
                </span>
              </div>
              <span
                className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                  isConfirmed
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-slate-100 text-slate-600'
                }`}
              >
                {isConfirmed ? 'Đã xác nhận' : 'Chờ đối soát'}
              </span>
            </div>

            {/* Tiêu đề câu hỏi */}
            <p className="text-xs font-bold text-slate-800 leading-snug m-0">
              {fact.label}
            </p>

            {/* Giá trị ghi nhận */}
            <div className="text-xs text-slate-700 bg-white p-3 rounded-xl border border-teal-100 leading-relaxed font-medium">
              {fact.currentValue || (
                <span className="text-slate-400 italic">Chưa có thông tin ghi nhận</span>
              )}
            </div>
          </div>
        );
      })}
    </div>

    {/* FOOTER BƯỚC 1: XÁC NHẬN CHI PHÍ */}
    <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <div className="text-xs text-slate-600">
        Chế độ phân tích:{' '}
        <strong className="text-teal-700 font-mono text-sm">Trọn gói Subscription</strong> (
        {selectedCount} thẻ bối cảnh).
      </div>

      <div className="flex items-center gap-2">
        <Button onClick={onCancel} className="rounded-xl text-xs font-semibold h-10 px-4">
          Hủy &amp; Quay lại
        </Button>
        <Button
          type="primary"
          onClick={onProceed}
          disabled={selectedCount === 0}
          className="bg-teal-600 hover:bg-teal-700 rounded-xl text-xs font-bold h-10 px-6 shadow-xs border-none"
        >
          Tiếp tục: Xác nhận chi phí <ArrowRight className="w-3.5 h-3.5 inline ml-1" />
        </Button>
      </div>
    </div>
  </>
);

interface AuditConfirmStepProps {
  selectedCount: number;
  isProcessing: boolean;
  isBalanceSufficient: boolean;
  onBack: () => void;
  onStartAudit: () => void;
}

export const AuditConfirmStep: React.FC<AuditConfirmStepProps> = ({
  selectedCount,
  isProcessing,
  isBalanceSufficient,
  onBack,
  onStartAudit,
}) => (
  <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-8 space-y-6 max-w-2xl mx-auto">
    <div className="text-center space-y-2">
      <div className="w-12 h-12 rounded-2xl bg-teal-100 text-teal-700 mx-auto flex items-center justify-center">
        <ShieldCheck className="w-6 h-6" />
      </div>
      <h3 className="text-lg font-black text-slate-800 m-0">
        Xác Nhận Rà Soát Tuân Thủ Bối Cảnh
      </h3>
      <p className="text-xs text-slate-500 m-0">
        Tính năng nằm trong gói thuê bao của bạn. Hệ thống sẽ đối soát dữ liệu và phân tích rủi ro tức thì.
      </p>
    </div>

    <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-3 text-xs">
      <div className="flex justify-between items-center pb-2 border-b border-slate-200">
        <span className="text-slate-500">Số lượng thẻ bối cảnh:</span>
        <span className="font-bold text-slate-800">{selectedCount} thẻ trọn gói</span>
      </div>
      <div className="flex justify-between items-center pb-2 border-b border-slate-200">
        <span className="text-slate-500">Chế độ phân tích:</span>
        <span className="font-semibold text-teal-800">Trọn gói Subscription</span>
      </div>
      <div className="flex justify-between items-center pt-1 text-sm">
        <span className="font-bold text-slate-800">Chi phí phát sinh thêm:</span>
        <span className="font-mono font-black text-emerald-600 text-base">
          0 ₫ (Miễn phí theo gói)
        </span>
      </div>
    </div>

    <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-3">
      <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
      <div>
        <span className="font-bold block">Gói Dịch Vụ Đang Hoạt Động</span>
        <span className="text-[11px] text-emerald-700">
          Đủ điều kiện rà soát và tạo danh mục kiểm tra tuân thủ.
        </span>
      </div>
    </div>

    <div className="flex items-center justify-between pt-2">
      <Button onClick={onBack} className="rounded-xl text-xs font-semibold h-10 px-4">
        Quay lại xem thẻ
      </Button>
      <Button
        type="primary"
        onClick={onStartAudit}
        disabled={isProcessing || !isBalanceSufficient}
        className="bg-teal-600 hover:bg-teal-700 rounded-xl text-xs font-bold h-10 px-6 border-none shadow-sm"
      >
        {isProcessing ? 'Đang xử lý...' : 'Xác Nhận & Bắt Đầu Rà Soát Ngay'}
      </Button>
    </div>
  </div>
);

interface AuditScanningStepProps {
  scanProgress: number;
  scanStageText: string;
}

export const AuditScanningStep: React.FC<AuditScanningStepProps> = ({
  scanProgress,
  scanStageText,
}) => (
  <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-8 sm:p-12 text-center space-y-6 max-w-xl mx-auto">
    <div className="w-16 h-16 rounded-3xl bg-teal-50 text-teal-600 mx-auto flex items-center justify-center animate-pulse">
      <Sparkles className="w-8 h-8" />
    </div>

    <div className="space-y-2">
      <h3 className="text-lg font-black text-slate-800 m-0">
        Đang Đối Chiếu Ma Trận Pháp Lý &amp; Thuế
      </h3>
      <p className="text-xs text-slate-500 m-0 max-w-sm mx-auto leading-relaxed">
        {scanStageText}
      </p>
    </div>

    <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden p-0.5">
      <div
        className="bg-linear-to-r from-teal-500 to-emerald-500 h-full rounded-full transition-all duration-300"
        style={{ width: `${scanProgress}%` }}
      />
    </div>
    <span className="font-mono text-xs font-bold text-teal-700 block">{scanProgress}%</span>
  </div>
);

interface AuditResultsStepProps {
  auditFindings: AuditFindingItem[];
  creatingSingleId: string | null;
  isCreatingAll: boolean;
  onCreateSingle: (finding: AuditFindingItem) => void;
  onCreateAll: () => void;
  onRestart: () => void;
  onOpenTasks: () => void;
}

export const AuditResultsStep: React.FC<AuditResultsStepProps> = ({
  auditFindings,
  creatingSingleId,
  isCreatingAll,
  onCreateSingle,
  onCreateAll,
  onRestart,
  onOpenTasks,
}) => (
  <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 space-y-6">
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
      <div>
        <div className="flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-extrabold">
            <Check className="w-4 h-4" />
          </span>
          <h3 className="text-base font-black text-slate-800 m-0">
            Hoàn Tất Rà Soát: Phát Hiện {auditFindings.length} Nghĩa Vụ Cần Tuân Thủ
          </h3>
        </div>
        <p className="text-xs text-slate-500 m-0 mt-0.5 pl-8">
          Hệ thống đã tự động phân tích căn cứ pháp lý, tính toán mức phạt rủi ro và sẵn sàng sinh Checklist nhiệm vụ.
        </p>
      </div>

      <Button
        type="primary"
        onClick={onCreateAll}
        loading={isCreatingAll}
        className="bg-teal-600 hover:bg-teal-700 font-extrabold text-xs rounded-xl h-10 px-5 border-none shadow-sm"
      >
        Sinh Toàn Bộ ({auditFindings.length}) Checklist Tuân Thủ
      </Button>
    </div>

    <div className="space-y-4">
      {auditFindings.map((finding) => (
        <div
          key={finding.id}
          className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-teal-300 transition-all space-y-3"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Tag color="cyan" className="font-bold text-[10px] m-0 uppercase">
                  {finding.ruleCode}
                </Tag>
                <Tag color="red" className="font-extrabold text-[10px] m-0 uppercase">
                  {finding.suggestedPriority || 'HIGH'}
                </Tag>
              </div>
              <h4 className="text-sm font-bold text-slate-900 m-0">{finding.obligationTitle}</h4>
            </div>

            <Button
              size="small"
              type="default"
              icon={<PlusCircle className="w-3.5 h-3.5 inline mr-1" />}
              onClick={() => onCreateSingle(finding)}
              loading={creatingSingleId === finding.id}
              className="rounded-lg text-xs font-semibold"
            >
              Tạo Checklist Này
            </Button>
          </div>

          {/* CĂN CỨ PHÁP LÝ & RỦI RO PHẠT */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase block">
                Căn Cứ Pháp Luật
              </span>
              <p className="text-slate-700 m-0 font-medium">{finding.legalBasis}</p>
              {finding.legalDocUrl && (
                <a
                  href={matchCoreLegalDocUrl(finding.ruleCode) || cleanDLPLUrl(finding.legalDocUrl)}
                  target="_blank"
                  rel="noreferrer"
                  className="text-teal-600 hover:underline inline-flex items-center gap-1 text-[11px] font-bold mt-1"
                >
                  Tra cứu văn bản gốc <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>

            <div className="bg-amber-50/70 p-3 rounded-xl border border-amber-200 space-y-1">
              <span className="text-[10px] font-bold text-amber-700 uppercase block">
                Chế Tài &amp; Rủi Ro Xử Phạt
              </span>
              <p className="text-amber-900 m-0 font-medium">{finding.penaltyRisk}</p>
            </div>
          </div>

          {/* MINH CHỨNG YÊU CẦU */}
          {finding.evidenceRequired && (
            <div className="text-xs text-slate-600 bg-white p-2.5 rounded-lg border border-slate-200 flex items-center gap-2">
              <span className="font-bold text-slate-700 shrink-0">
                Hồ sơ chứng minh bắt buộc:
              </span>
              <span>{finding.evidenceRequired}</span>
            </div>
          )}
        </div>
      ))}
    </div>

    <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
      <Button onClick={onRestart} className="rounded-xl text-xs font-semibold h-9">
        Rà Soát Lượt Khác
      </Button>

      <Button
        type="primary"
        onClick={onOpenTasks}
        className="bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl h-9 px-5 border-none"
      >
        Mở Trang Quản Lý Tasks &amp; Calendar <ArrowRight className="w-3.5 h-3.5 inline ml-1" />
      </Button>
    </div>
  </div>
);
