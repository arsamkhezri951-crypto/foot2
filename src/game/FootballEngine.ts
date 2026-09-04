/**
 * Elite Football - Complete Football Match Engine
 * Implements full 11v11 football gameplay with physics, AI, and controls
 */

import type { Team } from '../data/teams'

// ============================================
// CONSTANTS & CONFIGURATION
// ============================================

const PITCH_WIDTH = 105
const PITCH_HEIGHT = 68
const GOAL_WIDTH = 7.32
const GOAL_DEPTH = 2.44
const PENALTY_AREA_WIDTH = 40.32
const PENALTY_AREA_HEIGHT = 16.5
const SIX_YARD_BOX_WIDTH = 18.32
const SIX_YARD_BOX_HEIGHT = 5.5
const CENTER_CIRCLE_RADIUS = 9.15
const BALL_RADIUS = 0.11
const PLAYER_RADIUS = 0.5
const FRICTION = 0.97
const BALL_FRICTION = 0.98
const PLAYER_SPEED = 3.5
const SPRINT_SPEED = 5.0
const BALL_PASS_SPEED = 12
const BALL_SHOOT_SPEED = 20
const BALL_CROSS_SPEED = 15
const KEEPER_SPEED = 4.0
const AI_REACTION_TIME = 0.3

// ============================================
// TYPES
// ============================================

export interface Vector2 {
  x: number
  y: number
}

export interface Player {
  id: number
  teamId: 'home' | 'away'
  position: Vector2
  velocity: Vector2
  role: 'GK' | 'DEF' | 'MID' | 'FWD'
  homePosition: Vector2 // Formation position
  hasBall: boolean
  isControlling: boolean
  stamina: number
}

export interface Ball {
  position: Vector2
  velocity: Vector2
  owner: Player | null
  inPlay: boolean
  lastTouch: 'home' | 'away' | null
}

export interface GameState {
  players: Player[]
  ball: Ball
  homeScore: number
  awayScore: number
  gameTime: number
  isPaused: boolean
  isGoal: boolean
  goalTeam: 'home' | 'away' | null
  half: 1 | 2
  possession: 'home' | 'away' | null
}

export interface ControlState {
  up: boolean
  down: boolean
  left: boolean
  right: boolean
  sprint: boolean
  pass: boolean
  shoot: boolean
  cross: boolean
  joystickX: number
  joystickY: number
}

// ============================================
// UTILITIES
// ============================================

function distance(a: Vector2, b: Vector2): number {
  const dx = a.x - b.x
  const dy = a.y - b.y
  return Math.sqrt(dx * dx + dy * dy)
}

function normalize(v: Vector2): Vector2 {
  const len = Math.sqrt(v.x * v.x + v.y * v.y)
  if (len === 0) return { x: 0, y: 0 }
  return { x: v.x / len, y: v.y / len }
}

function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val))
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

// ============================================
// INITIALIZATION
// ============================================

function createPlayer(
  id: number,
  teamId: 'home' | 'away',
  role: 'GK' | 'DEF' | 'MID' | 'FWD',
  homeX: number,
  homeY: number
): Player {
  const side = teamId === 'home' ? 1 : -1
  return {
    id,
    teamId,
    position: { x: homeX * side, y: homeY },
    velocity: { x: 0, y: 0 },
    role,
    homePosition: { x: homeX * side, y: homeY },
    hasBall: false,
    isControlling: false,
    stamina: 100
  }
}

function createFormation(teamId: 'home' | 'away'): Player[] {
  const players: Player[] = []
  let id = 0

  // Goalkeeper
  players.push(createPlayer(id++, teamId, 'GK', 50, 0))

  // Defenders (4)
  players.push(createPlayer(id++, teamId, 'DEF', 35, -25))
  players.push(createPlayer(id++, teamId, 'DEF', 35, -8))
  players.push(createPlayer(id++, teamId, 'DEF', 35, 8))
  players.push(createPlayer(id++, teamId, 'DEF', 35, 25))

  // Midfielders (4)
  players.push(createPlayer(id++, teamId, 'MID', 15, -30))
  players.push(createPlayer(id++, teamId, 'MID', 15, -10))
  players.push(createPlayer(id++, teamId, 'MID', 15, 10))
  players.push(createPlayer(id++, teamId, 'MID', 15, 30))

  // Forwards (2)
  players.push(createPlayer(id++, teamId, 'FWD', -5, -15))
  players.push(createPlayer(id++, teamId, 'FWD', -5, 15))

  return players
}

function createBall(): Ball {
  return {
    position: { x: 0, y: 0 },
    velocity: { x: 0, y: 0 },
    owner: null,
    inPlay: true,
    lastTouch: null
  }
}

