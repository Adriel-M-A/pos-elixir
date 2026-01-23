import React, { createContext, useContext, useState } from 'react'

interface UIContextType {
  isBlocked: boolean
  blockMessage: string
  setBlocking: (blocked: boolean, message?: string) => void
}

const UIContext = createContext<UIContextType | undefined>(undefined)

export const UIProvider = ({ children }: { children: React.ReactNode }) => {
  const [isBlocked, setIsBlocked] = useState(false)
  const [blockMessage, setBlockMessage] = useState('')

  const setBlocking = (blocked: boolean, message: string = 'Procesando...') => {
    setIsBlocked(blocked)
    setBlockMessage(message)
  }

  return (
    <UIContext.Provider value={{ isBlocked, blockMessage, setBlocking }}>
      {children}
    </UIContext.Provider>
  )
}

export const useUI = () => {
  const context = useContext(UIContext)
  if (!context) throw new Error('useUI debe usarse dentro de un UIProvider')
  return context
}
