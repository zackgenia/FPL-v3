import type { TransferRecommendation } from '../types';

interface TransferCardProps {
  transfer: TransferRecommendation;
  rank: number;
  onPlayerClick?: (playerId: number) => void;
}

// FPL player photo URL helper
const getPlayerPhotoUrl = (photoCode: number) => {
  return `https://resources.premierleague.com/premierleague/photos/players/110x140/p${photoCode}.png`;
};

export function TransferCard({ transfer, rank, onPlayerClick }: TransferCardProps) {
  const { playerOut, playerIn, netGain, costChange, budgetAfter } = transfer;

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-sm hover:shadow-md hover:border-fpl-forest/50 transition-all">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-slate-400">#{rank}</span>
        <span className={`text-lg font-bold ${netGain >= 0 ? 'text-fpl-forest' : 'text-red-500'}`}>
          {netGain >= 0 ? '+' : ''}{netGain.toFixed(1)} pts
        </span>
      </div>

      <div className="flex items-center gap-4">
        {/* Player Out */}
        <div 
          className="flex-1 p-3 bg-red-50 rounded-md border border-red-200 cursor-pointer hover:border-red-300"
          onClick={() => onPlayerClick?.(playerOut.playerId)}
        >
          <div className="flex items-center gap-2 mb-2">
            <img
              src={getPlayerPhotoUrl(playerOut.photoCode)}
              alt={playerOut.webName}
              className="w-10 h-10 rounded-full object-cover object-top bg-slate-100"
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'https://resources.premierleague.com/premierleague/photos/players/110x140/Photo-Missing.png';
              }}
            />
            <div>
              <div className="flex items-center gap-1">
                <span className="text-red-500 text-sm">OUT</span>
                <span className="text-xs font-medium px-1.5 py-0.5 rounded bg-slate-200 text-slate-600">
                  {playerOut.position}
                </span>
              </div>
              <p className="font-medium text-slate-800">{playerOut.webName}</p>
            </div>
          </div>
          <p className="text-sm text-slate-500">{playerOut.teamShortName}</p>
          <div className="mt-2 text-sm">
            <span className="text-slate-500">£{(playerOut.cost / 10).toFixed(1)}m</span>
            <span className="mx-2 text-slate-300">•</span>
            <span className="text-slate-500">{playerOut.predictedPointsN.toFixed(1)} pts</span>
          </div>
        </div>

        {/* Arrow */}
        <div className="text-2xl text-slate-400">→</div>

        {/* Player In */}
        <div 
          className="flex-1 p-3 bg-green-50 rounded-md border border-green-200 cursor-pointer hover:border-green-300"
          onClick={() => onPlayerClick?.(playerIn.playerId)}
        >
          <div className="flex items-center gap-2 mb-2">
            <img
              src={getPlayerPhotoUrl(playerIn.photoCode)}
              alt={playerIn.webName}
              className="w-10 h-10 rounded-full object-cover object-top bg-slate-100"
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'https://resources.premierleague.com/premierleague/photos/players/110x140/Photo-Missing.png';
              }}
            />
            <div>
              <div className="flex items-center gap-1">
                <span className="text-green-600 text-sm">IN</span>
                <span className="text-xs font-medium px-1.5 py-0.5 rounded bg-slate-200 text-slate-600">
                  {playerIn.position}
                </span>
              </div>
              <p className="font-medium text-slate-800">{playerIn.webName}</p>
            </div>
          </div>
          <p className="text-sm text-slate-500">{playerIn.teamShortName}</p>
          <div className="mt-2 text-sm">
            <span className="text-slate-500">£{(playerIn.cost / 10).toFixed(1)}m</span>
            <span className="mx-2 text-slate-300">•</span>
            <span className="text-fpl-forest font-medium">{playerIn.predictedPointsN.toFixed(1)} pts</span>
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="mt-3 pt-3 border-t border-slate-100 flex justify-between text-sm">
        <span className="text-slate-500">
          Cost: {costChange >= 0 ? '+' : ''}£{(costChange / 10).toFixed(1)}m
        </span>
        <span className="text-slate-500">
          Bank after: £{(budgetAfter / 10).toFixed(1)}m
        </span>
      </div>
    </div>
  );
}
