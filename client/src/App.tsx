import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from './lib/auth'
import { PageLoader } from './components/ui/PageLoader'

const HomePage = lazy(() => import('./pages/HomePage'))
const SignInPage = lazy(() => import('./pages/SignInPage'))
const SignUpPage = lazy(() => import('./pages/SignUpPage'))
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage'))
const ResetPasswordPage = lazy(() => import('./pages/ResetPasswordPage'))
const DashboardPage = lazy(() => import('./pages/DashboardPage'))
const ProfilePage = lazy(() => import('./pages/ProfilePage'))
const CampusNewsPage = lazy(() => import('./pages/hubs/CampusNewsPage'))
const AspirantPage = lazy(() => import('./pages/hubs/AspirantPage'))
const SiwesPage = lazy(() => import('./pages/hubs/SiwesPage'))
const AcademicHubPage = lazy(() => import('./pages/hubs/AcademicHubPage'))
const FinalYearPage = lazy(() => import('./pages/hubs/FinalYearPage'))
const KnowYourSchoolPage = lazy(() => import('./pages/hubs/KnowYourSchoolPage'))

/** Blocks a route until the session has been restored from the refresh cookie. */
function RequireAuth({ children }: { children: React.ReactElement }) {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) return <PageLoader label="Restoring your session…" />
  if (!isAuthenticated) return <Navigate to="/signin" replace />
  return children
}

export default function App() {
  return (
    <Suspense fallback={<PageLoader label="Loading Talma…" />}>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/signup" element={<SignUpPage />} />
        <Route path="/signin" element={<SignInPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route
          path="/mycamp"
          element={
            <RequireAuth>
              <DashboardPage />
            </RequireAuth>
          }
        />
        <Route
          path="/myprofile"
          element={
            <RequireAuth>
              <ProfilePage />
            </RequireAuth>
          }
        />
        <Route path="/hubs/campus-news" element={<CampusNewsPage />} />
        <Route path="/hubs/aspirant" element={<AspirantPage />} />
        <Route path="/hubs/siwes" element={<SiwesPage />} />
        <Route path="/hubs/academic" element={<AcademicHubPage />} />
        <Route path="/hubs/final-year" element={<FinalYearPage />} />
        <Route path="/hubs/know-your-school" element={<KnowYourSchoolPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  )
}
