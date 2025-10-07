import { Check } from 'lucide-react'

export function SuccessCheck() {
  return (
    <div className="flex items-center justify-center">
      <div className="animate-[success-check_0.6s_cubic-bezier(0.4,0,0.2,1)]">
        <div className="flex items-center justify-center h-16 w-16 rounded-full bg-green-500">
          <Check className="h-8 w-8 text-white animate-[check-mark_0.4s_0.2s_cubic-bezier(0.4,0,0.2,1)_forwards] opacity-0" strokeWidth={3} />
        </div>
      </div>
    </div>
  )
}
