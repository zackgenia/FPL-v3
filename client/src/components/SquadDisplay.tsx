import type { SquadPlayer, Team, Position } from '../types';

interface SquadDisplayProps {
  squad: SquadPlayer[];
  teams: Team[];
  onRemove: (playerId: number) => void;
  onPlayerClick?: (playerId: number) => void;
}

const POSITION_ORDER: Position[] = ['GK', 'DEF', 'MID', 'FWD'];

export function SquadDisplay({ squad, teams, onRemove, onPlayerClick }: SquadDisplayProps) {
  const teamMap = new Map(teams.map(t => [t.id, t]));

  // Group by position
  const grouped = POSITION_ORDER.reduce((acc, pos) => {
    acc[pos] = squad.filter(p => p.position === pos);
    return acc;
  }, {} as Record<Position, SquadPlayer[]>);

  return (
    <div className="space-y-4">
      {POSITION_ORDER.map(position => (
        <div key={position}>
          <h4 className="text-sm font-semibold text-slate-500 mb-2">
            {position}s ({grouped[position].length})
          </h4>
          <div className="flex flex-wrap gap-2">
            {grouped[position].map(player => {
              const team = teamMap.get(player.teamId);
              return (
                <div
                  key={player.id}
                  className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-md border border-slate-200 group hover:border-slate-300"
                >
                  <div
                    className={onPlayerClick ? 'cursor-pointer hover:text-fpl-forest' : ''}
                    onClick={() => onPlayerClick?.(player.id)}
                  >
                    <span className="font-medium text-slate-800">{player.webName}</span>
                    <span className="text-sm text-slate-500 ml-2">
                      {team?.shortName} • £{(player.cost / 10).toFixed(1)}m
                    </span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemove(player.id);
                    }}
                    className="ml-2 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    ✕
                  </button>
                </div>
              );
            })}
            {grouped[position].length === 0 && (
              <span className="text-slate-400 text-sm">No {position}s selected</span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
