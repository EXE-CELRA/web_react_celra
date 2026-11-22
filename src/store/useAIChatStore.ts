import { create } from 'zustand';

interface AIChatState {
  isOpen: boolean;
  open: () => void;
  close: () => void;
}

/**
 * Bộ điều khiển dùng chung cho AIChatDrawer hiện tại.
 * Giúp nút "Trợ lý AI" trên Header và CELRA Mascot cùng mở một drawer duy nhất,
 * không tạo thêm chatbot hay thay đổi API/lịch sử hội thoại.
 */
export const useAIChatStore = create<AIChatState>((set) => ({
  isOpen: false,
  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false }),
}));
