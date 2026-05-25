import { useEffect } from 'preact/hooks'

// Static path-to-path legacy redirects (from old 404.html)
const LEGACY_ROUTES: Record<string, string> = {
  '/projects/project.html': '/work',
  '/diary': '/writing',
  '/diary/': '/writing',
  '/diary/index.html': '/writing',
  '/diary/entries/diary.html': '/writing',
  '/toolbox': '/tools',
  '/toolbox/': '/tools',
  '/toolbox/index.html': '/tools',
  '/toolbox/QRcode': '/tools/qr-code-generator/',
  '/toolbox/QRcode/': '/tools/qr-code-generator/',
  '/toolbox/QRcode/index.html': '/tools/qr-code-generator/',
  '/toolbox/image-converter': '/tools/image-converter/',
  '/toolbox/image-converter/': '/tools/image-converter/',
  '/toolbox/image-converter/index.html': '/tools/image-converter/',
}

// Old /school/answers/ paths → new /writing/:slug clean URLs
const SCHOOL_ROUTES: Record<string, string> = {
  '/school/answers/001-1.html': '/writing/SH24-001',
  '/school/answers/002-1.html': '/writing/SH24-002',
  '/school/answers/003-1.html': '/writing/SH24-003',
  '/school/answers/004-1.html': '/writing/SH24-004',
  '/school/answers/005-1.html': '/writing/SH24-005',
  '/school/answers/006-1.html': '/writing/SH24-006',
  '/school/answers/007-1.html': '/writing/SH24-007',
  '/school/answers/008-1.html': '/writing/SH24-008',
}

export function NotFound() {
  useEffect(() => {
    const path = window.location.pathname
    const params = new URLSearchParams(window.location.search)

    // Old query-param project URLs → /work/:slug
    if (path === '/work/project.html') {
      const slug = params.get('project')
      window.location.replace(slug ? `/work/${slug}` : '/work')
      return
    }

    // Old query-param writing entry URLs → /writing/:slug
    if (path === '/writing/entry.html') {
      const slug = params.get('entry')
      window.location.replace(slug ? `/writing/${slug}` : '/writing')
      return
    }

    // Static legacy routes
    if (path in LEGACY_ROUTES) {
      window.location.replace(LEGACY_ROUTES[path])
      return
    }

    if (path in SCHOOL_ROUTES) {
      window.location.replace(SCHOOL_ROUTES[path])
      return
    }
  }, [])

  return (
    <div>
      <h1>404</h1>
      <p>Page not found.</p>
      <a href="/">← Go home</a>
    </div>
  )
}
