import React from 'react'

const Career: React.FC<{ onBack: () => void }> = ({ onBack }) => (
  <div className="screen-in" style={{ padding: '2rem', color: '#fff' }}>
    <h1>CAREER MODE</h1>
    <p style={{ color: '#66739b' }}>Coming soon - Build your legacy!</p>
    <button onClick={onBack} className="btn-secondary" style={{ marginTop: '1rem' }}>BACK</button>
  </div>
)

export default Career
