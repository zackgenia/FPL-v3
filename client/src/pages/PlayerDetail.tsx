import { useState, useEffect } from 'react';
import { Loading, ErrorMessage } from '../components';
import { getPlayerDetail } from '../api';
import type { PlayerDetail as PlayerDetailType } from '../types';

interface PlayerDetailProps {
  playerId: number;
  horizon: number;
  onClose: () => void;
}

const getPlayerPhotoUrl = (photoCode: number) => {
  return `https://resources.premierleague.com/premierleague/photos/players/110x140/p${photoCode}.png`;
};

export function PlayerDetail({ playerId, horizon, onClose }: PlayerDetailProps) {
  const [data, setData] = useState<PlayerDetailType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError(null);
      try {
        const result = await getPlayerDetail(playerId, horizon);
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load player');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [playerId, horizon]);

  const getDifficultyColor = (difficulty: number) => {
    switch (difficulty) {
      case 1: return 'bg-emerald-500';
      case 2: return 'bg-green-400';
      case 3: return 'bg-yellow-400';
      case 4: return 'bg-orange-500';
      case 5: return 'bg-red-500';
      default: return 'bg-slate-400';
    }
  };

  const getFormTrendIcon = (trend: string) => {
    if (trend === 'rising') return { icon: '📈', color: 'text-green-600', label: 'Improving' };
    if (trend === 'falling') return { icon: '📉', color: 'text-red-600', label: 'Declining' };
    return { icon: '➡️', color: 'text-slate-600', label: 'Stable' };
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-fpl-forest to-fpl-pine text-white p-6 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">Player Analysis</h2>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {loading ? (
            <Loading message="Analyzing player..." />
          ) : error ? (
            <ErrorMessage message={error} />
          ) : data ? (
            <div className="space-y-6">
              {/* Player Header */}
              <div className="flex items-start gap-5">
                <img
                  src={getPlayerPhotoUrl(data.player.photoCode)}
                  alt={data.player.webName}
                  className="w-28 h-28 rounded-2xl object-cover object-top bg-slate-100 border-4 border-white shadow-lg"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://resources.premierleague.com/premierleague/photos/players/110x140/Photo-Missing.png';
                  }}
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm font-semibold px-3 py-1 rounded-full bg-fpl-forest/10 text-fpl-forest">
                      {data.player.position}
                    </span>
                    {data.player.penaltiesTaker && (
                      <span className="text-xs px-2 py-1 bg-amber-100 text-amber-700 rounded-full">Penalties</span>
                    )}
                    {data.player.setpieceTaker && (
                      <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full">Set Pieces</span>
                    )}
                  </div>
                  <h3 className="text-3xl font-bold text-slate-800">{data.player.webName}</h3>
                  <p className="text-lg text-slate-500">{data.player.teamShortName}</p>
                </div>
                <div className="text-right bg-gradient-to-br from-fpl-forest/10 to-fpl-pine/10 rounded-xl p-4 border border-fpl-forest/20">
                  <p className="text-4xl font-bold text-fpl-forest">{data.player.predictedPointsN.toFixed(1)}</p>
                  <p className="text-sm text-fpl-pine">predicted pts</p>
                  <p className="text-xs text-slate-500 mt-1">{horizon} gameweeks</p>
                </div>
              </div>

              {/* Key Stats */}
              <div className="grid grid-cols-5 gap-3">
                {[
                  { label: 'Cost', value: `£${(data.player.cost / 10).toFixed(1)}m`, color: 'text-slate-800' },
                  { label: 'Form', value: data.player.form, color: 'text-slate-800' },
                  { label: 'ICT', value: data.player.ictIndex, color: 'text-slate-800' },
                  { label: 'Team Form', value: `${data.player.teamMomentum}%`, color: data.player.teamMomentum > 50 ? 'text-green-600' : 'text-red-600' },
                  { label: 'Confidence', value: `${data.player.confidence}%`, color: data.player.confidence >= 70 ? 'text-green-600' : data.player.confidence >= 40 ? 'text-yellow-600' : 'text-red-600' },
                ].map((stat, i) => (
                  <div key={i} className="bg-slate-50 rounded-xl p-3 text-center border border-slate-100">
                    <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                    <p className="text-xs text-slate-500 mt-1">{stat.label}</p>
                  </div>
                ))}
              </div>

              {/* Season Stats */}
              <div className="bg-slate-50 rounded-xl p-5 border border-slate-100">
                <h4 className="font-semibold text-slate-800 mb-4">Season Statistics</h4>
                <div className="grid grid-cols-6 gap-3 text-center">
                  {[
                    { label: 'Points', value: data.player.totalPoints },
                    { label: 'Goals', value: data.player.goalsScored },
                    { label: 'Assists', value: data.player.assists },
                    { label: 'xG', value: data.player.expectedGoals.toFixed(1) },
                    { label: 'xA', value: data.player.expectedAssists.toFixed(1) },
                    { label: 'Bonus', value: data.player.bonus },
                  ].map((stat, i) => (
                    <div key={i}>
                      <p className="text-xl font-bold text-slate-800">{stat.value}</p>
                      <p className="text-xs text-slate-500">{stat.label}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Prediction Model */}
              <div className="bg-gradient-to-br from-fpl-forest/5 to-fpl-pine/5 rounded-xl p-5 border border-fpl-forest/10">
                <h4 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                  <span className="text-lg">🔮</span>
                  Prediction Breakdown
                </h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600">Base Form (avg last 5)</span>
                    <span className="font-semibold text-slate-800">{data.predictionBreakdown.baseScore.toFixed(1)} pts/match</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600">Clean Sheet Chance (avg)</span>
                    <span className="font-semibold text-fpl-forest">{data.predictionBreakdown.cleanSheetChance}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600">Goal Probability (per 90)</span>
                    <span className="font-semibold text-fpl-forest">{data.predictionBreakdown.goalChance}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600">Assist Probability (per 90)</span>
                    <span className="font-semibold text-fpl-forest">{data.predictionBreakdown.assistChance}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600">Team Momentum</span>
                    <span className={`font-semibold ${data.predictionBreakdown.teamMomentum > 50 ? 'text-green-600' : 'text-red-600'}`}>
                      {data.predictionBreakdown.teamMomentum}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600">Form Trend</span>
                    <span className={`font-semibold flex items-center gap-1 ${getFormTrendIcon(data.predictionBreakdown.formTrend).color}`}>
                      {getFormTrendIcon(data.predictionBreakdown.formTrend).icon}
                      {getFormTrendIcon(data.predictionBreakdown.formTrend).label}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600">Minutes Risk</span>
                    <span className={`font-semibold ${data.predictionBreakdown.minutesRiskPenalty > 0.3 ? 'text-red-600' : 'text-green-600'}`}>
                      {(data.predictionBreakdown.minutesRiskPenalty * 100).toFixed(0)}%
                    </span>
                  </div>
                  <div className="border-t border-fpl-forest/10 pt-3 flex justify-between items-center">
                    <span className="font-semibold text-slate-800">Final Prediction</span>
                    <span className="text-2xl font-bold text-fpl-forest">{data.predictionBreakdown.finalScore.toFixed(1)} pts</span>
                  </div>
                </div>
              </div>

              {/* Confidence Factors */}
              {data.predictionBreakdown.confidenceFactors.length > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                  <h4 className="font-semibold text-amber-800 mb-2 flex items-center gap-2">
                    <span>⚠️</span>
                    Notes
                  </h4>
                  <ul className="space-y-1">
                    {data.predictionBreakdown.confidenceFactors.map((factor, i) => (
                      <li key={i} className="text-sm text-amber-700 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                        {factor}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Upcoming Fixtures */}
              <div>
                <h4 className="font-semibold text-slate-800 mb-3">Upcoming Fixtures</h4>
                <div className="grid grid-cols-5 gap-2">
                  {data.predictionBreakdown.fixtureAdjustments.map((fixture, i) => (
                    <div key={i} className="text-center">
                      <p className="text-xs text-slate-500 mb-1">GW{fixture.gameweek}</p>
                      <div className={`${getDifficultyColor(fixture.difficulty)} text-white rounded-lg p-2`}>
                        <p className="font-bold text-sm">{fixture.opponent}</p>
                        <p className="text-xs opacity-80">{fixture.isHome ? 'Home' : 'Away'}</p>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">CS: {fixture.csChance}%</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent Matches */}
              <div>
                <h4 className="font-semibold text-slate-800 mb-3">Last 5 Matches</h4>
                <div className="overflow-x-auto rounded-xl border border-slate-200">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50">
                      <tr className="text-slate-500">
                        <th className="text-left py-3 px-4">GW</th>
                        <th className="text-left py-3 px-4">Opponent</th>
                        <th className="text-right py-3 px-4">Min</th>
                        <th className="text-right py-3 px-4">G</th>
                        <th className="text-right py-3 px-4">A</th>
                        <th className="text-right py-3 px-4">xG</th>
                        <th className="text-right py-3 px-4">xA</th>
                        <th className="text-right py-3 px-4">BPS</th>
                        <th className="text-right py-3 px-4 text-fpl-forest">Pts</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.recentMatches.map((match, i) => (
                        <tr key={i} className="border-t border-slate-100 hover:bg-slate-50">
                          <td className="py-3 px-4 font-medium text-slate-800">{match.gameweek}</td>
                          <td className="py-3 px-4 text-slate-700">
                            {match.opponent} <span className="text-slate-400">({match.wasHome ? 'H' : 'A'})</span>
                          </td>
                          <td className="text-right py-3 px-4 text-slate-600">{match.minutes}'</td>
                          <td className="text-right py-3 px-4 text-slate-600">{match.goals}</td>
                          <td className="text-right py-3 px-4 text-slate-600">{match.assists}</td>
                          <td className="text-right py-3 px-4 text-slate-500">{match.xG.toFixed(2)}</td>
                          <td className="text-right py-3 px-4 text-slate-500">{match.xA.toFixed(2)}</td>
                          <td className="text-right py-3 px-4 text-slate-600">{match.bonus}</td>
                          <td className="text-right py-3 px-4 font-bold text-fpl-forest">{match.points}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
