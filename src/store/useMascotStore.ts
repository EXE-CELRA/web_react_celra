import { create } from 'zustand';

export interface MascotSafeArea {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

interface MascotState {
  safeArea: MascotSafeArea;
  setSafeArea: (safeArea: MascotSafeArea) => void;
}

// Mặc định an toàn cho các trang không có Sidebar (Home, Login, ...).
const DEFAULT_SAFE_AREA: MascotSafeArea = {
  top: 84,
  right: 16,
  bottom: 16,
  left: 16,
};

/**
 * MainLayout cập nhật vùng an toàn theo trạng thái Sidebar/Header để mascot
 * không bao giờ che menu, thanh điều hướng hoặc các nút chức năng.
 */
export const useMascotStore = create<MascotState>((set) => ({
  safeArea: DEFAULT_SAFE_AREA,
  setSafeArea: (safeArea) => set({ safeArea }),
}));
