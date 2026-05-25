import type { ComponentChildren } from 'preact'

// Phase 2: full implementation
interface Props {
  children: ComponentChildren
}

export function PageWrapper({ children }: Props) {
  return <main>{children}</main>
}
