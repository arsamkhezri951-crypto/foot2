import React from 'react'
import { TEAMS } from '../data/teams'

const Clubs: React.FC<{ onBack: () => void }> = ({ onBack }) => (
  <div className="screen-in" style={{ padding: '2rem', color: '#fff', overflow: 'auto' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
      <h1 className="text-display">CLUBS</h1>
      <button onClick={onBack} className="btn-secondary">BACK</button>
    </div>
    <div style={{ 
      display: 'grid', 
      gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', 
      gap: '1rem' 
    }}>
      {TEAMS.map(team => (
        <div key={team.id} style={{
          background: 'rgba(13, 21, 48, 0.6)',
          border: '1px solid rgba(29, 43, 85, 0.6)',
          borderRadius: '8px',
          padding: '1rem',
          textAlign: 'center'
        }}>
          <div style={{
            height: '2rem',
            borderRadius: '4px',
            marginBottom: '0.5rem',
            background: `repeating-linear-gradient(90deg, ${team.primary} 0 20px, ${team.secondary} 20px 40px)`
          }} />
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', color: '#fff' }}>{team.name}</div>
          <div style={{ fontFamily: 'var(--font-cond)', fontSize: '0.75rem', color: '#66739b', marginTop: '0.5rem' }}>
            OVR: {team.rating}
          </div>
        </div>
      ))}
    </div>
  </div>
)

export default Clubs
