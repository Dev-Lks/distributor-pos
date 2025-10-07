'use client'

import { useState } from 'react'
import { Button } from './button'
import { cn } from '@/lib/utils'

interface RippleEffect {
  x: number
  y: number
  id: number
}

interface RippleButtonProps extends React.ComponentPropsWithoutRef<typeof Button> {
  children: React.ReactNode
}

export function RippleButton({ children, onClick, className, ...props }: RippleButtonProps) {
  const [ripples, setRipples] = useState<RippleEffect[]>([])

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    const button = e.currentTarget
    const rect = button.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    
    const newRipple: RippleEffect = { x, y, id: Date.now() }
    setRipples(prev => [...prev, newRipple])
    
    // Remove ripple após animação
    setTimeout(() => {
      setRipples(prev => prev.filter(r => r.id !== newRipple.id))
    }, 600)
    
    onClick?.(e)
  }

  return (
    <Button 
      {...props} 
      onClick={handleClick} 
      className={cn("relative overflow-hidden", className)}
    >
      {ripples.map(ripple => (
        <span
          key={ripple.id}
          className="absolute rounded-full bg-white/30 animate-ripple pointer-events-none"
          style={{
            left: ripple.x,
            top: ripple.y,
            width: 0,
            height: 0,
          }}
        />
      ))}
      {children}
    </Button>
  )
}
