import React, { useMemo } from 'react';
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
  const [stats, setStats] = React.useState<TeamStats[]>([]);
  
  // Phase State: ALL, QUALIFIERS (1-6), FINALS (7)
  const [phase, setPhase] = React.useState<'ALL' | 'QUALIFIERS' | 'FINALS'>('ALL');

  // Filters State
  const [filters, setFilters] = React.useState<{
    team: string;
    players: string[];
    weapon: string;
    safe: string;
    map: string;
    round: string;
    confrontation: string;
  }>({
    team: 'All', players: [], weapon: 'All', safe: 'All', map: 'All', round: 'All', confrontation: 'All'
  });

  const filterOptions = useMemo(() => ({
    teams: Array.from(new Set(data.details.map(d => d.TIME))).filter(Boolean).sort(),
    players: [], // Not relevant for team leaderboard
    weapons: [], // Not relevant
    safes: [], // Not relevant
    maps: Array.from(new Set(data.details.map(d => d.MAPA))).filter(Boolean).sort(),
    rounds: Array.from(new Set(data.details.map(d => d.RD))).filter(Boolean).sort(),
    confrontations: Array.from(new Set(data.details.map(d => d.CONFRONTO))).filter(Boolean).sort(),
  }), [data.details]);

  React.useEffect(() => {
    if (!data.loading) {
      // Create a shallow copy of data to filter detail rows before calculating
      const filteredDetails = data.details.filter(d => {
        // 1. Apply visual filters from FilterBar
        if (filters.team !== 'All' && d.TIME !== filters.team) return false;
        if (filters.map !== 'All' && d.MAPA !== filters.map) return false;
        if (filters.round !== 'All' && d.RD !== filters.round) return false;
        if (filters.confrontation !== 'All' && d.CONFRONTO !== filters.confrontation) return false;

        // 2. Apply Tournament Phase Logic
        const roundNum = parseInt(d.RD.replace(/\D/g, '')) || 0;
        
        if (phase === 'QUALIFIERS') {
            // Rounds 1 to 6
            if (roundNum < 1 || roundNum > 6) return false;
        } else if (phase === 'FINALS') {
            // Round 7 only
            if (roundNum !== 7) return false;
        }

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

  // Top 3 for Cards
  const topBooyahs = [...stats].sort((a, b) => b.b - a.b || b.pts - a.pts).slice(0, 3);
  const topPtsc = [...stats].sort((a, b) => b.ptsc - a.ptsc || b.pts - a.pts).slice(0, 3);
  const topAbts = [...stats].sort((a, b) => b.abts - a.abts || b.pts - a.pts).slice(0, 3);

  const Top3Card = ({ title, icon, teams, metricKey, metricLabel, colorClass }: { title: string, icon: React.ReactNode, teams: TeamStats[], metricKey: keyof TeamStats, metricLabel: string, colorClass: string }) => (
    <div className="bg-[#1a1a1a] rounded-2xl p-6 border border-gray-800 relative overflow-hidden group hover:border-yellow-600/50 transition-all shadow-lg">
      <div className={`absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity ${colorClass}`}>
        {icon}
      </div>
      <h3 className="text-lg font-black uppercase italic text-gray-200 mb-4 flex items-center gap-2">
        <span className={colorClass}>{icon}</span> {title}
      </h3>
      <div className="space-y-4">
        {teams.map((team, idx) => (
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
                 {team.image ? (
                    <img src={team.image} alt={team.name} className="w-8 h-8 rounded-full object-cover bg-black border border-gray-700" />
                 ) : (
                    <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center text-xs text-gray-300">
                        {team.name.substring(0,2)}
                    </div>
                 )}
                 <span className="font-bold text-gray-200 text-sm hover:text-yellow-400 uppercase tracking-tight">{team.name}</span>
              </div>
            </div>
            <div className="text-right">
              <span className={`block font-black text-xl italic ${colorClass}`}>{team[metricKey]}</span>
              <span className="text-[9px] text-gray-500 uppercase font-bold">{metricLabel}</span>
            </div>
          </div>
        ))}
        {teams.length === 0 && <div className="text-center text-xs text-gray-600 py-4">Sem dados nesta fase</div>}
      </div>
    </div>
  );

  return (
    <div className="space-y-6 pb-12">
      
      {/* PHASE SELECTOR */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex bg-[#1a1a1a] p-1.5 rounded-xl border border-gray-800">
            <button 
                onClick={() => setPhase('ALL')}
                className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all ${phase === 'ALL' ? 'bg-gray-700 text-white shadow' : 'text-gray-500 hover:text-white'}`}
            >
                <Layers size={14}/> Geral
            </button>
            <button 
                onClick={() => setPhase('QUALIFIERS')}
                className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all ${phase === 'QUALIFIERS' ? 'bg-blue-600 text-white shadow shadow-blue-900/50' : 'text-gray-500 hover:text-white'}`}
            >
                <Crosshair size={14}/> Classificatórias (1-6)
            </button>
            <button 
                onClick={() => setPhase('FINALS')}
                className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all ${phase === 'FINALS' ? 'bg-yellow-500 text-black shadow shadow-yellow-500/50' : 'text-gray-500 hover:text-white'}`}
            >
                <Star size={14} fill={phase === 'FINALS' ? 'black' : 'none'}/> Final (7)
            </button>
          </div>
          <div className="text-xs text-gray-500 font-bold uppercase tracking-widest hidden sm:block">
             Fase Atual: <span className="text-white">{phase === 'ALL' ? 'Campeonato Completo' : phase === 'QUALIFIERS' ? 'Fase de Grupos' : 'Grande Final'}</span>
          </div>
      </div>

      <FilterBar filters={filters} setFilters={setFilters} options={filterOptions} />

      {/* Top 3 Sections */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in duration-500">
        <Top3Card 
          title="Top 3 Booyahs" 
          icon={<Trophy size={24} />} 
          teams={topBooyahs} 
          metricKey="b" 
          metricLabel="Vitórias"
          colorClass="text-yellow-500"
        />
        <Top3Card 
          title="Top 3 PTS/C" 
          icon={<Crown size={24} />} 
          teams={topPtsc} 
          metricKey="ptsc" 
          metricLabel="Pts Colocação"
          colorClass="text-orange-400"
        />
        <Top3Card 
          title="Top 3 Abates" 
          icon={<Crosshair size={24} />} 
          teams={topAbts} 
          metricKey="abts" 
          metricLabel="Abates"
          colorClass="text-red-500"
        />
      </div>

      {/* Main Leaderboard Table */}
      <div className="bg-[#1a1a1a] rounded-2xl overflow-hidden border border-gray-800 shadow-xl animate-in slide-in-from-bottom-4 duration-500">
        <div className="p-4 border-b border-gray-800 bg-black flex justify-between items-center">
             <h3 className="font-black text-white uppercase text-sm tracking-widest flex items-center gap-2">
                 <Trophy size={16} className="text-yellow-500" /> 
                 Tabela de Classificação - {phase === 'ALL' ? 'Geral' : phase === 'QUALIFIERS' ? 'Classificatórias' : 'Grande Final'}
             </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left whitespace-nowrap">
            <thead className="bg-[#0f0f0f] text-gray-400 text-xs uppercase font-bold tracking-wider">
              <tr>
                <th className="px-4 py-4 text-center">#</th>
                <th className="px-4 py-4">Equipe</th>
                <th className="px-4 py-4 text-center bg-yellow-900/10 border-l border-r border-gray-800 text-yellow-500 font-black">PTS</th>
                <th className="px-4 py-4 text-center text-orange-300">PTSC</th>
                <th className="px-4 py-4 text-center text-red-400">ABTS</th>
                <th className="px-4 py-4 text-center text-yellow-400">B</th>
                <th className="px-4 py-4 text-center text-gray-300">S</th>
                <th className="px-4 py-4 text-center text-gray-500">Média Abates</th>
                <th className="px-4 py-4 text-center text-gray-500">Média Pts</th>
                <th className="px-4 py-4 text-center text-gray-500">Média PTSC</th>
                <th className="px-4 py-4 text-center text-gray-600">% Pts Pos</th>
                <th className="px-4 py-4 text-center text-gray-600">% Abates</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800 text-sm font-medium">
              {stats.map((team, index) => (
                <tr 
                    key={team.name} 
                    onClick={() => handleTeamClick(team.name)}
                    className="hover:bg-yellow-900/10 transition-colors group cursor-pointer"
                >
                  <td className="px-4 py-3 text-center font-mono text-gray-500 group-hover:text-yellow-500">{index + 1}</td>
                  <td className="px-4 py-3 font-bold text-white">
                    <div className="flex items-center gap-3">
                        {team.image ? (
                            <img src={team.image} alt={team.name} className="w-10 h-10 rounded-lg object-contain bg-black/40 p-1 border border-gray-800 group-hover:border-yellow-500/50" />
                        ) : (
                            <div className="w-10 h-10 rounded-lg bg-gray-800 flex items-center justify-center text-gray-500 text-xs">
                                {team.name.substring(0,2)}
                            </div>
                        )}
                        <span className="group-hover:text-yellow-400 transition-colors uppercase italic">{team.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center font-black text-white text-lg bg-yellow-900/5 border-l border-r border-gray-800 group-hover:bg-yellow-900/20">
                    {team.pts}
                  </td>
                  <td className="px-4 py-3 text-center text-orange-300">{team.ptsc}</td>
                  <td className="px-4 py-3 text-center text-red-400">{team.abts}</td>
                  <td className="px-4 py-3 text-center text-yellow-500 font-bold">{team.b}</td>
                  <td className="px-4 py-3 text-center text-gray-300">{team.s}</td>
                  
                  <td className="px-4 py-3 text-center text-gray-500">{team.avgAbts}</td>
                  <td className="px-4 py-3 text-center text-gray-500">{team.avgPts}</td>
                  <td className="px-4 py-3 text-center text-gray-500">{team.avgPtsc}</td>

                  <td className="px-4 py-3 text-center text-gray-500">
                    <span className="text-[10px] bg-gray-900 border border-gray-800 px-2 py-1 rounded">{team.percentPos}%</span>
                  </td>
                  <td className="px-4 py-3 text-center text-gray-500">
                    <span className="text-[10px] bg-gray-900 border border-gray-800 px-2 py-1 rounded">{team.percentAbts}%</span>
                  </td>
                </tr>
              ))}
              {stats.length === 0 && (
                  <tr>
                      <td colSpan={12} className="px-6 py-12 text-center text-gray-500">
                          Nenhum dado encontrado para a fase selecionada ({phase}).
                      </td>
                  </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Leaderboard;