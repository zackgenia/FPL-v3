import type { PlayerPrediction } from '../types';

interface PlayerCardProps {
  player: PlayerPrediction;
  onClick?: () => void;
  showRank?: number;
}

// FPL player photo URL helper
const getPlayerPhotoUrl = (photoCode: number) => {
  return `https://resources.premierleague.com/premierleague/photos/players/110x140/p${photoCode}.png`;
};

export function PlayerCard({ player, onClick, showRank }: PlayerCardProps) {
  const getDifficultyColor = (difficulty: number) => {
    switch (difficulty) {
      case 1: return 'bg-green-500';
      case 2: return 'bg-green-400';
      case 3: return 'bg-yellow-500';
      case 4: return 'bg-orange-500';
      case 5: return 'bg-red-500';
      default: return 'bg-slate-400';
    }
  };

  const getStatusIcon = (status: string, chanceOfPlaying: number | null) => {
    if (status === 'a' || chanceOfPlaying === 100) return null;
    if (status === 'd' || (chanceOfPlaying !== null && chanceOfPlaying >= 75)) return '⚠️';
    if (status === 'i') return '🏥';
    if (status === 's') return '🟥';
    return '❌';
  };

  const statusIcon = getStatusIcon(player.status, player.chanceOfPlaying);

  return (
    <div
      className={`bg-white rounded-lg border border-slate-200 p-4 shadow-sm ${
        onClick ? 'hover:border-fpl-forest hover:shadow-md cursor-pointer' : ''
      } transition-all`}
      onClick={onClick}
    >
      {/* Header with Photo */}
      <div className="flex items-start gap-3 mb-3">
        <img
          src={getPlayerPhotoUrl(player.photoCode)}
          alt={player.webName}
          className="w-14 h-14 rounded-full object-cover object-top bg-slate-100 border-2 border-slate-200"
          onError={(e) => {
            (e.target as HTMLImageElement).src = 'https://resources.premierleague.com/premierleague/photos/players/110x140/Photo-Missing.png';
          }}
        />
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            {showRank && (
              <span className="text-xs font-bold text-slate-400">#{showRank}</span>
            )}
            <span className="text-xs font-medium px-2 py-0.5 rounded bg-fpl-forest/10 text-fpl-forest">
              {player.position}
            </span>
            {statusIcon && <span title={player.status}>{statusIcon}</span>}
          </div>
          <h3 className="font-semibold text-slate-800">{player.webName}</h3>
          <p className="text-sm text-slate-500">{player.teamShortName}</p>
        </div>
        <div className="text-right">
          <p className="font-bold text-fpl-forest text-lg">
            {player.predictedPointsN.toFixed(1)}
          </p>
          <p className="text-xs text-slate-500">
            ({player.predictedPointsPerGW.toFixed(1)}/GW)
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-2 text-sm mb-3">
        <div>
          <span className="text-slate-500">Cost:</span>
          <span className="ml-2 font-medium text-slate-700">£{(player.cost / 10).toFixed(1)}m</span>
        </div>
        <div>
          <span className="text-slate-500">Form:</span>
          <span className="ml-2 font-medium text-slate-700">{player.form}</span>
        </div>
        <div>
          <span className="text-slate-500">xGI:</span>
          <span className="ml-2 font-medium text-slate-700">{player.expectedGoalInvolvements.toFixed(2)}</span>
        </div>
        <div>
          <span className="text-slate-500">Value:</span>
          <span className="ml-2 font-medium text-fpl-pine">{player.valueScore.toFixed(2)}</span>
        </div>
        <div>
          <span className="text-slate-500">ICT:</span>
          <span className="ml-2 font-medium text-slate-700">{player.ictIndex}</span>
        </div>
        <div>
          <span className="text-slate-500">Confidence:</span>
          <span className={`ml-2 font-medium ${
            player.confidence >= 70 ? 'text-green-600' : 
            player.confidence >= 40 ? 'text-yellow-600' : 'text-red-600'
          }`}>
            {player.confidence}%
          </span>
        </div>
      </div>

      {/* Badges */}
      <div className="flex gap-2 mb-3 flex-wrap">
        {player.penaltiesTaker && (
          <span className="text-xs px-2 py-1 bg-amber-50 text-amber-700 rounded border border-amber-200">
            Penalties
          </span>
        )}
        {player.setpieceTaker && (
          <span className="text-xs px-2 py-1 bg-blue-50 text-blue-700 rounded border border-blue-200">
            Set Pieces
          </span>
        )}
        {player.totalPoints > 0 && (
          <span className="text-xs px-2 py-1 bg-slate-100 text-slate-600 rounded">
            {player.totalPoints} pts total
          </span>
        )}
      </div>

      {/* Fixtures */}
      <div>
        <p className="text-xs text-slate-500 mb-2">Next fixtures:</p>
        <div className="flex gap-1 flex-wrap">
          {player.nextFixtures.slice(0, 5).map((fixture, i) => (
            <div
              key={i}
              className={`text-xs px-2 py-1 rounded ${getDifficultyColor(fixture.difficulty)} text-white`}
              title={`GW${fixture.gameweek}: ${fixture.opponent} (${fixture.isHome ? 'H' : 'A'})`}
            >
              {fixture.opponent}
              <span className="opacity-70 ml-1">
                {fixture.isHome ? 'H' : 'A'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
