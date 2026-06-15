import { PageWrapper } from "../components/layout/PageWrapper";
import { Breadcrumbs } from "../components/common/Breadcrumbs";

export function About() {
  return (
    <PageWrapper>
      <Breadcrumbs current="About" />

      <section class="script-section">
        <div class="h2">Profile</div>
        <div class="h1-caps">About</div>
      </section>
    </PageWrapper>
  );
}
