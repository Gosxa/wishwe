import { useState, useEffect } from 'react'
import Header from './components/Header.jsx'
import Hero from './components/Hero.jsx'
import StatusCard from './components/StatusCard.jsx'
import './App.css'

export default function App() {
  const [apiStatus, setApiStatus] = useState('checking')

  useEffect(() => {
    fetch('/api/health/')
      .then(r => r.ok ? setApiStatus('online') : setApiStatus('error'))
      .catch(() => setApiStatus('offline'))
  }, [])

  return (
    <div className="app">
      <Header />
      <main className="main">
        <Hero />
        <StatusCard apiStatus={apiStatus} />
      </main>
      <footer className="footer">
        <span>© 2026 Wishwe — Infrastructure ready</span>
      </footer>
    </div>
  )
}
