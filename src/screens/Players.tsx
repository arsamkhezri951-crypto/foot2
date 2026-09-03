import React from 'react'
import { PLAYERS, getTeam } from '../data/teams'

const Players: React.FC<{ onBack: () => void }> = ({ onBack }) => (
  <div className="screen-in" style={{ padding: '2rem', color: '#fff', overflow: 'auto' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
      <h1 className="text-display">PLAYERS</h1>
      <button onClick={onBack} className="btn-secondary">BACK</button>
    </div>
    <div style={{ 
      display: 'grid', 
      gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', 
      gap: '1rem' 
    }}>
      {PLAYERS.map(player => {
        const team = getTeam(player.clubId)
        return (
          <div key={player.id} style={{
            background: 'rgba(13, 21, 48, 0.6)',
            border: '1px solid rgba(29, 43, 85, 0.6)',
            borderRadius: '8px',
            padding: '1rem'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <span style={{ fontFamily: 'var(--font-cond)', fontSize: '0.7rem', color: '#ffd23f', width: '2rem' }}>#{player.number}</span>
              <span style={{ fontFamily: 'var(--font-cond)', fontSize: '0.7rem', color: '#66739b' }}>{player.position}</span>
            </div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', color: '#fff', marginBottom: '0.25rem' }}>
              {player.name.toUpperCase()}
            </div>
            <div style={{ fontFamily: 'var(--font-cond)', fontSize: '0.75rem', color: team?.primary || '#66739b', marginBottom: '0.75rem' }}>
              {team?.name || player.clubId}
            </div>
            <div style={{ 
              height: '2.5rem', 
              width: '2.5rem', 
              borderRadius: '50%', 
              background: `linear-gradient(135deg, ${team?.primary || '#66739b'}, ${team?.secondary || '#404040'})`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: 'var(--font-display)',
              fontSize: '1rem',
              color: '#fff',
              marginBottom: '0.75rem'
            }}>
              {player.overall}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem', fontSize: '0.65rem' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ color: '#66739b' }}>PAC</div>
                <div style={{ color: '#fff' }}>{player.pace}</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ color: '#66739b' }}>SHO</div>
                <div style={{ color: '#fff' }}>{player.shooting}</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ color: '#66739b' }}>PAS</div>
                <div style={{ color: '#fff' }}>{player.passing}</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ color: '#66739b' }}>DEF</div>
                <div style={{ color: '#fff' }}>{player.defense}</div>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  </div>
)

export default Players
