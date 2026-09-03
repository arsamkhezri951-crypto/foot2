import React from 'react'

const Tournament: React.FC<{ onBack: () => void }> = ({ onBack }) => (
  <div className="screen-in" style={{ padding: '2rem', color: '#fff' }}>
    <h1>TOURNAMENT MODE</h1>
    <p style={{ color: '#66739b' }}>Coming soon - Compete for the cup!</p>
    <button onClick={onBack} className="btn-secondary" style={{ marginTop: '1rem' }}>BACK</button>
  </div>
)

export default Tournament
