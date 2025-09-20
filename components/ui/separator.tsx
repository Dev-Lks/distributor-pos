import React from 'react'

export const Separator = ({ className = '' }: { className?: string }) => (
  <div className={`w-full h-px bg-border my-2 ${className}`} />
)

export default Separator
