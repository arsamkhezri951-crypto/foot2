import React from 'react'
import { getTeam } from '../data/teams'

interface MatchResultProps {
  homeTeamId: string
  awayTeamId: string
  homeScore: number
  awayScore: number
  context: string
  onRematch: () => void
  onMenu: () => void
}

const MatchResult: React.FC<MatchResultProps> = ({
  homeTeamId,
  awayTeamId,
  homeScore,
  awayScore,
  context,
  onRematch,
  onMenu
}) => {
  const homeTeam = getTeam(homeTeamId)!
  const awayTeam = getTeam(awayTeamId)!

  let resultText = 'DRAW'
  let resultColor = '#b8c2d9'
  
  if (homeScore > awayScore) {
    resultText = `${homeTeam.short} WINS!`
    resultColor = homeTeam.primary
  } else if (awayScore > homeScore) {
    resultText = `${awayTeam.short} WINS!`
    resultColor = awayTeam.primary
  }

  return (
    <div className="screen-in" style={{
      minHeight: '100%',
      background: 'linear-gradient(135deg, #070b18 0%, #0d1530 50%, #070b18 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 'clamp(1rem, 3vw, 2rem)'
    }}>
      <div style={{
        textAlign: 'center',
        maxWidth: '36rem',
        width: '100%'
      }}>
        {/* Result Header */}
        <div className="pop-in" style={{
          fontFamily: 'var(--font-cond)',
          fontWeight: 700,
          fontSize: 'clamp(0.75rem, 1.5vw, 0.9rem)',
          letterSpacing: '0.2em',
          color: '#ffd23f',
          marginBottom: '1rem',
          textTransform: 'uppercase'
        }}>
          FULL TIME
        </div>

        {/* Result Text */}
        <h1 className="text-display pop-in" style={{
          fontSize: 'clamp(2rem, 5vw, 4rem)',
          color: resultColor,
          letterSpacing: '0.08em',
          marginBottom: '2rem',
          textShadow: `0 4px 0 rgba(0,0,0,0.4), 0 10px 30px ${resultColor}40`
        }}>
          {resultText}
        </h1>

        {/* Score Display */}
        <div className="rise-in" style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 'clamp(1rem, 3vw, 2rem)',
          marginBottom: '2.5rem'
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{
              height: '2rem',
              width: '8rem',
              borderRadius: '4px',
              marginBottom: '0.5rem',
              background: `repeating-linear-gradient(90deg, ${homeTeam.primary} 0 20px, ${homeTeam.secondary} 20px 40px)`
            }} />
            <div style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(2.5rem, 6vw, 4rem)',
              color: '#ffffff'
            }}>
              {homeScore}
            </div>
          </div>

          <div style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(1.5rem, 4vw, 2.5rem)',
            color: '#66739b'
          }}>
            -
          </div>

          <div style={{ textAlign: 'center' }}>
            <div style={{
              height: '2rem',
              width: '8rem',
              borderRadius: '4px',
              marginBottom: '0.5rem',
              background: `repeating-linear-gradient(90deg, ${awayTeam.primary} 0 20px, ${awayTeam.secondary} 20px 40px)`
            }} />
            <div style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(2.5rem, 6vw, 4rem)',
              color: '#ffffff'
            }}>
              {awayScore}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem',
          maxWidth: '20rem',
          margin: '0 auto'
        }}>
          <button
            onClick={onRematch}
            className="btn-primary"
            style={{
              padding: '1rem 1.5rem',
              fontSize: '0.95rem',
              background: 'linear-gradient(180deg, #1769ff, #0d4db8)'
            }}
          >
            REMATCH
          </button>

          <button
            onClick={onMenu}
            className="btn-secondary"
            style={{
              padding: '1rem 1.5rem',
              fontSize: '0.95rem'
            }}
          >
            MAIN MENU
          </button>
        </div>
      </div>
    </div>
  )
}

export default MatchResult
