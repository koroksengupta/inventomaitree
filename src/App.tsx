// Which screen shows for which address.
// We use HashRouter (addresses like .../inventomaitree/#/connection) because
// GitHub Pages cannot send every address to index.html. With the # part, a
// refresh or shared link always loads the app first, then the right screen.
import { HashRouter, Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import ConnectionTest from './pages/ConnectionTest'
import Home from './pages/Home'

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="connection" element={<ConnectionTest />} />
          {/* Unknown address: show the home screen instead of a blank page */}
          <Route path="*" element={<Home />} />
        </Route>
      </Routes>
    </HashRouter>
  )
}