export function createGameState(): GameState {
  return {
    players: [...createFormation('home'), ...createFormation('away')],
    ball: createBall(),
    homeScore: 0,
    awayScore: 0,
    gameTime: 0,
    isPaused: false,
    isGoal: false,
    goalTeam: null,
    half: 1,
    possession: null
  }
}

// ============================================
// CONTROLS
// ============================================

export function createControls(): ControlState {
  return {
    up: false,
    down: false,
    left: false,
    right: false,
    sprint: false,
    pass: false,
    shoot: false,
    cross: false,
    joystickX: 0,
    joystickY: 0
  }
}

// ============================================
// PLAYER MOVEMENT & AI
// ============================================

function updatePlayerMovement(
  player: Player,
  ball: Ball,
  controls: ControlState,
  isControlledPlayer: boolean,
  difficulty: number,
  dt: number
) {
  if (isControlledPlayer) {
    // Human control
    let speed = controls.sprint ? SPRINT_SPEED : PLAYER_SPEED
    let dx = 0
    let dy = 0

    // Keyboard controls
    if (controls.up) dy -= 1
    if (controls.down) dy += 1
    if (controls.left) dx -= 1
    if (controls.right) dx += 1

    // Joystick override
    if (Math.abs(controls.joystickX) > 0.1 || Math.abs(controls.joystickY) > 0.1) {
      dx = controls.joystickX
      dy = controls.joystickY
    }

    if (dx !== 0 || dy !== 0) {
      const dir = normalize({ x: dx, y: dy })
      player.velocity.x = dir.x * speed
      player.velocity.y = dir.y * speed
    } else {
      player.velocity.x *= FRICTION
      player.velocity.y *= FRICTION
    }
  } else {
    // AI control
    updateAIPlayer(player, ball, difficulty, dt)
  }

  // Apply velocity
  player.position.x += player.velocity.x * dt
  player.position.y += player.velocity.y * dt

  // Keep player on pitch
  player.position.x = clamp(player.position.x, -PITCH_WIDTH / 2, PITCH_WIDTH / 2)
  player.position.y = clamp(player.position.y, -PITCH_HEIGHT / 2, PITCH_HEIGHT / 2)
}

function updateAIPlayer(player: Player, ball: Ball, difficulty: number, dt: number) {
  const target = getAITarget(player, ball, difficulty)
  const dirToTarget = normalize({
    x: target.x - player.position.x,
    y: target.y - player.position.y
  })

  const dist = distance(player.position, target)
  const speed = PLAYER_SPEED * (0.7 + difficulty * 0.3)

  if (dist > 1) {
    player.velocity.x = lerp(player.velocity.x, dirToTarget.x * speed, 0.1)
    player.velocity.y = lerp(player.velocity.y, dirToTarget.y * speed, 0.1)
  } else {
    player.velocity.x *= FRICTION
    player.velocity.y *= FRICTION
  }

  // Apply formation constraint
  const distFromHome = distance(player.position, player.homePosition)
  if (distFromHome > 25) {
    const dirHome = normalize({
      x: player.homePosition.x - player.position.x,
      y: player.homePosition.y - player.position.y
    })
    player.velocity.x += dirHome.x * 0.5
    player.velocity.y += dirHome.y * 0.5
  }
}

function getAITarget(player: Player, ball: Ball, difficulty: number): Vector2 {
  const isAttacking = player.teamId === 'home'
  const goalX = isAttacking ? PITCH_WIDTH / 2 : -PITCH_WIDTH / 2

  if (player.role === 'GK') {
    // Goalkeeper stays near goal
    return {
      x: goalX * 0.9,
      y: clamp(ball.y * 0.5, -GOAL_WIDTH / 2, GOAL_WIDTH / 2)
    }
  }

  // Check if ball is close
  const distToBall = distance(player.position, ball.position)
  const chaseThreshold = 15 + difficulty * 10

  if (distToBall < chaseThreshold && (!ball.owner || ball.owner.teamId !== player.teamId)) {
    // Chase ball
    return ball.position
  }

  // Return to formation with offensive/defensive shift
  const ballProgress = ball.x / (PITCH_WIDTH / 2)
  const shift = isAttacking ? Math.max(0, ballProgress) : Math.min(0, ballProgress)

  return {
    x: player.homePosition.x + shift * 20,
    y: player.homePosition.y
  }
}

// ============================================
// BALL PHYSICS
// ============================================

