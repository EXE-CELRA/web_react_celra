/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useContextStore } from '../../store/useContextStore';
import { useOrgStore } from '../../store/useOrgStore';
import type { ContextFact, ContextGroupConfig } from '../../interfaces';
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
  Plus,
  ArrowRight
} from 'lucide-react';
import { message, Modal, Form, Input, Select, Empty, Button } from 'antd';
import { ModuleSurveyModal } from '../../components/survey/ModuleSurveyModal';
import { isGroupSurveyCompleted } from '../../data/questionSurvey';

// eslint-disable-next-line react-refresh/only-export-components
export const ENABLED_CONTEXT_GROUP_KEYS = ['boi_canh_co_so', 'thue_ke_toan'];



// eslint-disable-next-line react-refresh/only-export-components
export const CONTEXT_GROUPS: ContextGroupConfig[] = [
  {
    key: 'boi_canh_co_so',
    label: 'Bối Cảnh Ban Đầu',
    shortLabel: 'Bối Cảnh Ban Đầu',
    tag: 'HỒ SƠ CƠ SỞ',
    icon: Building2,
    badgeClass: 'text-teal-700 bg-teal-50 border border-teal-200',
  },
  {
    key: 'thue_ke_toan',
    label: 'Thuế TNDN',
    shortLabel: 'Thuế TNDN',
    tag: 'THUẾ TNDN',
    icon: Receipt,
    badgeClass: 'text-blue-700 bg-blue-50 border border-blue-200',
  },
  {
    key: 'phap_ly_von',
    label: 'Hồ Sơ Pháp Lý & Vốn',
    shortLabel: 'Pháp Lý',
    tag: 'HỒ SƠ PHÁP LÝ & VỐN',
    icon: ShieldCheck,
    badgeClass: 'text-emerald-700 bg-emerald-50 border border-emerald-200',
  },
  {
    key: 'nganh_nghe_van_hanh',
    label: 'Ngành Nghề & Vận Hành',
    shortLabel: 'Vận Hành',
    tag: 'HOẠT ĐỘNG THỰC TẾ',
    icon: Layers,
    badgeClass: 'text-amber-700 bg-amber-50 border border-amber-200',
  },
  {
    key: 'hoa_don_dong_tien',
    label: 'Hóa Đơn & Dòng Tiền',
    shortLabel: 'Hóa Đơn',
    tag: 'HÓA ĐƠN & DÒNG TIỀN',
    icon: FileText,
    badgeClass: 'text-purple-700 bg-purple-50 border border-purple-200',
  },
  {
    key: 'lao_dong_bhxh',
    label: 'Lao Động & BHXH',
    shortLabel: 'Lao Động',
    tag: 'LAO ĐỘNG & BHXH',
    icon: Users,
    badgeClass: 'text-teal-700 bg-teal-50 border border-teal-200',
  },
  {
    key: 'dia_diem_pccc',
    label: 'Địa Điểm & PCCC',
    shortLabel: 'PCCC',
    tag: 'ĐỊA ĐIỂM & PCCC',
    icon: Building2,
    badgeClass: 'text-rose-700 bg-rose-50 border border-rose-200',
  },
  {
    key: 'giay_phep_con',
    label: 'Giấy Phép Con',
    shortLabel: 'Giấy Phép',
    tag: 'GIẤY PHÉP CON',
    icon: Award,
    badgeClass: 'text-indigo-700 bg-indigo-50 border border-indigo-200',
  },
  {
    key: 'hop_dong',
    label: 'Hợp Đồng & Giao Kết',
    shortLabel: 'Hợp Đồng',
    tag: 'HỢP ĐỒNG & GIAO KẾT',
    icon: Briefcase,
    badgeClass: 'text-cyan-700 bg-cyan-50 border border-cyan-200',
  },
  {
    key: 'du_lieu_shtt',
    label: 'Dữ Liệu & Sở Hữu Trí Tuệ',
    shortLabel: 'Dữ Liệu',
    tag: 'DỮ LIỆU & SHTT',
    icon: HardDrive,
    badgeClass: 'text-violet-700 bg-violet-50 border border-violet-200',
  },
];


