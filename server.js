const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// ===================
// CACHE SYSTEM
// ===================
class Cache {
  constructor(ttlMs = 600000) {
    this.cache = new Map();
    this.ttl = ttlMs;
  }

  get(key) {
    const item = this.cache.get(key);
    if (!item) return null;
    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return null;
    }
    return item.value;
  }

  set(key, value) {
    this.cache.set(key, { value, expiry: Date.now() + this.ttl });
  }
}

const cache = new Cache(600000); // 10 minute cache

// ===================
// FPL API SERVICE
// ===================
const FPL_BASE_URL = 'https://fantasy.premierleague.com/api';

async function fetchFPL(endpoint) {
  const cached = cache.get(endpoint);
  if (cached) return cached;

  const response = await fetch(`${FPL_BASE_URL}${endpoint}`);
  if (!response.ok) throw new Error(`FPL API error: ${response.status}`);
  
  const data = await response.json();
  cache.set(endpoint, data);
  return data;
}

async function getBootstrap() {
  return fetchFPL('/bootstrap-static/');
}

async function getFixtures() {
  return fetchFPL('/fixtures/');
}

async function getPlayerSummary(playerId) {
  return fetchFPL(`/element-summary/${playerId}/`);
}

// ===================
// PREDICTION SERVICE
// ===================
const POSITION_MAP = { 1: 'GK', 2: 'DEF', 3: 'MID', 4: 'FWD' };

const POINTS_SYSTEM = {
  GK: { cleanSheet: 4, goal: 6, assist: 3, goalConceded: -0.5 },
  DEF: { cleanSheet: 4, goal: 6, assist: 3, goalConceded: -0.5 },
  MID: { cleanSheet: 1, goal: 5, assist: 3, goalConceded: 0 },
  FWD: { cleanSheet: 0, goal: 4, assist: 3, goalConceded: 0 },
};

let teamsById = new Map();
let fixturesData = [];
let teamMomentum = new Map();

async function loadData() {
  const bootstrap = await getBootstrap();
  const fixtures = await getFixtures();
  
  teamsById = new Map(bootstrap.teams.map(t => [t.id, t]));
  fixturesData = fixtures;
  
  // Calculate team momentum
  const teamResults = new Map();
  const finished = fixtures.filter(f => f.finished && f.team_h_score !== null)
    .sort((a, b) => (b.event ?? 0) - (a.event ?? 0));

  for (const f of finished.slice(0, 100)) {
    const homeResult = f.team_h_score > f.team_a_score ? 3 : f.team_h_score === f.team_a_score ? 1 : 0;
    const awayResult = f.team_a_score > f.team_h_score ? 3 : f.team_a_score === f.team_h_score ? 1 : 0;
    
    if (!teamResults.has(f.team_h)) teamResults.set(f.team_h, []);
    if (!teamResults.has(f.team_a)) teamResults.set(f.team_a, []);
    teamResults.get(f.team_h).push(homeResult);
    teamResults.get(f.team_a).push(awayResult);
  }

  for (const [teamId, results] of teamResults) {
    const last5 = results.slice(0, 5);
    const total = last5.reduce((sum, r, i) => sum + r * (5 - i), 0);
    teamMomentum.set(teamId, total / 45);
  }
}

function getFdrMultiplier(fdr, position) {
  const factor = position === 'FWD' ? 0.7 : position === 'MID' ? 0.8 : 1.0;
  switch (fdr) {
    case 1: return 1 + (0.35 * factor);
    case 2: return 1 + (0.15 * factor);
    case 3: return 1.0;
    case 4: return 1 - (0.12 * factor);
    case 5: return 1 - (0.25 * factor);
    default: return 1.0;
  }
}

function calculateFormTrend(history) {
  if (history.length < 4) return 'stable';
  const last5 = history.slice(-5);
  const earlyAvg = last5.slice(0, 2).reduce((s, h) => s + h.total_points, 0) / 2;
  const recentAvg = last5.slice(-2).reduce((s, h) => s + h.total_points, 0) / 2;
  const diff = recentAvg - earlyAvg;
  return diff > 1.5 ? 'rising' : diff < -1.5 ? 'falling' : 'stable';
}

