import React, { useEffect, useRef, useState } from 'react'
import { getTeam } from '../data/teams'
import type { GameSettings } from '../data/storage'
import {
  createGameState,
  createControls,
  updateGame,
  doPass,
  doShoot,
  doCross,
  getControlledPlayer,
  worldToScreen,
  getCameraTarget,
  type GameState,
  type ControlState
} from '../game/FootballEngine'

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
  const containerRef = useRef<HTMLDivElement>(null)
  
  const homeTeam = getTeam(homeTeamId)!
  const awayTeam = getTeam(awayTeamId)!
  
  const [gameState, setGameState] = useState<GameState | null>(null)
  const [controls, setControls] = useState<ControlState>(createControls())
  const [displayTime, setDisplayTime] = useState('00:00')
  const [isPaused, setIsPaused] = useState(false)
  const [showGoalOverlay, setShowGoalOverlay] = useState(false)
  const [goalScorer, setGoalScorer] = useState<string | null>(null)
  
  const gameRef = useRef<GameState | null>(null)
  const controlsRef = useRef<ControlState>(createControls())
  const animationFrameRef = useRef<number>(0)
  const lastTimeRef = useRef<number>(0)
  const matchDurationRef = useRef<number>(settings.matchDuration)

  // Initialize game
  useEffect(() => {
    const game = createGameState()
    gameRef.current = game
    controlsRef.current = createControls()
    setGameState(game)
    setControls(controlsRef.current)
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [])

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!controlsRef.current) return
      
      switch(e.key.toLowerCase()) {
        case 'w':
        case 'arrowup':
          controlsRef.current.up = true
          break
        case 's':
        case 'arrowdown':
          controlsRef.current.down = true
          break
        case 'a':
        case 'arrowleft':
          controlsRef.current.left = true
          break
        case 'd':
        case 'arrowright':
          controlsRef.current.right = true
          break
        case 'shift':
          controlsRef.current.sprint = true
          break
        case 'x':
          if (!controlsRef.current.pass) {
            controlsRef.current.pass = true
            if (gameRef.current) {
              doPass(gameRef.current, controlsRef.current)
            }
          }
          break
        case ' ':
          if (!controlsRef.current.shoot) {
            controlsRef.current.shoot = true
            if (gameRef.current) {
              doShoot(gameRef.current, controlsRef.current)
            }
          }
          break
        case 'c':
          if (!controlsRef.current.cross) {
            controlsRef.current.cross = true
            if (gameRef.current) {
              doCross(gameRef.current, controlsRef.current)
            }
          }
          break
        case 'escape':
          setIsPaused(p => !p)
          break
      }
      setControls({ ...controlsRef.current })
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      if (!controlsRef.current) return
      
      switch(e.key.toLowerCase()) {
        case 'w':
        case 'arrowup':
          controlsRef.current.up = false
          break
        case 's':
        case 'arrowdown':
          controlsRef.current.down = false
          break
        case 'a':
        case 'arrowleft':
          controlsRef.current.left = false
          break
        case 'd':
        case 'arrowright':
          controlsRef.current.right = false
          break
        case 'shift':
          controlsRef.current.sprint = false
          break
      }
      setControls({ ...controlsRef.current })
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [])

  // Touch controls for mobile
  useEffect(() => {
    const setupTouchControls = () => {
      const joystickZone = document.getElementById('joystick-zone')
      const passBtn = document.getElementById('pass-btn')
      const shootBtn = document.getElementById('shoot-btn')
      const crossBtn = document.getElementById('cross-btn')

      if (joystickZone) {
        let joystickCenter = { x: 0, y: 0 }
        let joystickActive = false

        joystickZone.addEventListener('pointerdown', (e) => {
          joystickActive = true
          const rect = joystickZone.getBoundingClientRect()
          joystickCenter = {
            x: rect.left + rect.width / 2,
            y: rect.top + rect.height / 2
          }
          updateJoystick(e.clientX, e.clientY)
        })

        window.addEventListener('pointermove', (e) => {
          if (joystickActive) {
            updateJoystick(e.clientX, e.clientY)
          }
        })

        window.addEventListener('pointerup', () => {
          joystickActive = false
          controlsRef.current.joystickX = 0
          controlsRef.current.joystickY = 0
          setControls({ ...controlsRef.current })
        })

        function updateJoystick(clientX: number, clientY: number) {
          const dx = clientX - joystickCenter.x
          const dy = clientY - joystickCenter.y
          const distance = Math.sqrt(dx * dx + dy * dy)
          const maxDistance = 50
          const normalizedDistance = Math.min(distance, maxDistance) / maxDistance
          
          controlsRef.current.joystickX = (dx / distance) * normalizedDistance
          controlsRef.current.joystickY = (dy / distance) * normalizedDistance
          setControls({ ...controlsRef.current })
        }
      }

      if (passBtn) {
        passBtn.addEventListener('pointerdown', () => {
          controlsRef.current.pass = true
          if (gameRef.current) {
            doPass(gameRef.current, controlsRef.current)
          }
          setTimeout(() => { controlsRef.current.pass = false }, 100)
        })
      }

      if (shootBtn) {
        shootBtn.addEventListener('pointerdown', () => {
          controlsRef.current.shoot = true
          if (gameRef.current) {
            doShoot(gameRef.current, controlsRef.current)
          }
          setTimeout(() => { controlsRef.current.shoot = false }, 100)
        })
      }

      if (crossBtn) {
        crossBtn.addEventListener('pointerdown', () => {
          controlsRef.current.cross = true
          if (gameRef.current) {
            doCross(gameRef.current, controlsRef.current)
          }
          setTimeout(() => { controlsRef.current.cross = false }, 100)
        })
      }
    }

    setupTouchControls()
  }, [])

  // Game loop
  useEffect(() => {
    if (!gameRef.current || !canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Resize canvas
    const resizeCanvas = () => {
      if (containerRef.current && canvasRef.current) {
        const container = containerRef.current
        canvas.width = container.clientWidth
        canvas.height = container.clientHeight
      }
    }
    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)

    const difficultyMultiplier = settings.difficulty === 'easy' ? 0.7 : settings.difficulty === 'hard' ? 1.3 : 1.0

    const gameLoop = (timestamp: number) => {
      if (!lastTimeRef.current) lastTimeRef.current = timestamp
      const deltaTime = Math.min((timestamp - lastTimeRef.current) / 1000, 0.1)
      lastTimeRef.current = timestamp

      if (gameRef.current && !isPaused && !gameRef.current.isGoal) {
        updateGame(gameRef.current, controlsRef.current, difficultyMultiplier, deltaTime)
        
        // Update timer display
        const elapsedSeconds = Math.floor(gameRef.current.gameTime)
        const totalSeconds = matchDurationRef.current
        const remaining = Math.max(0, totalSeconds - elapsedSeconds)
        const minutes = Math.floor(remaining / 60)
        const seconds = remaining % 60
        setDisplayTime(`${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`)

        // Check for match end
        if (remaining <= 0) {
          onResult(gameRef.current.homeScore, gameRef.current.awayScore)
          return
        }

        // Handle goal overlay
        if (gameRef.current.isGoal && !showGoalOverlay) {
          setShowGoalOverlay(true)
          setGoalScorer(gameRef.current.goalTeam === 'home' ? homeTeam.short : awayTeam.short)
          setTimeout(() => {
            setShowGoalOverlay(false)
            setGoalScorer(null)
          }, 2000)
        }

        setGameState({ ...gameRef.current })
      }

      // Render
      render(ctx, canvas.width, canvas.height)

      animationFrameRef.current = requestAnimationFrame(gameLoop)
    }

    animationFrameRef.current = requestAnimationFrame(gameLoop)

    return () => {
      window.removeEventListener('resize', resizeCanvas)
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [isPaused, showGoalOverlay, homeTeam, awayTeam, onResult, settings.difficulty])

  // Render function
  const render = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const game = gameRef.current
    if (!game) return

    // Clear
    ctx.fillStyle = '#2d5a27'
    ctx.fillRect(0, 0, width, height)

    // Camera
    const cameraTarget = getCameraTarget(game.ball, game.players)
    const cameraX = cameraTarget.x
    const cameraY = cameraTarget.y * 0.5

    // Draw pitch markings
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)'
    ctx.lineWidth = 2

    // Pitch border
    const [leftTopX, leftTopY] = worldToScreen(-52.5, -34, width, height, cameraX, cameraY)
    const [rightBottomX, rightBottomY] = worldToScreen(52.5, 34, width, height, cameraX, cameraY)
    
    ctx.strokeRect(leftTopX, leftTopY, rightBottomX - leftTopX, rightBottomY - leftTopY)

    // Center line
    const [centerTopX, centerTopY] = worldToScreen(0, -34, width, height, cameraX, cameraY)
    const [centerBottomX, centerBottomY] = worldToScreen(0, 34, width, height, cameraX, cameraY)
    ctx.beginPath()
    ctx.moveTo(centerTopX, centerTopY)
    ctx.lineTo(centerBottomX, centerBottomY)
    ctx.stroke()

    // Center circle
    const [centerX, centerY] = worldToScreen(0, 0, width, height, cameraX, cameraY)
    const [, radius] = worldToScreen(9.15, 0, width, height, 0, 0)
    const screenRadius = radius - worldToScreen(0, 0, width, height, 0, 0)[0]
    ctx.beginPath()
    ctx.arc(centerX, centerY, Math.abs(screenRadius), 0, Math.PI * 2)
    ctx.stroke()

    // Goals
    const goalHeight = 7.32
    const [leftGoalX, leftGoalY] = worldToScreen(-52.5, 0, width, height, cameraX, cameraY)
    const [rightGoalX, rightGoalY] = worldToScreen(52.5, 0, width, height, cameraX, cameraY)
    
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)'
    ctx.fillRect(leftGoalX - 10, leftGoalY - 30, 10, 60)
    ctx.fillRect(rightGoalX, rightGoalY - 30, 10, 60)

    // Penalty areas
    const penaltyWidth = 40.32
    const penaltyHeight = 16.5
    const [leftPenX, leftPenY] = worldToScreen(-52.5 + penaltyHeight, -penaltyWidth/2, width, height, cameraX, cameraY)
    const [rightPenX, rightPenY] = worldToScreen(52.5 - penaltyHeight, -penaltyWidth/2, width, height, cameraX, cameraY)
    
    ctx.strokeRect(leftPenX, leftPenY, penaltyHeight * (width / 105), penaltyWidth * (height / 68))
    ctx.strokeRect(rightPenX - penaltyHeight * (width / 105), rightPenY, penaltyHeight * (width / 105), penaltyWidth * (height / 68))

    // Draw players
    for (const player of game.players) {
      const team = player.teamId === 'home' ? homeTeam : awayTeam
      const [px, py] = worldToScreen(player.position.x, player.position.y, width, height, cameraX, cameraY)
      const playerSize = 8

      // Player body
      ctx.fillStyle = player.teamId === 'home' ? team.primary : team.secondary
      ctx.beginPath()
      ctx.arc(px, py, playerSize, 0, Math.PI * 2)
      ctx.fill()
      
      // Border
      ctx.strokeStyle = '#ffffff'
      ctx.lineWidth = 2
      ctx.stroke()

      // Indicator for controlled player
      const controlledPlayer = getControlledPlayer(game)
      if (player === controlledPlayer) {
        ctx.strokeStyle = '#ffd23f'
        ctx.lineWidth = 3
        ctx.beginPath()
        ctx.arc(px, py, playerSize + 4, 0, Math.PI * 2)
        ctx.stroke()
      }

      // Player number
      ctx.fillStyle = '#ffffff'
      ctx.font = 'bold 8px Arial'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText((player.id + 1).toString(), px, py)
    }

    // Draw ball
    const [bx, by] = worldToScreen(game.ball.position.x, game.ball.position.y, width, height, cameraX, cameraY)
    const ballSize = 5
    
    ctx.fillStyle = '#ffffff'
    ctx.beginPath()
    ctx.arc(bx, by, ballSize, 0, Math.PI * 2)
    ctx.fill()
    
    ctx.strokeStyle = '#000000'
    ctx.lineWidth = 2
    ctx.stroke()
  }

  if (!gameState) {
    return (
      <div style={{
        position: 'fixed',
        inset: 0,
        background: '#070b18',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div className="loading-spinner" />
      </div>
    )
  }

  return (
    <div ref={containerRef} style={{
      position: 'fixed',
      inset: 0,
      background: '#070b18',
      overflow: 'hidden'
    }}>
      {/* Scoreboard */}
      <div style={{
        position: 'absolute',
        top: '1rem',
        left: '50%',
        transform: 'translateX(-50%)',
        background: 'linear-gradient(180deg, rgba(14, 28, 54, 0.95), rgba(8, 17, 34, 0.95))',
        border: '1px solid rgba(90, 140, 220, 0.4)',
        borderRadius: '12px',
        padding: '0.75rem 1.5rem',
        zIndex: 100,
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        gap: '1.5rem'
      }}>
        <div style={{ textAlign: 'left', minWidth: '80px' }}>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: homeTeam.primary }}>{homeTeam.short}</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', color: '#ffffff', minWidth: '1.5rem', textAlign: 'center' }}>
            {gameState.homeScore}
          </span>
          <span style={{
            fontFamily: 'var(--font-cond)',
            fontSize: '1rem',
            color: '#ffd23f',
            background: '#13233f',
            padding: '0.25rem 0.5rem',
            borderRadius: '4px',
            border: '1px solid rgba(255, 210, 63, 0.35)',
            minWidth: '60px',
            textAlign: 'center'
          }}>
            {displayTime}
          </span>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', color: '#ffffff', minWidth: '1.5rem', textAlign: 'center' }}>
            {gameState.awayScore}
          </span>
        </div>
        <div style={{ textAlign: 'right', minWidth: '80px' }}>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: awayTeam.primary }}>{awayTeam.short}</div>
        </div>
      </div>

      {/* Game Canvas */}
      <canvas
        ref={canvasRef}
        style={{
          width: '100%',
          height: '100%',
          display: 'block'
        }}
      />

      {/* Goal Overlay */}
      {showGoalOverlay && (
        <div style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'rgba(0, 0, 0, 0.5)',
          zIndex: 200,
          pointerEvents: 'none'
        }}>
          <div style={{
            textAlign: 'center',
            animation: 'popIn 0.3s ease-out'
          }}>
            <div style={{
              fontSize: 'clamp(3rem, 10vw, 8rem)',
              fontWeight: 'bold',
              color: '#ffd23f',
              textShadow: '0 4px 20px rgba(255, 210, 63, 0.5)',
              fontFamily: 'var(--font-display)'
            }}>
              GOAL!
            </div>
            <div style={{
              fontSize: 'clamp(1.5rem, 4vw, 3rem)',
              color: '#ffffff',
              marginTop: '1rem',
              fontFamily: 'var(--font-display)'
            }}>
              {goalScorer} SCORES!
            </div>
          </div>
        </div>
      )}

      {/* Pause Overlay */}
      {isPaused && !showGoalOverlay && (
        <div style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'rgba(0, 0, 0, 0.7)',
          zIndex: 200
        }}>
          <div style={{
            textAlign: 'center',
            background: 'rgba(14, 28, 54, 0.95)',
            padding: '2rem 3rem',
            borderRadius: '12px',
            border: '1px solid rgba(90, 140, 220, 0.4)'
          }}>
            <div style={{
              fontSize: '2rem',
              fontWeight: 'bold',
              color: '#ffffff',
              marginBottom: '1.5rem',
              fontFamily: 'var(--font-display)'
            }}>
              PAUSED
            </div>
            <button
              onClick={() => setIsPaused(false)}
              className="btn-primary"
              style={{ marginBottom: '0.75rem' }}
            >
              RESUME
            </button>
            <div style={{ marginTop: '0.75rem' }}>
              <button onClick={onExit} className="btn-secondary">EXIT MATCH</button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Controls */}
      <div id="joystick-zone" style={{
        position: 'absolute',
        bottom: '2rem',
        left: '2rem',
        width: '120px',
        height: '120px',
        background: 'rgba(255, 255, 255, 0.1)',
        borderRadius: '50%',
        border: '2px solid rgba(255, 255, 255, 0.3)',
        touchAction: 'none',
        display: 'none' // Show via media query on mobile
      }} />

      <div style={{
        position: 'absolute',
        bottom: '2rem',
        right: '2rem',
        display: 'flex',
        gap: '1rem',
        touchAction: 'none'
      }}>
        <button
          id="pass-btn"
          style={{
            width: '70px',
            height: '70px',
            borderRadius: '50%',
            background: 'rgba(23, 105, 255, 0.8)',
            border: '2px solid rgba(255, 255, 255, 0.5)',
            color: '#ffffff',
            fontSize: '0.9rem',
            fontWeight: 'bold',
            touchAction: 'none'
          }}
        >
          PASS
        </button>
        <button
          id="shoot-btn"
          style={{
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            background: 'rgba(255, 71, 87, 0.8)',
            border: '2px solid rgba(255, 255, 255, 0.5)',
            color: '#ffffff',
            fontSize: '0.9rem',
            fontWeight: 'bold',
            touchAction: 'none'
          }}
        >
          SHOOT
        </button>
        <button
          id="cross-btn"
          style={{
            width: '70px',
            height: '70px',
            borderRadius: '50%',
            background: 'rgba(255, 193, 7, 0.8)',
            border: '2px solid rgba(255, 255, 255, 0.5)',
            color: '#ffffff',
            fontSize: '0.9rem',
            fontWeight: 'bold',
            touchAction: 'none'
          }}
        >
          CROSS
        </button>
      </div>

      {/* Desktop Controls Hint */}
      <div style={{
        position: 'absolute',
        bottom: '1rem',
        left: '50%',
        transform: 'translateX(-50%)',
        fontFamily: 'var(--font-cond)',
        fontSize: '0.75rem',
        color: 'rgba(255, 255, 255, 0.5)',
        textAlign: 'center'
      }}>
        WASD/Arrows: Move | X: Pass | SPACE: Shoot | C: Cross | SHIFT: Sprint | ESC: Pause
      </div>

      <style>{`
        @keyframes popIn {
          0% { transform: scale(0.5); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
        
        .loading-spinner {
          width: 4rem;
          height: 4rem;
          border: 3px solid rgba(29, 43, 85, 0.6);
          borderTop-color: #00e5ff;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }
        
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        
        @media (max-width: 768px) {
          #joystick-zone {
            display: block !important;
          }
        }
      `}</style>
    </div>
  )
}

export default Match
