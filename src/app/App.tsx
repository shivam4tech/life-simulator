import { Routes, Route } from 'react-router'
import { AppShell } from './shell/AppShell'
import { LandingPage } from '@/features/landing/LandingPage'
import { MyLifePage } from '@/features/profile/MyLifePage'
import { AssumptionsPage } from '@/features/assumptions/AssumptionsPage'
import { OnboardingPage } from '@/features/onboarding/OnboardingPage'
import { SimulationPage } from '@/features/futures/SimulationPage'
import { PlaceholderPage } from '@/features/placeholder/PlaceholderPage'

export function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<LandingPage />} />
        <Route path="/my-life" element={<MyLifePage />} />
        <Route path="/assumptions" element={<AssumptionsPage />} />
        <Route path="/create" element={<OnboardingPage />} />
        <Route path="/futures" element={<SimulationPage />} />
        <Route
          path="/timeline"
          element={
            <PlaceholderPage
              title="Life timeline"
              sprint={4}
              description="A horizontally explorable timeline of your simulated lives — events, turning points and scrubbing through the years."
            />
          }
        />
        <Route
          path="/scenario-lab"
          element={
            <PlaceholderPage
              title="Scenario Lab"
              sprint={6}
              description="Career changes, retraining, business starts and counterfactual branches — compared against your baseline with real distributions."
            />
          }
        />
        <Route path="*" element={<PlaceholderPage title="Not found" />} />
      </Route>
    </Routes>
  )
}
