import React from 'react'
import type { GameSettings } from '../data/storage'

interface SettingsProps {
  settings: GameSettings
  onChange: (settings: Partial<GameSettings>) => void
  onBack: () => void
}

const Settings: React.FC<SettingsProps> = ({ settings, onChange, onBack }) => {
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
          SETTINGS
        </h1>
        <button onClick={onBack} className="btn-secondary">
          ← MENU
        </button>
      </div>

      <div style={{ maxWidth: '40rem', margin: '0 auto' }}>
        {/* Match Duration */}
        <div style={{
          background: 'rgba(13, 21, 48, 0.6)',
          border: '1px solid rgba(29, 43, 85, 0.6)',
          borderRadius: '8px',
          padding: '1.25rem',
          marginBottom: '1rem'
        }}>
          <div style={{
            fontFamily: 'var(--font-cond)',
            fontWeight: 700,
            fontSize: '0.75rem',
            letterSpacing: '0.15em',
            color: '#66739b',
            marginBottom: '1rem'
          }}>
            MATCH DURATION
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {[60, 90, 150, 240].map(duration => (
              <button
                key={duration}
                onClick={() => onChange({ matchDuration: duration })}
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  background: settings.matchDuration === duration 
                    ? 'rgba(0, 229, 255, 0.2)' 
                    : 'rgba(13, 21, 48, 0.6)',
                  border: settings.matchDuration === duration 
                    ? '1px solid rgba(0, 229, 255, 0.5)' 
                    : '1px solid rgba(29, 43, 85, 0.6)',
                  borderRadius: '4px',
                  fontFamily: 'var(--font-cond)',
                  fontWeight: 700,
                  fontSize: '0.75rem',
                  letterSpacing: '0.1em',
                  color: settings.matchDuration === duration ? '#00e5ff' : '#66739b',
                  cursor: 'pointer'
                }}
              >
                {duration / 60} MIN
              </button>
            ))}
          </div>
        </div>

        {/* Difficulty */}
        <div style={{
          background: 'rgba(13, 21, 48, 0.6)',
          border: '1px solid rgba(29, 43, 85, 0.6)',
          borderRadius: '8px',
          padding: '1.25rem',
          marginBottom: '1rem'
        }}>
          <div style={{
            fontFamily: 'var(--font-cond)',
            fontWeight: 700,
            fontSize: '0.75rem',
            letterSpacing: '0.15em',
            color: '#66739b',
            marginBottom: '1rem'
          }}>
            DIFFICULTY
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {(['easy', 'normal', 'hard'] as const).map(difficulty => (
              <button
                key={difficulty}
                onClick={() => onChange({ difficulty })}
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  background: settings.difficulty === difficulty 
                    ? 'rgba(0, 229, 255, 0.2)' 
                    : 'rgba(13, 21, 48, 0.6)',
                  border: settings.difficulty === difficulty 
                    ? '1px solid rgba(0, 229, 255, 0.5)' 
                    : '1px solid rgba(29, 43, 85, 0.6)',
                  borderRadius: '4px',
                  fontFamily: 'var(--font-cond)',
                  fontWeight: 700,
                  fontSize: '0.75rem',
                  letterSpacing: '0.1em',
                  color: settings.difficulty === difficulty ? '#00e5ff' : '#66739b',
                  cursor: 'pointer',
                  textTransform: 'uppercase'
                }}
              >
                {difficulty}
              </button>
            ))}
          </div>
        </div>

        {/* Sound Toggle */}
        <div style={{
          background: 'rgba(13, 21, 48, 0.6)',
          border: '1px solid rgba(29, 43, 85, 0.6)',
          borderRadius: '8px',
          padding: '1.25rem',
          marginBottom: '1rem'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div>
              <div style={{
                fontFamily: 'var(--font-cond)',
                fontWeight: 700,
                fontSize: '0.85rem',
                letterSpacing: '0.15em',
                color: '#fff'
              }}>
                SOUND EFFECTS
              </div>
              <div style={{
                fontFamily: 'var(--font-cond)',
                fontSize: '0.7rem',
                color: '#66739b',
                marginTop: '0.25rem'
              }}>
                Master audio toggle
              </div>
            </div>
            <button
              onClick={() => onChange({ soundEnabled: !settings.soundEnabled })}
              style={{
                width: '3.5rem',
                height: '1.75rem',
                background: settings.soundEnabled ? 'rgba(0, 229, 255, 0.3)' : 'rgba(29, 43, 85, 0.8)',
                border: settings.soundEnabled ? '1px solid rgba(0, 229, 255, 0.5)' : '1px solid rgba(29, 43, 85, 0.6)',
                borderRadius: '1rem',
                position: 'relative',
                cursor: 'pointer'
              }}
            >
              <div style={{
                position: 'absolute',
                top: '2px',
                width: '1.35rem',
                height: '1.35rem',
                borderRadius: '50%',
                background: settings.soundEnabled ? '#00e5ff' : '#66739b',
                transition: 'left 0.2s ease',
                left: settings.soundEnabled ? 'calc(100% - 1.55rem)' : '2px'
              }} />
            </button>
          </div>
        </div>

        {/* Screen Shake */}
        <div style={{
          background: 'rgba(13, 21, 48, 0.6)',
          border: '1px solid rgba(29, 43, 85, 0.6)',
          borderRadius: '8px',
          padding: '1.25rem',
          marginBottom: '1rem'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div>
              <div style={{
                fontFamily: 'var(--font-cond)',
                fontWeight: 700,
                fontSize: '0.85rem',
                letterSpacing: '0.15em',
                color: '#fff'
              }}>
                SCREEN SHAKE
              </div>
              <div style={{
                fontFamily: 'var(--font-cond)',
                fontSize: '0.7rem',
                color: '#66739b',
                marginTop: '0.25rem'
              }}>
                Visual feedback on goals
              </div>
            </div>
            <button
              onClick={() => onChange({ screenShake: !settings.screenShake })}
              style={{
                width: '3.5rem',
                height: '1.75rem',
                background: settings.screenShake ? 'rgba(0, 229, 255, 0.3)' : 'rgba(29, 43, 85, 0.8)',
                border: settings.screenShake ? '1px solid rgba(0, 229, 255, 0.5)' : '1px solid rgba(29, 43, 85, 0.6)',
                borderRadius: '1rem',
                position: 'relative',
                cursor: 'pointer'
              }}
            >
              <div style={{
                position: 'absolute',
                top: '2px',
                width: '1.35rem',
                height: '1.35rem',
                borderRadius: '50%',
                background: settings.screenShake ? '#00e5ff' : '#66739b',
                transition: 'left 0.2s ease',
                left: settings.screenShake ? 'calc(100% - 1.55rem)' : '2px'
              }} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Settings