async function calculatePrediction(player, horizon = 5) {
  await loadData();
  
  const summary = await getPlayerSummary(player.id);
  const history = summary.history;
  const upcoming = summary.fixtures.slice(0, horizon);
  const position = POSITION_MAP[player.element_type];
  const pts = POINTS_SYSTEM[position];

  let totalPoints = 0;
  const nextFixtures = [];

  const avgMinutes = history.length > 0 
    ? history.slice(-5).reduce((s, h) => s + h.minutes, 0) / Math.min(history.length, 5)
    : 45;
  const minutesProb = Math.min(avgMinutes / 90, 1) * (player.chance_of_playing_next_round ?? 100) / 100;
  
  const baseScore = history.length > 0
    ? history.slice(-5).reduce((s, h) => s + h.total_points, 0) / Math.min(history.length, 5)
    : 2;

  const formTrend = calculateFormTrend(history);
  const formMult = formTrend === 'rising' ? 1.1 : formTrend === 'falling' ? 0.9 : 1.0;
  const momentum = teamMomentum.get(player.team) ?? 0.5;

  for (const fix of upcoming) {
    const oppId = fix.is_home ? fix.team_a : fix.team_h;
    const opp = teamsById.get(oppId);
    const fdrMult = getFdrMultiplier(fix.difficulty, position);

    // Clean sheet probability
    const teamDef = fix.is_home 
      ? teamsById.get(player.team)?.strength_defence_home ?? 1000
      : teamsById.get(player.team)?.strength_defence_away ?? 1000;
    const oppAtk = fix.is_home
      ? opp?.strength_attack_away ?? 1000
      : opp?.strength_attack_home ?? 1000;
    const csProb = Math.max(0.05, Math.min(0.5, 0.5 + (teamDef - oppAtk) / 400));

    // Goal/assist probability
    const goalProb = (player.expected_goals_per_90 || 0) * (1100 / Math.max(oppAtk, 800)) + 
      (player.penalties_order <= 1 ? 0.08 : 0);
    const assistProb = (player.expected_assists_per_90 || 0) * (1100 / Math.max(oppAtk, 800));

    let fixPoints = 2 * minutesProb; // Appearance
    fixPoints += pts.cleanSheet * csProb * minutesProb;
    fixPoints += pts.goal * goalProb * minutesProb;
    fixPoints += pts.assist * assistProb * minutesProb;
    fixPoints += (player.bonus / Math.max(player.starts, 1)) * minutesProb;
    fixPoints *= fdrMult * formMult * (0.9 + momentum * 0.2);

    totalPoints += Math.max(0, fixPoints);

    nextFixtures.push({
      gameweek: fix.event,
      opponent: opp?.short_name ?? 'UNK',
      isHome: fix.is_home,
      difficulty: fix.difficulty,
    });
  }

  if (upcoming.length < horizon && upcoming.length > 0) {
    totalPoints = (totalPoints / upcoming.length) * horizon;
  }

  const team = teamsById.get(player.team);
  const minutesRisk = 1 - minutesProb;
  const confidence = Math.min(100, Math.round(
    Math.min(avgMinutes / 90, 1) * 35 +
    Math.min(history.length / 15, 1) * 25 +
    ((player.chance_of_playing_next_round ?? 100) / 100) * 20 +
    (formTrend === 'stable' ? 20 : formTrend === 'rising' ? 15 : 8)
  ));

  return {
    playerId: player.id,
    webName: player.web_name,
    teamShortName: team?.short_name ?? 'UNK',
    position,
    cost: player.now_cost,
    photoCode: player.code,
    predictedPointsN: Math.round(totalPoints * 10) / 10,
    predictedPointsPerGW: Math.round((totalPoints / horizon) * 10) / 10,
    confidence,
    form: Math.round(baseScore * 10) / 10,
    fixtureScore: upcoming.length > 0 
      ? Math.round(upcoming.reduce((s, f) => s + getFdrMultiplier(f.difficulty, position), 0) / upcoming.length * 100) / 100
      : 1,
    minutesRisk: Math.round(minutesRisk * 100) / 100,
    nextFixtures,
    status: player.status,
    chanceOfPlaying: player.chance_of_playing_next_round,
    selectedByPercent: player.selected_by_percent,
    penaltiesTaker: player.penalties_order !== null && player.penalties_order <= 1,
    setpieceTaker: (player.corners_and_indirect_freekicks_order !== null && player.corners_and_indirect_freekicks_order <= 1),
    ictIndex: Math.round(parseFloat(player.ict_index) * 10) / 10,
    expectedGoals: Math.round(parseFloat(player.expected_goals) * 100) / 100,
    expectedAssists: Math.round(parseFloat(player.expected_assists) * 100) / 100,
    expectedGoalInvolvements: Math.round(parseFloat(player.expected_goal_involvements) * 100) / 100,
    totalPoints: player.total_points,
    goalsScored: player.goals_scored,
    assists: player.assists,
    cleanSheets: player.clean_sheets,
    bonus: player.bonus,
    valueScore: player.now_cost > 0 ? Math.round((totalPoints / (player.now_cost / 10)) * 100) / 100 : 0,
    teamMomentum: Math.round((momentum) * 100),
  };
}

