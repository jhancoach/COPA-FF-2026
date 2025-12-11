import React, { useState, useMemo, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { DashboardData } from '../types';
import { calculateTeamStats } from '../services/dataService';
import { Shield, TrendingUp, Crosshair, Users, Map as MapIcon, ArrowLeft, Trophy, Target } from 'lucide-react';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, LabelList, PieChart, Pie, Cell, Legend } from 'recharts';
import FilterBar from '../components/FilterBar';

interface TeamsProps {
  data: DashboardData;
}

// Gold, Orange, Red, Blue theme for charts
const COLORS = ['#EAB308', '#F97316', '#EF4444', '#3B82F6', '#A855F7', '#10B981', '#6366F1', '#EC4899'];

const Teams: React.FC<TeamsProps> = ({ data }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [filters, setFilters] = useState({
     team: 'All', players: [], weapon: 'All', safe: 'All', map: 'All', round: 'All', confrontation: 'All'
  });

  // Check for navigation state (e.g. from Leaderboard click)
  useEffect(() => {
      if (location.state?.team) {
          setFilters(prev => ({ ...prev, team: location.state.team }));
          // Clear state so browser refresh doesn't get stuck (optional, but good UX)
          window.history.replaceState({}, document.title);
      }
  }, [location.state]);

  const allTeamStats = useMemo(() => calculateTeamStats(data), [data]);
  
  const filterOptions = useMemo(() => ({
    teams: allTeamStats.map(s => s.name).sort(),
    players: [], weapons: [], safes: [], maps: [], rounds: [], confrontations: []
  }), [allTeamStats]);

  // Handle selecting a team (either via filter bar or clicking a card)
  const selectedTeamName = filters.team !== 'All' ? filters.team : null;
  const selectedTeamStats = selectedTeamName ? allTeamStats.find(t => t.name === selectedTeamName) : null;

  // --- DERIVED DATA FOR DETAILED VIEW ---

  // 1. Chart Data: Points/Kills Evolution per Round
  const evolutionData = useMemo(() => {
     if (!selectedTeamName) return [];
     const roundsMap = new Map<string, { rd: string, pts: number, kills: number }>();

     data.details.forEach(d => {
         if (d.TIME !== selectedTeamName) return;
         if (!d.RD) return;

         const pts = parseInt(d.PTS) || 0;
         const kills = parseInt(d.ABTS) || 0;

         if (!roundsMap.has(d.RD)) {
             roundsMap.set(d.RD, { rd: d.RD, pts: 0, kills: 0 });
         }
         const r = roundsMap.get(d.RD)!;
         r.pts += pts;
         r.kills += kills;
     });

     return Array.from(roundsMap.values()).sort((a,b) => {
         const numA = parseInt(a.rd.replace(/\D/g, ''));
         const numB = parseInt(b.rd.replace(/\D/g, ''));
         return (numA || 0) - (numB || 0) || a.rd.localeCompare(b.rd);
     });
  }, [data.details, selectedTeamName]);

  // 2. Player Roster & Kill Contribution
  const { roster, killDistribution } = useMemo(() => {
      if (!selectedTeamName) return { roster: [], killDistribution: [] };

      // Aggregate from fPlayersDados
      const playersMap = new Map<string, { name: string, kills: number, matches: number }>();
      
      data.players.filter(p => p.TIME === selectedTeamName).forEach(p => {
          if (!playersMap.has(p.PLAYER)) {
              playersMap.set(p.PLAYER, { name: p.PLAYER, kills: 0, matches: 0 });
          }
          const pm = playersMap.get(p.PLAYER)!;
          pm.kills += parseInt(p.Abates || '0');
          pm.matches += parseInt(p.S || '0');
      });

      const rosterList = Array.from(playersMap.values()).sort((a,b) => b.kills - a.kills);
      
      const chartData = rosterList.map(p => ({
          name: p.name,
          value: p.kills
      })).filter(p => p.value > 0);

      return { roster: rosterList, killDistribution: chartData };
  }, [data.players, selectedTeamName]);

  // 3. Map Performance
  const mapStats = useMemo(() => {
      if (!selectedTeamName) return [];
      const stats = new Map<string, { map: string, pts: number, kills: number, booyahs: number, matches: number }>();

      data.details.filter(d => d.TIME === selectedTeamName).forEach(d => {
          if (!d.MAPA) return;
          if (!stats.has(d.MAPA)) {
              stats.set(d.MAPA, { map: d.MAPA, pts: 0, kills: 0, booyahs: 0, matches: 0 });
          }
          const m = stats.get(d.MAPA)!;
          m.pts += parseInt(d.PTS || '0');
          m.kills += parseInt(d.ABTS || '0');
          m.booyahs += parseInt(d.B || '0');
          m.matches += parseInt(d.S || '0');
      });

      return Array.from(stats.values()).sort((a,b) => b.pts - a.pts);
  }, [data.details, selectedTeamName]);

  const totalRosterKills = useMemo(() => roster.reduce((acc, p) => acc + p.kills, 0), [roster]);

  const handlePlayerClick = (playerName: string) => {
    navigate('/players', { state: { player: playerName } });
  };

  if (data.loading) return <div className="text-center py-20 animate-pulse text-yellow-500 font-bold">CARREGANDO DADOS DAS EQUIPES...</div>;

  return (
    <div className="space-y-6">
        
        {/* Top Controls */}
        <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
            <FilterBar 
                filters={filters as any} 
                setFilters={setFilters as any} 
                options={filterOptions} 
            />
            {selectedTeamName && (
                <button 
                    onClick={() => setFilters(prev => ({...prev, team: 'All'}))}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors text-sm font-bold uppercase tracking-wide border border-gray-600"
                >
                    <ArrowLeft size={16} /> Voltar para Galeria
                </button>
            )}
        </div>

        {/* --- VIEW 1: DETAILED TEAM REPORT --- */}
        {selectedTeamName && selectedTeamStats ? (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                
                {/* Hero Section */}
                <div className="bg-[#1a1a1a] rounded-2xl p-8 border border-gray-800 shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
                         <Trophy size={200} className="text-yellow-600/20" />
                    </div>
                    <div className="flex flex-col md:flex-row items-center gap-8 relative z-10">
                         <div className="w-32 h-32 md:w-40 md:h-40 bg-black rounded-full border-4 border-yellow-500/50 flex items-center justify-center overflow-hidden shadow-lg p-2">
                             {selectedTeamStats.image ? (
                                 <img src={selectedTeamStats.image} alt={selectedTeamStats.name} className="w-full h-full object-contain" />
                             ) : (
                                 <Trophy size={64} className="text-gray-600" />
                             )}
                         </div>
                         <div className="text-center md:text-left space-y-2">
                             <h1 className="text-4xl md:text-5xl font-black italic text-white tracking-tight uppercase">{selectedTeamStats.name}</h1>
                             <div className="flex flex-wrap justify-center md:justify-start gap-4 mt-4">
                                 <Badge label="Pontos Totais" value={selectedTeamStats.pts} color="bg-yellow-500 text-black" />
                                 <Badge label="Booyahs" value={selectedTeamStats.b} color="bg-orange-500" icon={<Trophy size={14}/>} />
                                 <Badge label="Abates" value={selectedTeamStats.abts} color="bg-red-600" icon={<Crosshair size={14}/>} />
                                 <Badge label="Partidas" value={selectedTeamStats.s} color="bg-gray-800" />
                             </div>
                         </div>
                    </div>
                </div>

                {/* Main Stats Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    
                    {/* Column 1: Charts (Evolution + Contribution) - Takes 2 cols */}
                    <div className="lg:col-span-2 space-y-6">
                        
                        {/* Points Evolution */}
                        <div className="bg-[#1a1a1a] p-6 rounded-2xl border border-gray-800 shadow-lg">
                            <h3 className="text-white font-bold mb-4 flex items-center gap-2 uppercase">
                                <TrendingUp size={18} className="text-yellow-500"/> 
                                Evolução de Pontos e Abates por Rodada
                            </h3>
                            <div className="h-72">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={evolutionData} margin={{top: 20, right: 10, left: -20, bottom: 0}}>
                                        <XAxis dataKey="rd" stroke="#525252" fontSize={10} tickLine={false} axisLine={false} />
                                        <Tooltip 
                                            contentStyle={{ backgroundColor: '#171717', border: '1px solid #404040', borderRadius: '8px' }}
                                            itemStyle={{ color: '#E5E7EB' }}
                                            cursor={{fill: 'rgba(234, 179, 8, 0.1)'}}
                                        />
                                        <Legend />
                                        <Bar dataKey="pts" fill="#EAB308" radius={[2, 2, 0, 0]} name="Pontos">
                                            <LabelList dataKey="pts" position="top" fill="#D4D4D4" fontSize={10} fontWeight="bold" />
                                        </Bar>
                                        <Bar dataKey="kills" fill="#EF4444" radius={[2, 2, 0, 0]} name="Abates">
                                             <LabelList dataKey="kills" position="top" fill="#D4D4D4" fontSize={10} fontWeight="bold" />
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                         {/* Map Stats Table */}
                        <div className="bg-[#1a1a1a] rounded-2xl border border-gray-800 overflow-hidden">
                             <div className="p-4 bg-black border-b border-gray-800">
                                 <h3 className="text-white font-bold flex items-center gap-2 uppercase tracking-wide"><MapIcon size={18} className="text-green-500"/> Desempenho por Mapa</h3>
                             </div>
                             <div className="overflow-x-auto">
                                 <table className="w-full text-sm text-left">
                                     <thead className="text-xs text-gray-500 uppercase bg-black/50">
                                         <tr>
                                             <th className="px-4 py-3">Mapa</th>
                                             <th className="px-4 py-3 text-center">Jogos</th>
                                             <th className="px-4 py-3 text-center">Booyahs</th>
                                             <th className="px-4 py-3 text-center">Abates</th>
                                             <th className="px-4 py-3 text-center">Pontos</th>
                                             <th className="px-4 py-3 text-center">Média</th>
                                         </tr>
                                     </thead>
                                     <tbody className="divide-y divide-gray-800">
                                         {mapStats.map((m, i) => (
                                             <tr key={i} className="hover:bg-yellow-900/10 transition-colors">
                                                 <td className="px-4 py-3 font-bold text-white uppercase">{m.map}</td>
                                                 <td className="px-4 py-3 text-center text-gray-400">{m.matches}</td>
                                                 <td className="px-4 py-3 text-center text-yellow-500 font-black">{m.booyahs}</td>
                                                 <td className="px-4 py-3 text-center text-red-500 font-bold">{m.kills}</td>
                                                 <td className="px-4 py-3 text-center text-white font-bold">{m.pts}</td>
                                                 <td className="px-4 py-3 text-center text-gray-300 font-mono">{(m.pts / m.matches).toFixed(1)}</td>
                                             </tr>
                                         ))}
                                     </tbody>
                                 </table>
                             </div>
                        </div>

                    </div>

                    {/* Column 2: Roster & Distribution - Takes 1 col */}
                    <div className="space-y-6">
                        
                        {/* Kill Contribution Chart */}
                        <div className="bg-[#1a1a1a] p-6 rounded-2xl border border-gray-800 shadow-lg flex flex-col items-center">
                            <h3 className="text-white font-bold mb-2 flex items-center gap-2 w-full uppercase">
                                <Target size={18} className="text-red-500"/> 
                                Contribuição de Abates
                            </h3>
                            <div className="h-64 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={killDistribution}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={80}
                                            paddingAngle={5}
                                            dataKey="value"
                                        >
                                            {killDistribution.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="#1a1a1a" strokeWidth={2} />
                                            ))}
                                        </Pie>
                                        <Tooltip contentStyle={{ backgroundColor: '#171717', borderRadius: '8px', border: '1px solid #404040' }} itemStyle={{color: '#fff'}} />
                                        <Legend verticalAlign="bottom" height={36} iconType="circle" />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Player Roster List */}
                        <div className="bg-[#1a1a1a] rounded-2xl border border-gray-800 overflow-hidden shadow-lg">
                             <div className="p-4 bg-black border-b border-gray-800">
                                 <h3 className="text-white font-bold flex items-center gap-2 uppercase tracking-wide"><Users size={18} className="text-blue-500"/> Elenco (Roster)</h3>
                             </div>
                             <div className="divide-y divide-gray-800">
                                 {roster.map((player, idx) => {
                                     const percent = totalRosterKills > 0 ? ((player.kills / totalRosterKills) * 100).toFixed(1) : "0.0";
                                     return (
                                     <div 
                                        key={idx} 
                                        onClick={() => handlePlayerClick(player.name)}
                                        className="p-3 flex items-center justify-between hover:bg-yellow-900/10 hover:border-l-2 hover:border-yellow-500 transition-all cursor-pointer group"
                                     >
                                         <div className="flex items-center gap-3">
                                             <div className="w-8 h-8 rounded-full bg-gray-900 flex items-center justify-center text-xs font-bold text-gray-500 border border-gray-800 group-hover:border-yellow-500/50">
                                                 {player.name.substring(0,2).toUpperCase()}
                                             </div>
                                             <div>
                                                 <div className="text-sm font-bold text-white group-hover:text-yellow-400 transition-colors uppercase">{player.name}</div>
                                                 <div className="text-[10px] text-gray-500">{player.matches} Partidas</div>
                                             </div>
                                         </div>
                                         <div className="text-right">
                                             <div className="text-sm font-black text-red-500">{player.kills} Kills</div>
                                             <div className="text-[10px] text-gray-500 font-mono">KD: {player.matches > 0 ? (player.kills / player.matches).toFixed(2) : '0.00'}</div>
                                             <div className="text-[10px] text-yellow-500 font-bold">{percent}% da Equipe</div>
                                         </div>
                                     </div>
                                 )})}
                             </div>
                        </div>

                    </div>
                </div>

            </div>
        ) : (
            
        /* --- VIEW 2: TEAM GALLERY (GRID) --- */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-in fade-in duration-500">
            {allTeamStats.filter(t => filters.team === 'All' || t.name === filters.team).map(team => (
                <div 
                    key={team.name} 
                    onClick={() => setFilters(prev => ({...prev, team: team.name}))}
                    className="bg-[#1a1a1a] rounded-2xl p-6 border border-gray-800 shadow-lg hover:border-yellow-500/50 hover:shadow-yellow-500/10 transition-all cursor-pointer group relative overflow-hidden"
                >
                    <div className="absolute top-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <ArrowLeft className="rotate-180 text-yellow-500" size={20} />
                    </div>

                    <div className="flex flex-col items-center mb-6">
                         <div className="w-20 h-20 bg-black rounded-full flex items-center justify-center border border-gray-800 overflow-hidden mb-4 group-hover:scale-110 group-hover:border-yellow-500 transition-all duration-300 p-1">
                            {team.image ? (
                                <img src={team.image} alt={team.name} className="w-full h-full object-contain" />
                            ) : (
                                <Trophy className="text-gray-700" size={32} />
                            )}
                         </div>
                         <h3 className="text-xl font-black italic text-white text-center group-hover:text-yellow-400 transition-colors uppercase">{team.name}</h3>
                         <p className="text-xs text-gray-500 mt-1 uppercase tracking-wider font-bold">{team.s} Jogos</p>
                    </div>

                    <div className="space-y-3">
                        <StatRow label="Pontos Totais" value={team.pts} color="text-yellow-500" />
                        <StatRow label="Booyahs" value={team.b} color="text-orange-500" />
                        <StatRow label="Abates" value={team.abts} color="text-red-500" />
                        <div className="border-t border-gray-800 my-2 pt-2 grid grid-cols-3 gap-1 text-center">
                            <MiniStat label="Avg Pts" value={team.avgPts} />
                            <MiniStat label="Avg Kill" value={team.avgAbts} />
                            <MiniStat label="PTS/C" value={team.ptsc} />
                        </div>
                    </div>
                </div>
            ))}
        </div>
        )}
    </div>
  );
};

// --- Helpers ---

const Badge = ({ label, value, color, icon }: any) => (
    <div className={`px-4 py-2 rounded-lg ${color} text-white shadow-lg flex items-center gap-2 font-bold`}>
        {icon}
        <div>
            <span className="block text-[10px] opacity-80 uppercase tracking-wider">{label}</span>
            <span className="block text-xl font-black leading-none">{value}</span>
        </div>
    </div>
);

const StatRow = ({ label, value, color }: any) => (
    <div className="flex justify-between items-center bg-[#0f0f0f] p-2 rounded-lg border border-gray-800">
        <span className="text-xs text-gray-500 uppercase font-bold tracking-wide">{label}</span>
        <span className={`text-lg font-black ${color}`}>{value}</span>
    </div>
);

const MiniStat = ({ label, value }: any) => (
    <div>
        <div className="text-[9px] text-gray-600 uppercase font-bold">{label}</div>
        <div className="text-sm font-bold text-gray-300 font-mono">{value}</div>
    </div>
);

export default Teams;