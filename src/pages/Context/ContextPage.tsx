import React, { useState, useEffect } from 'react';
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
  Lock
} from 'lucide-react';
import { message } from 'antd';

type FilterTab = 'all' | 'tax_accounting';

export const ContextPage: React.FC = () => {
  const { facts, fetchFacts, updateFact } = useContextStore();

  const [selectedTab, setSelectedTab] = useState<FilterTab>('all');
  const [activeFactForHistory, setActiveFactForHistory] = useState<ContextFact | null>(null);

  // Edit value modal
  const [editingFact, setEditingFact] = useState<ContextFact | null>(null);
  const [newFactValue, setNewFactValue] = useState('');
  const [factEditNote, setFactEditNote] = useState('');

  // Conflict resolution modal
  const [conflictFact, setConflictFact] = useState<ContextFact | null>(null);
  const [agreedValue, setAgreedValue] = useState('');

  // Compliance Audit Modal
  const [showAuditModal, setShowAuditModal] = useState(false);
  const [auditTargetFactId, setAuditTargetFactId] = useState<string | null>(null);

  useEffect(() => {
    fetchFacts();
  }, []);

  // Thẻ Thuế Doanh Nghiệp (dùng cho rà soát nghĩa vụ thuế)
  const taxFacts = facts.filter((f) => f.group === 'tax_accounting');
  const taxCount = taxFacts.length;

  // 4 thẻ Hồ sơ nền tảng (MST, Loại hình, Quy mô nhân sự, Ngành nghề - để user xem/sửa)
  const baseFacts = facts.filter((f) => f.group === 'legal' || f.group === 'operations');

  // Tab Tất cả = 4 thẻ Nền tảng + các thẻ Thuế (để user xem tổng thể và bấm Cập nhật)
  const allDisplayFacts = [...baseFacts, ...taxFacts];
  const allCount = allDisplayFacts.length;

  // Khi chọn Tab 'all': hiển thị tất cả (để xem/sửa thông tin). Khi chọn Tab 'tax_accounting': chỉ hiển thị Thuế (để rà soát)
  const filteredFacts = selectedTab === 'all' ? allDisplayFacts : taxFacts;

  // Group metadata helper for module classification
  const getGroupMeta = (group: string) => {
    switch (group) {
      case 'tax_accounting':
        return {
          title: 'Thuế Doanh Nghiệp',
          tag: 'THUẾ DOANH NGHIỆP',
          badgeClass: 'text-blue-700 bg-blue-50 border border-blue-200',
          icon: Receipt,
        };
      case 'revenue_invoices':
        return {
          title: 'Hóa Đơn & Dòng Tiền',
          tag: 'HÓA ĐƠN & DÒNG TIỀN',
          badgeClass: 'text-purple-700 bg-purple-50 border border-purple-200',
          icon: FileText,
        };
      case 'legal':
        return {
          title: 'Pháp Lý & Vốn',
          tag: 'TẦNG 1: HỒ SƠ PHÁP LÝ',
          badgeClass: 'text-emerald-700 bg-emerald-50 border border-emerald-200',
          icon: ShieldCheck,
        };
      case 'operations':
        return {
          title: 'Ngành Nghề & Vận Hành',
          tag: 'TẦNG 1: HOẠT ĐỘNG THỰC TẾ',
          badgeClass: 'text-amber-700 bg-amber-50 border border-amber-200',
          icon: Layers,
        };
      case 'hr_labor':
        return {
          title: 'Lao Động & BHXH',
          tag: 'LAO ĐỘNG & BHXH',
          badgeClass: 'text-teal-700 bg-teal-50 border border-teal-200',
          icon: Users,
        };
      default:
        return {
          title: group || 'Quy định',
          tag: 'QUY ĐỊNH CHUNG',
          badgeClass: 'text-slate-700 bg-slate-50 border border-slate-200',
          icon: Database,
        };
    }
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

        {/* Nút tính năng: Rà soát tuân thủ */}
        <div className="flex items-center gap-2 self-start md:self-auto shrink-0">
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
              {taxCount} thẻ
            </span>
          </button>
        </div>
      </div>

      {/* TABS PHÂN LOẠI MODULE TUÂN THỦ - CHUYÊN BIỆT THUẾ */}
      <div className="bg-white p-2 rounded-2xl border border-slate-200/90 shadow-xs flex items-center gap-2 overflow-x-auto">
        {/* TAB TẤT CẢ DỮ KIỆN - GỒM 4 THẺ NỀN TẢNG + CÁC THẺ THUẾ ĐỂ USER CẬP NHẬT */}
        <button
          type="button"
          onClick={() => setSelectedTab('all')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
            selectedTab === 'all'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-blue-700 hover:bg-blue-50'
          }`}
        >
          <span>Tất cả dữ kiện</span>
          <span
            className={`text-[10px] px-2 py-0.5 rounded-full font-extrabold ${
              selectedTab === 'all' ? 'bg-white/20 text-white' : 'bg-blue-100 text-blue-800'
            }`}
          >
            {allCount}
          </span>
        </button>

        {/* TAB THUẾ DOANH NGHIỆP - ĐANG KÍCH HOẠT */}
        <button
          type="button"
          onClick={() => setSelectedTab('tax_accounting')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
            selectedTab === 'tax_accounting'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-blue-700 hover:bg-blue-50'
          }`}
        >
          <Receipt className="w-3.5 h-3.5" />
          <span>Thuế Doanh Nghiệp</span>
          <span
            className={`text-[10px] px-2 py-0.5 rounded-full font-extrabold ${
              selectedTab === 'tax_accounting' ? 'bg-white/20 text-white' : 'bg-blue-100 text-blue-800'
            }`}
          >
            {taxCount}
          </span>
        </button>

        {/* --- CÁC THẺ KHÓA DẠNG DISABLE HOÀN TOÀN, CẤM CLICK, KHÔNG CÓ SỐ LƯỢNG --- */}
        <button
          type="button"
          disabled
          aria-disabled="true"
          className="px-3 py-2 rounded-xl text-xs font-medium flex items-center gap-1.5 shrink-0 border border-slate-200 bg-slate-50 text-slate-400 cursor-not-allowed opacity-50 select-none pointer-events-none"
          title="Hóa đơn đang khóa trong MVP (chỉ kích hoạt Core Thuế)"
        >
          <Lock className="w-3 h-3 text-slate-400" />
          <span>Hóa Đơn & Dòng Tiền</span>
          <span className="text-[10px] text-slate-400 bg-slate-200/60 px-1.5 py-0.2 rounded font-mono">
            Chưa mở
          </span>
        </button>

        <button
          type="button"
          disabled
          aria-disabled="true"
          className="px-3 py-2 rounded-xl text-xs font-medium flex items-center gap-1.5 shrink-0 border border-slate-200 bg-slate-50 text-slate-400 cursor-not-allowed opacity-50 select-none pointer-events-none"
          title="Hồ sơ nền tảng đang khóa trong MVP (chỉ kích hoạt Core Thuế)"
        >
          <Lock className="w-3 h-3 text-slate-400" />
          <span>Hồ Sơ Nền Tảng (Pháp lý)</span>
          <span className="text-[10px] text-slate-400 bg-slate-200/60 px-1.5 py-0.2 rounded font-mono">
            Chưa mở
          </span>
        </button>

        <button
          type="button"
          disabled
          aria-disabled="true"
          className="px-3 py-2 rounded-xl text-xs font-medium flex items-center gap-1.5 shrink-0 border border-slate-200 bg-slate-50 text-slate-400 cursor-not-allowed opacity-50 select-none pointer-events-none"
          title="Lĩnh vực Lao động & BHXH đang khóa trong MVP"
        >
          <Lock className="w-3 h-3 text-slate-400" />
          <span>Lao Động & BHXH</span>
          <span className="text-[10px] text-slate-400 bg-slate-200/60 px-1.5 py-0.2 rounded font-mono">
            Chưa mở
          </span>
        </button>

        <button
          type="button"
          disabled
          aria-disabled="true"
          className="px-3 py-2 rounded-xl text-xs font-medium flex items-center gap-1.5 shrink-0 border border-slate-200 bg-slate-50 text-slate-400 cursor-not-allowed opacity-50 select-none pointer-events-none"
          title="Lĩnh vực Giấy phép con & PCCC đang khóa trong MVP"
        >
          <Lock className="w-3 h-3 text-slate-400" />
          <span>Giấy Phép Con & PCCC</span>
          <span className="text-[10px] text-slate-400 bg-slate-200/60 px-1.5 py-0.2 rounded font-mono">
            Chưa mở
          </span>
        </button>

        <button
          type="button"
          disabled
          aria-disabled="true"
          className="px-3 py-2 rounded-xl text-xs font-medium flex items-center gap-1.5 shrink-0 border border-slate-200 bg-slate-50 text-slate-400 cursor-not-allowed opacity-50 select-none pointer-events-none"
          title="Lĩnh vực An toàn dữ liệu & Thương mại điện tử đang khóa trong MVP"
        >
          <Lock className="w-3 h-3 text-slate-400" />
          <span>Dữ Liệu & TMĐT</span>
          <span className="text-[10px] text-slate-400 bg-slate-200/60 px-1.5 py-0.2 rounded font-mono">
            Chưa mở
          </span>
        </button>
      </div>


      {/* CONTEXT FACTS LIST - 2 COLUMN GRID */}
      {filteredFacts.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center space-y-4 shadow-xs">
          <div className="w-14 h-14 bg-teal-50 text-teal-600 rounded-2xl flex items-center justify-center mx-auto">
            <Database className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-800">Không có dữ kiện nào trong mục này</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Chưa có dữ kiện bối cảnh nào thuộc nhóm được chọn. Bạn có thể xem tất cả dữ kiện của doanh nghiệp.
            </p>
          </div>
          <button
            onClick={() => setSelectedTab('all')}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer inline-flex items-center gap-2"
          >
            Xem tất cả nhóm dữ kiện
          </button>
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
      {activeFactForHistory && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
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
        </div>
      )}

      {/* Edit Value Modal */}
      {editingFact && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
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
        </div>
      )}

      {/* Conflict Resolution Modal */}
      {conflictFact && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
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
        </div>
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
    </div>
  );
};
export default ContextPage;
