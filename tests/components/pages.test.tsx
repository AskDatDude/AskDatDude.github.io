import { fireEvent, render, screen, waitFor, within } from "@testing-library/preact";
import { beforeEach, describe, expect, it, mock } from "../test-api.ts";
import { About } from "../../src/pages/About";
import { Home } from "../../src/pages/Home";
import { NotFound } from "../../src/pages/NotFound";
import { Tools } from "../../src/pages/Tools";
import { Work } from "../../src/pages/Work";
import { WorkDetail } from "../../src/pages/WorkDetail";
import { Writing } from "../../src/pages/Writing";
import { WritingDetail } from "../../src/pages/WritingDetail";
import { jsonResponse, textResponse } from "../helpers";

const projects = [
  {
    id: "002",
    slug: "new-project",
    title: "New Project",
    subtitle: "Current",
    summary: "Modern security work",
    date: "02.01.2026",
    image: "/projects/new.webp",
    imageAlt: "New project image",
    category: "security",
    type: "personal",
    featured: true,
  },
  {
    id: "001",
    slug: "old-project",
    title: "Old Project",
    subtitle: "Archive",
    summary: "Infrastructure work",
    date: "01.01.2024",
    image: "/projects/old.webp",
    imageAlt: "Old project image",
    category: "infrastructure",
    type: "academic",
    featured: false,
  },
];

const entries = [
  {
    slug: "new-entry",
    title: "New Entry",
    date: "03.02.2026",
    id: "COURSE-2",
    summary: "Security report",
    tags: ["COURSE-2", "Security"],
  },
  {
    slug: "old-entry",
    title: "Old Entry",
    date: "01.01.2024",
    id: "COURSE-1",
    summary: "Linux report",
    tags: ["COURSE-1", "Linux"],
  },
];

beforeEach(() => {
  window.history.replaceState(null, "", "/");
  document.title = "Tests";
});

function mockFetch(
  implementation: (input: RequestInfo | URL) => Promise<Response>,
) {
  globalThis.fetch = mock(implementation) as typeof fetch;
}

