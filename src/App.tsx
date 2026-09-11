import { Routes, Route } from 'react-router'
import { ROUTES } from './routes'
import NotFoundPage from './pages/NotFoundPage'
import { FxProvider } from './fx/FxProvider'
import { CrtFrame } from './fx/CrtFrame'
/* DEV ONLY — the `/kit` primitive gallery. Kept out of `ROUTES` so it never
   reaches the nav, and dropped from production builds by the `DEV` guard
   below. Task 17 deletes this import, the route and the page. */
import DevKitPage from './pages/DevKitPage'

export default function App() {
  return (
    <FxProvider>
      <CrtFrame>
        <Routes>
          {ROUTES.map((route) => (
            <Route key={route.path} path={route.path} element={route.element} />
          ))}
          {import.meta.env.DEV && (
            <Route path="/kit" element={<DevKitPage />} />
          )}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </CrtFrame>
    </FxProvider>
  )
}