async function getBreakdown(player, horizon = 5) {
  await loadData();
  const summary = await getPlayerSummary(player.id);
  const history = summary.history;
  const upcoming = summary.fixtures.slice(0, horizon);
  const position = POSITION_MAP[player.element_type];

  const baseScore = history.length > 0
    ? history.slice(-5).reduce((s, h) => s + h.total_points, 0) / Math.min(history.length, 5) : 2;
  
  const formTrend = calculateFormTrend(history);
  const momentum = teamMomentum.get(player.team) ?? 0.5;
  const avgMinutes = history.length > 0 
    ? history.slice(-5).reduce((s, h) => s + h.minutes, 0) / Math.min(history.length, 5) : 45;
  const minutesRisk = 1 - Math.min(avgMinutes / 90, 1);

  const fixtureAdjustments = upcoming.map(f => {
    const oppId = f.is_home ? f.team_a : f.team_h;
    const opp = teamsById.get(oppId);
    const teamDef = f.is_home 
      ? teamsById.get(player.team)?.strength_defence_home ?? 1000
      : teamsById.get(player.team)?.strength_defence_away ?? 1000;
    const oppAtk = f.is_home ? opp?.strength_attack_away ?? 1000 : opp?.strength_attack_home ?? 1000;
    
    return {
      gameweek: f.event,
      opponent: opp?.short_name ?? 'UNK',
      difficulty: f.difficulty,
      multiplier: getFdrMultiplier(f.difficulty, position),
      isHome: f.is_home,
      csChance: Math.round(Math.max(5, Math.min(50, 50 + (teamDef - oppAtk) / 8))),
    };
  });

  const confidenceFactors = [];
  if (history.length < 5) confidenceFactors.push('Limited match history');
  if (minutesRisk > 0.3) confidenceFactors.push('Rotation risk');
  if (player.chance_of_playing_next_round !== null && player.chance_of_playing_next_round < 100) {
    confidenceFactors.push(`${player.chance_of_playing_next_round}% chance of playing`);
  }
  if (player.news) confidenceFactors.push(`News: ${player.news}`);
  if (formTrend === 'falling') confidenceFactors.push('Form declining ↓');
  if (formTrend === 'rising') confidenceFactors.push('Form improving ↑');
  if (momentum > 0.7) confidenceFactors.push('Team in great form');
  if (momentum < 0.3) confidenceFactors.push('Team struggling');

  const pred = await calculatePrediction(player, horizon);

  return {
    baseScore: Math.round(baseScore * 10) / 10,
    fixtureAdjustments,
    minutesRiskPenalty: Math.round(minutesRisk * 100) / 100,
    setpieceBonus: (player.penalties_order <= 1 ? 0.4 : 0) + (player.corners_and_indirect_freekicks_order <= 1 ? 0.15 : 0),
    finalScore: pred.predictedPointsN,
    confidenceFactors,
    ictBonus: Math.min(parseFloat(player.ict_index) / 200, 0.5),
    xGBonus: (player.expected_goals_per_90 || 0) + (player.expected_assists_per_90 || 0),
    formTrend,
    homeAwayAdjustment: 0,
    teamMomentum: Math.round(momentum * 100),
    cleanSheetChance: fixtureAdjustments.length > 0 
      ? Math.round(fixtureAdjustments.reduce((s, f) => s + f.csChance, 0) / fixtureAdjustments.length) : 0,
    goalChance: Math.round((player.expected_goals_per_90 || 0) * 100),
    assistChance: Math.round((player.expected_assists_per_90 || 0) * 100),
  };
}

