// Client-side type definitions

export type Position = 'GK' | 'DEF' | 'MID' | 'FWD';

export interface Player {
  id: number;
  webName: string;
  firstName: string;
  secondName: string;
  teamId: number;
  position: number;
  cost: number;
  form: string;
  totalPoints: number;
  pointsPerGame: string;
  selectedByPercent: string;
  status: string;
  news: string;
  chanceOfPlaying: number | null;
  minutes: number;
  goals: number;
  assists: number;
  cleanSheets: number;
  penaltiesOrder: number | null;
  cornersOrder: number | null;
  photoCode: number;
}

export interface Team {
  id: number;
  name: string;
  shortName: string;
  strength: number;
}

export interface Gameweek {
  id: number;
  name: string;
  deadlineTime: string;
  finished: boolean;
  isCurrent: boolean;
  isNext: boolean;
}

export interface BootstrapData {
  players: Player[];
  teams: Team[];
  currentGameweek: number;
  gameweeks: Gameweek[];
}

export interface FixturePreview {
  gameweek: number;
  opponent: string;
  isHome: boolean;
  difficulty: number;
}

export interface PlayerPrediction {
  playerId: number;
  webName: string;
  teamShortName: string;
  position: Position;
  cost: number;
  photoCode: number;
  predictedPointsN: number;
  predictedPointsPerGW: number;
  confidence: number;
  form: number;
  fixtureScore: number;
  minutesRisk: number;
  nextFixtures: FixturePreview[];
  status: string;
  chanceOfPlaying: number | null;
  selectedByPercent: string;
  penaltiesTaker: boolean;
  setpieceTaker: boolean;
  ictIndex: number;
  expectedGoals: number;
  expectedAssists: number;
  expectedGoalInvolvements: number;
  totalPoints: number;
  goalsScored: number;
  assists: number;
  cleanSheets: number;
  bonus: number;
  valueScore: number;
  teamMomentum: number;
}

export interface SquadPlayer {
  id: number;
  webName: string;
  position: Position;
  cost: number;
  teamId: number;
  photoCode?: number;
}

export interface TransferRecommendation {
  playerOut: PlayerPrediction;
  playerIn: PlayerPrediction;
  netGain: number;
  costChange: number;
  budgetAfter: number;
}

export interface PositionTargets {
  position: Position;
  targets: PlayerPrediction[];
}

export interface RecommendationResponse {
  bestTransfer: TransferRecommendation | null;
  topTransfers: TransferRecommendation[];
  topTargetsByPosition: PositionTargets[];
  currentGameweek: number;
  horizon: number;
}

export interface MatchHistory {
  gameweek: number;
  opponent: string;
  wasHome: boolean;
  points: number;
  minutes: number;
  goals: number;
  assists: number;
  cleanSheet: boolean;
  bonus: number;
  xG: number;
  xA: number;
}

export interface PredictionBreakdown {
  baseScore: number;
  fixtureAdjustments: { 
    gameweek: number; 
    opponent: string; 
    difficulty: number; 
    multiplier: number;
    isHome: boolean;
    csChance: number;
  }[];
  minutesRiskPenalty: number;
  setpieceBonus: number;
  finalScore: number;
  confidenceFactors: string[];
  ictBonus: number;
  xGBonus: number;
  formTrend: 'rising' | 'stable' | 'falling';
  homeAwayAdjustment: number;
  teamMomentum: number;
  cleanSheetChance: number;
  goalChance: number;
  assistChance: number;
}

export interface PlayerDetail {
  player: PlayerPrediction;
  recentMatches: MatchHistory[];
  predictionBreakdown: PredictionBreakdown;
}

export interface TeamFixture {
  teamId: number;
  gameweek: number;
  opponent: string;
  isHome: boolean;
  difficulty: number;
}

export interface TeamFixturesResponse {
  teams: { id: number; name: string; shortName: string }[];
  fixtures: TeamFixture[];
  currentGameweek: number;
}

// Position code to string mapping
export const POSITION_MAP: Record<number, Position> = {
  1: 'GK',
  2: 'DEF',
  3: 'MID',
  4: 'FWD',
};

export const POSITION_NAMES: Record<Position, string> = {
  GK: 'Goalkeeper',
  DEF: 'Defender',
  MID: 'Midfielder',
  FWD: 'Forward',
};
