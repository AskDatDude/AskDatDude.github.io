import type { ComponentChildren } from "preact";
import "./ReadingIntro.css";

export type ReadingIntroItem = {
  label: string;
  values: string[];
};

interface ReadingIntroProps {
  title: string;
  subtitle?: string;
  summary?: string;
  info: ReadingIntroItem[];
  actions?: ComponentChildren;
}

export function ReadingIntro({
  title,
  subtitle,
  summary,
  info,
  actions,
}: ReadingIntroProps) {
  return (
    <section class="reading-intro">
      <div>
        <h1 class="big-card-header">{title}</h1>
        {subtitle && <h2 class="h2 reading-intro-subtitle">{subtitle}</h2>}
      </div>

      <div class="reading-intro-details">
        {summary && <p class="paragraph two-columns">{summary}</p>}

        {!!info.length && (
          <div class="short-info">
            {info.map((item) => (
              <div class="group" key={item.label}>
                <h2 class="h2">{item.label}</h2>
                {item.values.map((value, index) => (
                  <p key={`${item.label}-${value}-${index}`} class="paragraph">
                    {value}
                  </p>
                ))}
              </div>
            ))}
          </div>
        )}

        {actions}
      </div>
      <div class="reading-intro-divider line" />
    </section>
  );
}
