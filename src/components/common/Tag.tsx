import "./Tag.css";

interface Props {
  label: string;
}

export function Tag({ label }: Props) {
  return <span class="tag">{label}</span>;
}
