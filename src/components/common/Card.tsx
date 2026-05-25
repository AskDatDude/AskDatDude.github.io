import type { ComponentChildren } from 'preact'

// Phase 2: full implementation
interface Props {
  children: ComponentChildren
  href?: string
}

export function Card({ children, href }: Props) {
  if (href) {
    return <a href={href}>{children}</a>
  }
  return <div>{children}</div>
}