// ===================
// API ROUTES
// ===================

// Bootstrap data
app.get('/api/bootstrap', async (req, res) => {
  try {
    const data = await getBootstrap();
    const currentGW = data.events.find(gw => gw.is_current) ?? data.events.find(gw => gw.is_next);
    
    res.json({
      players: data.elements.map(p => ({
        id: p.id,
        webName: p.web_name,
        firstName: p.first_name,
        secondName: p.second_name,
        teamId: p.team,
        position: p.element_type,
        cost: p.now_cost,
        form: p.form,
        totalPoints: p.total_points,
        pointsPerGame: p.points_per_game,
        selectedByPercent: p.selected_by_percent,
        status: p.status,
        news: p.news,
        chanceOfPlaying: p.chance_of_playing_next_round,
        minutes: p.minutes,
        goals: p.goals_scored,
        assists: p.assists,
        cleanSheets: p.clean_sheets,
        penaltiesOrder: p.penalties_order,
        cornersOrder: p.corners_and_indirect_freekicks_order,
        photoCode: p.code,
      })),
      teams: data.teams.map(t => ({
        id: t.id,
        name: t.name,
        shortName: t.short_name,
        strength: t.strength,
      })),
      currentGameweek: currentGW?.id ?? 1,
      gameweeks: data.events.map(gw => ({
        id: gw.id,
        name: gw.name,
        deadlineTime: gw.deadline_time,
        finished: gw.finished,
        isCurrent: gw.is_current,
        isNext: gw.is_next,
      })),
    });
  } catch (error) {
    console.error('Bootstrap error:', error);
    res.status(500).json({ error: 'Failed to fetch FPL data' });
  }
});

// Player detail
app.get('/api/player/:id', async (req, res) => {
  try {
    const playerId = parseInt(req.params.id);
    const horizon = parseInt(req.query.horizon) || 5;
    
    const bootstrap = await getBootstrap();
    const player = bootstrap.elements.find(p => p.id === playerId);
    if (!player) return res.status(404).json({ error: 'Player not found' });

    const summary = await getPlayerSummary(playerId);
    const prediction = await calculatePrediction(player, horizon);
    const breakdown = await getBreakdown(player, horizon);

    await loadData();
    const recentMatches = summary.history.slice(-5).map(h => ({
      gameweek: h.round,
      opponent: teamsById.get(h.opponent_team)?.short_name ?? 'UNK',
      wasHome: h.was_home,
      points: h.total_points,
      minutes: h.minutes,
      goals: h.goals_scored,
      assists: h.assists,
      cleanSheet: h.clean_sheets > 0,
      bonus: h.bonus,
      xG: parseFloat(h.expected_goals),
      xA: parseFloat(h.expected_assists),
    }));

    res.json({ player: prediction, recentMatches, predictionBreakdown: breakdown });
  } catch (error) {
    console.error('Player error:', error);
    res.status(500).json({ error: 'Failed to fetch player data' });
  }
});

