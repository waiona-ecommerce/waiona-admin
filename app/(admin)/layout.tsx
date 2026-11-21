import type { ReactNode } from 'react'
import { LogoutButton } from './LogoutButton'
import { Nav } from './Nav'
import { NotificationBell } from './NotificationBell'

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-full flex-col">
      <header className="flex items-center justify-between border-b px-6 py-4">
        <span className="font-semibold">Waiona Admin</span>
        <div className="flex items-center gap-4">
          <NotificationBell />
          <LogoutButton />
        </div>
      </header>
      <div className="flex flex-1">
        <aside className="w-56 shrink-0 border-r p-4">
          <Nav />
        </aside>
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  )
}
