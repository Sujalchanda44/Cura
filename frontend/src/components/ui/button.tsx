import * as React from "react"
import { cn } from "@/lib/utils"

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
  size?: 'default' | 'sm' | 'lg' | 'icon'
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
          {
            'bg-[#134E2F] text-white hover:bg-[#0E3B23] shadow-md shadow-[#134E2F]/20 hover:shadow-lg transition-all active:scale-[0.98] font-bold': variant === 'default',
            'bg-[#FF6554] text-white hover:bg-[#E54B3A]': variant === 'destructive',
            'border border-slate-200 bg-white text-slate-800 hover:bg-[#C1F3BA]/20 hover:border-[#C1F3BA]': variant === 'outline',
            'bg-[#C1F3BA] text-[#134E2F] hover:bg-[#ADE8A5] font-bold shadow-sm shadow-[#C1F3BA]/30': variant === 'secondary',
            'hover:bg-slate-100 hover:text-slate-900': variant === 'ghost',
            'text-[#134E2F] underline-offset-4 hover:underline font-semibold': variant === 'link',
            'h-10 px-4 py-2': size === 'default',
            'h-9 rounded-md px-3': size === 'sm',
            'h-11 rounded-md px-8 text-base': size === 'lg',
            'h-10 w-10': size === 'icon',
          },
          className
        )}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button }
