import React from 'react'
import { Button } from '@/components/ui/button'
import { Moon, Sun } from 'lucide-react'

interface ThemeToggleProps {
  theme: 'light' | 'dark'
  toggleTheme: () => void
}

export function ThemeToggle({ theme, toggleTheme }: ThemeToggleProps) {
  return (
    <Button onClick={toggleTheme} variant="outline" size="icon">
      {theme === 'light' ? <Moon className="h-[1.2rem] w-[1.2rem]" /> : <Sun className="h-[1.2rem] w-[1.2rem]" />}
    </Button>
  )
}
