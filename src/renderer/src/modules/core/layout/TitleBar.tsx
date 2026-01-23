import { useState } from 'react'
import { useLocation } from 'react-router-dom'
import { Minus, Square, X, Copy } from 'lucide-react'
import packageJson from '../../../../../../package.json'

export default function TitleBar(): React.ReactElement {
  const [isMaximized, setIsMaximized] = useState(true)
  const location = useLocation()
  const isLogin = location.pathname === '/login'

  const handleMinimize = (): void => {
    window.api.window.minimize()
  }

  const handleMaximize = (): void => {
    window.api.window.maximize()
    setIsMaximized(!isMaximized)
  }

  const handleClose = (): void => {
    window.api.window.close()
  }

  // Estilos dinámicos basados en si es login o no
  const containerClasses = isLogin
    ? "h-8 flex select-none items-center justify-between bg-white text-black titlebar-drag border-b border-gray-200"
    : "h-8 flex select-none items-center justify-between bg-sidebar text-sidebar-foreground titlebar-drag border-b"

  const buttonHover = isLogin
    ? "hover:bg-black/5"
    : "hover:bg-black/10 dark:hover:bg-white/10"

  return (
    <div className={containerClasses}>
      <div className="flex items-center px-4 gap-2">
        <div className="h-3 w-3 rounded-full bg-primary animate-pulse shadow-[0_0_8px_hsl(var(--primary))]" />
        <span className="text-xs font-semibold tracking-wide opacity-90">
          {packageJson.productName} <span className="font-normal opacity-50 ml-1">v{packageJson.version}</span>
        </span>
      </div>

      <div className="flex h-full items-center">
        {/* User Info Section */}


        <div className="flex h-full titlebar-nodrag">
          {/* Minimizar */}
          <button
            onClick={handleMinimize}
            className={`flex h-full w-10 items-center justify-center transition-colors focus:outline-none ${buttonHover}`}
            title="Minimizar"
          >
            <Minus className="h-4 w-4" />
          </button>

          {/* Maximizar / Restaurar - Oculto en Login */}
          {!isLogin && (
            <button
              onClick={handleMaximize}
              className={`flex h-full w-10 items-center justify-center transition-colors focus:outline-none ${buttonHover}`}
              title={isMaximized ? 'Restaurar' : 'Maximizar'}
            >
              {isMaximized ? (
                <Copy className="h-3.5 w-3.5 rotate-180" />
              ) : (
                <Square className="h-3.5 w-3.5" />
              )}
            </button>
          )}

          {/* Cerrar */}
          <button
            onClick={handleClose}
            className="flex h-full w-10 items-center justify-center hover:bg-destructive hover:text-destructive-foreground transition-colors focus:outline-none"
            title="Cerrar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