function updateBall(ball: Ball, players: Player[], dt: number) {
  if (!ball.inPlay) return

  // Apply velocity
  ball.position.x += ball.velocity.x * dt
  ball.position.y += ball.velocity.y * dt

  // Apply friction
  ball.velocity.x *= BALL_FRICTION
  ball.velocity.y *= BALL_FRICTION

  // Stop if very slow
  if (Math.abs(ball.velocity.x) < 0.01) ball.velocity.x = 0
  if (Math.abs(ball.velocity.y) < 0.01) ball.velocity.y = 0

  // Bounce off sidelines
  if (ball.position.y <= -PITCH_HEIGHT / 2 + BALL_RADIUS ||
      ball.position.y >= PITCH_HEIGHT / 2 - BALL_RADIUS) {
    ball.velocity.y *= -0.8
    ball.position.y = clamp(ball.position.y, -PITCH_HEIGHT / 2 + BALL_RADIUS, PITCH_HEIGHT / 2 - BALL_RADIUS)
  }

  // Check for goals
  if (ball.position.x <= -PITCH_WIDTH / 2 && Math.abs(ball.position.y) < GOAL_WIDTH / 2) {
    return 'away_goal'
  }
  if (ball.position.x >= PITCH_WIDTH / 2 && Math.abs(ball.position.y) < GOAL_WIDTH / 2) {
    return 'home_goal'
  }

  // Bounce off end lines (outside goal)
  if (ball.position.x <= -PITCH_WIDTH / 2 + BALL_RADIUS ||
      ball.position.x >= PITCH_WIDTH / 2 - BALL_RADIUS) {
    if (Math.abs(ball.position.y) >= GOAL_WIDTH / 2) {
      ball.velocity.x *= -0.8
      ball.position.x = clamp(ball.position.x, -PITCH_WIDTH / 2 + BALL_RADIUS, PITCH_WIDTH / 2 - BALL_RADIUS)
    }
  }

  // Check player collisions
  for (const player of players) {
    const dist = distance(player.position, ball.position)
    if (dist < PLAYER_RADIUS + BALL_RADIUS) {
      // Player touches ball
      if (!ball.owner || ball.owner !== player) {
        ball.owner = player
        ball.lastTouch = player.teamId
        player.hasBall = true
      }

      // Dribble direction
      const dribbleDir = normalize(player.velocity)
      if (dribbleDir.x !== 0 || dribbleDir.y !== 0) {
        ball.velocity.x = dribbleDir.x * 3
        ball.velocity.y = dribbleDir.y * 3
      }

      // Keep ball close
      const pushDir = normalize({
        x: ball.position.x - player.position.x,
        y: ball.position.y - player.position.y
      })
      ball.position.x = player.position.x + pushDir.x * (PLAYER_RADIUS + BALL_RADIUS + 0.1)
      ball.position.y = player.position.y + pushDir.y * (PLAYER_RADIUS + BALL_RADIUS + 0.1)
    }
  }

  return null
}

// ============================================
// ACTIONS
// ============================================

export function doPass(game: GameState, controls: ControlState) {
  const ball = game.ball
  if (!ball.owner) return

  const passer = ball.owner
  const isAttacking = passer.teamId === 'home'

  // Find nearest teammate in front
  let bestTeammate: Player | null = null
  let bestDist = Infinity

  for (const player of game.players) {
    if (player.teamId === passer.teamId && player !== passer) {
      const ahead = isAttacking ? player.position.x > passer.position.x : player.position.x < passer.position.x
      if (ahead) {
        const dist = distance(passer.position, player.position)
        if (dist < bestDist && dist < 40) {
          bestDist = dist
          bestTeammate = player
        }
      }
    }
  }

  let target: Vector2
  if (bestTeammate) {
    target = bestTeammate.position
  } else {
    // Pass forward into space
    target = {
      x: passer.position.x + (isAttacking ? 20 : -20),
      y: passer.position.y
    }
  }

  const dir = normalize({ x: target.x - passer.position.x, y: target.y - passer.position.y })
  ball.velocity.x = dir.x * BALL_PASS_SPEED
  ball.velocity.y = dir.y * BALL_PASS_SPEED
  ball.owner = null
  passer.hasBall = false
}

export function doShoot(game: GameState, controls: ControlState) {
  const ball = game.ball
  if (!ball.owner) return

  const shooter = ball.owner
  const isAttacking = shooter.teamId === 'home'
  const goalX = isAttacking ? PITCH_WIDTH / 2 : -PITCH_WIDTH / 2

  // Aim at goal with some error based on distance
  const distToGoal = Math.abs(goalX - shooter.position.x)
  const error = (distToGoal / PITCH_WIDTH) * 5

  const targetY = clamp(
    (Math.random() - 0.5) * error,
    -GOAL_WIDTH / 2 + 1,
    GOAL_WIDTH / 2 - 1
  )

  const dir = normalize({
    x: goalX - shooter.position.x,
    y: targetY - shooter.position.y
  })

  ball.velocity.x = dir.x * BALL_SHOOT_SPEED
  ball.velocity.y = dir.y * BALL_SHOOT_SPEED
  ball.owner = null
  shooter.hasBall = false
}

