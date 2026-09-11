import { Routes, Route } from 'react-router'
import { ROUTES } from './routes'
import NotFoundPage from './pages/NotFoundPage'

export default function App() {
  return (
    <Routes>
      {ROUTES.map((route) => (
        <Route key={route.path} path={route.path} element={route.element} />
      ))}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}
