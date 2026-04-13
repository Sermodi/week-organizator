'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Calendar, Layers, History, Settings, LogOut, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import { logout } from '@/lib/actions/auth.actions'

const navItems = [
  { href: '/dashboard', icon: Sparkles, label: 'Esta semana' },
  { href: '/areas', icon: Layers, label: 'Áreas' },
  { href: '/history', icon: History, label: 'Historial' },
  { href: '/settings', icon: Settings, label: 'Ajustes' },
]

export function Sidebar() {
  const pathname = usePathname()
  return (
    <aside className="w-56 shrink-0 flex flex-col bg-zinc-900 border-r border-zinc-800 min-h-screen">
      <div className="p-4 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-violet-600 flex items-center justify-center">
            <Calendar className="w-4 h-4 text-white" />
          </div>
          <span className="font-semibold text-white text-sm">WeekOrganizator</span>
        </div>
      </div>
      <nav className="flex-1 p-3 space-y-0.5">
        {navItems.map(({ href, icon: Icon, label }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors',
              pathname.startsWith(href)
                ? 'bg-violet-600/20 text-violet-300'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
            )}
          >
            <Icon className="w-4 h-4" />
            {label}
          </Link>
        ))}
      </nav>
      <div className="p-3 border-t border-zinc-800">
        <form action={logout}>
          <button
            type="submit"
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Cerrar sesión
          </button>
        </form>
      </div>
    </aside>
  )
}
