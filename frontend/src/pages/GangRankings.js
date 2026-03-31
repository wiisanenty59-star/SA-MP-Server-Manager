import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Trophy, Crown, Target, Users, Crosshair, MapPin, RefreshCw } from 'lucide-react';
import { Button } from '../components/ui/button';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

function GangRankings() {
  const [rankings, setRankings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchRankings(); }, []);

  const fetchRankings = async () => {
    try {
      const res = await axios.get(`${BACKEND_URL}/api/gangs/rankings`);
      setRankings(res.data.rankings || []);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  const getRankStyle = (rank) => {
    if (rank === 1) return 'bg-amber-500/10 border-amber-500/30';
    if (rank === 2) return 'bg-zinc-400/10 border-zinc-400/30';
    if (rank === 3) return 'bg-orange-700/10 border-orange-700/30';
    return 'bg-zinc-900 border-zinc-800';
  };

  const getRankLabel = (rank) => {
    if (rank === 1) return { icon: Crown, color: 'text-amber-400', label: '1ST' };
    if (rank === 2) return { icon: Trophy, color: 'text-zinc-300', label: '2ND' };
    if (rank === 3) return { icon: Trophy, color: 'text-orange-600', label: '3RD' };
    return { icon: null, color: 'text-zinc-500', label: `#${rank}` };
  };

  const topGang = rankings[0];

  return (
    <div data-testid="gang-rankings-container">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-zinc-50 mb-2" style={{ fontFamily: 'Chivo, sans-serif' }}>Gang Rankings</h1>
          <p className="text-sm text-zinc-400">Which gang runs these streets?</p>
        </div>
        <Button onClick={fetchRankings} data-testid="refresh-gang-rankings" className="bg-zinc-800 hover:bg-zinc-700 text-zinc-50 border border-zinc-700 rounded-sm font-bold uppercase text-xs">
          <RefreshCw className="w-4 h-4 mr-2" /> Refresh
        </Button>
      </div>

      {/* Top Gang Spotlight */}
      {topGang && (
        <div data-testid="top-gang-spotlight" className="mb-6 p-6 rounded-sm border" style={{ borderColor: topGang.color + '44', background: `linear-gradient(135deg, ${topGang.color}11 0%, transparent 60%)` }}>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-sm flex items-center justify-center text-2xl font-black" style={{ backgroundColor: topGang.color + '22', color: topGang.color, border: `2px solid ${topGang.color}66` }}>
              {topGang.tag}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <Crown className="w-5 h-5 text-amber-400" />
                <span className="text-xs text-amber-400 font-bold uppercase tracking-wider">#1 Gang</span>
              </div>
              <h2 className="text-3xl font-black text-zinc-50" style={{ fontFamily: 'Chivo, sans-serif' }}>{topGang.name}</h2>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-4">
            {[
              { label: 'Score', value: topGang.score, color: 'text-amber-400' },
              { label: 'Kills', value: topGang.total_kills, color: 'text-green-500' },
              { label: 'K/D', value: topGang.kd_ratio, color: 'text-blue-400' },
              { label: 'Members', value: topGang.members, color: 'text-zinc-50' },
              { label: 'Turf', value: topGang.territories, color: 'text-purple-400' },
            ].map((stat, i) => (
              <div key={i} className="bg-zinc-950/60 rounded-sm p-3 text-center">
                <div className="text-xs text-zinc-500 uppercase tracking-wider">{stat.label}</div>
                <div className={`text-xl font-bold font-mono ${stat.color}`}>{stat.value}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Rankings Table */}
      <div className="space-y-2">
        {loading ? (
          <div className="text-zinc-500 text-center py-8">Loading rankings...</div>
        ) : rankings.length === 0 ? (
          <div className="text-zinc-500 text-center py-8">No gang data yet</div>
        ) : (
          rankings.map((gang) => {
            const rankInfo = getRankLabel(gang.rank);
            const RankIcon = rankInfo.icon;
            return (
              <div key={gang.gang_id} data-testid={`gang-rank-row-${gang.gang_id}`}
                className={`rounded-sm border p-4 flex items-center gap-4 transition-colors hover:bg-zinc-800/40 ${getRankStyle(gang.rank)}`}>
                {/* Rank */}
                <div className="w-12 text-center flex-shrink-0">
                  {RankIcon ? (
                    <RankIcon className={`w-6 h-6 mx-auto ${rankInfo.color}`} />
                  ) : (
                    <span className={`text-lg font-bold font-mono ${rankInfo.color}`}>{rankInfo.label}</span>
                  )}
                </div>

                {/* Gang Tag + Name */}
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="w-10 h-10 rounded-sm flex items-center justify-center text-xs font-black flex-shrink-0"
                    style={{ backgroundColor: gang.color + '22', color: gang.color, border: `1px solid ${gang.color}44` }}>
                    {gang.tag}
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-bold text-zinc-50 truncate">{gang.name}</h3>
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: gang.color }} />
                      <span className="text-xs text-zinc-500">{gang.tag}</span>
                    </div>
                  </div>
                </div>

                {/* Stats */}
                <div className="hidden sm:grid grid-cols-5 gap-4 text-center flex-shrink-0">
                  <div>
                    <div className="text-xs text-zinc-600 uppercase">Score</div>
                    <div className="text-sm font-bold font-mono text-amber-400">{gang.score}</div>
                  </div>
                  <div>
                    <div className="text-xs text-zinc-600 uppercase">Kills</div>
                    <div className="text-sm font-bold font-mono text-green-500">{gang.total_kills}</div>
                  </div>
                  <div>
                    <div className="text-xs text-zinc-600 uppercase">K/D</div>
                    <div className="text-sm font-bold font-mono text-blue-400">{gang.kd_ratio}</div>
                  </div>
                  <div>
                    <div className="text-xs text-zinc-600 uppercase">Members</div>
                    <div className="text-sm font-bold font-mono text-zinc-50">{gang.members}</div>
                  </div>
                  <div>
                    <div className="text-xs text-zinc-600 uppercase">Turf</div>
                    <div className="text-sm font-bold font-mono text-purple-400">{gang.territories}</div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export default GangRankings;
