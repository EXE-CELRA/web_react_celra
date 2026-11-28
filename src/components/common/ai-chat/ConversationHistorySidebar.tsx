import React from 'react';
import {
  MessageSquare,
  Plus,
  Trash2,
  PanelLeftClose,
  Building2,
  Loader2,
  MessagesSquare,
} from 'lucide-react';
import { Popconfirm, Tooltip } from 'antd';
import type { ConversationItem } from '../../../interfaces/aiAssistant.interface';
import { formatConversationTime } from './ai-chat.utils';

interface ConversationHistorySidebarProps {
  conversations: ConversationItem[];
  activeConversationId: string | null;
  loading: boolean;
  activeOrgName?: string;
  onSelectConversation: (id: string) => void;
  onNewConversation: () => void;
  onDeleteConversation: (id: string) => void;
  onToggleSidebar: () => void;
}

export const ConversationHistorySidebar: React.FC<ConversationHistorySidebarProps> = ({
  conversations,
  activeConversationId,
  loading,
  activeOrgName,
  onSelectConversation,
  onNewConversation,
  onDeleteConversation,
  onToggleSidebar,
}) => {
  return (
    <aside className="w-[280px] shrink-0 border-r border-[#E2E8F0] bg-white flex flex-col h-full z-10 transition-all select-none">
      {/* Top Header & New Chat Button */}
      <div className="p-3.5 border-b border-[#E2E8F0] space-y-2.5 shrink-0 bg-[#F8FAFC]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessagesSquare className="w-4 h-4 text-[#2563EB]" />
            <span className="text-xs font-bold text-[#172B4D] uppercase tracking-wider">
              Lịch sử trò chuyện
            </span>
          </div>
          <button
            type="button"
            onClick={onToggleSidebar}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-[#172B4D] hover:bg-slate-200/60 transition-colors cursor-pointer"
            title="Thu gọn danh sách"
          >
            <PanelLeftClose className="w-4 h-4" />
          </button>
        </div>

        {/* Nút Phiên mới phong cách ChatGPT */}
        <button
          type="button"
          onClick={onNewConversation}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold text-white bg-[#2563EB] hover:bg-blue-700 active:scale-[0.98] rounded-xl transition-all shadow-xs cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Phiên mới</span>
        </button>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
        {loading && conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-slate-400 gap-2">
            <Loader2 className="w-5 h-5 animate-spin text-[#2563EB]" />
            <span className="text-xs">Đang tải lịch sử...</span>
          </div>
        ) : conversations.length === 0 ? (
          <div className="py-12 px-4 text-center text-slate-400">
            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center mx-auto mb-2 text-slate-400">
              <MessageSquare className="w-5 h-5" />
            </div>
            <p className="text-xs font-medium text-slate-600">Chưa có hội thoại nào</p>
            <p className="text-[11px] text-slate-400 mt-1">
              Gửi câu hỏi đầu tiên để bắt đầu lưu trữ lịch sử
            </p>
          </div>
        ) : (
          conversations.map((item) => {
            const isActive = activeConversationId === item.id;
            const timeStr = formatConversationTime(item.updatedAt || item.createdAt);

            return (
              <div
                key={item.id}
                onClick={() => onSelectConversation(item.id)}
                className={`group relative flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer transition-all text-xs ${
                  isActive
                    ? 'bg-blue-50/80 text-[#2563EB] font-medium border border-blue-200/80 shadow-2xs'
                    : 'text-[#334155] hover:bg-slate-100/80 hover:text-[#0F172A]'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0 flex-1 pr-1">
                  <MessageSquare
                    className={`w-3.5 h-3.5 shrink-0 ${
                      isActive ? 'text-[#2563EB]' : 'text-slate-400 group-hover:text-slate-600'
                    }`}
                  />
                  <div className="min-w-0 flex-1">
                    <Tooltip title={item.title} placement="right" mouseEnterDelay={0.5}>
                      <p className="truncate text-xs font-medium leading-snug">
                        {item.title || 'Cuộc trò chuyện mới'}
                      </p>
                    </Tooltip>
                    {timeStr ? (
                      <span className="text-[10.5px] text-slate-400 block mt-0.5 font-normal">
                        {timeStr}
                      </span>
                    ) : null}
                  </div>
                </div>

                {/* Nút Xóa có Popconfirm bảo vệ */}
                <div
                  className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Popconfirm
                    title="Xóa cuộc trò chuyện này?"
                    description="Toàn bộ tin nhắn trong phiên này sẽ bị xóa khỏi hệ thống."
                    okText="Xóa"
                    cancelText="Hủy"
                    okButtonProps={{ danger: true, size: 'small' }}
                    cancelButtonProps={{ size: 'small' }}
                    onConfirm={() => onDeleteConversation(item.id)}
                  >
                    <button
                      type="button"
                      className="p-1 rounded-md text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                      title="Xóa phiên trò chuyện"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </Popconfirm>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer: Organization boundary tag */}
      <div className="p-3 border-t border-[#E2E8F0] bg-[#F8FAFC] shrink-0 text-[11px] text-[#64748B]">
        <div className="flex items-center gap-1.5 min-w-0">
          <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span className="truncate" title={activeOrgName || 'Doanh nghiệp hiện tại'}>
            {activeOrgName || 'Doanh nghiệp hiện tại'}
          </span>
        </div>
      </div>
    </aside>
  );
};
