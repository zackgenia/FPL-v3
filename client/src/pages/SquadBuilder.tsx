import { useState } from 'react';
import { PlayerSearch, SquadDisplay, Loading, ErrorMessage } from '../components';
import type { Player, Team } from '../types';

interface SquadBuilderProps {
  players: Player[];
  teams: Team[];
  squad: ReturnType<typeof import('../hooks').useSquad>;
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  onPlayerClick?: (playerId: number) => void;
}

export function SquadBuilder({
  players,
  teams,
  squad,
  loading,
  error,
  onRetry,
  onPlayerClick,
}: SquadBuilderProps) {
  const {
    squad: currentSquad,
    bank,
    setBank,
    adjustBank,
    addPlayer,
    removePlayer,
    clearSquad,
    canAddPlayer,
    squadValue,
    positionCounts,
    isSquadComplete,
  } = squad;

  const [addError, setAddError] = useState<string | null>(null);

  if (loading) {
    return <Loading message="Loading FPL data..." />;
  }

  if (error) {
    return <ErrorMessage message={error} onRetry={onRetry} />;
  }

  const handleAddPlayer = (player: Player) => {
    const result = addPlayer(player);
    if (!result.success && result.error) {
      setAddError(result.error);
      setTimeout(() => setAddError(null), 3000);
    } else {
      setAddError(null);
    }
  };

  const handleBankAdjust = (delta: number) => {
    adjustBank(delta);
  };

  const handleBankInput = (value: string) => {
    const parsed = parseFloat(value);
    if (!isNaN(parsed) && parsed >= 0) {
      setBank(Math.round(parsed * 10));
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Squad Builder</h2>
            <p className="text-slate-500">Build your 15-player squad to get transfer recommendations</p>
          </div>
          
          <button
            onClick={clearSquad}
            className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-colors border border-red-200"
          >
            Clear Squad
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          {/* Squad Size */}
          <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-4 border border-slate-200">
            <p className="text-sm text-slate-500 mb-1">Squad Size</p>
            <div className="flex items-end gap-1">
              <span className="text-3xl font-bold text-slate-800">{currentSquad.length}</span>
              <span className="text-lg text-slate-400 mb-1">/15</span>
            </div>
            <div className="mt-2 h-2 bg-slate-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-fpl-forest rounded-full transition-all duration-300"
                style={{ width: `${(currentSquad.length / 15) * 100}%` }}
              />
            </div>
          </div>

          {/* Team Value */}
          <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-4 border border-slate-200">
            <p className="text-sm text-slate-500 mb-1">Team Value</p>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-bold text-slate-800">£{(squadValue / 10).toFixed(1)}</span>
              <span className="text-lg text-slate-400">m</span>
            </div>
          </div>

          {/* Bank */}
          <div className="bg-gradient-to-br from-fpl-forest/5 to-fpl-pine/10 rounded-xl p-4 border border-fpl-forest/20">
            <p className="text-sm text-fpl-forest/70 mb-1">In The Bank</p>
            <div className="flex items-center gap-2">
              <span className="text-lg text-fpl-forest">£</span>
              <input
                type="number"
                value={(bank / 10).toFixed(1)}
                onChange={(e) => handleBankInput(e.target.value)}
                step="0.1"
                min="0"
                className="w-20 text-3xl font-bold bg-transparent text-fpl-forest focus:outline-none"
              />
              <span className="text-lg text-fpl-forest/70">m</span>
              
              <div className="flex flex-col ml-auto">
                <button
                  onClick={() => handleBankAdjust(1)}
                  className="w-8 h-6 flex items-center justify-center bg-fpl-forest/10 hover:bg-fpl-forest/20 rounded-t-md border border-fpl-forest/20 text-fpl-forest transition-colors"
                >
                  ▲
                </button>
                <button
                  onClick={() => handleBankAdjust(-1)}
                  className="w-8 h-6 flex items-center justify-center bg-fpl-forest/10 hover:bg-fpl-forest/20 rounded-b-md border border-t-0 border-fpl-forest/20 text-fpl-forest transition-colors"
                >
                  ▼
                </button>
              </div>
            </div>
            <p className="text-xs text-fpl-pine/70 mt-1">Adjust if your team value increased</p>
          </div>

          {/* Total Budget */}
          <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-4 border border-slate-200">
            <p className="text-sm text-slate-500 mb-1">Total Budget</p>
            <div className="flex items-baseline gap-1">
              <span className={`text-3xl font-bold ${squadValue + bank > 1000 ? 'text-fpl-forest' : 'text-slate-800'}`}>
                £{((squadValue + bank) / 10).toFixed(1)}
              </span>
              <span className="text-lg text-slate-400">m</span>
            </div>
            {squadValue + bank > 1000 && (
              <p className="text-xs text-fpl-forest mt-1">+£{((squadValue + bank - 1000) / 10).toFixed(1)}m profit</p>
            )}
          </div>
        </div>

        {/* Position Slots */}
        <div className="flex flex-wrap gap-3 mt-6">
          {(['GK', 'DEF', 'MID', 'FWD'] as const).map(pos => {
            const limits = { GK: 2, DEF: 5, MID: 5, FWD: 3 };
            const count = positionCounts[pos];
            const limit = limits[pos];
            const isFull = count === limit;
            
            return (
              <div
                key={pos}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all ${
                  isFull 
                    ? 'bg-fpl-forest text-white border-fpl-forest' 
                    : 'bg-white text-slate-700 border-slate-200'
                }`}
              >
                <span className="font-semibold">{pos}</span>
                <div className="flex gap-1">
                  {Array.from({ length: limit }).map((_, i) => (
                    <div
                      key={i}
                      className={`w-2.5 h-2.5 rounded-full ${
                        i < count 
                          ? isFull ? 'bg-white' : 'bg-fpl-forest'
                          : isFull ? 'bg-white/30' : 'bg-slate-200'
                      }`}
                    />
                  ))}
                </div>
                <span className={`text-sm ${isFull ? 'text-white/80' : 'text-slate-400'}`}>
                  {count}/{limit}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Error Message */}
      {addError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 flex items-center gap-2">
          <span>⚠️</span>
          {addError}
        </div>
      )}

      {/* Two Column Layout */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Search */}
        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
          <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <span className="w-8 h-8 bg-fpl-forest/10 rounded-lg flex items-center justify-center text-fpl-forest">🔍</span>
            Search Players
          </h3>
          <PlayerSearch
            players={players}
            teams={teams}
            onSelect={handleAddPlayer}
            canAdd={canAddPlayer}
          />
        </div>

        {/* Current Squad */}
        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
          <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <span className="w-8 h-8 bg-fpl-forest/10 rounded-lg flex items-center justify-center text-fpl-forest">👥</span>
            Your Squad
          </h3>
          {currentSquad.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">⚽</span>
              </div>
              <p className="text-slate-500 mb-2">No players selected yet</p>
              <p className="text-sm text-slate-400">Search and add players to build your squad</p>
            </div>
          ) : (
            <SquadDisplay
              squad={currentSquad}
              teams={teams}
              onRemove={removePlayer}
              onPlayerClick={onPlayerClick}
            />
          )}
        </div>
      </div>

      {/* Squad Status */}
      {isSquadComplete ? (
        <div className="bg-gradient-to-r from-fpl-forest to-fpl-pine rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
              <span className="text-2xl">✓</span>
            </div>
            <div>
              <h3 className="text-lg font-semibold">Squad Complete!</h3>
              <p className="text-white/80">Head over to Transfers to see your best transfer options</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-slate-100 rounded-xl p-6 border border-slate-200">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm">
              <span className="text-2xl">📋</span>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-800">Keep Building</h3>
              <p className="text-slate-500">Add {15 - currentSquad.length} more player{15 - currentSquad.length !== 1 ? 's' : ''} to complete your squad</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
