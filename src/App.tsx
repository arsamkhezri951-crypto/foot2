import React, { useEffect, useState } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useNavigate,
} from "react-router-dom";

import MainMenu from "../screens/MainMenu";
import TeamSelect from "../screens/TeamSelect";
import MatchSetup from "../screens/MatchSetup";
import Match from "../screens/Match";
import Career from "../screens/Career";
import Tournament from "../screens/Tournament";
import Clubs from "../screens/Clubs";
import Players from "../screens/Players";
import Settings from "../screens/Settings";
import MatchResult from "../screens/MatchResult";

import { loadSettings, saveSettings } from "../data/storage";
import type { GameSettings } from "../data/storage";

interface AppState {
  settings: GameSettings;
  homeTeamId: string | null;
  awayTeamId: string | null;
  matchContext: "friendly" | "career" | "tournament" | null;
  matchResult: {
    homeScore: number;
    awayScore: number;
  } | null;
}

const GameRoutes: React.FC = () => {
  const navigate = useNavigate();

  const [state, setState] = useState<AppState>({
    settings: loadSettings(),
    homeTeamId: null,
    awayTeamId: null,
    matchContext: null,
    matchResult: null,
  });

  useEffect(() => {
    document.documentElement.lang = "en";
    document.documentElement.dir = "ltr";
  }, []);

  const updateSettings = (settings: Partial<GameSettings>) => {
    const updated = {
      ...state.settings,
      ...settings,
    };

    setState((prev) => ({
      ...prev,
      settings: updated,
    }));

    saveSettings(settings);
  };

  const setTeams = (
    homeId: string,
    awayId: string,
    context: "friendly" | "career" | "tournament"
  ) => {
    setState((prev) => ({
      ...prev,
      homeTeamId: homeId,
      awayTeamId: awayId,
      matchContext: context,
    }));
  };

  const setMatchResult = (homeScore: number, awayScore: number) => {
    setState((prev) => ({
      ...prev,
      matchResult: {
        homeScore,
        awayScore,
      },
    }));
  };

  const resetMatch = () => {
    setState((prev) => ({
      ...prev,
      homeTeamId: null,
      awayTeamId: null,
      matchContext: null,
      matchResult: null,
    }));
  };

  return (
    <Routes>
      <Route
        path="/"
        element={
          <MainMenu
            onNavigate={(path: string) => navigate(path)}
            career={null}
            cup={null}
          />
        }
      />

      <Route
        path="/play-match"
        element={
          <TeamSelect
            settings={state.settings}
            onSelect={(home, away) => {
              setTeams(home, away, "friendly");
              navigate("/match-setup");
            }}
            onBack={() => navigate("/")}
          />
        }
      />

      <Route
        path="/match-setup"
        element={
          state.homeTeamId && state.awayTeamId ? (
            <MatchSetup
              homeTeamId={state.homeTeamId}
              awayTeamId={state.awayTeamId}
              settings={state.settings}
              onStart={() => navigate("/match")}
              onBack={() => navigate("/play-match")}
            />
          ) : (
            <Navigate to="/play-match" replace />
          )
        }
      />

      <Route
        path="/match"
        element={
          state.homeTeamId && state.awayTeamId ? (
            <Match
              homeTeamId={state.homeTeamId}
              awayTeamId={state.awayTeamId}
              settings={state.settings}
              context={state.matchContext || "friendly"}
              onResult={(homeScore, awayScore) => {
                setMatchResult(homeScore, awayScore);
                navigate("/match-result");
              }}
              onExit={() => navigate("/")}
            />
          ) : (
            <Navigate to="/play-match" replace />
          )
        }
      />

      <Route
        path="/career"
        element={<Career onBack={() => navigate("/")} />}
      />

      <Route
        path="/tournament"
        element={<Tournament onBack={() => navigate("/")} />}
      />

      <Route
        path="/clubs"
        element={<Clubs onBack={() => navigate("/")} />}
      />

      <Route
        path="/players"
        element={<Players onBack={() => navigate("/")} />}
      />

      <Route
        path="/settings"
        element={
          <Settings
            settings={state.settings}
            onChange={updateSettings}
            onBack={() => navigate("/")}
          />
        }
      />

      <Route
        path="/match-result"
        element={
          state.matchResult ? (
            <MatchResult
              homeTeamId={state.homeTeamId || "blue"}
              awayTeamId={state.awayTeamId || "red"}
              homeScore={state.matchResult.homeScore}
              awayScore={state.matchResult.awayScore}
              context={state.matchContext || "friendly"}
              onRematch={() => {
                setState((prev) => ({
                  ...prev,
                  matchResult: null,
                }));

                navigate("/match-setup");
              }}
              onMenu={() => {
                resetMatch();
                navigate("/");
              }}
            />
          ) : (
            <Navigate to="/" replace />
          )
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

const App: React.FC = () => {
  return (
    <BrowserRouter basename="/foot2">
      <GameRoutes />
    </BrowserRouter>
  );
};

export default App;
