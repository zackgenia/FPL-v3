import { useState, useEffect, useMemo } from 'react';
import { Loading, ErrorMessage } from '../components';
import { getTeamFixtures } from '../api';
import type { TeamFixturesResponse } from '../types';

export function FixtureTracker() {
  const [data, setData] = useState<TeamFixturesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [numWeeks, setNumWeeks] = useState(6);
  const [sortBy, setSortBy] = useState<'name' | 'difficulty'>('difficulty');

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError(null);
      try {
        const result = await getTeamFixtures(numWeeks);
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load fixtures');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [numWeeks]);

  // Calculate difficulty score for each team
  const teamDifficultyScores = useMemo(() => {
    if (!data) return new Map<number, number>();
    
    const scores = new Map<number, number>();
    for (const team of data.teams) {
      const teamFixtures = data.fixtures.filter(f => f.teamId === team.id);
      const avgDifficulty = teamFixtures.length > 0
        ? teamFixtures.reduce((sum, f) => sum + f.difficulty, 0) / teamFixtures.length
        : 3;
      scores.set(team.id, avgDifficulty);
    }
    return scores;
  }, [data]);

  // Sort teams
  const sortedTeams = useMemo(() => {
    if (!data) return [];
    
    return [...data.teams].sort((a, b) => {
      if (sortBy === 'name') {
        return a.name.localeCompare(b.name);
      } else {
        const scoreA = teamDifficultyScores.get(a.id) ?? 3;
        const scoreB = teamDifficultyScores.get(b.id) ?? 3;
        return scoreA - scoreB; // Lower difficulty = better fixtures
      }
    });
  }, [data, sortBy, teamDifficultyScores]);

  // Get gameweeks to display
  const gameweeks = useMemo(() => {
    if (!data) return [];
    const gws = new Set<number>();
    data.fixtures.forEach(f => gws.add(f.gameweek));
    return Array.from(gws).sort((a, b) => a - b);
  }, [data]);

  const getDifficultyColor = (difficulty: number) => {
    switch (difficulty) {
      case 1: return 'bg-emerald-500 text-white';
      case 2: return 'bg-green-400 text-white';
      case 3: return 'bg-yellow-400 text-slate-800';
      case 4: return 'bg-orange-500 text-white';
      case 5: return 'bg-red-600 text-white';
      default: return 'bg-slate-300 text-slate-600';
    }
  };

  const getDifficultyBadge = (difficulty: number) => {
    switch (difficulty) {
      case 1: return { label: 'Very Easy', color: 'text-emerald-600 bg-emerald-50 border-emerald-200' };
      case 2: return { label: 'Easy', color: 'text-green-600 bg-green-50 border-green-200' };
      case 3: return { label: 'Medium', color: 'text-yellow-700 bg-yellow-50 border-yellow-200' };
      case 4: return { label: 'Hard', color: 'text-orange-600 bg-orange-50 border-orange-200' };
      case 5: return { label: 'Very Hard', color: 'text-red-600 bg-red-50 border-red-200' };
      default: return { label: 'Unknown', color: 'text-slate-600 bg-slate-50 border-slate-200' };
    }
  };

  const getAverageDifficultyLabel = (score: number) => {
    if (score <= 1.8) return { label: 'Excellent', color: 'text-emerald-600' };
    if (score <= 2.3) return { label: 'Good', color: 'text-green-600' };
    if (score <= 2.8) return { label: 'Average', color: 'text-yellow-600' };
    if (score <= 3.5) return { label: 'Tough', color: 'text-orange-600' };
    return { label: 'Very Hard', color: 'text-red-600' };
  };

  if (loading) {
    return <Loading message="Loading fixture data..." />;
  }

  if (error) {
    return <ErrorMessage message={error} />;
  }

  if (!data) {
    return <ErrorMessage message="No fixture data available" />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Fixture Difficulty Tracker</h2>
          <p className="text-slate-500">Plan your transfers based on upcoming fixture difficulty</p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <label className="text-sm text-slate-600">Show:</label>
            <select
              value={numWeeks}
              onChange={(e) => setNumWeeks(parseInt(e.target.value))}
              className="px-3 py-2 bg-white border border-slate-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-fpl-forest/20"
            >
              <option value={4}>4 gameweeks</option>
              <option value={6}>6 gameweeks</option>
              <option value={8}>8 gameweeks</option>
              <option value={10}>10 gameweeks</option>
            </select>
          </div>
          
          <div className="flex items-center gap-2">
            <label className="text-sm text-slate-600">Sort by:</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'name' | 'difficulty')}
              className="px-3 py-2 bg-white border border-slate-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-fpl-forest/20"
            >
              <option value="difficulty">Best Fixtures</option>
              <option value="name">Team Name</option>
            </select>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
        <h3 className="text-sm font-semibold text-slate-700 mb-3">Fixture Difficulty Rating (FDR)</h3>
        <div className="flex flex-wrap gap-3">
          {[1, 2, 3, 4, 5].map(fdr => {
            const badge = getDifficultyBadge(fdr);
            return (
              <div key={fdr} className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold ${getDifficultyColor(fdr)}`}>
                  {fdr}
                </div>
                <span className="text-sm text-slate-600">{badge.label}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gradient-to-r from-slate-50 to-slate-100">
                <th className="text-left py-4 px-4 font-semibold text-slate-700 sticky left-0 bg-slate-50 z-10 min-w-[180px]">
                  Team
                </th>
                <th className="text-center py-4 px-2 font-semibold text-slate-700 min-w-[80px]">
                  Avg FDR
                </th>
                {gameweeks.map(gw => (
                  <th key={gw} className="text-center py-4 px-2 font-semibold text-slate-700 min-w-[70px]">
                    GW{gw}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sortedTeams.map((team, idx) => {
                const avgScore = teamDifficultyScores.get(team.id) ?? 3;
                const avgLabel = getAverageDifficultyLabel(avgScore);
                const teamFixtures = data.fixtures.filter(f => f.teamId === team.id);
                
                return (
                  <tr 
                    key={team.id} 
                    className={`border-t border-slate-100 hover:bg-slate-50/50 transition-colors ${
                      idx < 5 ? 'bg-green-50/30' : idx >= sortedTeams.length - 5 ? 'bg-red-50/30' : ''
                    }`}
                  >
                    <td className="py-3 px-4 sticky left-0 bg-white z-10 border-r border-slate-100">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
                          <span className="text-xs font-bold text-slate-600">{team.shortName}</span>
                        </div>
                        <div>
                          <p className="font-medium text-slate-800">{team.name}</p>
                          {sortBy === 'difficulty' && idx < 3 && (
                            <span className="text-xs text-emerald-600">🔥 Best fixtures</span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-2 text-center">
                      <div className="flex flex-col items-center">
                        <span className="text-lg font-bold text-slate-800">{avgScore.toFixed(2)}</span>
                        <span className={`text-xs font-medium ${avgLabel.color}`}>{avgLabel.label}</span>
                      </div>
                    </td>
                    {gameweeks.map(gw => {
                      const fixture = teamFixtures.find(f => f.gameweek === gw);
                      if (!fixture) {
                        return (
                          <td key={gw} className="py-3 px-2 text-center">
                            <div className="w-full h-12 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 text-sm">
                              -
                            </div>
                          </td>
                        );
                      }
                      
                      return (
                        <td key={gw} className="py-3 px-2 text-center">
                          <div 
                            className={`rounded-lg p-2 ${getDifficultyColor(fixture.difficulty)} transition-transform hover:scale-105 cursor-default`}
                            title={`${team.name} vs ${fixture.opponent} (${fixture.isHome ? 'Home' : 'Away'}) - FDR: ${fixture.difficulty}`}
                          >
                            <div className="text-sm font-bold">{fixture.opponent}</div>
                            <div className="text-xs opacity-80">{fixture.isHome ? 'H' : 'A'}</div>
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Tips */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-xl border border-emerald-200 p-5">
          <h3 className="font-semibold text-emerald-800 mb-2 flex items-center gap-2">
            <span className="text-lg">💡</span>
            Best Fixture Runs
          </h3>
          <p className="text-sm text-emerald-700 mb-3">
            Consider targeting players from these teams for upcoming transfers:
          </p>
          <div className="flex flex-wrap gap-2">
            {sortedTeams.slice(0, 5).map(team => (
              <span 
                key={team.id} 
                className="px-3 py-1.5 bg-white rounded-full text-sm font-medium text-emerald-700 border border-emerald-200"
              >
                {team.name}
              </span>
            ))}
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-red-50 to-orange-50 rounded-xl border border-red-200 p-5">
          <h3 className="font-semibold text-red-800 mb-2 flex items-center gap-2">
            <span className="text-lg">⚠️</span>
            Tough Fixtures Ahead
          </h3>
          <p className="text-sm text-red-700 mb-3">
            Consider selling players from these teams or benching them:
          </p>
          <div className="flex flex-wrap gap-2">
            {sortedTeams.slice(-5).reverse().map(team => (
              <span 
                key={team.id} 
                className="px-3 py-1.5 bg-white rounded-full text-sm font-medium text-red-700 border border-red-200"
              >
                {team.name}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
