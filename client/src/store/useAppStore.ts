import { create } from 'zustand'

type AppState = {
  installPromptEvent: any | null
  setInstallPromptEvent: (e: any | null) => void
}

export const useAppStore = create<AppState>((set) => ({
  installPromptEvent: null,
  setInstallPromptEvent: (e) => set({ installPromptEvent: e }),
}))

