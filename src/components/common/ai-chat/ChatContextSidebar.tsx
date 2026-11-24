import React from 'react';
import {
  PanelRightClose,
  PanelRightOpen,
  Building2,
  AlertCircle,
  ExternalLink,
  ClipboardCheck,
  BookmarkPlus,
} from 'lucide-react';
import type { Organization } from '../../../interfaces';
import { type MessageItem, resolveCitationUrl } from './ai-chat.utils';

interface ChatContextSidebarProps {
  open: boolean;
  activeOrg: Organization | null;
  latestUserMessage?: MessageItem;
  latestAiMessage?: MessageItem;
  onToggleOpen: (open: boolean) => void;
  onOpenAudit: () => void;
  onOpenTasks: () => void;
}

export const ChatContextSidebar: React.FC<ChatContextSidebarProps> = ({
  open,
  activeOrg,
  latestUserMessage,
  latestAiMessage,
  onToggleOpen,
  onOpenAudit,
  onOpenTasks,
}) => {
  if (!open) {
    return (
      <button
        type="button"
        onClick={() => onToggleOpen(true)}
        className="hidden lg:flex w-10 h-10 mt-3 mr-3 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:text-[#2563EB] cursor-pointer"
        title="Mở panel ngữ cảnh"
        aria-label="Mở panel ngữ cảnh"
      >
        <PanelRightOpen className="w-4 h-4" />
      </button>
    );
  }

  return (
    <aside className="hidden lg:flex w-[300px] shrink-0 flex-col border-l border-slate-200 bg-white overflow-y-auto">
      <div className="h-[52px] px-4 border-b border-slate-200 flex items-center justify-between shrink-0">
        <span className="text-[12px] font-bold text-[#172B4D]">Ngữ cảnh câu hỏi</span>
        <button
          type="button"
          onClick={() => onToggleOpen(false)}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 cursor-pointer"
          title="Thu gọn panel ngữ cảnh"
          aria-label="Thu gọn panel ngữ cảnh"
        >
          <PanelRightClose className="w-4 h-4" />
        </button>
      </div>

      <div className="p-4 space-y-5">
        <section>
          <div className="mb-3 flex items-center gap-2 text-[11px] font-bold uppercase tracking-wide text-slate-500">
            <Building2 className="w-4 h-4" />
            Doanh nghiệp
          </div>
          <div className="rounded-xl border border-slate-200 p-3">
            <p className="text-[13px] font-bold text-[#172B4D]">
              {activeOrg?.legalName || activeOrg?.name || 'Chưa cập nhật tên doanh nghiệp'}
            </p>
            {activeOrg?.legalType || activeOrg?.loaiHinhPhapLy ? (
              <p className="mt-1 text-[11px] text-slate-500">
                {activeOrg.legalType || activeOrg.loaiHinhPhapLy}
              </p>
            ) : null}
            {activeOrg?.industry || activeOrg?.nganhNghe ? (
              <p className="mt-2 text-[11px] text-slate-600">
                Ngành: {activeOrg.industry || activeOrg.nganhNghe}
              </p>
            ) : null}
            {activeOrg?.scale ? (
              <p className="mt-1 text-[11px] text-slate-600">Quy mô: {activeOrg.scale}</p>
            ) : null}
          </div>
        </section>

        <section>
          <h4 className="mb-2 text-[11px] font-bold uppercase tracking-wide text-slate-500">
            Chủ đề hiện tại
          </h4>
          {latestUserMessage ? (
            <p className="text-[12px] leading-5 text-slate-700">{latestUserMessage.text}</p>
          ) : (
            <p className="text-[12px] leading-5 text-slate-500">Chưa có câu hỏi trong phiên này.</p>
          )}
          {latestAiMessage?.verificationChecklist?.length ? (
            <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] text-amber-800 flex gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>Cần xác minh thêm thông tin từ doanh nghiệp.</span>
            </div>
          ) : null}
        </section>

        <section>
          <h4 className="mb-2 text-[11px] font-bold uppercase tracking-wide text-slate-500">
            Tài liệu tham khảo
          </h4>
          {latestAiMessage?.citations?.length ? (
            <div className="space-y-2">
              {latestAiMessage.citations.slice(0, 4).map((citation, index) => (
                <a
                  key={`${citation.docNumber}-${index}`}
                  href={resolveCitationUrl(citation)}
                  target="_blank"
                  rel="noreferrer"
                  className="block rounded-lg border border-slate-200 p-3 hover:border-[#2563EB]/40"
                >
                  <p className="text-[12px] font-semibold text-[#172B4D]">{citation.title}</p>
                  {citation.docNumber ? (
                    <p className="mt-1 text-[10px] text-slate-500">{citation.docNumber}</p>
                  ) : null}
                  <span className="mt-2 inline-flex items-center gap-1 text-[10px] font-bold text-[#2563EB]">
                    Xem chi tiết <ExternalLink className="w-3 h-3" />
                  </span>
                </a>
              ))}
            </div>
          ) : (
            <p className="text-[12px] leading-5 text-slate-500">
              Chưa xác minh được văn bản pháp luật cho câu hỏi hiện tại.
            </p>
          )}
        </section>

        <section>
          <h4 className="mb-2 text-[11px] font-bold uppercase tracking-wide text-slate-500">
            Hành động nhanh
          </h4>
          <div className="space-y-2">
            <button
              type="button"
              onClick={onOpenAudit}
              className="w-full h-10 rounded-lg border border-slate-200 bg-white px-3 text-[12px] font-semibold text-[#172B4D] hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
            >
              <ClipboardCheck className="w-4 h-4 text-[#2563EB]" />
              Đánh giá tuân thủ
            </button>
            <button
              type="button"
              onClick={onOpenTasks}
              className="w-full h-10 rounded-lg border border-slate-200 bg-white px-3 text-[12px] font-semibold text-[#172B4D] hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
            >
              <BookmarkPlus className="w-4 h-4 text-[#2563EB]" />
              Tạo nhiệm vụ liên quan
            </button>
          </div>
        </section>
      </div>
    </aside>
  );
};
