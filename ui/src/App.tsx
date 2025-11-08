import './App.css'
import { ConfigEditor } from './components'

/**
 * Main Application Component
 * SoC Top RTL Generator UI (FlooNoC/floogen integration)
 */
function App() {
  return (
    <div className="app-container">
      <header className="app-header">
        <h1>SoC Top RTL Generator</h1>
        <p>Browser-based UI for FlooNoC Configuration and RTL Generation</p>
      </header>
      
      <main className="app-main">
        <ConfigEditor />
      </main>
      
      <footer className="app-footer">
        <p>Powered by FlooNoC | Apache-2.0 License</p>
      </footer>
    </div>
  )
}

export default App
