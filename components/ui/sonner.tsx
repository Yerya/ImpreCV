'use client'

import type { CSSProperties } from 'react'
import { useTheme } from 'next-themes'
import { Toaster as Sonner, type ToasterProps } from 'sonner'

const Toaster = ({ toastOptions, ...props }: ToasterProps) => {
  const { theme = 'system' } = useTheme()

  const mergedToastOptions: ToasterProps['toastOptions'] = {
    ...toastOptions,
    classNames: {
      ...(toastOptions?.classNames ?? {}),
      toast: ['glass-chrome', 'backdrop-blur-xl', 'backdrop-saturate-125', toastOptions?.classNames?.toast]
        .filter(Boolean)
        .join(' '),
    },
  }

  return (
    <Sonner
      theme={theme as ToasterProps['theme']}
      className="toaster group"
      toastOptions={mergedToastOptions}
      style={
        {
          '--normal-bg': 'var(--popover)',
          '--normal-text': 'var(--popover-foreground)',
          '--normal-border': 'var(--border)',
        } as CSSProperties
      }
      {...props}
    />
  )
}

export { Toaster }
