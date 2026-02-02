
import React, { useState, useMemo, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { DashboardData, TeamStats, PlayerData } from '../types';
import { calculateTeamStats } from '../services/dataService';
import { Shield, TrendingUp, Users, ArrowLeft, Target, Award, Crosshair } from 'lucide-react';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, LabelList, PieChart, Pie, Cell, Legend, CartesianGrid, YAxis } from 'recharts';
import FilterBar from '../components/FilterBar';

interface TeamsProps {
  data: DashboardData;
}

const COLORS = ['#EAB308', '#F97316', '#EF4444', '#3B82F6', '#A855F7', '#10B981', '#6366F1', '#EC4899'];

const Teams: React.FC<TeamsProps> = ({ data }) => {
  const location = useLocation();
  const navigate = useNavigate();

  // Filtros Independentes por Página
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

  useEffect(() => {
      if (location.state?.team) {
          setFilters(prev => ({ ...prev, team: location.state.team }));
          window.history.replaceState({}, document.title);
      }
  }, [location.state]);

  const normalize = (val: string | undefined) => (val || '').trim().toUpperCase();

  // Estatísticas dos Times recalculadas com base nos filtros da página
  const filteredTeamStats = useMemo(() => {
    const filteredDetails = data.details.filter(d => {
      if (filters.map !== 'All' && normalize(d.MAPA) !== normalize(filters.map)) return false;
      if (filters.rodada !== 'All' && normalize(d.RD) !== normalize(filters.rodada)) return false;
      if (filters.queda !== 'All' && normalize(d.Q) !== normalize(filters.queda)) return false;
      return true;
    });
    return calculateTeamStats({ ...data, details: filteredDetails });
  }, [data, filters]);
  
  const filterOptions = useMemo(() => ({
    teams: Array.from(new Set(data.players.map(p => p.TIME))).filter(Boolean).sort(),
    players: [], 
    weapons: [], 
    safes: [], 
    maps: Array.from(new Set(data.players.map(p => p.MAPA))).filter(Boolean).sort(),
    rounds: Array.from(new Set(data.players.map(p => p.RD))).filter(Boolean).sort(),
    quedas: Array.from(new Set(data.players.map(p => p.Q))).filter(Boolean).sort(),
    confrontations: []
  }), [data.players]);

  const selectedTeamName = filters.team !== 'All' ? filters.team : null;
  const selectedTeamStats = selectedTeamName ? filteredTeamStats.find(t => t.name === selectedTeamName) : null;

  // --- ELENCO E CONTRIBUIÇÃO (Baseado em fPlayersDados e Filtros Locais) ---
  const teamRosterData = useMemo(() => {
      const rosters: Record<string, { name: string, kills: number, matches: number, avg: string }[]> = {};
      const filterMap = normalize(filters.map);
      const filterRd = normalize(filters.rodada);
      const filterQ = normalize(filters.queda);

      const filteredPlayers = data.players.filter(p => {
          if (filters.map !== 'All' && normalize(p.MAPA) !== filterMap) return false;
          if (filters.rodada !== 'All' && normalize(p.RD) !== filterRd) return false;
          if (filters.queda !== 'All' && normalize(p.Q) !== filterQ) return false;
          return true;
      });

      filteredPlayers.forEach(p => {
          if (!p.TIME) return;
          if (!rosters[p.TIME]) rosters[p.TIME] = [];
          
          let player = rosters[p.TIME].find(pl => pl.name === p.PLAYER);
          if (!player) {
              player = { name: p.PLAYER, kills: 0, matches: 0, avg: '0.00' };
              rosters[p.TIME].push(player);
          }
          player.kills += parseInt(p.Abates || '0');
          player.matches += parseInt(p.S || '0');
      });

      Object.keys(rosters).forEach(t => {
          rosters[t].forEach(p => {
              p.avg = p.matches > 0 ? (p.kills / p.matches).toFixed(2) : '0.00';
          });
          rosters[t].sort((a, b) => b.kills - a.kills);
      });

      return rosters;
  }, [data.players, filters]);

  const evolutionData = useMemo(() => {
     if (!selectedTeamName) return [];
     const roundsMap = new Map<string, { rd: string, pts: number, kills: number }>();
     data.details.filter(d => d.TIME === selectedTeamName).forEach(d => {
         if (!d.RD) return;
         if (!roundsMap.has(d.RD)) roundsMap.set(d.RD, { rd: d.RD, pts: 0, kills: 0 });
         const r = roundsMap.get(d.RD)!;
         r.pts += parseInt(d.PTS) || 0;
         r.kills += parseInt(d.ABTS) || 0;
     });
     return Array.from(roundsMap.values()).sort((a,b) => {
         const numA = parseInt(a.rd.replace(/\D/g, '')) || 0;
         const numB = parseInt(b.rd.replace(/\D/g, '')) || 0;
         return numA - numB;
     });
  }, [data.details, selectedTeamName]);

  const handlePlayerClick = (playerName: string) => {
    navigate('/players', { state: { player: playerName } });
  };

  if (data.loading) return <div className="text-center py-20 animate-pulse text-yellow-500 font-bold uppercase italic tracking-widest">Processando Equipes...</div>;

  return (
    <div className="space-y-8">
        <div className="flex flex-col md:flex-row gap-4 justify-between items-center no-print">
            <FilterBar filters={filters} setFilters={setFilters} options={filterOptions} />
            {selectedTeamName && (
                <button 
                    onClick={() => setFilters(prev => ({...prev, team: 'All'}))}
                    className="flex items-center gap-2 px-6 py-3 bg-white/5 hover:bg-white/10 text-yellow-500 rounded-xl transition-all text-xs font-black uppercase tracking-widest border border-white/5"
                >
                    <ArrowLeft size={16} /> Voltar à Galeria
                </button>
            )}
        </div>

        {selectedTeamName && selectedTeamStats ? (
            <div className="space-y-8 animate-in fade-in duration-500">
                {/* Header Profile */}
                <div className="bg-[#1a1a1a] rounded-3xl p-8 border border-gray-800 shadow-2xl relative overflow-hidden bg-gradient-to-br from-[#1a1a1a] to-black">
                    <div className="absolute top-0 right-0 p-12 opacity-5">
                         <Shield size={220} className="text-yellow-500" />
                    </div>
                    <div className="flex flex-col md:flex-row items-center gap-10 relative z-10">
                         <div className="w-40 h-40 bg-black rounded-3xl border-2 border-yellow-500/30 flex items-center justify-center overflow-hidden shadow-2xl p-4 rotate-2 hover:rotate-0 transition-transform duration-500">
                             {selectedTeamStats.image ? (
                                 <img src={selectedTeamStats.image} alt={selectedTeamStats.name} className="w-full h-full object-contain" />
                             ) : (
                                 <Shield size={80} className="text-gray-800" />
                             )}
                         </div>
                         <div className="text-center md:text-left space-y-4">
                             <div className="flex items-center gap-3 justify-center md:justify-start">
                                <span className="bg-yellow-500 text-black text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-tighter">PRO LEAGUE</span>
                                <span className="text-gray-500 text-[10px] font-bold uppercase tracking-widest">DADOS FILTRADOS</span>
                             </div>
                             <h1 className="text-5xl md:text-7xl font-black italic text-white tracking-tighter uppercase leading-none">{selectedTeamStats.name}</h1>
                             <div className="flex flex-wrap justify-center md:justify-start gap-4">
                                 <StatBadge label="PONTOS" value={selectedTeamStats.pts} color="text-yellow-500" />
                                 <StatBadge label="VITÓRIAS" value={selectedTeamStats.b} color="text-orange-500" />
                                 <StatBadge label="KILLS" value={selectedTeamStats.abts} color="text-red-500" />
                                 <StatBadge label="MÉDIA EQUIPE" value={selectedTeamStats.avgAbts} color="text-blue-500" />
                             </div>
                         </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Performance e Cards */}
                    <div className="lg:col-span-7 space-y-8">
                        <div className="bg-[#1a1a1a] p-8 rounded-3xl border border-gray-800 shadow-xl">
                            <h3 className="text-white font-black text-sm mb-12 flex items-center gap-3 uppercase tracking-widest">
                                <TrendingUp size={20} className="text-yellow-500"/> HISTÓRICO DE PERFORMANCE (PONTOS E ABATES POR RODADA)
                            </h3>
                            <div className="h-80">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={evolutionData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
                                        <XAxis dataKey="rd" stroke="#444" fontSize={11} fontWeight="bold" axisLine={false} tickLine={false} label={{ value: 'RODADAS', position: 'insideBottom', offset: -5, fill: '#666', fontSize: 10, fontWeight: 'bold' }} />
                                        <YAxis stroke="#444" fontSize={10} axisLine={false} tickLine={false} />
                                        <Tooltip cursor={{fill: 'rgba(255,255,255,0.05)'}} contentStyle={{ backgroundColor: '#000', border: '1px solid #333', borderRadius: '15px' }} />
                                        <Legend verticalAlign="top" align="right" wrapperStyle={{ paddingBottom: '20px', fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase' }} />
                                        <Bar dataKey="pts" name="Pontos" fill="#EAB308" radius={[4, 4, 0, 0]} barSize={35}>
                                            <LabelList dataKey="pts" position="top" fill="#fff" fontSize={10} fontWeight="900" />
                                        </Bar>
                                        <Bar dataKey="kills" name="Abates" fill="#EF4444" radius={[4, 4, 0, 0]} barSize={35}>
                                            <LabelList dataKey="kills" position="top" fill="#fff" fontSize={10} fontWeight="900" />
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-gradient-to-br from-yellow-900/10 to-black p-6 rounded-3xl border border-yellow-500/10">
                                <Award className="text-yellow-500 mb-4" size={32} />
                                <h4 className="text-white font-black uppercase italic text-lg">TOP PLAYER DO PERÍODO</h4>
                                <div className="mt-6 flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-full bg-yellow-500 flex items-center justify-center text-black font-black text-xl">
                                        {teamRosterData[selectedTeamName]?.[0]?.name.substring(0,1) || '?'}
                                    </div>
                                    <div>
                                        <span className="block text-white font-black text-xl uppercase italic">{teamRosterData[selectedTeamName]?.[0]?.name || '---'}</span>
                                        <div className="flex items-center gap-3">
                                            <span className="text-yellow-500 font-mono font-bold">{teamRosterData[selectedTeamName]?.[0]?.kills || 0} ABATES</span>
                                            <span className="text-blue-400 font-black text-xs italic">AVG: {teamRosterData[selectedTeamName]?.[0]?.avg || '0.00'}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-[#111] p-6 rounded-3xl border border-white/5 text-center flex flex-col items-center justify-center">
                                <div className="text-5xl font-black text-white italic">{selectedTeamStats.s}</div>
                                <div className="text-[10px] text-gray-500 font-bold uppercase mt-2 tracking-widest">PARTIDAS DISPUTADAS</div>
                            </div>
                        </div>
                    </div>

                    {/* Elenco e Contribuição */}
                    <div className="lg:col-span-5 space-y-8">
                        <div className="bg-[#1a1a1a] p-8 rounded-3xl border border-gray-800 shadow-xl">
                            <h3 className="text-white font-black text-sm mb-6 flex items-center gap-3 uppercase tracking-widest">
                                <Target size={20} className="text-red-500"/> % CONTRIBUIÇÃO DE ABATES
                            </h3>
                            <div className="h-64 mb-6">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={teamRosterData[selectedTeamName]?.map(p => ({ name: p.name, value: p.kills }))}
                                            innerRadius={60}
                                            outerRadius={90}
                                            paddingAngle={8}
                                            dataKey="value"
                                        >
                                            {teamRosterData[selectedTeamName]?.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip contentStyle={{backgroundColor: '#000', border: '1px solid #333'}} />
                                        <Legend />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                            
                            {/* Lista de Legenda e Médias (Estatísticas fPlayersDados) */}
                            <div className="space-y-4 pt-6 border-t border-gray-800">
                                <div className="flex justify-between items-center mb-4">
                                    <span className="text-[10px] text-gray-500 font-black uppercase tracking-widest">ELENCO (fPlayersDados)</span>
                                </div>
                                <div className="divide-y divide-gray-900">
                                    {teamRosterData[selectedTeamName]?.map((player, idx) => {
                                        const totalKills = teamRosterData[selectedTeamName].reduce((acc, curr) => acc + curr.kills, 0) || 1;
                                        const percent = ((player.kills / totalKills) * 100).toFixed(1);
                                        return (
                                            <div key={idx} onClick={() => handlePlayerClick(player.name)} className="py-4 flex flex-col gap-3 group cursor-pointer">
                                                <div className="flex justify-between items-center">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-10 h-10 rounded-xl bg-gray-900 border border-gray-800 flex items-center justify-center font-black text-gray-500 group-hover:border-yellow-500 transition-colors" style={{color: COLORS[idx % COLORS.length]}}>
                                                            {player.name.substring(0,2).toUpperCase()}
                                                        </div>
                                                        <div>
                                                            <span className="block text-white font-black text-sm uppercase italic group-hover:text-yellow-500 transition-colors">{player.name}</span>
                                                            <div className="flex items-center gap-2 mt-1">
                                                                <span className="text-[9px] text-gray-600 font-bold uppercase tracking-widest">{player.matches} JOGOS</span>
                                                                <span className="text-[10px] text-blue-400 font-black italic">AVG: {player.avg}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <span className="block text-red-500 font-black text-lg leading-none">{player.kills}</span>
                                                        <span className="text-[9px] text-gray-500 font-bold uppercase">KILLS</span>
                                                    </div>
                                                </div>
                                                <div className="w-full bg-gray-900 h-1.5 rounded-full overflow-hidden flex items-center">
                                                    <div 
                                                        className="h-full rounded-full transition-all duration-1000"
                                                        style={{ width: `${percent}%`, backgroundColor: COLORS[idx % COLORS.length] }}
                                                    ></div>
                                                </div>
                                                <div className="flex justify-between text-[9px] font-black uppercase tracking-tighter">
                                                    <span className="text-gray-600">IMPACTO NO TIME</span>
                                                    <span className="text-yellow-500">{percent}%</span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        ) : (
            /* VIEW: GALERIA DE TIMES (GRID) */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-in fade-in duration-500">
                {filteredTeamStats.map(team => (
                    <div 
                        key={team.name} 
                        onClick={() => setFilters(prev => ({...prev, team: team.name}))}
                        className="bg-[#1a1a1a] rounded-3xl p-6 border border-gray-800 shadow-xl hover:border-yellow-500/40 hover:translate-y-[-5px] transition-all cursor-pointer group flex flex-col"
                    >
                        <div className="flex items-center justify-between mb-6">
                            <div className="w-16 h-16 bg-black rounded-2xl flex items-center justify-center border border-gray-800 p-2 group-hover:scale-110 group-hover:border-yellow-500 transition-all">
                                {team.image ? <img src={team.image} alt={team.name} className="w-full h-full object-contain" /> : <Shield className="text-gray-800" size={24} />}
                            </div>
                            <div className="text-right">
                                <h3 className="text-xl font-black italic text-white uppercase leading-none group-hover:text-yellow-500 transition-colors">{team.name}</h3>
                                <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1 block">{team.pts} PONTOS</span>
                            </div>
                        </div>

                        <div className="space-y-4 flex-1">
                            <div className="bg-black/40 rounded-2xl p-4 border border-white/5">
                                <span className="text-[9px] text-gray-600 font-black uppercase tracking-widest mb-3 block border-b border-white/5 pb-2">TOP ATIRADORES</span>
                                <div className="space-y-2">
                                    {teamRosterData[team.name]?.slice(0, 3).map((p, i) => (
                                        <div key={i} className="flex justify-between items-center text-[11px] font-bold uppercase italic">
                                            <div className="flex items-center gap-2">
                                                <span className="text-gray-400 truncate max-w-[80px]">{p.name}</span>
                                            </div>
                                            <span className="text-red-500 font-black">{p.kills}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                                <div className="bg-black/20 p-2 rounded-xl border border-white/5 flex flex-col items-center">
                                    <span className="text-[8px] text-gray-600 font-black uppercase tracking-tighter">VITÓRIAS</span>
                                    <span className="text-sm font-black text-yellow-500">{team.b}</span>
                                </div>
                                <div className="bg-black/20 p-2 rounded-xl border border-white/5 flex flex-col items-center">
                                    <span className="text-[8px] text-gray-600 font-black uppercase tracking-tighter">AVG KILLS</span>
                                    <span className="text-sm font-black text-blue-400">{team.avgAbts}</span>
                                </div>
                            </div>
                        </div>

                        <div className="mt-6 flex justify-center">
                            <div className="text-[10px] font-black text-yellow-500/50 uppercase tracking-widest group-hover:text-yellow-500 transition-colors">PERFIL DA EQUIPE →</div>
                        </div>
                    </div>
                ))}
            </div>
        )}
    </div>
  );
};

const StatBadge = ({ label, value, color }: any) => (
    <div className="bg-black/60 px-5 py-3 rounded-2xl border border-white/5 text-center min-w-[100px] shadow-inner">
        <span className="block text-[10px] text-gray-500 font-black uppercase tracking-widest mb-1">{label}</span>
        <span className={`block text-2xl font-black ${color} italic`}>{value}</span>
    </div>
);

export default Teams;
