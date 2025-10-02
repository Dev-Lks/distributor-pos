'use client'

import { Palette } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export function SimpleDropdownTest() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon">
          <Palette className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem onClick={() => alert('Item 1 clicked')}>
          Item 1
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => alert('Item 2 clicked')}>
          Item 2
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => alert('Item 3 clicked')}>
          Item 3
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
