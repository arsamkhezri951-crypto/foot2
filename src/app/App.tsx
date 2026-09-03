import React, { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import MainMenu from '../screens/MainMenu'
import TeamSelect from '../screens/TeamSelect'
import MatchSetup from '../screens/MatchSetup'
import Match from '../screens/Match'
import Career from '../screens/Career'
import Tournament from '../screens/Tournament'
import Clubs from '../screens/Clubs'
import Players from '../screens/Players'
import Settings from '../screens/Settings'
import MatchResult from '../screens/MatchResult'
import { loadSettings, saveSettings } from '../data/storage'
import type { GameSettings } from '../data/storage'

interface AppState {
  settings: GameSettings
  homeTeamId: string | null
  awayTeamId: string | null
  matchContext: 'friendly' | 'career' | 'tournament' | null
  matchResult: { homeScore: number; awayScore: number } | null
}

const App: React.FC = () => {
  const [state, setState] = useState<AppState>({
    settings: loadSettings(),
    homeTeamId: null,
    awayTeamId: null,
    matchContext: null,
    matchResult: null
  })

  useEffect(() => {
    document.documentElement.lang = 'en'
  }, [])

  const updateSettings = (settings: Partial<GameSettings>) => {
    const updated = { ...state.settings, ...settings }
    setState(prev => ({ ...prev, settings: updated }))
    saveSettings(settings)
  }

  const setTeams = (homeId: string, awayId: string, context: 'friendly' | 'career' | 'tournament') => {
    setState(prev => ({ ...prev, homeTeamId: homeId, awayTeamId: awayId, matchContext: context }))
  }

  const setMatchResult = (homeScore: number, awayScore: number) => {
    setState(prev => ({ ...prev, matchResult: { homeScore, awayScore } }))
  }

  const resetMatch = () => {
    setState(prev => ({ 
      ...prev, 
      homeTeamId: null, 
      awayTeamId: null, 
      matchContext: null,
      matchResult: null
    }))
  }

  return (
    <BrowserRouter basename="/">
      <Routes>
        <Route path="/" element={
          <MainMenu 
            onNavigate={() => {}}
            career={null}
            cup={null}
          />
        } />
        <Route path="/play-match" element={
          <TeamSelect 
            settings={state.settings}
            onSelect={(home, away) => setTeams(home, away, 'friendly')}
            onBack={() => {}}
          />
        } />
        <Route path="/match-setup" element={
          state.homeTeamId && state.awayTeamId ? (
            <MatchSetup
              homeTeamId={state.homeTeamId}
              awayTeamId={state.awayTeamId}
              settings={state.settings}
              onStart={() => {}}
              onBack={() => {}}
            />
          ) : (
            <Navigate to="/play-match" replace />
          )
        } />
        <Route path="/match" element={
          state.homeTeamId && state.awayTeamId ? (
            <Match
              homeTeamId={state.homeTeamId}
              awayTeamId={state.awayTeamId}
              settings={state.settings}
              context={state.matchContext || 'friendly'}
              onResult={setMatchResult}
              onExit={() => {}}
            />
          ) : (
            <Navigate to="/play-match" replace />
          )
        } />
        <Route path="/career" element={<Career onBack={() => {}} />} />
        <Route path="/tournament" element={<Tournament onBack={() => {}} />} />
        <Route path="/clubs" element={<Clubs onBack={() => {}} />} />
        <Route path="/players" element={<Players onBack={() => {}} />} />
        <Route path="/settings" element={
          <Settings
            settings={state.settings}
            onChange={updateSettings}
            onBack={() => {}}
          />
        } />
        <Route path="/match-result" element={
          state.matchResult ? (
            <MatchResult
              homeTeamId={state.homeTeamId || 'blue'}
              awayTeamId={state.awayTeamId || 'red'}
              homeScore={state.matchResult.homeScore}
              awayScore={state.matchResult.awayScore}
              context={state.matchContext || 'friendly'}
              onRematch={() => {}}
              onMenu={resetMatch}
            />
          ) : (
            <Navigate to="/" replace />
          )
        } />
      </Routes>
    </BrowserRouter>
  )
}

export default App
