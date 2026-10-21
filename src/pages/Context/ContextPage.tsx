import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useContextStore } from '../../store/useContextStore';
import { ContextComplianceAuditModal } from '../../components/common/ContextComplianceAuditModal';
import type { ContextFact } from '../../types';
import { 
  Database, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  History, 
  Edit3, 
  ShieldCheck, 
  X, 
  HelpCircle,
  Receipt,
  FileText,
  Layers,
  Users,
  Building2,
  Award,
  Briefcase,
  HardDrive,
  Plus
} from 'lucide-react';
import { message, Modal, Form, Input, Select, Tooltip } from 'antd';

export const ENABLED_CONTEXT_GROUP_KEYS = ['tax_accounting', 'legal'];

export interface ContextGroupConfig {
  key: string;
  label: string;
  shortLabel: string;
  tag: string;
  icon: any;
  badgeClass: string;
}

export const CONTEXT_GROUPS: ContextGroupConfig[] = [
  {
    key: 'tax_accounting',
    label: 'Thuế Doanh Nghiệp',
    shortLabel: 'Thuế',
    tag: 'THUẾ DOANH NGHIỆP',
    icon: Receipt,
    badgeClass: 'text-blue-700 bg-blue-50 border border-blue-200',
  },
  {
    key: 'legal',
    label: 'Hồ Sơ Pháp Lý & Vốn',
    shortLabel: 'Pháp Lý',
    tag: 'HỒ SƠ PHÁP LÝ & VỐN',
    icon: ShieldCheck,
    badgeClass: 'text-emerald-700 bg-emerald-50 border border-emerald-200',
  },
  {
    key: 'operations',
    label: 'Ngành Nghề & Vận Hành',
    shortLabel: 'Vận Hành',
    tag: 'HOẠT ĐỘNG THỰC TẾ',
    icon: Layers,
    badgeClass: 'text-amber-700 bg-amber-50 border border-amber-200',
  },
  {
    key: 'revenue_invoices',
    label: 'Hóa Đơn & Dòng Tiền',
    shortLabel: 'Hóa Đơn',
    tag: 'HÓA ĐƠN & DÒNG TIỀN',
    icon: FileText,
    badgeClass: 'text-purple-700 bg-purple-50 border border-purple-200',
  },
  {
    key: 'hr_labor',
    label: 'Lao Động & BHXH',
    shortLabel: 'Lao Động',
    tag: 'LAO ĐỘNG & BHXH',
    icon: Users,
    badgeClass: 'text-teal-700 bg-teal-50 border border-teal-200',
  },
  {
    key: 'premises',
    label: 'Địa Điểm & PCCC',
    shortLabel: 'PCCC',
    tag: 'ĐỊA ĐIỂM & PCCC',
    icon: Building2,
    badgeClass: 'text-rose-700 bg-rose-50 border border-rose-200',
  },
  {
    key: 'conditional_licensing',
    label: 'Giấy Phép Con',
    shortLabel: 'Giấy Phép',
    tag: 'GIẤY PHÉP CON',
    icon: Award,
    badgeClass: 'text-indigo-700 bg-indigo-50 border border-indigo-200',
  },
  {
    key: 'contracts',
    label: 'Hợp Đồng & Giao Kết',
    shortLabel: 'Hợp Đồng',
    tag: 'HỢP ĐỒNG & GIAO KẾT',
    icon: Briefcase,
    badgeClass: 'text-cyan-700 bg-cyan-50 border border-cyan-200',
  },
  {
    key: 'tech_data',
    label: 'Dữ Liệu & Sở Hữu Trí Tuệ',
    shortLabel: 'Dữ Liệu',
    tag: 'DỮ LIỆU & SHTT',
    icon: HardDrive,
    badgeClass: 'text-violet-700 bg-violet-50 border border-violet-200',
  },
];

