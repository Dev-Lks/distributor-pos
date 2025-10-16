"use client"

import * as React from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { 
  Drawer, 
  DrawerContent, 
  DrawerHeader, 
  DrawerTitle, 
  DrawerDescription,
  DrawerBody,
  DrawerFooter,
} from '@/components/ui/drawer'
import { useIsMobile } from '@/hooks/useMediaQuery'
import { cn } from "@/lib/utils"

interface ResponsiveDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title?: string
  description?: string
  children: React.ReactNode
  className?: string
  footer?: React.ReactNode
}

export function ResponsiveDialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  className,
  footer,
}: ResponsiveDialogProps) {
  const isMobile = useIsMobile()

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className={className}>
          {(title || description) && (
            <DrawerHeader>
              {title && <DrawerTitle>{title}</DrawerTitle>}
              {description && <DrawerDescription>{description}</DrawerDescription>}
            </DrawerHeader>
          )}
          
          <DrawerBody>
            {children}
          </DrawerBody>
          
          {footer && (
            <DrawerFooter>
              {footer}
            </DrawerFooter>
          )}
        </DrawerContent>
      </Drawer>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn("sm:max-w-[500px] max-h-[90vh] flex flex-col", className)}>
        {(title || description) && (
          <DialogHeader className="flex-shrink-0">
            {title && <DialogTitle>{title}</DialogTitle>}
            {description && <DialogDescription>{description}</DialogDescription>}
          </DialogHeader>
        )}
        
        <div className="flex-1 overflow-y-auto py-4">
          {children}
        </div>

        {footer && (
          <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 pt-4 border-t flex-shrink-0">
            {footer}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
