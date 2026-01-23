import { useState } from 'react'
import { Sidebar } from './Sidebar'
import { Outlet } from 'react-router-dom'
import { useKeyboardShortcut } from '../../../hooks/useKeyboardShortcut'

function AppLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  useKeyboardShortcut(
    'b',
    () => {
      setSidebarCollapsed((prev) => !prev)
    },
    { ctrlKey: true }
  )

  return (
    <div className="flex h-full w-full overflow-hidden text-foreground">
      <Sidebar collapsed={sidebarCollapsed} onCollapsedChange={setSidebarCollapsed} />

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <div className="flex-1 overflow-auto bg-background">
          <Outlet />
        </div>
      </main>
    </div>
  )
}

export default AppLayout
