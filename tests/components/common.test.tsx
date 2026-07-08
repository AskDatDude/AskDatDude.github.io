import { fireEvent, render, screen, waitFor } from "@testing-library/preact";
import { describe, expect, it, mock } from "../test-api.ts";
import { BackToTop } from "../../src/components/common/BackToTop";
import { Breadcrumbs } from "../../src/components/common/Breadcrumbs";
import { Button, LinkButton, LoadMoreButton } from "../../src/components/common/Button";
import { Card } from "../../src/components/common/Card";
import { Tag } from "../../src/components/common/Tag";
import { PageWrapper } from "../../src/components/layout/PageWrapper";
import { ReadingLayout } from "../../src/components/reading/ReadingLayout";

describe("shared components", () => {
  it("renders buttons, cards, tags, and breadcrumbs with their behavior", () => {
    const click = mock();
    render(
      <>
        <Breadcrumbs current="Tools" />
        <Button onClick={click}>Run</Button>
        <Button href="/work" variant="ghost">Work</Button>
        <LoadMoreButton onClick={click} />
        <LinkButton href="https://example.com" target="_blank">External</LinkButton>
        <Card href="/writing/example" variant="list">Entry</Card>
        <Tag label="Security" />
      </>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Run" }));
    fireEvent.click(screen.getByRole("button", { name: "Load more" }));
    expect(click).toHaveBeenCalledTimes(2);
    expect(screen.getByRole("link", { name: "Work" })).toHaveClass("btn--ghost");
    expect(screen.getByRole("link", { name: "Entry" })).toHaveAttribute(
      "href",
      "/writing/example",
    );
    expect(screen.getByText("Security")).toHaveClass("tag");
    expect(screen.getByRole("navigation", { name: "Breadcrumb" })).toHaveTextContent(
      "Home/Tools",
    );
  });

  it("reveals PageWrapper after its animation frame", async () => {
    render(<PageWrapper>Visible content</PageWrapper>);
    await waitFor(() =>
      expect(screen.getByRole("main")).toHaveClass("main-content", "visible"),
    );
  });

  it("renders article navigation and table of contents", () => {
    render(
      <ReadingLayout
        backHref="/work"
        backLabel="All work"
        tableOfContents={[{ id: "section", level: 2, text: "Section" }]}
        html={'<h2 id="section">Section</h2><p>Body</p>'}
      />,
    );

    expect(screen.getByRole("link", { name: "← All work" })).toHaveAttribute(
      "href",
      "/work",
    );
    expect(screen.getByRole("complementary", { name: "Table of contents" })).toHaveTextContent(
      "Section",
    );
  });

  it("shows and activates the back-to-top control after scrolling", () => {
    Object.defineProperty(window, "scrollY", { configurable: true, value: 1500 });
    render(<BackToTop variant="project" />);
    const button = screen.getByRole("button", { name: "Back to top" });
    fireEvent.scroll(window);
    expect(button).toHaveClass("visible");
    fireEvent.click(button);
    expect(window.scrollTo).toHaveBeenCalledWith({ top: 0, behavior: "smooth" });
  });
});
