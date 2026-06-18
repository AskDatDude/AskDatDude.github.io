import { LocationProvider, Router, Route } from 'preact-iso'
import { useEffect } from 'preact/hooks'
import { Navbar } from './components/layout/Navbar'
import { Footer } from './components/layout/Footer'
import { Home } from './pages/Home'
import { Work } from './pages/Work'
import { WorkDetail } from './pages/WorkDetail'
import { Writing } from './pages/Writing'
import { WritingDetail } from './pages/WritingDetail'
import { Tools } from './pages/Tools'
import { About } from './pages/About'
import { NotFound } from './pages/NotFound'

function QrGeneratorRedirect() {
  useEffect(() => {
    window.location.replace('/tools/qr-code-generator/index.html')
  }, [])

  return null
}

function ImageConverterRedirect() {
  useEffect(() => {
    window.location.replace('/tools/image-converter/index.html')
  }, [])

  return null
}

export function App() {
  return (
    <LocationProvider>
      <Navbar />
      <div class="app-body">
        <Router>
          <Route path="/" component={Home} />
          <Route path="/work" component={Work} />
          <Route path="/work/:slug" component={WorkDetail} />
          <Route path="/writing" component={Writing} />
          <Route path="/writing/:slug" component={WritingDetail} />
          <Route path="/tools" component={Tools} />
          <Route path="/tools/qr-code-generator" component={QrGeneratorRedirect} />
          <Route path="/tools/qr-code-generator/" component={QrGeneratorRedirect} />
          <Route path="/tools/image-converter" component={ImageConverterRedirect} />
          <Route path="/tools/image-converter/" component={ImageConverterRedirect} />
          <Route path="/about" component={About} />
          <Route default component={NotFound} />
        </Router>
      </div>
      <Footer />
    </LocationProvider>
  )
}
