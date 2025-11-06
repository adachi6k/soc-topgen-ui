import { useState } from 'react'
import './App.css'

/**
 * Main Application Component
 * SoC Top RTL Generator UI (FlooNoC/floogen integration)
 */
function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <div className="app-container">
        <header className="app-header">
          <h1>SoC Top RTL Generator</h1>
          <p>Browser-based UI for FlooNoC Configuration and RTL Generation</p>
        </header>
        
        <main className="app-main">
          <div className="card">
            <h2>Welcome to soc-topgen-ui</h2>
            <p>
              This application allows you to configure AXI-based SoC architectures
              and generate RTL using floogen.
            </p>
            <button onClick={() => setCount((count) => count + 1)}>
              count is {count}
            </button>
          </div>
          
          <div className="info">
            <h3>Features</h3>
            <ul>
              <li>Visual configuration editor for protocols, endpoints, routers</li>
              <li>Real-time YAML validation</li>
              <li>Automatic RTL generation with floogen</li>
              <li>Download generated SystemVerilog files</li>
            </ul>
          </div>
        </main>
        
        <footer className="app-footer">
          <p>Powered by FlooNoC | Apache-2.0 License</p>
        </footer>
      </div>
    </>
  )
}

export default App
