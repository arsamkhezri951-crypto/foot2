import React, { useState } from 'react'
import { TEAMS, getTeam } from '../data/teams'
import type { GameSettings } from '../data/storage'

interface TeamSelectProps {
  settings: GameSettings
  onSelect: (homeId: string, awayId: string) => void
  onBack: () => void
}

const TeamSelect: React.FC<TeamSelectProps> = ({ settings, onSelect, onBack }) => {
  const [homeTeamId, setHomeTeamId] = useState<string>('blue')
  const [awayTeamId, setAwayTeamId] = useState<string>('red')

  const homeTeam = getTeam(homeTeamId)!
  const awayTeam = getTeam(awayTeamId)!

  const selectRandomTeam = (isHome: boolean) => {
    const available = TEAMS.filter(t => 
      isHome ? t.id !== awayTeamId : t.id !== homeTeamId
    )
    const random = available[Math.floor(Math.random() * available.length)]
    if (isHome) {
      setHomeTeamId(random.id)
    } else {
      setAwayTeamId(random.id)
    }
  }

  return (
    <div className="screen-in" style={{
      minHeight: '100%',
      background: 'linear-gradient(135deg, #070b18 0%, #0d1530 50%, #070b18 100%)',
      padding: 'clamp(1rem, 3vw, 2rem)',
      overflow: 'auto'
    }}>
      {/* Header */}
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
          SELECT TEAMS
        </h1>
        <button
          onClick={onBack}
          className="btn-secondary"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          MENU
        </button>
      </div>

      {/* Team Selection Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 18rem), 1fr))',
        gap: '1.5rem',
        maxWidth: '64rem',
        margin: '0 auto 2rem'
      }}>
        {/* Home Team */}
        <div style={{
          background: 'rgba(13, 21, 48, 0.8)',
          border: '1px solid rgba(29, 43, 85, 0.8)',
          borderRadius: '8px',
          padding: '1.5rem',
          position: 'relative'
        }}>
          <div style={{
            fontFamily: 'var(--font-cond)',
            fontWeight: 700,
            fontSize: '0.85rem',
            letterSpacing: '0.2em',
            color: '#1769ff',
            marginBottom: '1rem',
            textTransform: 'uppercase'
          }}>
            HOME TEAM
          </div>

          {/* Team Preview */}
          <div style={{
            height: '4rem',
            borderRadius: '4px',
            marginBottom: '1rem',
            background: `repeating-linear-gradient(90deg, ${homeTeam.primary} 0 26px, ${homeTeam.secondary} 26px 52px)`,
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(to bottom, rgba(255,255,255,0.1), rgba(0,0,0,0.3))'
            }} />
            <span style={{
              position: 'absolute',
              right: '0.5rem',
              top: '50%',
              transform: 'translateY(-50%)',
              fontFamily: 'var(--font-display)',
              fontSize: '1.5rem',
              color: '#0a1226',
              background: 'rgba(253,253,255,0.85)',
              padding: '0.25rem 0.5rem'
            }}>
              {homeTeam.short}
            </span>
          </div>

          <div style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(1.5rem, 3vw, 2rem)',
            color: '#ffffff',
            letterSpacing: '0.08em',
            marginBottom: '0.5rem'
          }}>
            {homeTeam.name.toUpperCase()}
          </div>

          {/* Ratings */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem',
            marginTop: '1rem'
          }}>
            {[
              { label: 'ATT', value: homeTeam.attack },
              { label: 'MID', value: homeTeam.midfield },
              { label: 'DEF', value: homeTeam.defense },
              { label: 'OVR', value: homeTeam.rating, highlight: true }
            ].map(stat => (
              <div key={stat.label} style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem'
              }}>
                <span style={{
                  fontFamily: 'var(--font-cond)',
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  letterSpacing: '0.15em',
                  color: stat.highlight ? '#00e5ff' : '#66739b',
                  width: '2rem'
                }}>
                  {stat.label}
                </span>
                <div style={{
                  flex: 1,
                  height: '6px',
                  background: 'rgba(29, 43, 85, 0.8)',
                  borderRadius: '3px',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    height: '100%',
                    width: `${(stat.value - 70) / 15 * 100}%`,
                    background: stat.highlight 
                      ? 'linear-gradient(90deg, #1769ff, #00e5ff)'
                      : 'linear-gradient(90deg, #1769ff, #6c3bff)'
                  }} />
                </div>
                <span style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '1rem',
                  color: stat.highlight ? '#00e5ff' : '#b8c2d9',
                  width: '2rem',
                  textAlign: 'right'
                }}>
                  {stat.value}
                </span>
              </div>
            ))}
          </div>

          {/* Random Button */}
          <button
            onClick={() => selectRandomTeam(true)}
            className="btn-secondary"
            style={{
              width: '100%',
              marginTop: '1rem',
              fontSize: '0.75rem'
            }}
          >
            RANDOMIZE
          </button>
        </div>

        {/* Away Team */}
        <div style={{
          background: 'rgba(13, 21, 48, 0.8)',
          border: '1px solid rgba(29, 43, 85, 0.8)',
          borderRadius: '8px',
          padding: '1.5rem',
          position: 'relative'
        }}>
          <div style={{
            fontFamily: 'var(--font-cond)',
            fontWeight: 700,
            fontSize: '0.85rem',
            letterSpacing: '0.2em',
            color: '#ff5fa2',
            marginBottom: '1rem',
            textTransform: 'uppercase'
          }}>
            AWAY TEAM
          </div>

          {/* Team Preview */}
          <div style={{
            height: '4rem',
            borderRadius: '4px',
            marginBottom: '1rem',
            background: `repeating-linear-gradient(90deg, ${awayTeam.primary} 0 26px, ${awayTeam.secondary} 26px 52px)`,
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(to bottom, rgba(255,255,255,0.1), rgba(0,0,0,0.3))'
            }} />
            <span style={{
              position: 'absolute',
              right: '0.5rem',
              top: '50%',
              transform: 'translateY(-50%)',
              fontFamily: 'var(--font-display)',
              fontSize: '1.5rem',
              color: '#0a1226',
              background: 'rgba(253,253,255,0.85)',
              padding: '0.25rem 0.5rem'
            }}>
              {awayTeam.short}
            </span>
          </div>

          <div style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(1.5rem, 3vw, 2rem)',
            color: '#ffffff',
            letterSpacing: '0.08em',
            marginBottom: '0.5rem'
          }}>
            {awayTeam.name.toUpperCase()}
          </div>

          {/* Ratings */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem',
            marginTop: '1rem'
          }}>
            {[
              { label: 'ATT', value: awayTeam.attack },
              { label: 'MID', value: awayTeam.midfield },
              { label: 'DEF', value: awayTeam.defense },
              { label: 'OVR', value: awayTeam.rating, highlight: true }
            ].map(stat => (
              <div key={stat.label} style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem'
              }}>
                <span style={{
                  fontFamily: 'var(--font-cond)',
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  letterSpacing: '0.15em',
                  color: stat.highlight ? '#00e5ff' : '#66739b',
                  width: '2rem'
                }}>
                  {stat.label}
                </span>
                <div style={{
                  flex: 1,
                  height: '6px',
                  background: 'rgba(29, 43, 85, 0.8)',
                  borderRadius: '3px',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    height: '100%',
                    width: `${(stat.value - 70) / 15 * 100}%`,
                    background: stat.highlight 
                      ? 'linear-gradient(90deg, #1769ff, #00e5ff)'
                      : 'linear-gradient(90deg, #1769ff, #6c3bff)'
                  }} />
                </div>
                <span style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '1rem',
                  color: stat.highlight ? '#00e5ff' : '#b8c2d9',
                  width: '2rem',
                  textAlign: 'right'
                }}>
                  {stat.value}
                </span>
              </div>
            ))}
          </div>

          {/* Random Button */}
          <button
            onClick={() => selectRandomTeam(false)}
            className="btn-secondary"
            style={{
              width: '100%',
              marginTop: '1rem',
              fontSize: '0.75rem'
            }}
          >
            RANDOMIZE
          </button>
        </div>
      </div>

      {/* Team Quick Select */}
      <div style={{
        maxWidth: '64rem',
        margin: '0 auto 2rem'
      }}>
        <div style={{
          fontFamily: 'var(--font-cond)',
          fontSize: '0.75rem',
          letterSpacing: '0.15em',
          color: '#66739b',
          marginBottom: '0.75rem'
        }}>
          QUICK SELECT
        </div>
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '0.5rem'
        }}>
          {TEAMS.map(team => (
            <button
              key={team.id}
              onClick={() => setHomeTeamId(team.id)}
              style={{
                padding: '0.5rem 1rem',
                background: homeTeamId === team.id 
                  ? 'rgba(0, 229, 255, 0.2)' 
                  : 'rgba(13, 21, 48, 0.6)',
                border: homeTeamId === team.id 
                  ? '1px solid rgba(0, 229, 255, 0.5)' 
                  : '1px solid rgba(29, 43, 85, 0.6)',
                borderRadius: '4px',
                fontFamily: 'var(--font-cond)',
                fontWeight: 700,
                fontSize: '0.75rem',
                letterSpacing: '0.1em',
                color: homeTeamId === team.id ? '#00e5ff' : '#66739b',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              {team.short}
            </button>
          ))}
        </div>
      </div>

      {/* Start Match Button */}
      <div style={{
        maxWidth: '64rem',
        margin: '0 auto',
        paddingTop: '1rem'
      }}>
        <button
          onClick={() => onSelect(homeTeamId, awayTeamId)}
          className="btn-primary"
          style={{
            width: '100%',
            padding: '1.25rem 2rem',
            fontSize: '1.1rem',
            background: 'linear-gradient(180deg, #1769ff, #0d4db8)',
            boxShadow: '0 8px 24px rgba(23, 105, 255, 0.3)'
          }}
        >
          START MATCH →
        </button>
      </div>
    </div>
  )
}

export default TeamSelect
