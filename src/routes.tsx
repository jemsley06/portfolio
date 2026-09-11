import type { ReactElement } from 'react'
import HomePage from './pages/HomePage'
import PilotPage from './pages/PilotPage'
import ProjectsPage from './pages/ProjectsPage'
import ResumePage from './pages/ResumePage'

export type Route = {
  path: string
  label: string
  kanji: string
  element: ReactElement
}

export const ROUTES: Route[] = [
  { path: '/', label: 'HOME', kanji: '本部', element: <HomePage /> },
  { path: '/pilot', label: 'PILOT', kanji: '操縦者', element: <PilotPage /> },
  {
    path: '/projects',
    label: 'PROJECTS',
    kanji: '作戦記録',
    element: <ProjectsPage />,
  },
  {
    path: '/resume',
    label: 'RESUME',
    kanji: '人事記録',
    element: <ResumePage />,
  },
]
