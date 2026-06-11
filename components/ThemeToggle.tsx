'use client'

import { Moon, Sun } from 'lucide-react'
import { useTheme } from './ThemeProvider'

export default function ThemeToggle() {
  const { theme, toggle } = useTheme()

  return (
    <button
      onClick={toggle}
      aria-label="Cambiar tema"
      className="flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
    >
      {theme === 'dark' ? (
        <>
          <Sun className="w-3.5 h-3.5" />
          Claro
        </>
      ) : (
        <>
          <Moon className="w-3.5 h-3.5" />
          Oscuro
        </>
      )}
    </button>
  )
}