describe("page behavior", () => {
  it("renders homepage data dynamically and handles markdown reading times", async () => {
    mockFetch((input: RequestInfo | URL) => {
        const url = String(input);
        if (url === "/projects/index.json") return Promise.resolve(jsonResponse(projects));
        if (url === "/writing/index.json") return Promise.resolve(jsonResponse(entries));
        if (url.startsWith("/writing/entries/")) {
          return Promise.resolve(textResponse(Array(180).fill("word").join(" ")));
        }
        return Promise.resolve(textResponse("", 404));
      });

    render(<Home />);
    expect(await screen.findByText("New Project")).toBeInTheDocument();
    expect(await screen.findByText("New Entry")).toBeInTheDocument();
    expect((await screen.findAllByText("~2 min read")).length).toBeGreaterThan(0);
    expect(screen.getByRole("link", { name: "View work" })).toHaveAttribute(
      "href",
      "/work",
    );
  });

  it("filters, sorts, clears, and updates Work query parameters", async () => {
    window.history.replaceState(null, "", "/work");
    mockFetch(() => Promise.resolve(jsonResponse(projects)));
    render(<Work />);

    await screen.findByText("New Project");
    expect(screen.getByText("02")).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Old project image" })).toHaveAttribute(
      "src",
      "/projects/old.webp",
    );

    fireEvent.click(screen.getByRole("button", { name: "Show list layout" }));
    expect(screen.getByRole("button", { name: "Show grid layout" })).toBeInTheDocument();

    fireEvent.input(screen.getByPlaceholderText("Search projects"), {
      target: { value: "Old Project" },
    });
    await waitFor(() => expect(screen.queryByText("New Project")).not.toBeInTheDocument());
    expect(screen.getByText("Old Project")).toBeInTheDocument();
    expect(window.location.search).toContain("q=Old+Project");

    fireEvent.click(screen.getByRole("button", { name: "Clear all" }));
    await screen.findByText("New Project");

    fireEvent.change(screen.getByLabelText("Sort"), { target: { value: "title" } });
    expect(window.location.search).toContain("sort=title");

    const categoryFacet = screen.getByRole("group", { name: "Category" });
    const securityLabel = within(categoryFacet).getByText("Security").closest("label");
    fireEvent.click(within(securityLabel!).getByRole("checkbox"));
    await waitFor(() => expect(screen.queryByText("Old Project")).not.toBeInTheDocument());
    expect(window.location.search).toContain("category=security");
  });

  it("filters Writing by search and facets and calculates reading lengths", async () => {
    window.history.replaceState(null, "", "/writing");
    mockFetch((input: RequestInfo | URL) => {
        const url = String(input);
        if (url === "/writing/index.json") return Promise.resolve(jsonResponse(entries));
        const wordCount = url.includes("new-entry") ? 1700 : 100;
        return Promise.resolve(textResponse(Array(wordCount).fill("word").join(" ")));
      });
    render(<Writing />);

    await screen.findByText("New Entry");
    fireEvent.input(screen.getByPlaceholderText("Search writing"), {
      target: { value: "Linux" },
    });
    await waitFor(() => expect(screen.queryByText("New Entry")).not.toBeInTheDocument());
    expect(screen.getByText("Old Entry")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Clear all" }));
    const longLabel = await screen.findByText("Long");
    fireEvent.click(within(longLabel.closest("label")!).getByRole("checkbox"));
    await waitFor(() => expect(screen.queryByText("Old Entry")).not.toBeInTheDocument());
    expect(screen.getByText("New Entry")).toBeInTheDocument();
  });

  it("renders Tools, About, and NotFound pages", async () => {
    mockFetch(() =>
        Promise.resolve(
          jsonResponse([
            { id: "tool", title: "Dynamic Tool", description: "Useful", url: "/tool" },
          ]),
        ),
      );
    const toolsRender = render(<Tools />);
    expect(await screen.findByRole("link", { name: /Dynamic Tool/ })).toHaveAttribute(
      "href",
      "/tool",
    );
    toolsRender.unmount();

    render(<About />);
    expect(screen.getAllByText("About")).toHaveLength(2);

    window.history.replaceState(null, "", "/missing");
    render(<NotFound />);
    expect(screen.getByRole("heading", { name: "Page not found." })).toBeInTheDocument();
  });

  it("renders project details and rejects unsafe project slugs", async () => {
    const raw = `<!--- metadata
title: Detailed Project
summary: Project summary
tools: ["Deno", "Vite"]
buttons: [{"text":"Source","url":"https://example.com"}]
--->
## Overview
Body`;
    mockFetch(() => Promise.resolve(textResponse(raw)));
    const detail = render(<WorkDetail slug="safe-project" />);
    expect(await screen.findByRole("heading", { name: "Detailed Project" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Source" })).toHaveAttribute(
      "target",
      "_blank",
    );
    expect(document.title).toBe("Detailed Project - Robin Niinemets");
    detail.unmount();

    render(<WorkDetail slug="../unsafe" />);
    expect(screen.getByText("Invalid project slug.")).toBeInTheDocument();
  });

  it("renders writing details and reports missing entries", async () => {
    const raw = `<!--- metadata
title: Detailed Entry
date: 01.01.2026
week: Week 1
--->
## Overview
Body`;
    mockFetch(() => Promise.resolve(textResponse(raw)));
    const detail = render(<WritingDetail slug="safe-entry" />);
    expect(await screen.findByRole("heading", { name: "Detailed Entry" })).toBeInTheDocument();
    expect(screen.getByText("Week 1")).toBeInTheDocument();
    expect(document.title).toBe("Detailed Entry - Robin Niinemets");
    detail.unmount();

    mockFetch(() => Promise.resolve(textResponse("", 404)));
    render(<WritingDetail slug="missing-entry" />);
    expect(await screen.findByText("Writing entry not found.")).toBeInTheDocument();
  });
});
