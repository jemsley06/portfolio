import type { ReactElement } from 'react'
import HomePage from './pages/HomePage'
import PilotPage from './pages/PilotPage'
import ProjectsPage from './pages/ProjectsPage'
import ResumePage from './pages/ResumePage'

export type Route = {
  path: string
  label: string
  element: ReactElement
}

export const ROUTES: Route[] = [
  { path: '/', label: 'HOME', element: <HomePage /> },
  { path: '/pilot', label: 'PILOT', element: <PilotPage /> },
  { path: '/projects', label: 'PROJECTS', element: <ProjectsPage /> },
  { path: '/resume', label: 'RESUME', element: <ResumePage /> },
]
