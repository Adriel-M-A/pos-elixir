import { cn } from '@/lib/utils'
import { ScrollArea } from '@/components/ui/scroll-area'
import { NavLink } from 'react-router-dom'
import { useTheme } from 'next-themes'
import { ChevronLeft, ChevronRight, LogOut, Users, Settings, Sun, Moon } from 'lucide-react'
import { Separator } from '@ui/separator'
import { Button } from '@ui/button'
import { Avatar, AvatarFallback } from '@ui/avatar'
import { menuConfig } from './menu'
import logo from '@/assets/logo.png'
import { useAuth } from '@/modules/auth/context/AuthContext'
import { useEffect, useState } from 'react'
import type { AppConfig } from '@shared/types'

interface SidebarProps {
  collapsed?: boolean
  onCollapsedChange?: (collapsed: boolean) => void
}

export function Sidebar({ collapsed = false, onCollapsedChange }: SidebarProps) {
  const { user, logout, can } = useAuth()
  const { theme, setTheme } = useTheme()
  const [enableUserManagement, setEnableUserManagement] = useState(false)

  useEffect(() => {
    window.api.invoke<AppConfig>('auth:get-config').then((config) => {
      setEnableUserManagement(config.ENABLE_USER_MANAGEMENT)
    })
  }, [])

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <aside
      className={cn(
        'flex flex-col bg-sidebar border-r border-border transition-all duration-300 ease-in-out',
        collapsed ? 'w-16' : 'w-60'
      )}
    >
      {/* Header */}
      <div className={cn('h-20 flex items-center transition-all justify-between', collapsed ? 'px-2 justify-center' : 'px-4')}>
        <div className={cn('flex items-center', collapsed ? 'justify-center w-full' : 'gap-3')}>
          <div className="h-9 w-9 shrink-0 transition-transform duration-300 hover:scale-105">
            <img src={logo} alt="Control POS" className="w-full h-full object-contain" />
          </div>
          {!collapsed && (
            <div className="flex flex-col overflow-hidden animate-in fade-in slide-in-from-left-1 duration-300">
              <span className="font-bold text-sm tracking-tight text-foreground leading-none">
                Control POS
              </span>
              <span className="text-[10px] font-medium text-muted-foreground mt-1 tracking-wide uppercase">
                Punto de Venta
              </span>
            </div>
          )}
        </div>
        {!collapsed && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onCollapsedChange?.(!collapsed)}
            className="h-8 w-8 text-muted-foreground/50 hover:text-foreground"
            title="Contraer sidebar"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
        )}
      </div>

      {collapsed && (
        <div className='flex justify-center mb-2'>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onCollapsedChange?.(!collapsed)}
            className="h-8 w-8 text-muted-foreground/50 hover:text-foreground"
            title="Expandir sidebar"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}



      <Separator className="mx-4 w-auto bg-border" />

      {/* Navegación */}
      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="space-y-1">
          {menuConfig
            .filter(item => !item.permission || can(item.permission))
            .map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  cn(
                    'group flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-all relative',
                    isActive
                      ? 'bg-secondary text-primary shadow-sm'
                      : 'text-muted-foreground hover:bg-secondary/20 hover:text-foreground'
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <item.icon
                      className={cn(
                        'h-5 w-5 shrink-0',
                        isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'
                      )}
                    />
                    {!collapsed && (
                      <>
                        <span className="flex-1 truncate">{item.label}</span>
                        {isActive && <ChevronRight className="h-3 w-3 opacity-50" />}
                      </>
                    )}
                    {isActive && <div className="absolute left-0 w-1 h-5 bg-primary rounded-r-full" />}
                  </>
                )}
              </NavLink>
            ))}

        </nav>
      </ScrollArea>

      {/* Footer / Toggle / Logout */}
      {/* Footer */}
      <div className="p-3 border-t border-border space-y-3">
        {/* Admin Links Group */}
        {/* Admin Links Group */}
        {user?.role === 'ADMIN' && (
          <div className='space-y-1'>
            {enableUserManagement && (
              <NavLink
                to="/users"
                className={({ isActive }) =>
                  cn(
                    'group flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-all relative',
                    isActive
                      ? 'bg-secondary text-primary shadow-sm'
                      : 'text-muted-foreground hover:bg-secondary/20 hover:text-foreground'
                  )
                }
                title="Gestión de Usuarios"
              >
                {({ isActive }) => (
                  <>
                    <Users
                      className={cn(
                        'h-5 w-5 shrink-0',
                        isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'
                      )}
                    />
                    {!collapsed && (
                      <>
                        <span className="flex-1 truncate">Usuarios</span>
                        {isActive && <ChevronRight className="h-3 w-3 opacity-50" />}
                      </>
                    )}
                    {isActive && <div className="absolute left-0 w-1 h-5 bg-primary rounded-r-full" />}
                  </>
                )}
              </NavLink>
            )}

            <NavLink
              to="/configuracion"
              className={({ isActive }) =>
                cn(
                  'group flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-all relative',
                  isActive
                    ? 'bg-secondary text-primary shadow-sm'
                    : 'text-muted-foreground hover:bg-secondary/20 hover:text-foreground'
                )
              }
              title="Configuración"
            >
              {({ isActive }) => (
                <>
                  <Settings
                    className={cn(
                      'h-5 w-5 shrink-0',
                      isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'
                    )}
                  />
                  {!collapsed && (
                    <>
                      <span className="flex-1 truncate">Configuración</span>
                      {isActive && <ChevronRight className="h-3 w-3 opacity-50" />}
                    </>
                  )}
                  {isActive && <div className="absolute left-0 w-1 h-5 bg-primary rounded-r-full" />}
                </>
              )}
            </NavLink>
            <Separator className="my-2 bg-border/50" />
          </div>
        )}

        {/* Theme Toggle */}
        <Button
          variant="ghost"
          size={collapsed ? "icon" : "sm"}
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className={cn(
            'w-full justify-start text-muted-foreground hover:text-foreground transition-all',
            collapsed && 'justify-center px-0'
          )}
          title={theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
        >
          {theme === 'dark' ? <Sun className={cn("h-5 w-5", !collapsed && "mr-3")} /> : <Moon className={cn("h-5 w-5", !collapsed && "mr-3")} />}
          {!collapsed && <span className="truncate">{theme === 'dark' ? 'Modo Claro' : 'Modo Oscuro'}</span>}
        </Button>

        {enableUserManagement && user && <Separator className="bg-border/50" />}

        {/* User Profile & Logout */}
        {enableUserManagement && user ? (
          <div className={cn("flex items-center gap-2", collapsed ? "flex-col justify-center" : "justify-between")}>
            <div className={cn("flex items-center gap-3 overflow-hidden", collapsed && "justify-center")}>
              <Avatar className="h-8 w-8 border border-border">

                <AvatarFallback className="text-[10px] bg-primary text-primary-foreground font-medium">
                  {getInitials(user.name)}
                </AvatarFallback>
              </Avatar>

              {!collapsed && (
                <div className="flex flex-col min-w-0">
                  <span className="text-sm font-medium truncate leading-none">{user.name}</span>
                </div>
              )}
            </div>

            <Button
              variant="ghost"
              size="icon"
              onClick={logout}
              className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
              title="Cerrar Sesión"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        ) : null}
      </div>
    </aside >
  )
}
