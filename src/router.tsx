import { createBrowserRouter, Navigate } from 'react-router-dom'
import { RequireAuth } from './components/RequireAuth'
import { AppShell } from './layouts/AppShell'
import { AdminDashboardPage } from './pages/AdminDashboardPage'
import { CatalogPage } from './pages/CatalogPage'
import { LoginPage } from './pages/LoginPage'
import { NotFoundPage } from './pages/NotFoundPage'
import { SurveySubmissionsPage } from './pages/SurveySubmissionsPage'
import { StudentSurveyPage } from './pages/StudentSurveyPage'
import { UserManagementPage } from './pages/UserManagementPage'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Navigate to="/login" replace />,
  },
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/app',
    element: (
      <RequireAuth>
        <AppShell />
      </RequireAuth>
    ),
    children: [
      {
        path: 'admin/dashboard',
        element: (
          <RequireAuth allowedRoles={['ADMIN']}>
            <AdminDashboardPage />
          </RequireAuth>
        ),
      },
      {
        path: 'admin/catalogos',
        element: <Navigate to="/app/admin/catalogos/niveles" replace />,
      },
      {
        path: 'admin/catalogos/:gestion',
        element: (
          <RequireAuth allowedRoles={['ADMIN']}>
            <CatalogPage />
          </RequireAuth>
        ),
      },
      {
        path: 'admin/usuarios',
        element: <Navigate to="/app/admin/usuarios/estudiantes" replace />,
      },
      {
        path: 'admin/usuarios/:gestion',
        element: (
          <RequireAuth allowedRoles={['ADMIN']}>
            <UserManagementPage />
          </RequireAuth>
        ),
      },
      {
        path: 'admin/submissions',
        element: (
          <RequireAuth allowedRoles={['ADMIN']}>
            <SurveySubmissionsPage />
          </RequireAuth>
        ),
      },
      {
        path: 'student/encuesta',
        element: (
          <RequireAuth allowedRoles={['ESTUDIANTE']}>
            <StudentSurveyPage />
          </RequireAuth>
        ),
      },
    ],
  },
  {
    path: '*',
    element: <NotFoundPage />,
  },
])