export function doCross(game: GameState, controls: ControlState) {
  const ball = game.ball
  if (!ball.owner) return

  const crosser = ball.owner
  const isAttacking = crosser.teamId === 'home'

  // Cross towards far post
  const targetX = isAttacking ? PITCH_WIDTH / 2 - 10 : -PITCH_WIDTH / 2 + 10
  const targetY = isAttacking ? -20 : 20

  const dir = normalize({
    x: targetX - crosser.position.x,
    y: targetY - crosser.position.y
  })

  ball.velocity.x = dir.x * BALL_CROSS_SPEED
  ball.velocity.y = dir.y * BALL_CROSS_SPEED
  ball.owner = null
  crosser.hasBall = false
}

// ============================================
// GOAL DETECTION & RESET
// ============================================

export function handleGoal(game: GameState, scoringTeam: 'home' | 'away') {
  if (scoringTeam === 'home') {
    game.homeScore++
  } else {
    game.awayScore++
  }

  game.isGoal = true
  game.goalTeam = scoringTeam
  game.isPaused = true

  // Reset after delay
  setTimeout(() => resetAfterGoal(game), 2000)
}

function resetAfterGoal(game: GameState) {
  game.ball.position = { x: 0, y: 0 }
  game.ball.velocity = { x: 0, y: 0 }
  game.ball.owner = null
  game.ball.inPlay = true
  game.ball.lastTouch = null

  // Reset players to formation
  for (const player of game.players) {
    player.position = { ...player.homePosition }
    player.velocity = { x: 0, y: 0 }
    player.hasBall = false
    player.isControlling = false
  }

  game.isGoal = false
  game.goalTeam = null
  game.isPaused = false
}

// ============================================
// GAME LOOP
// ============================================

let controlledPlayerIndex = 0

export function getControlledPlayer(game: GameState): Player | null {
  const homePlayers = game.players.filter(p => p.teamId === 'home')
  if (controlledPlayerIndex >= homePlayers.length) {
    controlledPlayerIndex = 0
  }
  return homePlayers[controlledPlayerIndex] || null
}

export function switchControlledPlayer(game: GameState, ball: Ball) {
  const homePlayers = game.players.filter(p => p.teamId === 'home')

  // Find player closest to ball
  let closest: Player | null = null
  let closestDist = Infinity

  for (const player of homePlayers) {
    const dist = distance(player.position, ball.position)
    if (dist < closestDist) {
      closestDist = dist
      closest = player
    }
  }

  if (closest) {
    controlledPlayerIndex = homePlayers.indexOf(closest)
  }
}

export function updateGame(
  game: GameState,
  controls: ControlState,
  difficulty: number,
  dt: number
) {
  if (game.isPaused) return

  // Update game time
  game.gameTime += dt

  // Get controlled player
  const controlledPlayer = getControlledPlayer(game)

  // Auto-switch when ball changes possession
  if (game.ball.lastTouch === 'away') {
    switchControlledPlayer(game, game.ball)
  }

  // Update all players
  for (const player of game.players) {
    const isControlled = player === controlledPlayer
    updatePlayerMovement(player, game.ball, controls, isControlled, difficulty, dt)
  }

  // Update ball
  const goalResult = updateBall(game.ball, game.players, dt)
  if (goalResult === 'home_goal') {
    handleGoal(game, 'home')
  } else if (goalResult === 'away_goal') {
    handleGoal(game, 'away')
  }

  // Update possession
  if (game.ball.owner) {
    game.possession = game.ball.owner.teamId
  }

  // Clear pass/shoot/cross after triggering
  if (controls.pass || controls.shoot || controls.cross) {
    controls.pass = false
    controls.shoot = false
    controls.cross = false
  }
}

// ============================================
// RENDERING HELPERS
// ============================================

export function worldToScreen(x: number, y: number, canvasWidth: number, canvasHeight: number, cameraX: number, cameraY: number): [number, number] {
  const scaleX = canvasWidth / PITCH_WIDTH
  const scaleY = canvasHeight / PITCH_HEIGHT
  const scale = Math.min(scaleX, scaleY)

  const screenX = (x - cameraX) * scale + canvasWidth / 2
  const screenY = (y - cameraY) * scale + canvasHeight / 2

  return [screenX, screenY]
}

export function getCameraTarget(ball: Ball, players: Player[]): Vector2 {
  // Camera follows ball with slight lead
  return {
    x: ball.position.x + ball.velocity.x * 2,
    y: ball.position.y * 0.5
  }
}