// eslint-disable-next-line react-refresh/only-export-components
export const CORE_BASE_FACT_KEYS = [
  'tax_code',
  'company_type_tag',
  'charter_capital',
  'employee_scale',
  'industry_tags',
];

export const BASE_FACT_KEYS = CORE_BASE_FACT_KEYS;

// eslint-disable-next-line react-refresh/only-export-components
export const OBSOLETE_FACT_KEYS = [
  'tax_filing_cycle',
  'annual_revenue',
  'employee_count',
];

// eslint-disable-next-line react-refresh/only-export-components
export const INDUSTRY_LABEL_MAP: Record<string, string> = {
  TAG_FNB: 'Dịch vụ ăn uống / F&B / Nhà hàng / Quán cafe',
  TAG_RETAIL: 'Bán lẻ & Phân phối sản phẩm',
  TAG_ECOMMERCE: 'Bán lẻ & Thương mại điện tử (Online)',
  TAG_SOFTWARE: 'Phát triển phần mềm & Dịch vụ CNTT',
  TAG_SERVICES: 'Dịch vụ tư vấn & Chuyên môn',
  TAG_MANUFACTURING: 'Sản xuất & Gia công chế biến',
  TAG_CONSTRUCTION: 'Xây dựng & Thi công công trình',
  TAG_LOGISTICS: 'Vận tải & Kho bãi Logistics',
};

// eslint-disable-next-line react-refresh/only-export-components
export const COMPANY_TYPE_MAP: Record<string, string> = {
  TAG_TNHH_1TV: 'Công ty TNHH Một thành viên',
  TAG_TNHH_2TV: 'Công ty TNHH Hai thành viên trở lên',
  TAG_JSC: 'Công ty Cổ phần',
  TAG_HKD: 'Hộ kinh doanh cá thể',
  TAG_DOANH_NGHIEP_TU_NHAN: 'Doanh nghiệp tư nhân',
};

// eslint-disable-next-line react-refresh/only-export-components
export function getBaseProfileFacts(org: any, profile: any): ContextFact[] {
  const taxCode = org?.taxCode || profile?.taxCode || '';
  const name = org?.name || profile?.companyName || '';
  const rawLegalType = profile?.companyTypeTag || org?.legalType || '';
  const legalType = COMPANY_TYPE_MAP[rawLegalType] || org?.legalType || '';
  const charterCapital = profile?.charterCapital || org?.charterCapital || 0;
  const count = org?.employeeCount ?? profile?.employeeCount;
  const rawTags = profile?.industryTags;
  const formattedIndustry = Array.isArray(rawTags) && rawTags.length > 0
    ? rawTags.map((t) => INDUSTRY_LABEL_MAP[t] || t).join(', ')
    : '';
  const now = new Date().toISOString();

  // Xác định giá trị hiển thị rỗng an toàn, không dùng dữ liệu giả
  const mstValue = taxCode && name ? `${taxCode} - ${name}` : (taxCode || name || 'Chưa cập nhật mã số thuế & tên doanh nghiệp');
  const typeValue = legalType || 'Chưa cập nhật loại hình doanh nghiệp';
  const capitalValue = charterCapital > 0
    ? `${Number(charterCapital).toLocaleString('vi-VN')} VNĐ (${Number(charterCapital) > 10000000000 ? 'Bậc 1: Lệ phí môn bài 3.000.000đ/năm' : 'Bậc 2: Lệ phí môn bài 2.000.000đ/năm'})`
    : 'Chưa cập nhật vốn điều lệ';
  const empValue = count !== undefined && count !== null
    ? `${count} nhân sự thực tế (Quy mô: ${count < 10 ? 'Dưới 10 người - Miễn thủ tục NQLĐ bằng văn bản theo Điều 218 BLLĐ 2019' : 'Từ 10 người trở lên - Bắt buộc ban hành và đăng ký NQLĐ bằng văn bản theo Điều 119 BLLĐ 2019'})`
    : 'Chưa cập nhật quy mô lao động';
  const industryValue = formattedIndustry || 'Chưa cập nhật ngành nghề kinh doanh';

  return [
    {
      id: 'fact-base-mst',
      key: 'tax_code',
      label: 'Mã số thuế & Định danh pháp lý',
      group: 'boi_canh_co_so',
      currentValue: mstValue,
      status: taxCode ? 'confirmed' : 'draft',
      source: 'Hồ sơ nền tảng (Xác thực CSDL Thuế Quốc gia)',
      updatedAt: now,
    },
    {
      id: 'fact-base-type',
      key: 'company_type_tag',
      label: 'Hình thức kinh doanh & Loại hình doanh nghiệp',
      group: 'boi_canh_co_so',
      currentValue: typeValue,
      status: legalType ? 'confirmed' : 'draft',
      source: 'Hồ sơ nền tảng (Luật Doanh nghiệp 2020)',
      updatedAt: now,
    },
    {
      id: 'fact-base-capital',
      key: 'charter_capital',
      label: 'Vốn điều lệ đăng ký trên ĐKKD',
      group: 'boi_canh_co_so',
      currentValue: capitalValue,
      status: charterCapital > 0 ? 'confirmed' : 'draft',
      source: 'Hồ sơ nền tảng (Nghị định 139/2016/NĐ-CP)',
      updatedAt: now,
    },
    {
      id: 'fact-base-emp',
      key: 'employee_scale',
      label: 'Quy mô lao động & Nghĩa vụ Nội quy lao động (NQLĐ)',
      group: 'boi_canh_co_so',
      currentValue: empValue,
      status: count !== undefined && count !== null ? 'confirmed' : 'draft',
      source: 'Hồ sơ nền tảng (Bộ luật Lao động 2019)',
      updatedAt: now,
    },
    {
      id: 'fact-base-industry',
      key: 'industry_tags',
      label: 'Ngành nghề & Hoạt động kinh doanh thực tế',
      group: 'boi_canh_co_so',
      currentValue: industryValue,
      status: formattedIndustry ? 'confirmed' : 'draft',
      source: 'Hồ sơ nền tảng',
      updatedAt: now,
    },
  ];
}

