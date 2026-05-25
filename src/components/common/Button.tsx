import type { ComponentChildren } from 'preact'

// Phase 2: full implementation
interface Props {
  children: ComponentChildren
  href?: string
  onClick?: () => void
  variant?: 'primary' | 'ghost' | 'outline'
}

export function Button({ children, href, onClick, variant = 'primary' }: Props) {
  if (href) {
    return <a href={href} class={`btn btn--${variant}`}>{children}</a>
  }
  return (
    <button type="button" onClick={onClick} class={`btn btn--${variant}`}>
      {children}
    </button>
  )
}
