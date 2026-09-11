import { Routes, Route } from 'react-router'
import { ROUTES } from './routes'
import NotFoundPage from './pages/NotFoundPage'
import { FxProvider } from './fx/FxProvider'
import { CrtFrame } from './fx/CrtFrame'

export default function App() {
  return (
    <FxProvider>
      <CrtFrame>
        <Routes>
          {ROUTES.map((route) => (
            <Route key={route.path} path={route.path} element={route.element} />
          ))}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </CrtFrame>
    </FxProvider>
  )
}
