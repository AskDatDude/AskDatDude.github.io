// Phase 2: full implementation
interface Props {
  label: string
}

export function Tag({ label }: Props) {
  return <span>{label}</span>
}
