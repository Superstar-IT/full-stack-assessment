import { AppFooter } from './components/layout/AppFooter'
import { AppHeader } from './components/layout/AppHeader'
import { TripPlannerPage } from './pages/TripPlannerPage'
import './App.css'

export default function App() {
  return (
    <div className="app">
      <AppHeader />
      <TripPlannerPage />
      <AppFooter />
    </div>
  )
}
