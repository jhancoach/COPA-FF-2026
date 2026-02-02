
import React, { useMemo, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardData, TeamStats } from '../types';
import { calculateTeamStats } from '../services/dataService';
import { Trophy, Crosshair, Crown, Layers, Star } from 'lucide-react';
import FilterBar from '../components/FilterBar';

interface LeaderboardProps {
  data: DashboardData;
}

const Leaderboard: React.FC<LeaderboardProps> = ({ data }) => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<TeamStats[]>([]);
  const [phase, setPhase] = useState<'ALL' | 'QUALIFIERS' | 'FINALS'>('ALL');
  
  const [filters, setFilters] = useState({
    team: 'All',
    players: [] as string[],
    weapon: 'All',
    safe: 'All',
    map: 'All',
    rodada: 'All',
    queda: 'All',
    confrontation: 'All'
  });

  const filterOptions = useMemo(() => ({
    teams: Array.from(new Set(data.details.map(d => d.TIME))).filter(Boolean).sort(),
    players: [],
    weapons: [],
    safes: [],
    maps: Array.from(new Set(data.details.map(d => d.MAPA))).filter(Boolean).sort(),
    rounds: Array.from(new Set(data.details.map(d => d.RD))).filter(Boolean).sort(),
    quedas: Array.from(new Set(data.details.map(d => d.Q))).filter(Boolean).sort(),
    confrontations: Array.from(new Set(data.details.map(d => d.CONFRONTO))).filter(Boolean).sort(),
  }), [data.details]);

  const normalize = (val: string | undefined) => (val || '').trim().toUpperCase();

  useEffect(() => {
    if (!data.loading) {
      const filteredDetails = data.details.filter(d => {
        if (filters.team !== 'All' && d.TIME !== filters.team) return false;
        if (filters.map !== 'All' && normalize(d.MAPA) !== normalize(filters.map)) return false;
        if (filters.rodada !== 'All' && normalize(d.RD) !== normalize(filters.rodada)) return false;
        if (filters.confrontation !== 'All' && d.CONFRONTO !== filters.confrontation) return false;

        const roundNum = parseInt(d.RD.replace(/\D/g, '')) || 0;
        if (phase === 'QUALIFIERS' && (roundNum < 1 || roundNum > 6)) return false;
        if (phase === 'FINALS' && roundNum !== 7) return false;

        return true;
      });

      const filteredData = { ...data, details: filteredDetails };
      setStats(calculateTeamStats(filteredData));
    }
  }, [data, filters, phase]);

  const handleTeamClick = (teamName: string) => {
      navigate('/teams', { state: { team: teamName } });
  };

  if (data.loading) return <div className="text-center py-20 text-yellow-500 animate-pulse font-bold">CARREGANDO CLASSIFICAÇÃO...</div>;

  const topBooyahs = [...stats].sort((a, b) => b.b - a.b || b.pts - a.pts).slice(0, 3);
  const topPtsc = [...stats].sort((a, b) => b.ptsc - a.ptsc || b.pts - a.pts).slice(0, 3);
  const topAbts = [...stats].sort((a, b) => b.abts - a.abts || b.pts - a.pts).slice(0, 3);

  const Top3Card = ({ title, icon, teams, metricKey, metricLabel, colorClass }: any) => (
    <div className="bg-[#1a1a1a] rounded-2xl p-6 border border-gray-800 relative overflow-hidden group hover:border-yellow-600/50 transition-all shadow-lg">
      <div className={`absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity ${colorClass}`}>
        {icon}
      </div>
      <h3 className="text-lg font-black uppercase italic text-gray-200 mb-4 flex items-center gap-2">
        <span className={colorClass}>{icon}</span> {title}
      </h3>
      <div className="space-y-4">
        {teams.map((team: any, idx: number) => (
          <div 
            key={team.name} 
            onClick={() => handleTeamClick(team.name)}
            className="flex items-center justify-between bg-[#0f0f0f] p-3 rounded-xl border border-gray-800 cursor-pointer hover:bg-gray-800 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className={`w-6 h-6 rounded-sm skew-x-[-10deg] flex items-center justify-center text-xs font-bold ${idx === 0 ? 'bg-yellow-500 text-black' : idx === 1 ? 'bg-gray-400 text-black' : 'bg-orange-700 text-white'}`}>
                {idx + 1}
              </div>
              <div className="flex items-center gap-2">
                 {team.image && <img src={team.image} alt={team.name} className="w-8 h-8 rounded-full object-cover bg-black border border-gray-700" />}
                 <span className="font-bold text-gray-200 text-sm hover:text-yellow-400 uppercase tracking-tight">{team.name}</span>
              </div>
            </div>
            <div className="text-right">
              <span className={`block font-black text-xl italic ${colorClass}`}>{team[metricKey]}</span>
              <span className="text-[9px] text-gray-500 uppercase font-bold">{metricLabel}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex bg-[#1a1a1a] p-1.5 rounded-xl border border-gray-800">
            <button onClick={() => setPhase('ALL')} className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all ${phase === 'ALL' ? 'bg-gray-700 text-white' : 'text-gray-400'}`}><Layers size={14}/> Geral</button>
            <button onClick={() => setPhase('QUALIFIERS')} className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all ${phase === 'QUALIFIERS' ? 'bg-blue-600 text-white' : 'text-gray-400'}`}><Crosshair size={14}/> Classificatórias</button>
            <button onClick={() => setPhase('FINALS')} className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all ${phase === 'FINALS' ? 'bg-yellow-500 text-black' : 'text-gray-400'}`}><Star size={14}/> Final</button>
          </div>
      </div>

      <FilterBar filters={filters} setFilters={setFilters} options={filterOptions} />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Top3Card title="Top 3 Booyahs" icon={<Trophy size={24} />} teams={topBooyahs} metricKey="b" metricLabel="Vitórias" colorClass="text-yellow-500" />
        <Top3Card title="Top 3 PTS/C" icon={<Crown size={24} />} teams={topPtsc} metricKey="ptsc" metricLabel="Pts Colocação" colorClass="text-orange-400" />
        <Top3Card title="Top 3 Abates" icon={<Crosshair size={24} />} teams={topAbts} metricKey="abts" metricLabel="Abates" colorClass="text-red-500" />
      </div>

      <div className="bg-[#1a1a1a] rounded-2xl overflow-hidden border border-gray-800 shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left whitespace-nowrap">
            <thead className="bg-[#0f0f0f] text-gray-400 text-xs uppercase font-bold tracking-wider">
              <tr>
                <th className="px-4 py-4 text-center">#</th>
                <th className="px-4 py-4">Equipe</th>
                <th className="px-4 py-4 text-center bg-yellow-900/10 text-yellow-500 font-black">PTS</th>
                <th className="px-4 py-4 text-center">PTSC</th>
                <th className="px-4 py-4 text-center">ABTS</th>
                <th className="px-4 py-4 text-center">B</th>
                <th className="px-4 py-4 text-center">S</th>
                <th className="px-4 py-4 text-center">Média Abates</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800 text-sm font-medium">
              {stats.map((team, index) => (
                <tr key={team.name} onClick={() => handleTeamClick(team.name)} className="hover:bg-yellow-900/10 transition-colors group cursor-pointer">
                  <td className="px-4 py-3 text-center font-mono text-gray-500">{index + 1}</td>
                  <td className="px-4 py-3 font-bold text-white flex items-center gap-3">
                    {team.image && <img src={team.image} className="w-10 h-10 object-contain" alt={team.name}/>}
                    <span className="uppercase italic">{team.name}</span>
                  </td>
                  <td className="px-4 py-3 text-center font-black text-white text-lg bg-yellow-900/5">{team.pts}</td>
                  <td className="px-4 py-3 text-center text-orange-300">{team.ptsc}</td>
                  <td className="px-4 py-3 text-center text-red-400">{team.abts}</td>
                  <td className="px-4 py-3 text-center text-yellow-500">{team.b}</td>
                  <td className="px-4 py-3 text-center">{team.s}</td>
                  <td className="px-4 py-3 text-center">{team.avgAbts}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Leaderboard;
