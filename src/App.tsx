import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AppShell } from './components/AppShell'
import { LandingPage } from './features/landing/LandingPage'
import { AuthPage } from './features/auth/AuthPage'
import { OnboardingPage } from './features/onboarding/OnboardingPage'
import { DashboardPage } from './features/dashboard/DashboardPage'
import { LogPage } from './features/log/LogPage'
import { PlanPage } from './features/plan/PlanPage'
import { WeeklySummaryPage } from './features/weekly/WeeklySummaryPage'
import { ProfilePage } from './features/profile/ProfilePage'
import { HistoryPage } from './features/history/HistoryPage'
import { NotificationsPage } from './features/nudges/NotificationsPage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppShell />}>
          <Route path="/" element={<LandingPage />} />
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/onboarding" element={<OnboardingPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/log" element={<LogPage />} />
          <Route path="/plan" element={<PlanPage />} />
          <Route path="/weekly" element={<WeeklySummaryPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="/notifications" element={<NotificationsPage />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
