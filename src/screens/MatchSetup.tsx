import React from 'react'
import { getTeam } from '../data/teams'
import type { GameSettings } from '../data/storage'

interface MatchSetupProps {
  homeTeamId: string
  awayTeamId: string
  settings: GameSettings
  onStart: () => void
  onBack: () => void
}

const MatchSetup: React.FC<MatchSetupProps> = ({ 
  homeTeamId, 
  awayTeamId, 
  settings, 
  onStart, 
  onBack 
}) => {
  const homeTeam = getTeam(homeTeamId)!
  const awayTeam = getTeam(awayTeamId)!

  return (
    <div className="screen-in" style={{
      minHeight: '100%',
      background: 'linear-gradient(135deg, #070b18 0%, #0d1530 50%, #070b18 100%)',
      padding: 'clamp(1rem, 3vw, 2rem)',
      overflow: 'auto'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '2rem'
      }}>
        <h1 className="text-display" style={{
          fontSize: 'clamp(1.5rem, 4vw, 2.5rem)',
          color: '#ffffff',
          letterSpacing: '0.1em'
        }}>
          MATCH SETUP
        </h1>
        <button onClick={onBack} className="btn-secondary">
          ← BACK
        </button>
      </div>

      {/* Teams Display */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '2rem',
        marginBottom: '3rem',
        flexWrap: 'wrap'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            height: '3rem',
            width: '12rem',
            borderRadius: '4px',
            marginBottom: '0.5rem',
            background: `repeating-linear-gradient(90deg, ${homeTeam.primary} 0 26px, ${homeTeam.secondary} 26px 52px)`
          }} />
          <div style={{
            fontFamily: 'var(--font-display)',
            fontSize: '1.5rem',
            color: '#1769ff'
          }}>
            {homeTeam.short}
          </div>
        </div>

        <div style={{
          fontFamily: 'var(--font-display)',
          fontSize: '2rem',
          color: '#66739b'
        }}>
          VS
        </div>

        <div style={{ textAlign: 'center' }}>
          <div style={{
            height: '3rem',
            width: '12rem',
            borderRadius: '4px',
            marginBottom: '0.5rem',
            background: `repeating-linear-gradient(90deg, ${awayTeam.primary} 0 26px, ${awayTeam.secondary} 26px 52px)`
          }} />
          <div style={{
            fontFamily: 'var(--font-display)',
            fontSize: '1.5rem',
            color: '#ff5fa2'
          }}>
            {awayTeam.short}
          </div>
        </div>
      </div>

      {/* Settings Summary */}
      <div style={{
        maxWidth: '40rem',
        margin: '0 auto 2rem',
        background: 'rgba(13, 21, 48, 0.6)',
        border: '1px solid rgba(29, 43, 85, 0.6)',
        borderRadius: '8px',
        padding: '1.5rem'
      }}>
        <div style={{
          fontFamily: 'var(--font-cond)',
          fontWeight: 700,
          fontSize: '0.85rem',
          letterSpacing: '0.2em',
          color: '#66739b',
          marginBottom: '1rem'
        }}>
          MATCH SETTINGS
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(10rem, 1fr))',
          gap: '1rem'
        }}>
          <div>
            <div style={{
              fontFamily: 'var(--font-cond)',
              fontSize: '0.7rem',
              color: '#66739b',
              marginBottom: '0.25rem'
            }}>
              DURATION
            </div>
            <div style={{
              fontFamily: 'var(--font-display)',
              fontSize: '1.2rem',
              color: '#ffffff'
            }}>
              {settings.matchDuration / 60} MIN
            </div>
          </div>

          <div>
            <div style={{
              fontFamily: 'var(--font-cond)',
              fontSize: '0.7rem',
              color: '#66739b',
              marginBottom: '0.25rem'
            }}>
              DIFFICULTY
            </div>
            <div style={{
              fontFamily: 'var(--font-display)',
              fontSize: '1.2rem',
              color: '#00e5ff'
            }}>
              {settings.difficulty.toUpperCase()}
            </div>
          </div>

          <div>
            <div style={{
              fontFamily: 'var(--font-cond)',
              fontSize: '0.7rem',
              color: '#66739b',
              marginBottom: '0.25rem'
            }}>
              SOUND
            </div>
            <div style={{
              fontFamily: 'var(--font-display)',
              fontSize: '1.2rem',
              color: settings.soundEnabled ? '#00e5ff' : '#66739b'
            }}>
              {settings.soundEnabled ? 'ON' : 'OFF'}
            </div>
          </div>
        </div>
      </div>

      {/* Kick Off Button */}
      <button
        onClick={onStart}
        className="btn-primary"
        style={{
          width: '100%',
          maxWidth: '40rem',
          padding: '1.5rem 2rem',
          fontSize: '1.3rem',
          background: 'linear-gradient(180deg, #00e5ff, #00a8ff)',
          boxShadow: '0 8px 24px rgba(0, 229, 255, 0.3)'
        }}
      >
        KICK OFF
      </button>
    </div>
  )
}

export default MatchSetup
