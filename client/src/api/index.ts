import type {
  BootstrapData,
  PlayerDetail,
  RecommendationResponse,
  SquadPlayer,
  Position,
  PlayerPrediction,
  TeamFixturesResponse,
} from '../types';

const API_BASE = '/api';

/**
 * Generic fetch wrapper with error handling and retry
 */
async function fetchAPI<T>(
  endpoint: string,
  options?: RequestInit,
  retries: number = 2
): Promise<T> {
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await fetch(`${API_BASE}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
        },
        ...options,
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Unknown error' }));
        throw new Error(error.message || `API Error: ${response.status}`);
      }

      return response.json();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error');
      if (attempt < retries) {
        await new Promise(resolve => setTimeout(resolve, 500 * (attempt + 1)));
      }
    }
  }
  
  throw lastError;
}

/**
 * Get bootstrap data (all players, teams, gameweeks)
 */
export async function getBootstrap(): Promise<BootstrapData> {
  return fetchAPI<BootstrapData>('/bootstrap');
}

/**
 * Get player detail with prediction breakdown
 */
export async function getPlayerDetail(
  playerId: number,
  horizon: number = 5
): Promise<PlayerDetail> {
  return fetchAPI<PlayerDetail>(`/player/${playerId}?horizon=${horizon}`);
}

/**
 * Get transfer recommendations
 */
export async function getRecommendations(
  squad: SquadPlayer[],
  bank: number,
  horizon: number = 5,
  includeInjured: boolean = false,
  positionFilter?: Position
): Promise<RecommendationResponse> {
  return fetchAPI<RecommendationResponse>('/recommendations', {
    method: 'POST',
    body: JSON.stringify({
      squad,
      bank,
      horizon,
      includeInjured,
      positionFilter,
    }),
  }, 3); // Extra retries for recommendations
}

/**
 * Get top targets for a position
 */
export async function getTopTargets(
  position: Position,
  horizon: number = 5,
  maxCost?: number,
  includeInjured: boolean = false,
  count: number = 20
): Promise<{ position: Position; horizon: number; targets: PlayerPrediction[] }> {
  const params = new URLSearchParams({
    horizon: horizon.toString(),
    count: count.toString(),
    includeInjured: includeInjured.toString(),
  });
  
  if (maxCost !== undefined) {
    params.set('maxCost', maxCost.toString());
  }

  return fetchAPI(`/top-targets/${position}?${params}`);
}

/**
 * Get team fixtures for FDR display
 */
export async function getTeamFixtures(numWeeks: number = 6): Promise<TeamFixturesResponse> {
  return fetchAPI<TeamFixturesResponse>(`/team-fixtures?weeks=${numWeeks}`);
}

/**
 * Health check
 */
export async function healthCheck(): Promise<{ status: string; timestamp: string }> {
  return fetchAPI('/health');
}
