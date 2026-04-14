import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { ThemeMode, Challenge, Profile } from '@/types'

interface AppState {
  theme: ThemeMode
  activeChallenge: Challenge | null
  profile: Profile | null
  selectedChallengeId: string | null
  setTheme: (theme: ThemeMode) => void
  toggleTheme: () => void
  setActiveChallenge: (challenge: Challenge | null) => void
  setProfile: (profile: Profile | null) => void
  setSelectedChallengeId: (id: string | null) => void
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      theme: 'dark',
      activeChallenge: null,
      profile: null,
      selectedChallengeId: null,
      setTheme: (theme) => {
        set({ theme })
        if (theme === 'dark') {
          document.documentElement.classList.add('dark')
        } else {
          document.documentElement.classList.remove('dark')
        }
      },
      toggleTheme: () => {
        const current = get().theme
        get().setTheme(current === 'dark' ? 'light' : 'dark')
      },
      setActiveChallenge: (challenge) => set({ activeChallenge: challenge }),
      setProfile: (profile) => set({ profile }),
      setSelectedChallengeId: (id) => set({ selectedChallengeId: id }),
    }),
    {
      name: '90day-app-store',
      partialize: (state) => ({ theme: state.theme }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          if (state.theme === 'dark') {
            document.documentElement.classList.add('dark')
          } else {
            document.documentElement.classList.remove('dark')
          }
        }
      },
    }
  )
)
