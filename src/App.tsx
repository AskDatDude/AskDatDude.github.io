import { LocationProvider, Router, Route } from 'preact-iso'
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

export function App() {
  return (
    <LocationProvider>
      <Navbar />
      <Router>
        <Route path="/" component={Home} />
        <Route path="/work" component={Work} />
        <Route path="/work/:slug" component={WorkDetail} />
        <Route path="/writing" component={Writing} />
        <Route path="/writing/:slug" component={WritingDetail} />
        <Route path="/tools" component={Tools} />
        <Route path="/about" component={About} />
        <Route default component={NotFound} />
      </Router>
      <Footer />
    </LocationProvider>
  )
}
