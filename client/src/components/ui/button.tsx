import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'

import { cn } from '@/lib/utils'

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  asChild?: boolean
  variant?: 'primary' | 'secondary' | 'ghost'
}

export function Button({ className, variant = 'primary', asChild, ...props }: ButtonProps) {
  const Comp: any = asChild ? Slot : 'button'
  const base =
    'inline-flex items-center justify-center rounded-control text-sm shadow-subtle transition-colors disabled:opacity-50 disabled:pointer-events-none'
  const variants: Record<string, string> = {
    primary: 'h-11 bg-brand-primary px-5 font-medium text-white hover:bg-brand-primary/95',
    secondary: 'h-11 bg-brand-warning px-5 font-medium text-white hover:bg-brand-warning/95',
    ghost: 'h-10 border border-brand-border bg-white px-4 text-brand-dark hover:bg-brand-bg',
  }
  return <Comp className={cn(base, variants[variant], className)} {...props} />
}