// Recommendations
app.post('/api/recommendations', async (req, res) => {
  try {
    const { squad, bank, horizon = 5, includeInjured = false } = req.body;
    if (!squad || !Array.isArray(squad)) {
      return res.status(400).json({ error: 'Invalid squad' });
    }

    const bootstrap = await getBootstrap();
    const currentGW = bootstrap.events.find(gw => gw.is_current)?.id ?? 1;

    // Get predictions for squad
    const squadPredictions = new Map();
    for (const sp of squad) {
      const player = bootstrap.elements.find(p => p.id === sp.id);
      if (player) {
        squadPredictions.set(sp.id, await calculatePrediction(player, horizon));
      }
    }

    // Get top targets by position
    const positions = ['GK', 'DEF', 'MID', 'FWD'];
    const topTargetsByPosition = [];
    
    for (const pos of positions) {
      const posCode = { GK: 1, DEF: 2, MID: 3, FWD: 4 }[pos];
      const players = bootstrap.elements.filter(p => 
        p.element_type === posCode && 
        (includeInjured || p.status === 'a' || p.status === 'd')
      );
      
      const predictions = await Promise.all(
        players.slice(0, 50).map(p => calculatePrediction(p, horizon))
      );
      
      topTargetsByPosition.push({
        position: pos,
        targets: predictions.sort((a, b) => b.predictedPointsN - a.predictedPointsN).slice(0, 10),
      });
    }

    // Calculate transfers
    const transfers = [];
    const squadIds = new Set(squad.map(p => p.id));
    const teamCounts = new Map();
    squad.forEach(p => {
      const player = bootstrap.elements.find(e => e.id === p.id);
      if (player) teamCounts.set(player.team, (teamCounts.get(player.team) ?? 0) + 1);
    });

    for (const sp of squad) {
      const currentPred = squadPredictions.get(sp.id);
      if (!currentPred) continue;

      const available = bank + sp.cost;
      const posTargets = topTargetsByPosition.find(t => t.position === sp.position)?.targets ?? [];

      for (const candidate of posTargets) {
        if (squadIds.has(candidate.playerId)) continue;
        if (candidate.cost > available) continue;

        const candPlayer = bootstrap.elements.find(p => p.id === candidate.playerId);
        if (!candPlayer) continue;

        const currentTeam = bootstrap.elements.find(p => p.id === sp.id)?.team;
        const candTeamCount = teamCounts.get(candPlayer.team) ?? 0;
        if (candPlayer.team !== currentTeam && candTeamCount >= 3) continue;

        const netGain = candidate.predictedPointsN - currentPred.predictedPointsN;
        if (netGain > 0) {
          transfers.push({
            playerOut: currentPred,
            playerIn: candidate,
            netGain: Math.round(netGain * 10) / 10,
            costChange: sp.cost - candidate.cost,
            budgetAfter: bank + sp.cost - candidate.cost,
          });
        }
      }
    }

    transfers.sort((a, b) => b.netGain - a.netGain);

    res.json({
      bestTransfer: transfers[0] ?? null,
      topTransfers: transfers.slice(0, 10),
      topTargetsByPosition,
      currentGameweek: currentGW,
      horizon,
    });
  } catch (error) {
    console.error('Recommendations error:', error);
    res.status(500).json({ error: 'Failed to generate recommendations' });
  }
});

// Team fixtures
app.get('/api/team-fixtures', async (req, res) => {
  try {
    const numWeeks = parseInt(req.query.weeks) || 6;
    await loadData();
    
    const bootstrap = await getBootstrap();
    const currentGW = bootstrap.events.find(gw => gw.is_current)?.id ?? 1;

    const teams = Array.from(teamsById.values()).map(t => ({
      id: t.id,
      name: t.name,
      shortName: t.short_name,
    }));

    const fixtures = [];
    for (const f of fixturesData) {
      if (f.event === null || f.event < currentGW || f.event >= currentGW + numWeeks) continue;

      fixtures.push({
        teamId: f.team_h,
        gameweek: f.event,
        opponent: teamsById.get(f.team_a)?.short_name ?? 'UNK',
        isHome: true,
        difficulty: f.team_h_difficulty,
      });
      fixtures.push({
        teamId: f.team_a,
        gameweek: f.event,
        opponent: teamsById.get(f.team_h)?.short_name ?? 'UNK',
        isHome: false,
        difficulty: f.team_a_difficulty,
      });
    }

    res.json({ teams, fixtures, currentGameweek: currentGW });
  } catch (error) {
    console.error('Fixtures error:', error);
    res.status(500).json({ error: 'Failed to fetch fixtures' });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Serve static files from client build
app.use(express.static(path.join(__dirname, 'client', 'dist')));

// SPA fallback
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'client', 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 FPL Transfer Recommender running on port ${PORT}`);
});
