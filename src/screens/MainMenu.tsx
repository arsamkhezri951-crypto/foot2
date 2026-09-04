import React, { useState, useEffect } from 'react'

interface MainMenuProps {
  onNavigate: (screen: string) => void
  career: any | null
  cup: any | null
}

const MainMenu: React.FC<MainMenuProps> = ({ onNavigate, career, cup }) => {
  const [hoveredIndex, setHoveredIndex] = useState<number>(-1)

  const menuItems = [
    { id: 'play', label: 'PLAY MATCH', sublabel: 'Choose your teams', path: '/play-match' },
    { id: 'career', label: 'CAREER', sublabel: 'Build your legacy', path: '/career' },
    { id: 'tournament', label: 'TOURNAMENT', sublabel: 'Compete for the cup', path: '/tournament' },
    { id: 'clubs', label: 'CLUBS', sublabel: 'Teams • Kits • Ratings', path: '/clubs' },
    { id: 'players', label: 'PLAYERS', sublabel: 'Star players of the league', path: '/players' },
    { id: 'settings', label: 'SETTINGS', sublabel: 'Game • Sound • Controls', path: '/settings' }
  ]

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        setHoveredIndex(prev => Math.min(prev + 1, menuItems.length - 1))
      } else if (e.key === 'ArrowUp') {
        setHoveredIndex(prev => Math.max(prev - 1, 0))
      } else if (e.key === 'Enter' && hoveredIndex >= 0) {
        const item = menuItems[hoveredIndex]
        if (item.path) {
          window.location.hash = item.path
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [hoveredIndex, menuItems])

  return (
    <div className="screen-in" style={{
      minHeight: '100%',
      background: 'linear-gradient(135deg, #070b18 0%, #0d1530 50%, #070b18 100%)',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Animated Background */}
      <div className="pitch-lines" style={{
        position: 'absolute',
        inset: 0,
        opacity: 0.3
      }} />

      {/* Ambient Lighting Effects */}
      <div style={{
        position: 'absolute',
        top: '-20%',
        right: '-10%',
        width: '60%',
        height: '60%',
        background: 'radial-gradient(circle, rgba(23, 105, 255, 0.12), transparent 60%)',
        pointerEvents: 'none'
      }} />

      <div style={{
        position: 'absolute',
        bottom: '-20%',
        left: '-10%',
        width: '60%',
        height: '60%',
        background: 'radial-gradient(circle, rgba(108, 59, 255, 0.1), transparent 60%)',
        pointerEvents: 'none'
      }} />

      {/* Content */}
      <div style={{
        position: 'relative',
        zIndex: 10,
        minHeight: '100%',
        display: 'flex',
        flexDirection: 'column',
        padding: 'clamp(2rem, 5vw, 4rem)'
      }}>
        {/* Header */}
        <div className="rise-in" style={{ marginBottom: 'clamp(2rem, 4vw, 3rem)' }}>
          <div style={{
            fontFamily: 'var(--font-body)',
            fontWeight: 900,
            fontSize: 'clamp(0.7rem, 1.5vw, 0.9rem)',
            letterSpacing: '0.3em',
            color: '#ffd23f',
            marginBottom: '0.5rem'
          }}>
            ELITE FOOTBALL
          </div>
          <h1 className="text-display" style={{
            fontSize: 'clamp(3rem, 8vw, 6rem)',
            lineHeight: 0.9,
            letterSpacing: '0.05em',
            color: '#ffffff',
            textShadow: '0 4px 0 #0d2c55, 0 10px 30px rgba(40, 120, 255, 0.45)'
          }}>
            <span style={{ color: '#1769ff' }}>ELITE</span>
            <br />
            <span style={{ color: '#00e5ff' }}>FOOTBALL</span>
          </h1>
        </div>

        {/* Menu Items */}
        <nav style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '0.25rem',
          maxWidth: 'min(90vw, 40rem)'
        }}>
          {menuItems.map((item, index) => (
            <div
              key={item.id}
              className={`menu-item ${hoveredIndex === index ? 'hovered' : ''}`}
              onMouseEnter={() => setHoveredIndex(index)}
              onClick={() => {
                if (item.path) {
                  window.location.href = item.path
                }
              }}
              style={{
                background: hoveredIndex === index ? 'rgba(13, 27, 51, 0.85)' : 'transparent',
                border: hoveredIndex === index ? '1px solid rgba(0, 229, 255, 0.3)' : '1px solid transparent',
                borderRadius: '4px',
                transition: 'all 0.18s ease',
                cursor: 'pointer'
              }}
            >
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1.5rem'
              }}>
                <span style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 'clamp(1.2rem, 2.5vw, 1.8rem)',
                  color: hoveredIndex === index ? '#00e5ff' : '#66739b',
                  minWidth: '2.5rem'
                }}>
                  {String(index + 1).padStart(2, '0')}
                </span>
                <div style={{ flex: 1 }}>
                  <div style={{
                    fontFamily: 'var(--font-cond)',
                    fontWeight: 700,
                    fontSize: 'clamp(1rem, 2vw, 1.4rem)',
                    letterSpacing: '0.15em',
                    color: hoveredIndex === index ? '#ffffff' : '#b8c2d9',
                    textTransform: 'uppercase'
                  }}>
                    {item.label}
                  </div>
                  <div style={{
                    fontFamily: 'var(--font-cond)',
                    fontSize: 'clamp(0.7rem, 1.5vw, 0.85rem)',
                    letterSpacing: '0.1em',
                    color: '#66739b',
                    marginTop: '0.25rem'
                  }}>
                    {item.sublabel}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </nav>

        {/* Footer Info */}
        <div className="rise-in" style={{
          marginTop: 'auto',
          paddingTop: '2rem',
          fontFamily: 'var(--font-cond)',
          fontSize: 'clamp(0.65rem, 1.3vw, 0.75rem)',
          letterSpacing: '0.2em',
          color: '#66739b'
        }}>
          <p>PRESS START TO BEGIN YOUR LEGENDARY JOURNEY</p>
        </div>
      </div>
    </div>
  )
}

export default MainMenu
