import React from 'react'

export const Input = (props: React.InputHTMLAttributes<HTMLInputElement> & { className?: string }) => {
  const { className = '', ...rest } = props
  return <input {...rest} className={`border px-2 py-1 rounded ${className}`} />
}

export default Input
