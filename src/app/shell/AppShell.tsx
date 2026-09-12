import { Outlet } from 'react-router'
import { BottomNav } from './BottomNav'
import { SideRail } from './SideRail'
import { TopBar } from './TopBar'

export function AppShell() {
  return (
    <div className="flex h-dvh overflow-hidden bg-bg">
      <SideRail />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar />
        <main className="min-h-0 flex-1 overflow-y-auto">
          <Outlet />
        </main>
        <BottomNav />
      </div>
    </div>
  )
}
