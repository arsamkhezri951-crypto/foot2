import React, { useEffect, useRef } from 'react'
import { getTeam } from '../data/teams'
import type { GameSettings } from '../data/storage'

interface MatchProps {
  homeTeamId: string
  awayTeamId: string
  settings: GameSettings
  context: 'friendly' | 'career' | 'tournament'
  onResult: (homeScore: number, awayScore: number) => void
  onExit: () => void
}

const Match: React.FC<MatchProps> = ({ 
  homeTeamId, 
  awayTeamId, 
  settings,
  context,
  onResult,
  onExit 
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  
  const homeTeam = getTeam(homeTeamId)!
  const awayTeam = getTeam(awayTeamId)!

  // Simple match simulation for MVP
  useEffect(() => {
    let homeScore = 0
    let awayScore = 0
    let time = 0
    
    const interval = setInterval(() => {
      time += 1
      
      // Simulate goals based on team ratings
      if (Math.random() < 0.02) {
        if (Math.random() * homeTeam.attack > Math.random() * awayTeam.defense) {
          homeScore++
        } else {
          awayScore++
        }
      }
      
      // End match when time reaches duration
      if (time >= settings.matchDuration) {
        clearInterval(interval)
        onResult(homeScore, awayScore)
      }
    }, 1000)
    
    return () => clearInterval(interval)
  }, [settings.matchDuration, homeTeam, awayTeam, onResult])

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: '#070b18',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1rem'
    }}>
      <div className="screen-in" style={{
        textAlign: 'center',
        maxWidth: '40rem',
        width: '100%'
      }}>
        {/* Scoreboard */}
        <div style={{
          background: 'linear-gradient(180deg, rgba(14, 28, 54, 0.95), rgba(8, 17, 34, 0.95))',
          border: '1px solid rgba(90, 140, 220, 0.4)',
          borderRadius: '12px',
          padding: '1rem 1.5rem',
          marginBottom: '2rem',
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.5)'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem'
          }}>
            <div style={{ flex: 1, textAlign: 'left' }}>
              <div style={{
                height: '1.5rem',
                borderRadius: '4px',
                marginBottom: '0.5rem',
                background: `repeating-linear-gradient(90deg, ${homeTeam.primary} 0 16px, ${homeTeam.secondary} 16px 32px)`
              }} />
              <div style={{
                fontFamily: 'var(--font-display)',
                fontSize: '1rem',
                color: '#5db2ff'
              }}>
                {homeTeam.short}
              </div>
            </div>
            
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '1rem'
            }}>
              <span style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'clamp(1.5rem, 4vw, 2.5rem)',
                color: '#ffffff',
                minWidth: '2rem',
                textAlign: 'center'
              }}>
                -
              </span>
              <span style={{
                fontFamily: 'var(--font-cond)',
                fontSize: '1rem',
                color: '#ffd23f',
                background: '#13233f',
                padding: '0.25rem 0.5rem',
                borderRadius: '4px',
                border: '1px solid rgba(255, 210, 63, 0.35)'
              }}>
                00:00
              </span>
              <span style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'clamp(1.5rem, 4vw, 2.5rem)',
                color: '#ffffff',
                minWidth: '2rem',
                textAlign: 'center'
              }}>
                -
              </span>
            </div>
            
            <div style={{ flex: 1, textAlign: 'right' }}>
              <div style={{
                height: '1.5rem',
                borderRadius: '4px',
                marginBottom: '0.5rem',
                background: `repeating-linear-gradient(90deg, ${awayTeam.primary} 0 16px, ${awayTeam.secondary} 16px 32px)`
              }} />
              <div style={{
                fontFamily: 'var(--font-display)',
                fontSize: '1rem',
                color: '#ffb3d1'
              }}>
                {awayTeam.short}
              </div>
            </div>
          </div>
        </div>

        {/* Match Info */}
        <div style={{
          fontFamily: 'var(--font-cond)',
          fontSize: '0.85rem',
          color: '#66739b',
          letterSpacing: '0.1em',
          marginBottom: '1rem'
        }}>
          SIMULATING MATCH...
        </div>

        {/* Loading Animation */}
        <div style={{
          width: '4rem',
          height: '4rem',
          margin: '0 auto 1.5rem',
          border: '3px solid rgba(29, 43, 85, 0.6)',
          borderTopColor: '#00e5ff',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }} />

        {/* Controls Hint */}
        <div style={{
          fontFamily: 'var(--font-cond)',
          fontSize: '0.7rem',
          color: '#66739b',
          marginTop: '2rem'
        }}>
          Full gameplay implementation coming soon
        </div>

        <button
          onClick={onExit}
          className="btn-secondary"
          style={{ marginTop: '1.5rem' }}
        >
          EXIT MATCH
        </button>
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}

export default Match
