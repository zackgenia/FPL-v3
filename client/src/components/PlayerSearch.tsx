import { useState, useMemo } from 'react';
import type { Player, Team } from '../types';
import { POSITION_MAP } from '../types';

interface PlayerSearchProps {
  players: Player[];
  teams: Team[];
  onSelect: (player: Player) => void;
  canAdd: (player: Player) => { allowed: boolean; reason?: string };
}

// FPL player photo URL helper
const getPlayerPhotoUrl = (photoCode: number) => {
  return `https://resources.premierleague.com/premierleague/photos/players/110x140/p${photoCode}.png`;
};

export function PlayerSearch({ players, teams, onSelect, canAdd }: PlayerSearchProps) {
  const [search, setSearch] = useState('');
  const [positionFilter, setPositionFilter] = useState<string>('all');

  const teamMap = useMemo(() => {
    return new Map(teams.map(t => [t.id, t]));
  }, [teams]);

  const filteredPlayers = useMemo(() => {
    let filtered = players;

    // Position filter
    if (positionFilter !== 'all') {
      const posCode = { GK: 1, DEF: 2, MID: 3, FWD: 4 }[positionFilter];
      filtered = filtered.filter(p => p.position === posCode);
    }

    // Search filter
    if (search.trim()) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(p =>
        p.webName.toLowerCase().includes(searchLower) ||
        p.firstName.toLowerCase().includes(searchLower) ||
        p.secondName.toLowerCase().includes(searchLower) ||
        teamMap.get(p.teamId)?.name.toLowerCase().includes(searchLower)
      );
    }

    // Sort by total points
    return filtered.sort((a, b) => b.totalPoints - a.totalPoints).slice(0, 50);
  }, [players, teams, search, positionFilter, teamMap]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'a': return '✓';
      case 'd': return '⚠️';
      case 'i': return '🏥';
      case 's': return '🟥';
      case 'u': return '❌';
      default: return '?';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-3">
        <input
          type="text"
          placeholder="Search players..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 px-4 py-2 bg-slate-50 border border-slate-300 rounded-md focus:outline-none focus:border-fpl-forest focus:ring-1 focus:ring-fpl-forest"
        />
        <select
          value={positionFilter}
          onChange={(e) => setPositionFilter(e.target.value)}
          className="px-4 py-2 bg-slate-50 border border-slate-300 rounded-md focus:outline-none focus:border-fpl-forest"
        >
          <option value="all">All Positions</option>
          <option value="GK">Goalkeepers</option>
          <option value="DEF">Defenders</option>
          <option value="MID">Midfielders</option>
          <option value="FWD">Forwards</option>
        </select>
      </div>

      <div className="max-h-96 overflow-y-auto space-y-2">
        {filteredPlayers.length === 0 ? (
          <p className="text-slate-400 text-center py-4">No players found</p>
        ) : (
          filteredPlayers.map(player => {
            const team = teamMap.get(player.teamId);
            const { allowed, reason } = canAdd(player);
            
            return (
              <div
                key={player.id}
                className={`flex items-center justify-between p-3 rounded-md border ${
                  allowed
                    ? 'bg-white border-slate-200 hover:border-fpl-forest hover:shadow-sm cursor-pointer'
                    : 'bg-slate-50 border-slate-100 opacity-60'
                } transition-all`}
                onClick={() => allowed && onSelect(player)}
                title={!allowed ? reason : undefined}
              >
                <div className="flex items-center gap-3">
                  <img
                    src={getPlayerPhotoUrl(player.photoCode)}
                    alt={player.webName}
                    className="w-10 h-10 rounded-full object-cover object-top bg-slate-100"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://resources.premierleague.com/premierleague/photos/players/110x140/Photo-Missing.png';
                    }}
                  />
                  <span className="text-xs font-medium px-2 py-1 rounded bg-fpl-forest/10 text-fpl-forest">
                    {POSITION_MAP[player.position]}
                  </span>
                  <span className="text-sm" title={player.news || undefined}>
                    {getStatusIcon(player.status)}
                  </span>
                  <div>
                    <p className="font-medium text-slate-800">{player.webName}</p>
                    <p className="text-sm text-slate-500">{team?.shortName}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium text-slate-800">£{(player.cost / 10).toFixed(1)}m</p>
                  <p className="text-sm text-slate-500">{player.totalPoints} pts</p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