export const ContextPage: React.FC = () => {
  const { facts, fetchFacts, updateFact, createFact } = useContextStore();

  const [selectedTab, setSelectedTab] = useState<string>('all');
  const [activeFactForHistory, setActiveFactForHistory] = useState<ContextFact | null>(null);

  // Edit value modal
  const [editingFact, setEditingFact] = useState<ContextFact | null>(null);
  const [newFactValue, setNewFactValue] = useState('');
  const [factEditNote, setFactEditNote] = useState('');

  // Create fact modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createForm] = Form.useForm();
  const [creating, setCreating] = useState(false);

  // Conflict resolution modal
  const [conflictFact, setConflictFact] = useState<ContextFact | null>(null);
  const [agreedValue, setAgreedValue] = useState('');

  // Compliance Audit Modal
  const [showAuditModal, setShowAuditModal] = useState(false);
  const [auditTargetFactId, setAuditTargetFactId] = useState<string | null>(null);

  useEffect(() => {
    fetchFacts();
  }, []);

  // Lọc động toàn bộ các thẻ theo tab được chọn (hoặc tất cả các thẻ trong DB)
  // Lọc dữ kiện: Chỉ hiển thị dữ kiện thuộc 2 phân hệ đang mở (Thuế & Pháp lý)
  const enabledFacts = facts.filter((f) => ENABLED_CONTEXT_GROUP_KEYS.includes(f.group || ''));
  const filteredFacts = selectedTab === 'all'
    ? enabledFacts
    : enabledFacts.filter((f) => f.group === selectedTab);

  // Group metadata helper for module classification
  const getGroupMeta = (group: string) => {
    const found = CONTEXT_GROUPS.find((g) => g.key === group);
    if (found) {
      return {
        title: found.label,
        tag: found.tag,
        badgeClass: found.badgeClass,
        icon: found.icon,
      };
    }
    return {
      title: group || 'Quy định',
      tag: 'QUY ĐỊNH CHUNG',
      badgeClass: 'text-slate-700 bg-slate-50 border border-slate-200',
      icon: Database,
    };
  };

  // Nhận diện trạng thái hiển thị thông minh: Khảo sát ban đầu vs Chủ DN tự bấm Cập nhật
  const getFactComplianceInfo = (fact: ContextFact) => {
    // 1. Nhóm 4 thẻ nền tảng (MST, Loại hình, Quy mô, Ngành nghề)
    const baseKeys = ['tax_code', 'company_type_tag', 'employee_scale', 'industry_tags'];
    const factKey = fact.key || fact.factKey || '';
    const isBase = baseKeys.includes(factKey) || 
      fact.id.startsWith('fact-tax') || 
      fact.id.startsWith('fact-company') || 
      fact.id.startsWith('fact-employee') || 
      fact.id.startsWith('fact-industry');

    if (isBase) {
      return {
        badge: (
          <span className="bg-emerald-100 text-emerald-800 text-[11px] font-bold px-2 py-0.5 rounded flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Đã xác nhận
          </span>
        ),
        borderClass: 'border-slate-200 hover:border-teal-400',
        valueBoxClass: 'bg-slate-50 border-slate-100 text-slate-800'
      };
    }

    const val = (fact.currentValue || '').trim();

    // 2. QUY TẮC: Nếu câu trả lời là "Chưa trả lời" hoặc để trống -> Hiển thị đúng trạng thái "Chưa trả lời"
    if (!val || val === 'Chưa trả lời' || val.toLowerCase().includes('chưa trả lời') || val === 'Chưa xác định') {
      return {
        badge: (
          <span className="bg-slate-100 text-slate-600 text-[11px] font-bold px-2 py-0.5 rounded flex items-center gap-1 border border-slate-200">
            <HelpCircle className="w-3 h-3 text-slate-400" /> Chưa trả lời
          </span>
        ),
        borderClass: 'border-slate-200 hover:border-slate-300',
        valueBoxClass: 'bg-slate-50 border-slate-200 text-slate-400 italic'
      };
    }

    // 3. Nếu chủ doanh nghiệp đã tự bấm cập nhật (history > 1 lần khai báo)
    if (fact.history && fact.history.length > 1) {
      return {
        badge: (
          <span className="bg-emerald-100 text-emerald-800 text-[11px] font-bold px-2 py-0.5 rounded flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Đã xác nhận
          </span>
        ),
        borderClass: 'border-teal-200 hover:border-teal-400',
        valueBoxClass: 'bg-teal-50/40 border-teal-100 text-teal-950'
      };
    }

    // 4. Phân loại trạng thái tuân thủ trực quan theo câu trả lời khảo sát ban đầu
    if (val.includes('Chưa thực hiện') || val.includes('Chưa có') || val.includes('Không có')) {
      return {
        badge: (
          <span className="bg-rose-100 text-rose-800 text-[11px] font-bold px-2 py-0.5 rounded flex items-center gap-1">
            <AlertCircle className="w-3 h-3 text-rose-600" /> Chưa tuân thủ
          </span>
        ),
        borderClass: 'border-rose-200 hover:border-rose-400 shadow-rose-50/50',
        valueBoxClass: 'bg-rose-50/60 border-rose-200 text-rose-900'
      };
    }

    if (val.includes('Đang chuẩn bị') || val.includes('Có một phần')) {
      return {
        badge: (
          <span className="bg-amber-100 text-amber-800 text-[11px] font-bold px-2 py-0.5 rounded flex items-center gap-1">
            <Clock className="w-3 h-3 text-amber-600" /> Đang chuẩn bị
          </span>
        ),
        borderClass: 'border-amber-200 hover:border-amber-400 shadow-amber-50/50',
        valueBoxClass: 'bg-amber-50/60 border-amber-200 text-amber-900'
      };
    }

    if (val.includes('Chưa rõ')) {
      return {
        badge: (
          <span className="bg-sky-100 text-sky-800 text-[11px] font-bold px-2 py-0.5 rounded flex items-center gap-1">
            <HelpCircle className="w-3 h-3 text-sky-600" /> Cần rà soát
          </span>
        ),
        borderClass: 'border-sky-200 hover:border-sky-400 shadow-sky-50/50',
        valueBoxClass: 'bg-sky-50/60 border-sky-200 text-sky-900'
      };
    }

    if (val.includes('Đã hoàn thành') || val.includes('Tuân thủ đầy đủ') || val.includes('Đã có')) {
      return {
        badge: (
          <span className="bg-emerald-100 text-emerald-800 text-[11px] font-bold px-2 py-0.5 rounded flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Đã tuân thủ
          </span>
        ),
        borderClass: 'border-emerald-200 hover:border-emerald-400',
        valueBoxClass: 'bg-emerald-50/60 border-emerald-200 text-emerald-900'
      };
    }

    // Mặc định
    return {
      badge: (
        <span className="bg-emerald-100 text-emerald-800 text-[11px] font-bold px-2 py-0.5 rounded flex items-center gap-1">
          <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Đã xác nhận
        </span>
      ),
      borderClass: 'border-slate-200 hover:border-teal-400',
      valueBoxClass: 'bg-slate-50 border-slate-100 text-slate-800'
    };
  };

  const handleSaveFactUpdate = async () => {
    if (!editingFact || !newFactValue.trim()) return;
    try {
      await updateFact(editingFact.id, newFactValue.trim(), factEditNote.trim() || 'Chủ DN tự cập nhật');
      message.success(`Đã cập nhật dữ kiện "${editingFact.label}" thành công!`);
      setEditingFact(null);
      fetchFacts();
    } catch (err: any) {
      message.error(err.message || 'Lỗi khi cập nhật dữ kiện');
    }
  };

  const handleResolveConflict = async () => {
    if (!conflictFact || !agreedValue.trim()) return;
    try {
      await updateFact(conflictFact.id, agreedValue.trim(), 'Đối chiếu & Thống nhất thông tin mâu thuẫn');
      message.success(`Đã thống nhất thông tin cho "${conflictFact.label}"!`);
      setConflictFact(null);
      fetchFacts();
    } catch (err: any) {
      message.error(err.message || 'Lỗi khi thống nhất thông tin');
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Title Header matching Prototype */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Database className="w-5 h-5 text-teal-600" />
            Bối cảnh Doanh nghiệp (Enterprise Context Engine)
          </h2>
        </div>

        {/* Nút tính năng: Thêm dữ kiện mới & Rà soát tuân thủ */}
        <div className="flex items-center gap-2 self-start md:self-auto shrink-0 flex-wrap">
          <button
            onClick={() => {
              createForm.resetFields();
              createForm.setFieldsValue({ group: selectedTab !== 'all' ? selectedTab : 'tax_accounting' });
              setIsCreateModalOpen(true);
            }}
            className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer border border-slate-300 shadow-xs"
            title="Thêm thẻ dữ kiện bối cảnh mới vào hệ thống"
          >
            <Plus className="w-4 h-4 text-teal-600" />
            <span>Thêm dữ kiện mới</span>
          </button>

          <button
            onClick={() => {
              setAuditTargetFactId(null);
              setShowAuditModal(true);
            }}
            className="px-4 py-2.5 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-xs hover:shadow-md cursor-pointer group"
            title="Rà soát tuân thủ các quy định pháp luật theo dữ liệu Context"
          >
            <ShieldCheck className="w-4 h-4 text-emerald-200 group-hover:scale-110 transition-transform" />
            <span>Rà soát tuân thủ</span>
            <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full font-extrabold text-white">
              {facts.length} thẻ
            </span>
          </button>
        </div>
      </div>

      {/* TABS PHÂN LOẠI 9 NHÓM BỐI CẢNH DOANH NGHIỆP ĐỘNG */}
      <div className="bg-white p-2 rounded-2xl border border-slate-200/90 shadow-xs flex items-center gap-2 overflow-x-auto">
        {/* TAB TẤT CẢ DỮ KIỆN */}
        <button
          type="button"
          onClick={() => setSelectedTab('all')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
            selectedTab === 'all'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-700 hover:bg-slate-100 bg-slate-50 border border-slate-200'
          }`}
        >
          <Database className="w-3.5 h-3.5" />
          <span>Tất cả dữ kiện</span>
          <span
            className={`text-[10px] px-2 py-0.5 rounded-full font-extrabold ${
              selectedTab === 'all' ? 'bg-white/20 text-white' : 'bg-blue-100 text-blue-800'
            }`}
          >
            {facts.length}
          </span>
        </button>

        {/* 9 NHÓM CONTEXT DYNAMIC TỪ DATABASE */}
        {CONTEXT_GROUPS.map((g) => {
          const isEnabled = ENABLED_CONTEXT_GROUP_KEYS.includes(g.key);
          const count = facts.filter((f) => f.group === g.key).length;
          const isSelected = selectedTab === g.key;
          const IconComponent = g.icon;

          if (!isEnabled) {
            return (
              <Tooltip key={g.key} title="Phân hệ tạm khóa theo lộ trình, hiện tại chỉ mở Thuế & Hồ sơ pháp lý">
                <button
                  type="button"
                  disabled
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 shrink-0 bg-slate-100/90 border border-slate-200 text-slate-400 opacity-60 cursor-not-allowed select-none transition-all"
                >
                  <IconComponent className="w-3.5 h-3.5 text-slate-400" />
                  <span>{g.label}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-200 text-slate-500 font-medium">
                    Tạm khóa
                  </span>
                </button>
              </Tooltip>
            );
          }

          return (
            <button
              key={g.key}
              type="button"
              onClick={() => setSelectedTab(g.key)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                isSelected
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-700 hover:text-blue-700 hover:bg-slate-100 bg-slate-50 border border-slate-200'
              }`}
            >
              <IconComponent className="w-3.5 h-3.5" />
              <span>{g.label}</span>
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full font-extrabold ${
                  isSelected
                    ? 'bg-white/20 text-white'
                    : count > 0
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-slate-200 text-slate-500'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>


      {/* CONTEXT FACTS LIST - 2 COLUMN GRID */}
      {filteredFacts.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center space-y-4 shadow-xs">
          <div className="w-14 h-14 bg-teal-50 text-teal-600 rounded-2xl flex items-center justify-center mx-auto">
            <Database className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-800">
              {selectedTab === 'all'
                ? 'Chưa có dữ kiện bối cảnh nào'
                : `Chưa có dữ kiện nào thuộc nhóm "${CONTEXT_GROUPS.find((g) => g.key === selectedTab)?.label || selectedTab}"`}
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Doanh nghiệp có thể thêm dữ kiện mới cho nhóm này hoặc hoàn tất Khảo sát doanh nghiệp để đồng bộ dữ liệu tự động.
            </p>
          </div>
          <div className="flex items-center justify-center gap-2 pt-1 flex-wrap">
            <button
              onClick={() => {
                createForm.resetFields();
                createForm.setFieldsValue({ group: selectedTab !== 'all' ? selectedTab : 'tax_accounting' });
                setIsCreateModalOpen(true);
              }}
              className="px-4 py-2 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer inline-flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              Thêm dữ kiện cho nhóm này
            </button>
            {selectedTab !== 'all' && (
              <button
                onClick={() => setSelectedTab('all')}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer inline-flex items-center gap-1.5"
              >
                Xem tất cả ({facts.length})
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredFacts.map((fact) => {
            const compInfo = getFactComplianceInfo(fact);
            const groupMeta = getGroupMeta(fact.group || fact.category || '');
            const GroupIcon = groupMeta.icon;
            const affectedRules = Array.isArray(fact.affectedRules) ? fact.affectedRules : [];

            return (
              <div
                key={fact.id}
                className={`bg-white p-5 rounded-2xl border ${compInfo.borderClass} shadow-xs transition-all space-y-3.5 flex flex-col justify-between`}
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className={`text-[10px] font-extrabold uppercase tracking-wide px-2 py-0.5 rounded-md flex items-center gap-1 ${groupMeta.badgeClass}`}>
                        <GroupIcon className="w-3 h-3" />
                        {groupMeta.tag}
                      </span>
                      {fact.source && (
                        <span className="text-[10px] text-slate-500 bg-slate-100 font-medium px-2 py-0.5 rounded">
                          {fact.source}
                        </span>
                      )}
                    </div>
                    {compInfo.badge}
                  </div>

                  <h4 className="text-xs sm:text-sm font-bold text-slate-900">
                    {fact.label}
                  </h4>

                  <div className={`p-3 rounded-xl border text-xs leading-relaxed font-semibold ${compInfo.valueBoxClass}`}>
                    {fact.currentValue || '⚪ Chưa trả lời'}
                  </div>

                  {/* Conflict warning if any */}
                  {fact.conflictDetails && (
                    <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-900 space-y-1">
                      <div className="font-bold flex items-center gap-1.5 text-rose-800">
                        <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                        Cảnh báo mâu thuẫn thông tin:
                      </div>
                      <p className="text-[11px] leading-relaxed">{fact.conflictDetails}</p>
                      <button
                        onClick={() => {
                          setConflictFact(fact);
                          setAgreedValue(fact.currentValue || '');
                        }}
                        className="mt-1 px-2.5 py-1 bg-rose-600 text-white rounded text-[11px] font-bold hover:bg-rose-700 cursor-pointer"
                      >
                        Đối chiếu &amp; Thống nhất dữ liệu
                      </button>
                    </div>
                  )}
                </div>

                {/* Fact Metadata & Audit Info */}
                <div className="space-y-2 pt-2 border-t border-slate-100 text-[11px] text-slate-500">
                  <div className="flex justify-between">
                    <span>Thời điểm cung cấp:</span>
                    <span>
                      {fact.providedAt 
                        ? new Date(fact.providedAt).toLocaleString('vi-VN') 
                        : (fact as any).createdAt 
                        ? new Date((fact as any).createdAt).toLocaleString('vi-VN') 
                        : 'Mới cập nhật'}
                    </span>
                  </div>
                  {affectedRules.length > 0 && (
                    <div className="flex items-center gap-1 pt-1 flex-wrap">
                      <span className="text-slate-400">Rule bị ảnh hưởng:</span>
                      <div className="flex gap-1 flex-wrap">
                        {affectedRules.map((r: string) => (
                          <span key={r} className="font-mono text-[10px] font-bold text-teal-700 bg-teal-50 px-1 rounded">
                            {r}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Actions footer */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
                    <button
                      onClick={() => setActiveFactForHistory(fact)}
                      className="text-slate-500 hover:text-slate-800 flex items-center gap-1 font-semibold text-xs transition-colors cursor-pointer"
                    >
                      <History className="w-3.5 h-3.5" /> Lịch sử ({fact.history?.length || 0})
                    </button>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setAuditTargetFactId(fact.id);
                          setShowAuditModal(true);
                        }}
                        className="text-emerald-700 hover:text-emerald-900 flex items-center gap-1 font-bold text-xs bg-emerald-50 hover:bg-emerald-100 px-2 py-1 rounded-lg border border-emerald-200 transition-colors cursor-pointer"
                        title="Rà soát tuân thủ riêng cho thẻ này"
                      >
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Rà soát thẻ
                      </button>

                      <button
                        onClick={() => {
                          setEditingFact(fact);
                          setNewFactValue(fact.currentValue || '');
                          setFactEditNote('');
                        }}
                        className="text-teal-700 hover:text-teal-900 flex items-center gap-1 font-bold text-xs transition-colors cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5" /> Cập nhật
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* History Modal */}
      {activeFactForHistory && createPortal(
        <div style={{ zIndex: 2000 }} className="fixed inset-0 z-[2000] bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 border border-slate-200 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <History className="w-4 h-4 text-teal-600" />
                Lịch sử thay đổi: {activeFactForHistory.label}
              </h3>
              <button onClick={() => setActiveFactForHistory(null)} className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
              {!activeFactForHistory.history || activeFactForHistory.history.length === 0 ? (
                <div className="text-center py-6 text-xs text-slate-400 italic">
                  Chưa có bản ghi thay đổi nào cho thuộc tính này.
                </div>
              ) : (
                activeFactForHistory.history.map((h: any, idx: number) => (
                  <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs space-y-1">
                    <div className="flex justify-between text-[11px] text-slate-500">
                      <span className="font-semibold text-slate-800">{h.changedBy || 'Hệ thống'}</span>
                      <span>{h.changedAt ? new Date(h.changedAt).toLocaleString('vi-VN') : 'Ghi nhận ban đầu'}</span>
                    </div>
                    <p className="font-bold text-slate-900">{h.value}</p>
                    {h.note && <p className="text-[11px] text-slate-600 italic">Ghi chú: {h.note}</p>}
                  </div>
                ))
              )}
            </div>

            <div className="flex justify-end pt-2 border-t">
              <button
                onClick={() => setActiveFactForHistory(null)}
                className="px-4 py-1.5 bg-slate-800 text-white rounded-lg text-xs font-semibold cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Edit Value Modal */}
      {editingFact && createPortal(
        <div style={{ zIndex: 2000 }} className="fixed inset-0 z-[2000] bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 border border-slate-200 shadow-2xl space-y-4 text-xs">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-sm font-bold text-slate-900">
                Cập nhật thông tin Context
              </h3>
              <button onClick={() => setEditingFact(null)} className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="font-bold text-slate-700 block mb-1">{editingFact.label}:</label>
                <textarea
                  rows={3}
                  value={newFactValue}
                  onChange={(e) => setNewFactValue(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:border-teal-500"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Ghi chú nguồn / Căn cứ thay đổi:</label>
                <input
                  type="text"
                  placeholder="VD: Theo hồ sơ đăng ký kinh doanh điều chỉnh ngày 15/03..."
                  value={factEditNote}
                  onChange={(e) => setFactEditNote(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:border-teal-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t">
              <button
                onClick={() => setEditingFact(null)}
                className="px-3.5 py-1.5 text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
              >
                Hủy
              </button>
              <button
                onClick={handleSaveFactUpdate}
                className="px-4 py-1.5 bg-teal-600 text-white rounded-lg font-bold hover:bg-teal-700 shadow-xs cursor-pointer"
              >
                Lưu cập nhật
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Conflict Resolution Modal */}
      {conflictFact && createPortal(
        <div style={{ zIndex: 2000 }} className="fixed inset-0 z-[2000] bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 border border-slate-200 shadow-2xl space-y-4 text-xs">
            <div className="flex items-center justify-between border-b pb-3 text-rose-900">
              <h3 className="text-sm font-bold flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-rose-600" />
                Đối chiếu &amp; Thống nhất thông tin mâu thuẫn
              </h3>
              <button onClick={() => setConflictFact(null)} className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-slate-600">
              Nhập giá trị thống nhất cuối cùng sau khi đã trao đổi giữa Chủ doanh nghiệp và Phòng ban/Kế toán:
            </p>

            <textarea
              rows={3}
              value={agreedValue}
              onChange={(e) => setAgreedValue(e.target.value)}
              className="w-full p-2 border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:border-teal-500 font-semibold"
            />

            <div className="flex justify-end gap-2 pt-2 border-t">
              <button
                onClick={() => setConflictFact(null)}
                className="px-3.5 py-1.5 text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
              >
                Hủy
              </button>
              <button
                onClick={handleResolveConflict}
                className="px-4 py-1.5 bg-teal-600 text-white rounded-lg font-bold hover:bg-teal-700 shadow-xs cursor-pointer"
              >
                Xác nhận thống nhất
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Context Compliance Audit Modal */}
      <ContextComplianceAuditModal
        isOpen={showAuditModal}
        onClose={() => {
          setShowAuditModal(false);
          setAuditTargetFactId(null);
        }}
        initialSelectedFactId={auditTargetFactId}
        onSuccess={() => fetchFacts()}
      />

      {/* CREATE NEW CONTEXT FACT MODAL */}
      <Modal
        title="Thêm Thẻ Dữ Kiện Bối Cảnh Mới"
        open={isCreateModalOpen}
        onCancel={() => setIsCreateModalOpen(false)}
        onOk={() => createForm.submit()}
        confirmLoading={creating}
        okText="Lưu Thẻ Dữ Kiện"
        cancelText="Hủy"
        destroyOnClose
      >
        <Form
          form={createForm}
          layout="vertical"
          onFinish={async (values) => {
            setCreating(true);
            try {
              const generatedKey = `fact_${values.group}_${Date.now().toString().slice(-4)}`;
              await createFact({
                key: generatedKey,
                label: values.label,
                group: values.group,
                currentValue: values.currentValue,
                source: values.source || 'Chủ DN tự khai báo',
              });
              message.success(`Đã thêm thành công thẻ bối cảnh: "${values.label}"!`);
              setIsCreateModalOpen(false);
              createForm.resetFields();
              await fetchFacts();
            } catch (err: any) {
              message.error(err.message || 'Lỗi khi thêm thẻ dữ kiện');
            } finally {
              setCreating(false);
            }
          }}
        >
          <Form.Item
            name="group"
            label="Nhóm Bối Cảnh"
            rules={[{ required: true, message: 'Vui lòng chọn nhóm bối cảnh' }]}
            initialValue="tax_accounting"
          >
            <Select
              options={CONTEXT_GROUPS.map((g) => ({
                label: g.label,
                value: g.key,
              }))}
            />
          </Form.Item>

          <Form.Item
            name="label"
            label="Tên nghĩa vụ / Tiêu đề dữ kiện"
            rules={[{ required: true, message: 'Vui lòng nhập tên dữ kiện' }]}
          >
            <Input placeholder="Ví dụ: Giấy chứng nhận cơ sở đủ điều kiện ATTP, Hợp đồng thuê mặt bằng..." />
          </Form.Item>

          <Form.Item
            name="currentValue"
            label="Tình trạng / Giá trị thực tế của Doanh nghiệp"
            rules={[{ required: true, message: 'Vui lòng nhập giá trị thực tế' }]}
          >
            <Input.TextArea
              rows={3}
              placeholder="Ví dụ: Đã hoàn tất và được cấp chứng nhận ngày 15/01/2026..."
            />
          </Form.Item>

          <Form.Item name="source" label="Nguồn thông tin minh chứng" initialValue="Chủ DN tự khai báo">
            <Input placeholder="Ví dụ: Hồ sơ lưu trữ nội bộ, Khảo sát doanh nghiệp..." />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};
export default ContextPage;
