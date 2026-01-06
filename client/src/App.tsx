import { useState } from 'react';
import { useBootstrap, useSquad } from './hooks';
import { SquadBuilder, Recommendations, PlayerDetail, FixtureTracker } from './pages';

type Page = 'squad' | 'recommendations' | 'fixtures';

function App() {
  const [currentPage, setCurrentPage] = useState<Page>('squad');
  const [selectedPlayerId, setSelectedPlayerId] = useState<number | null>(null);
  const [horizon, setHorizon] = useState(5);

  const bootstrap = useBootstrap();
  const squad = useSquad();

  const handlePlayerClick = (playerId: number) => {
    setSelectedPlayerId(playerId);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="bg-gradient-to-r from-fpl-forest via-fpl-pine to-fpl-olive shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                <span className="text-2xl">⚽</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white tracking-tight">
                  FPL Transfer <span className="text-fpl-mint">Recommender</span>
                </h1>
                <p className="text-white/70 text-sm">Make smarter transfer decisions</p>
              </div>
            </div>
            
            {/* Navigation */}
            <nav className="flex gap-1 bg-black/20 p-1 rounded-xl backdrop-blur-sm">
              {[
                { key: 'squad', label: 'Squad Builder', icon: '👥' },
                { key: 'recommendations', label: 'Transfers', icon: '🔄' },
                { key: 'fixtures', label: 'Fixtures', icon: '📅' },
              ].map(({ key, label, icon }) => (
                <button
                  key={key}
                  onClick={() => setCurrentPage(key as Page)}
                  className={`px-4 py-2.5 rounded-lg transition-all duration-200 flex items-center gap-2 ${
                    currentPage === key
                      ? 'bg-white text-fpl-forest font-semibold shadow-md'
                      : 'text-white/90 hover:bg-white/10'
                  }`}
                >
                  <span>{icon}</span>
                  <span className="hidden sm:inline">{label}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>
      </header>

      {/* Stats Bar */}
      <div className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-fpl-forest animate-pulse"></div>
                <span className="text-sm text-slate-600">
                  GW {bootstrap.data?.currentGameweek ?? '-'}
                </span>
              </div>
              <div className="h-4 w-px bg-slate-300"></div>
              <div className="text-sm">
                <span className="text-slate-500">Squad:</span>
                <span className="ml-1 font-semibold text-slate-800">{squad.squad.length}/15</span>
              </div>
              <div className="h-4 w-px bg-slate-300"></div>
              <div className="text-sm">
                <span className="text-slate-500">Value:</span>
                <span className="ml-1 font-semibold text-slate-800">£{(squad.squadValue / 10).toFixed(1)}m</span>
              </div>
              <div className="h-4 w-px bg-slate-300"></div>
              <div className="text-sm">
                <span className="text-slate-500">Bank:</span>
                <span className="ml-1 font-semibold text-fpl-forest">£{(squad.bank / 10).toFixed(1)}m</span>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-slate-500">Horizon:</span>
              <select
                value={horizon}
                onChange={(e) => setHorizon(parseInt(e.target.value))}
                className="px-2 py-1 bg-slate-100 border border-slate-200 rounded-md text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-fpl-forest/20"
              >
                <option value={3}>3 GWs</option>
                <option value={5}>5 GWs</option>
                <option value={8}>8 GWs</option>
                <option value={10}>10 GWs</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {currentPage === 'squad' && (
          <SquadBuilder
            players={bootstrap.data?.players ?? []}
            teams={bootstrap.data?.teams ?? []}
            squad={squad}
            loading={bootstrap.loading}
            error={bootstrap.error}
            onRetry={bootstrap.refresh}
            onPlayerClick={handlePlayerClick}
          />
        )}
        {currentPage === 'recommendations' && (
          <Recommendations
            squad={squad.squad}
            bank={squad.bank}
            isSquadComplete={squad.isSquadComplete}
            horizon={horizon}
            onPlayerClick={handlePlayerClick}
          />
        )}
        {currentPage === 'fixtures' && (
          <FixtureTracker />
        )}
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-200 py-6 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-slate-500">
              Data from official{' '}
              <a
                href="https://fantasy.premierleague.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-fpl-forest hover:underline font-medium"
              >
                Fantasy Premier League
              </a>{' '}
              API
            </p>
            <div className="flex items-center gap-4 text-sm text-slate-400">
              <span>Built with ❤️ for FPL managers</span>
            </div>
          </div>
        </div>
      </footer>

      {/* Player Detail Modal */}
      {selectedPlayerId && (
        <PlayerDetail
          playerId={selectedPlayerId}
          horizon={horizon}
          onClose={() => setSelectedPlayerId(null)}
        />
      )}
    </div>
  );
}

export default App;
