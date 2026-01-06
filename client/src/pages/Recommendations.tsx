import { useState, useEffect, useCallback, useRef } from 'react';
import { TransferCard, PlayerCard, Loading, ErrorMessage } from '../components';
import { getRecommendations } from '../api';
import type { 
  SquadPlayer, 
  RecommendationResponse, 
  Position,
  PlayerPrediction 
} from '../types';

interface RecommendationsProps {
  squad: SquadPlayer[];
  bank: number;
  isSquadComplete: boolean;
  horizon: number;
  onPlayerClick?: (playerId: number) => void;
}

type ViewMode = 'transfers' | 'GK' | 'DEF' | 'MID' | 'FWD';

export function Recommendations({
  squad,
  bank,
  isSquadComplete,
  horizon,
  onPlayerClick,
}: RecommendationsProps) {
  const [recommendations, setRecommendations] = useState<RecommendationResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [includeInjured, setIncludeInjured] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('transfers');
  
  const fetchRef = useRef(0);

  const fetchRecommendations = useCallback(async () => {
    if (squad.length === 0) return;

    const fetchId = ++fetchRef.current;
    setLoading(true);
    setError(null);

    try {
      const positionFilter = viewMode !== 'transfers' ? viewMode as Position : undefined;
      const result = await getRecommendations(
        squad,
        bank,
        horizon,
        includeInjured,
        positionFilter
      );
      
      // Only update if this is still the latest request
      if (fetchId === fetchRef.current) {
        setRecommendations(result);
      }
    } catch (err) {
      if (fetchId === fetchRef.current) {
        setError(err instanceof Error ? err.message : 'Failed to get recommendations');
      }
    } finally {
      if (fetchId === fetchRef.current) {
        setLoading(false);
      }
    }
  }, [squad, bank, horizon, includeInjured, viewMode]);

  useEffect(() => {
    if (isSquadComplete) {
      fetchRecommendations();
    }
  }, [isSquadComplete, fetchRecommendations]);

  if (!isSquadComplete) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="w-24 h-24 bg-gradient-to-br from-slate-100 to-slate-200 rounded-2xl flex items-center justify-center mb-6 shadow-inner">
          <span className="text-5xl">📋</span>
        </div>
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Complete Your Squad First</h2>
        <p className="text-slate-500 text-center max-w-md mb-4">
          You need a full 15-player squad to get transfer recommendations.
        </p>
        <div className="flex items-center gap-2 bg-slate-100 rounded-full px-4 py-2">
          <span className="text-lg">👥</span>
          <span className="font-medium text-slate-700">{squad.length}/15 players</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Transfer Recommendations</h2>
            <p className="text-slate-500">
              {recommendations 
                ? `Predictions for next ${recommendations.horizon} gameweeks starting GW${recommendations.currentGameweek}`
                : 'Finding the best transfers for your team...'}
            </p>
          </div>
          <button
            onClick={fetchRecommendations}
            disabled={loading}
            className="px-5 py-2.5 bg-gradient-to-r from-fpl-forest to-fpl-pine text-white font-medium rounded-lg hover:shadow-lg disabled:opacity-50 transition-all"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                Loading...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                🔄 Refresh
              </span>
            )}
          </button>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap gap-4 items-center mt-4 pt-4 border-t border-slate-100">
          <label className="flex items-center gap-3 cursor-pointer group">
            <div className="relative">
              <input
                type="checkbox"
                checked={includeInjured}
                onChange={(e) => setIncludeInjured(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-10 h-6 bg-slate-200 rounded-full peer-checked:bg-fpl-forest transition-colors"></div>
              <div className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform peer-checked:translate-x-4"></div>
            </div>
            <span className="text-sm text-slate-600 group-hover:text-slate-800">Include injured/doubtful</span>
          </label>
        </div>
      </div>

      {/* View Tabs */}
      <div className="flex gap-1 bg-white rounded-xl p-1.5 border border-slate-200 shadow-sm">
        {([
          { key: 'transfers', label: 'For My Team', icon: '🎯' },
          { key: 'GK', label: 'Top GKs', icon: '🧤' },
          { key: 'DEF', label: 'Top DEFs', icon: '🛡️' },
          { key: 'MID', label: 'Top MIDs', icon: '⚡' },
          { key: 'FWD', label: 'Top FWDs', icon: '🎯' },
        ] as { key: ViewMode; label: string; icon: string }[]).map(({ key, label, icon }) => (
          <button
            key={key}
            onClick={() => setViewMode(key)}
            className={`flex-1 px-4 py-2.5 rounded-lg transition-all flex items-center justify-center gap-2 ${
              viewMode === key
                ? 'bg-gradient-to-r from-fpl-forest to-fpl-pine text-white shadow-md'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <span>{icon}</span>
            <span className="hidden sm:inline font-medium">{label}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12">
          <Loading message="Calculating the best transfers..." />
        </div>
      ) : error ? (
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <ErrorMessage message={error} onRetry={fetchRecommendations} />
        </div>
      ) : recommendations ? (
        viewMode === 'transfers' ? (
          <TransferView 
            recommendations={recommendations} 
            onPlayerClick={onPlayerClick}
          />
        ) : (
          <PositionView
            position={viewMode}
            targets={recommendations.topTargetsByPosition.find(p => p.position === viewMode)?.targets ?? []}
            onPlayerClick={onPlayerClick}
          />
        )
      ) : null}
    </div>
  );
}

// Transfer Recommendations View
function TransferView({
  recommendations,
  onPlayerClick,
}: {
  recommendations: RecommendationResponse;
  onPlayerClick?: (playerId: number) => void;
}) {
  const { bestTransfer, topTransfers } = recommendations;

  if (topTransfers.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-3xl">✓</span>
        </div>
        <h3 className="text-xl font-semibold text-slate-800 mb-2">Squad Optimized!</h3>
        <p className="text-slate-500">
          No beneficial transfers found. Your squad is already in great shape!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Best Transfer */}
      {bestTransfer && (
        <div className="bg-gradient-to-r from-fpl-forest/5 to-fpl-pine/5 rounded-xl p-6 border border-fpl-forest/20">
          <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <span className="w-8 h-8 bg-fpl-forest rounded-lg flex items-center justify-center text-white">⭐</span>
            Recommended Transfer
          </h3>
          <TransferCard
            transfer={bestTransfer}
            rank={1}
            onPlayerClick={onPlayerClick}
          />
        </div>
      )}

      {/* Other Options */}
      {topTransfers.length > 1 && (
        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Alternative Transfers</h3>
          <div className="grid gap-4 md:grid-cols-2">
            {topTransfers.slice(1).map((transfer, i) => (
              <TransferCard
                key={`${transfer.playerOut.playerId}-${transfer.playerIn.playerId}`}
                transfer={transfer}
                rank={i + 2}
                onPlayerClick={onPlayerClick}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Position Targets View
function PositionView({
  position,
  targets,
  onPlayerClick,
}: {
  position: Position;
  targets: PlayerPrediction[];
  onPlayerClick?: (playerId: number) => void;
}) {
  if (targets.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
        <p className="text-slate-500">No {position}s found matching your criteria.</p>
      </div>
    );
  }

  const positionNames = {
    GK: 'Goalkeepers',
    DEF: 'Defenders',
    MID: 'Midfielders',
    FWD: 'Forwards',
  };

  return (
    <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
      <h3 className="text-lg font-semibold text-slate-800 mb-4">
        Top {positionNames[position]}
      </h3>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {targets.map((player, i) => (
          <PlayerCard
            key={player.playerId}
            player={player}
            showRank={i + 1}
            onClick={() => onPlayerClick?.(player.playerId)}
          />
        ))}
      </div>
    </div>
  );
}