export const ContextPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const rawGroup = searchParams.get('group');
  const { activeOrg, organizations } = useOrgStore();
  const { facts, fetchFacts, updateFact, createFact } = useContextStore();

  const [selectedTab, setSelectedTab] = useState<string>('boi_canh_co_so');

  // Nếu truy cập hoặc chọn phân hệ Thuế TNDN: Vào thẳng trang rà soát, không hiện thẻ trung gian
  useEffect(() => {
    if (rawGroup === 'thue_ke_toan' || selectedTab === 'thue_ke_toan') {
      navigate('/context/audit?group=thue_ke_toan', { replace: true });
    }
  }, [rawGroup, selectedTab, navigate]);
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

  // Module Survey Modal (Check Gate)
  const [isSurveyModalOpen, setIsSurveyModalOpen] = useState(false);

  const handleStartComplianceAudit = () => {
    const targetGroup = selectedTab === 'boi_canh_co_so' ? 'thue_ke_toan' : selectedTab;
    if (targetGroup === 'thue_ke_toan') {
      navigate('/context/audit?group=thue_ke_toan');
      return;
    }
    const isCompleted = isGroupSurveyCompleted(facts, targetGroup);
    if (!isCompleted) {
      setIsSurveyModalOpen(true);
    } else {
      navigate(`/context/audit?group=${targetGroup}`);
    }
  };

  useEffect(() => {
    if (activeOrg?.id) {
      fetchFacts();
    }
  }, [activeOrg?.id]);

    // 1. Phục hồi thông tin hồ sơ cơ sở từ local storage nếu có
  const savedBaseProfile = React.useMemo(() => {
    try {
      const activeOrgId = activeOrg?.id;
      if (activeOrgId) {
        const orgSurvey = localStorage.getItem(`celra_survey_profile_${activeOrgId}`);
        if (orgSurvey) return JSON.parse(orgSurvey);
      }
      const savedCompleted = localStorage.getItem('celra_survey_completed_profile');
      if (savedCompleted) {
        const parsed = JSON.parse(savedCompleted);
        // Chỉ chấp nhận dữ liệu cache nếu khớp với thông tin của activeOrg hiện tại
        if (!activeOrg || parsed.taxCode === activeOrg.taxCode || parsed.companyName === activeOrg.name) {
          return parsed;
        }
      }
    } catch {
      // Ignore
    }
    return null;
  }, [activeOrg]);

  // Danh sách các thẻ Bối Cảnh Cơ Sở (từ DB facts nếu có, fallback sang thông tin doanh nghiệp)
  const baseProfileFacts: ContextFact[] = React.useMemo(() => {
    // 1. Kiểm tra: Chỉ sinh thẻ khi DB đã có dữ liệu hoặc đã hoàn tất bài khảo sát
    const hasDbFacts = facts.some((f) => CORE_BASE_FACT_KEYS.includes(f.key || ''));
    const isSurveyDone = localStorage.getItem('celra_survey_completed') === 'true' || Boolean(activeOrg?.taxCode && activeOrg?.name);

    if (!hasDbFacts && !isSurveyDone) {
      return [];
    }
    const fallbackList = getBaseProfileFacts(activeOrg, savedBaseProfile);
    const fallbackMap = new Map(fallbackList.map((f) => [f.key, f]));

    // 1. Lọc ra các fact thuộc 5 key cốt lõi từ DB (loại trừ sạch sẽ các obsolete keys)
    const dbFactsByKey = new Map<string, ContextFact>();
    for (const f of facts) {
      const key = f.key || '';
      if (OBSOLETE_FACT_KEYS.includes(key)) continue;
      if (CORE_BASE_FACT_KEYS.includes(key)) {
        dbFactsByKey.set(key, f);
      }
    }

    // 2. Tạo đúng danh sách 5 thẻ theo thứ tự chuẩn CORE_BASE_FACT_KEYS
    return CORE_BASE_FACT_KEYS.map((key) => {
      const dbFact = dbFactsByKey.get(key);
      const fallback = fallbackMap.get(key)!;

      if (!dbFact) {
        return fallback;
      }

      let formattedValue = dbFact.currentValue || '';
      let formattedLabel = dbFact.label;

      if (key === 'tax_code') {
        formattedLabel = 'Mã số thuế & Định danh pháp lý';
        const taxVal = dbFact.currentValue || '';
        const orgName = activeOrg?.name || savedBaseProfile?.companyName;
        if (orgName && !taxVal.includes(orgName)) {
          formattedValue = `${taxVal} - ${orgName}`;
        }
      } else if (key === 'company_type_tag') {
        formattedLabel = 'Hình thức kinh doanh & Loại hình doanh nghiệp';
        if (COMPANY_TYPE_MAP[formattedValue]) {
          formattedValue = COMPANY_TYPE_MAP[formattedValue];
        }
      } else if (key === 'charter_capital') {
        formattedLabel = 'Vốn điều lệ đăng ký trên ĐKKD';
        const capNum = Number(String(formattedValue).replace(/\D/g, '')) || 0;
        if (capNum > 0) {
          const monBai = capNum > 10000000000 ? 'Bậc 1: Lệ phí môn bài 3.000.000đ/năm' : 'Bậc 2: Lệ phí môn bài 2.000.000đ/năm';
          formattedValue = `${capNum.toLocaleString('vi-VN')} VNĐ (${monBai})`;
        }
      } else if (key === 'employee_scale') {
        formattedLabel = 'Quy mô lao động & Nghĩa vụ Nội quy lao động (NQLĐ)';
        const count = activeOrg?.employeeCount ?? savedBaseProfile?.employeeCount;
        if (!formattedValue.includes('Điều 218 BLLĐ 2019') && !formattedValue.includes('Điều 119 BLLĐ 2019')) {
          formattedValue = `${count} nhân sự thực tế (Quy mô: ${count < 10 ? 'Dưới 10 người - Miễn thủ tục NQLĐ bằng văn bản theo Điều 218 BLLĐ 2019' : 'Từ 10 người trở lên - Bắt buộc ban hành và đăng ký NQLĐ bằng văn bản theo Điều 119 BLLĐ 2019'})`;
        }
      } else if (key === 'industry_tags') {
        formattedLabel = 'Ngành nghề & Hoạt động kinh doanh thực tế';
        const rawTags = (formattedValue || '').split(',').map((t) => t.trim());
        const friendlyTags = rawTags.map((t) => INDUSTRY_LABEL_MAP[t] || t);
        formattedValue = friendlyTags.filter(Boolean).join(', ');
      }

      return {
        ...dbFact,
        label: formattedLabel,
        currentValue: formattedValue,
        group: 'boi_canh_co_so',
        source: dbFact.source || fallback.source,
      };
    });
  }, [facts, activeOrg, savedBaseProfile]);

  // Danh sách các thẻ Thuế TNDN (chỉ các thẻ câu hỏi tình huống chuyên sâu)
  const taxFacts: ContextFact[] = React.useMemo(() => {
    return facts.filter(
      (f) =>
        f.group === 'thue_ke_toan' &&
        !CORE_BASE_FACT_KEYS.includes(f.key || '') &&
        !OBSOLETE_FACT_KEYS.includes(f.key || '') &&
        !f.source?.includes('Khảo sát nền tảng') &&
        !f.source?.includes('Hồ sơ nền tảng')
    );
  }, [facts]);

  // Lọc dữ kiện: Chỉ hiển thị dữ kiện thuộc phân hệ đang chọn
  const filteredFacts: ContextFact[] = React.useMemo(() => {
    if (selectedTab === 'boi_canh_co_so') {
      return baseProfileFacts;
    }
    if (selectedTab === 'thue_ke_toan') {
      return taxFacts;
    }
    return facts.filter((f) => f.group === selectedTab);
  }, [selectedTab, baseProfileFacts, taxFacts, facts]);

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
    const baseKeys = ['tax_code', 'company_type_tag', 'charter_capital', 'employee_scale', 'industry_tags'];
    const factKey = fact.key || fact.factKey || '';
    const isBase = baseKeys.includes(factKey) || 
      fact.id.startsWith('fact-base') || fact.id.startsWith('fact-tax') || 
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      message.error(err.message || 'Lỗi khi thống nhất thông tin');
    }
  };

  if (!activeOrg && organizations.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px' }}>
        <Empty
          description="Bạn chưa có hồ sơ doanh nghiệp nào trên hệ thống"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        >
          <Button type="primary" size="large" onClick={() => navigate('/survey')}>
            Bắt đầu tạo hồ sơ doanh nghiệp ngay
          </Button>
        </Empty>
      </div>
    );
  }

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

        {/* Nút tính năng: Rà soát Thuế TNDN (Vào thẳng trang rà soát) */}
        <div className="flex items-center gap-2 self-start md:self-auto shrink-0 flex-wrap">
          <button
            type="button"
            onClick={handleStartComplianceAudit}
            className="px-4 py-2.5 bg-gradient-to-r from-blue-600 to-teal-600 hover:from-blue-700 hover:to-teal-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-xs hover:shadow-md cursor-pointer group"
            title="Chuyển sang trang rà soát sổ thu chi và tính thuế TNDN"
          >
            <ShieldCheck className="w-4 h-4 text-emerald-200 group-hover:scale-110 transition-transform" />
            <span>Rà soát Thuế TNDN (Sổ Thu Chi)</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* TABS PHÂN LOẠI 9 NHÓM BỐI CẢNH DOANH NGHIỆP ĐỘNG */}
      <div className="bg-white p-2 rounded-2xl border border-slate-200/90 shadow-xs flex items-center gap-2 overflow-x-auto">
        {/* CÁC PHÂN HỆ ĐANG HOẠT ĐỘNG (THUẾ DOANH NGHIỆP) */}
        {CONTEXT_GROUPS.filter((g) => ENABLED_CONTEXT_GROUP_KEYS.includes(g.key)).map((g) => {
          const count = g.key === 'boi_canh_co_so' ? baseProfileFacts.length : g.key === 'thue_ke_toan' ? 'Excel' : facts.filter((f) => f.group === g.key).length;
          const isSelected = selectedTab === g.key;
          const IconComponent = g.icon;

          return (
            <button
              key={g.key}
              type="button"
              onClick={() => {
                if (g.key === 'thue_ke_toan') {
                  navigate('/context/audit?group=thue_ke_toan');
                  return;
                }
                setSelectedTab(g.key);
              }}
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
                    : count === 'Excel' || (typeof count === 'number' && count > 0)
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

      {/* BANNER THÔNG TIN: BỐI CẢNH BAN ĐẦU */}
      {selectedTab === 'boi_canh_co_so' && (
        <div className={`border rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs ${
          baseProfileFacts.length > 0 
            ? 'bg-gradient-to-r from-teal-50 via-slate-50 to-teal-50 border-teal-200/90' 
            : 'bg-gradient-to-r from-amber-50/80 via-slate-50 to-amber-50/80 border-amber-200'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${
              baseProfileFacts.length > 0 ? 'bg-teal-100 border-teal-200 text-teal-700' : 'bg-amber-100 border-amber-200 text-amber-700'
            }`}>
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <span>Hồ Sơ &amp; Bối Cảnh Ban Đầu Của Doanh Nghiệp</span>
                {baseProfileFacts.length > 0 ? (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-extrabold uppercase">Đã xác thực</span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-extrabold uppercase">Chưa khảo sát</span>
                )}
              </h4>
              <p className="text-[11px] text-slate-600 leading-relaxed mt-0.5">
                {baseProfileFacts.length > 0
                  ? 'Các thông số pháp lý, vốn, nhân sự và ngành nghề kinh doanh được đồng bộ từ hồ sơ doanh nghiệp. Bấm vào tab Thuế TNDN phía trên khi bạn muốn bắt đầu rà soát tuân thủ.'
                  : 'Doanh nghiệp chưa hoàn thành khảo sát bối cảnh ban đầu. Vui lòng bấm nút Khảo sát hồ sơ để hệ thống kích hoạt bối cảnh tuân thủ và nghĩa vụ thuế.'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 self-stretch sm:self-auto justify-end">
            <button
              type="button"
              onClick={() => navigate('/survey')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all border shadow-xs cursor-pointer flex items-center gap-1.5 ${
                baseProfileFacts.length > 0
                  ? 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300'
                  : 'bg-amber-600 hover:bg-amber-700 text-white border-amber-600'
              }`}
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>{baseProfileFacts.length > 0 ? 'Chỉnh sửa hồ sơ' : 'Làm khảo sát ngay'}</span>
            </button>
          </div>
        </div>
      )}

      {!ENABLED_CONTEXT_GROUP_KEYS.includes(selectedTab) ? (
        <div className="bg-white p-8 sm:p-12 rounded-2xl border border-dashed border-slate-300 text-center space-y-5 shadow-xs">
          <div className="w-16 h-16 bg-slate-100 text-slate-600 rounded-2xl flex items-center justify-center mx-auto border border-slate-200 shadow-inner">
            {(() => {
              const CurrentIcon = CONTEXT_GROUPS.find((g) => g.key === selectedTab)?.icon || Layers;
              return <CurrentIcon className="w-8 h-8 text-slate-600" />;
            })()}
          </div>
          <div className="space-y-2 max-w-lg mx-auto">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-bold">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
              Phân Hệ Đang Phát Triển
            </div>
            <h3 className="text-base font-bold text-slate-900">
              Phân Hệ {CONTEXT_GROUPS.find((g) => g.key === selectedTab)?.label || selectedTab} Chưa Kích Hoạt
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              CELRA hiện tại đang chuyên sâu và chỉ rà soát cho phân hệ <strong>Thuế TNDN</strong>.
              <br />
              Để kích hoạt phân hệ này, lập trình viên sẽ cấu hình bộ câu hỏi độc lập tại thư mục <code className="px-1.5 py-0.5 rounded bg-slate-100 font-mono text-slate-800 text-[11px]">src/data/questionSurvey/</code> và kết nối vào hệ sinh thái CELRA.
            </p>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => message.info(`Phân hệ "${CONTEXT_GROUPS.find((g) => g.key === selectedTab)?.label}" đang chờ lập trình viên bổ sung file khảo sát vào questionSurvey/!`)}
              className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-2"
            >
              <Plus className="w-4 h-4 text-emerald-400" />
              <span>Khảo sát &amp; Kích hoạt Phân hệ này</span>
            </button>
            <button
              type="button"
              onClick={() => navigate('/context/audit?group=thue_ke_toan')}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
            >
              Quay lại phân hệ Thuế TNDN
            </button>
          </div>
        </div>
      ) : filteredFacts.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center space-y-4 shadow-xs">
          <div className="w-14 h-14 bg-teal-50 text-teal-600 rounded-2xl flex items-center justify-center mx-auto">
            <Database className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-800">
              {selectedTab === 'boi_canh_co_so'
                ? 'Doanh nghiệp chưa có hồ sơ bối cảnh ban đầu'
                : `Chưa có dữ kiện nào thuộc nhóm "${CONTEXT_GROUPS.find((g) => g.key === selectedTab)?.label || selectedTab}"`}
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              {selectedTab === 'boi_canh_co_so'
                ? 'Hệ thống chỉ khởi tạo và lưu các thẻ ngữ cảnh sau khi bạn hoàn thành và nộp bài khảo sát doanh nghiệp. Hãy thực hiện khảo sát ngay!'
                : 'Doanh nghiệp có thể thêm dữ kiện mới cho nhóm này hoặc hoàn tất Khảo sát doanh nghiệp để đồng bộ dữ liệu tự động.'}
            </p>
          </div>
          <div className="flex items-center justify-center gap-2 pt-1 flex-wrap">
            {selectedTab === 'boi_canh_co_so' ? (
              <button
                type="button"
                onClick={() => navigate('/survey')}
                className="px-5 py-2.5 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer inline-flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Làm bài khảo sát doanh nghiệp ngay
              </button>
            ) : (
              <button
                onClick={() => {
                  createForm.resetFields();
                  createForm.setFieldsValue({ group: selectedTab || 'thue_ke_toan' });
                  setIsCreateModalOpen(true);
                }}
                className="px-4 py-2 bg-linear-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer inline-flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                Thêm dữ kiện cho nhóm này
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
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        : (fact as any).createdAt 
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        ? new Date((fact as any).createdAt).toLocaleString('vi-VN') 
                        : 'Mới cập nhật'}
                    </span>
                  </div>

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
        <div style={{ zIndex: 2000 }} className="fixed inset-0 z-2000 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
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
        <div style={{ zIndex: 2000 }} className="fixed inset-0 z-[2000] bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 border border-slate-200 shadow-2xl space-y-4 text-xs">
            <div className="flex items-center justify-between border-b pb-3 text-rose-900">
              <h3 className="text-sm font-bold flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
                <span>Đối chiếu &amp; Thống nhất dữ liệu mâu thuẫn</span>
              </h3>
              <button onClick={() => setConflictFact(null)} className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-1">
              <span className="font-bold text-slate-800 text-xs">{conflictFact.label}</span>
            </div>

            {/* Chi tiết cảnh báo mâu thuẫn */}
            {conflictFact.conflictDetails && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 space-y-1">
                <div className="font-bold text-[11px] text-rose-900 flex items-center gap-1">
                  <span>⚠️ Căn cứ phát hiện mâu thuẫn:</span>
                </div>
                <p className="text-[11px] leading-relaxed m-0">{conflictFact.conflictDetails}</p>
              </div>
            )}

            {/* Giá trị đang lưu */}
            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 space-y-1">
              <span className="text-[11px] text-slate-500 font-semibold">Giá trị hiện tại đang ghi nhận:</span>
              <div className="font-bold text-slate-800 text-xs">
                {conflictFact.currentValue || 'Chưa có'}
              </div>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">
                Nhập hoặc chọn giá trị chính thức đã thống nhất:
              </label>
              <textarea
                rows={3}
                value={agreedValue}
                onChange={(e) => setAgreedValue(e.target.value)}
                className="w-full p-2.5 border border-slate-300 rounded-xl text-slate-800 focus:outline-none focus:border-teal-500 font-semibold"
                placeholder="Nhập giá trị thống nhất cuối cùng..."
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t">
              <button
                onClick={() => setConflictFact(null)}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-medium cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleResolveConflict}
                className="px-5 py-2 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white rounded-xl font-bold shadow-xs cursor-pointer"
              >
                Xác nhận thống nhất &amp; Xóa cảnh báo
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

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
            initialValue="thue_ke_toan"
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

      {/* MODAL KHẢO SÁT TÌNH HUỐNG THEO THẺ CONTEXT (CHECK GATE) */}
      <ModuleSurveyModal
        isOpen={isSurveyModalOpen}
        groupKey={selectedTab}
        onClose={() => setIsSurveyModalOpen(false)}
        onSuccess={() => {
          navigate(`/context/audit?group=${selectedTab}`);
        }}
      />
    </div>
  );
};
export default ContextPage;
