import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Trophy, RefreshCw, TrendingUp, Target } from 'lucide-react';
import { Button } from '../components/ui/button';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

function Rankings() {
  const [rankings, setRankings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRankings();
  }, []);

  const fetchRankings = async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/rankings`);
      setRankings(response.data.rankings || []);
    } catch (error) {
      console.error('Error fetching rankings:', error);
    } finally {
      setLoading(false);
    }
  };

  const getKDRatio = (kills, deaths) => {
    if (deaths === 0) return kills;
    return (kills / deaths).toFixed(2);
  };

  const getRankMedal = (rank) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return rank;
  };

  return (
    <div data-testid="rankings-container">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-zinc-50 mb-2" style={{ fontFamily: 'Chivo, sans-serif' }}>
            Rankings
          </h1>
          <p className="text-sm text-zinc-400">Top players leaderboard</p>
        </div>
        <Button
          onClick={fetchRankings}
          data-testid="refresh-rankings-button"
          className="bg-zinc-800 hover:bg-zinc-700 text-zinc-50 border border-zinc-700 rounded-sm font-bold uppercase text-xs"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="stat-card">
          <Trophy className="w-5 h-5 text-amber-500 mb-3" />
          <div className="metric-label">TOTAL PLAYERS</div>
          <div className="metric-number">{rankings.length}</div>
        </div>
        <div className="stat-card">
          <Target className="w-5 h-5 text-red-500 mb-3" />
          <div className="metric-label">TOTAL KILLS</div>
          <div className="metric-number">
            {rankings.reduce((sum, r) => sum + (r.kills || 0), 0)}
          </div>
        </div>
        <div className="stat-card">
          <TrendingUp className="w-5 h-5 text-green-500 mb-3" />
          <div className="metric-label">TOP PLAYER</div>
          <div className="text-lg font-bold text-zinc-50 mt-1">
            {rankings[0]?.name || 'N/A'}
          </div>
        </div>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-sm overflow-hidden">
        <table className="data-table">
          <thead>
            <tr>
              <th>RANK</th>
              <th>NAME</th>
              <th>GANG</th>
              <th>KILLS</th>
              <th>DEATHS</th>
              <th>K/D</th>
              <th>LEVEL</th>
              <th>RESPECT</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="8" className="text-center py-8 text-zinc-500">
                  Loading rankings...
                </td>
              </tr>
            ) : rankings.length === 0 ? (
              <tr>
                <td colSpan="8" className="text-center py-8 text-zinc-500">
                  No rankings data available
                </td>
              </tr>
            ) : (
              rankings.map((player, index) => (
                <tr key={index} data-testid={`ranking-row-${index}`}>
                  <td className="font-mono font-bold text-amber-500">
                    {getRankMedal(index + 1)}
                  </td>
                  <td className="font-medium text-zinc-50">{player.name}</td>
                  <td className="text-zinc-400">{player.gang || 'None'}</td>
                  <td className="font-mono text-green-500">{player.kills || 0}</td>
                  <td className="font-mono text-red-500">{player.deaths || 0}</td>
                  <td className="font-mono font-bold text-amber-500">
                    {getKDRatio(player.kills || 0, player.deaths || 0)}
                  </td>
                  <td className="font-mono">{player.level || 0}</td>
                  <td className="font-mono text-blue-500">{player.respect || 0}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Rankings;
