
import React, { useMemo, useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { DashboardData, PlayerData } from '../types';
import { Trophy, Crown, User, Swords, Zap, BarChart2, Scale, Map as MapIcon, Skull, ChevronRight, Sparkles, X, Activity, Info, Crosshair, Shield, ArrowLeft, Disc } from 'lucide-react';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, LabelList, Cell, YAxis, CartesianGrid } from 'recharts';
import FilterBar from '../components/FilterBar';

interface PlayersProps {
  data: DashboardData;
  globalFilters: any;
  setGlobalFilters: any;
}

const Players: React.FC<PlayersProps> = ({ data, globalFilters, setGlobalFilters }) => {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState<'ranking' | 'chars' | 'report' | 'compare' | 'auditoria'>('ranking');

  // Detecta navegação externa (clique em jogador em outra página)
  useEffect(() => {
    if (location.state?.player) {
      setGlobalFilters((prev: any) => ({ ...prev, players: [location.state.player] }));
      setActiveTab('report');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      window.history.replaceState({}, document.title);
    }
  }, [location.state, setGlobalFilters]);

  const [compareA, setCompareA] = useState<string>('');
  const [compareB, setCompareB] = useState<string>('');

  const normalize = (val: string | undefined) => (val || '').trim().toUpperCase();

  const filterOptions = useMemo(() => {
    const teams = Array.from(new Set(data.players.map(p => p.TIME))).filter(Boolean).sort();
    const players = Array.from(new Set(data.players.map(p => p.PLAYER))).filter(Boolean).sort();
    
    const maps = Array.from(new Set([
        ...data.players.map(p => p.MAPA),
        ...data.killFeed.map(k => k.MAPA)
    ])).filter(Boolean).sort();

    const rounds = Array.from(new Set([
        ...data.players.map(p => p.RD),
        ...data.killFeed.map(k => k.RD)
    ])).filter(Boolean).sort();

    const quedas = Array.from(new Set([
        ...data.players.map(p => p.Q),
        ...data.killFeed.map(k => k.Q)
    ])).filter(Boolean).sort();

    return { teams, players, weapons: [], safes: [], maps, rounds, quedas, confrontations: [] };
  }, [data.players, data.killFeed]);

  const playerToTeamMap = useMemo(() => {
      const m = new Map<string, string>();
      data.players.forEach(p => {
          if (p.PLAYER && p.TIME) m.set(normalize(p.PLAYER), p.TIME);
      });
      return m;
  }, [data.players]);

  const auditData = useMemo(() => {
    if (activeTab !== 'auditoria') return [];
    const filterMap = normalize(globalFilters.map);
    const filterRd = normalize(globalFilters.rodada);
    const filterQ = normalize(globalFilters.queda);

    const filteredA = data.players.filter(p => {
      if (globalFilters.team !== 'All' && p.TIME !== globalFilters.team) return false;
      if (globalFilters.players.length > 0 && !globalFilters.players.includes(p.PLAYER)) return false;
      if (globalFilters.map !== 'All' && normalize(p.MAPA) !== filterMap) return false;
      if (globalFilters.rodada !== 'All' && normalize(p.RD) !== filterRd) return false;
      if (globalFilters.queda !== 'All' && normalize(p.Q) !== filterQ) return false;
      return true;
    });

    const filteredB = data.killFeed.filter(k => {
      if (globalFilters.map !== 'All' && normalize(k.MAPA) !== filterMap) return false;
      if (globalFilters.rodada !== 'All' && normalize(k.RD) !== filterRd) return false;
      if (globalFilters.queda !== 'All' && normalize(k.Q) !== filterQ) return false;
      if (globalFilters.players.length > 0 && !globalFilters.players.includes(k.PLAYER)) return false;
      if (globalFilters.team !== 'All') {
          const team = playerToTeamMap.get(normalize(k.PLAYER));
          if (team !== globalFilters.team) return false;
      }
      return true;
    });

    const allPlayers = new Set<string>();
    const statsA: Record<string, { kills: number, team: string }> = {};
    const statsB: Record<string, number> = {};

    filteredA.forEach(p => {
      if (!p.PLAYER) return;
      allPlayers.add(p.PLAYER);
      statsA[p.PLAYER] = {
        kills: (statsA[p.PLAYER]?.kills || 0) + (parseInt(p.Abates) || 0),
        team: p.TIME
      };
    });

    filteredB.forEach(k => {
      if (!k.PLAYER) return;
      allPlayers.add(k.PLAYER);
      statsB[k.PLAYER] = (statsB[k.PLAYER] || 0) + 1;
    });

    return Array.from(allPlayers).map(name => ({
      name,
      team: statsA[name]?.team || playerToTeamMap.get(normalize(name)) || 'N/A',
      killsA: statsA[name]?.kills || 0,
      killsB: statsB[name] || 0
    })).sort((a, b) => b.killsA - a.killsA);
  }, [data.players, data.killFeed, globalFilters, activeTab, playerToTeamMap]);

  const rankingData = useMemo(() => {
    if (activeTab !== 'ranking') return [];
    const filterMap = normalize(globalFilters.map);
    const filterRd = normalize(globalFilters.rodada);
    const filterQ = normalize(globalFilters.queda);

    const filtered = data.players.filter(p => {
        if (globalFilters.team !== 'All' && p.TIME !== globalFilters.team) return false;
        if (globalFilters.players.length > 0 && !globalFilters.players.includes(p.PLAYER)) return false;
        if (globalFilters.map !== 'All' && normalize(p.MAPA) !== filterMap) return false;
        if (globalFilters.rodada !== 'All' && normalize(p.RD) !== filterRd) return false;
        if (globalFilters.queda !== 'All' && normalize(p.Q) !== filterQ) return false;
        return true;
    });

    const statsMap = new Map<string, { kills: number; matches: number; team: string }>();
    filtered.forEach(p => {
        if (!p.PLAYER) return;
        const kills = parseInt(p.Abates || '0');
        const matches = parseInt(p.S || '0'); 
        if (!statsMap.has(p.PLAYER)) {
            statsMap.set(p.PLAYER, { kills, matches, team: p.TIME });
        } else {
            const s = statsMap.get(p.PLAYER)!;
            s.kills += kills;
            s.matches += matches;
        }
    });

    return Array.from(statsMap.entries()).map(([name, stat]) => ({
        name,
        team: stat.team,
        kills: stat.kills,
        matches: stat.matches,
        avg: stat.matches > 0 ? (stat.kills / stat.matches).toFixed(2) : '0.00'
    })).sort((a, b) => b.kills - a.kills);
  }, [data.players, globalFilters, activeTab]);

  const handlePlayerClick = (playerName: string) => {
      setGlobalFilters((prev: any) => ({ ...prev, players: [playerName] }));
      setActiveTab('report');
      window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const charactersData = useMemo(() => {
    if (activeTab !== 'chars') return [];
    const filterMap = normalize(globalFilters.map);
    const filterRd = normalize(globalFilters.rodada);

    return data.characters.filter(c => {
        if (globalFilters.team !== 'All' && c.Time !== globalFilters.team) return false;
        if (globalFilters.players.length > 0 && !globalFilters.players.includes(c.Player)) return false;
        if (globalFilters.map !== 'All' && normalize(c.Mapa) !== filterMap) return false;
        if (globalFilters.rodada !== 'All' && normalize(c.Rd) !== filterRd) return false;
        return true;
    }).map(c => {
         const findDim = (dims: any[], name: string) => {
             if (!name) return undefined;
             const cleanName = name.trim().toLowerCase();
             return dims.find(d => d.Name.trim().toLowerCase() === cleanName)?.IMG;
         }
         return {
             ...c,
             hab1Img: findDim(data.hab1, c.Hab1),
             hab2Img: findDim(data.hab2, c.Hab2),
             hab3Img: findDim(data.hab3, c.Hab3),
             hab4Img: findDim(data.hab4, c.Hab4),
             petImg: findDim(data.pets, c.Pet),
             itemImg: findDim(data.items, c.Item),
             teamImg: data.teamsReference.find(t => t.TIME === c.Time)?.IMG
         };
    });
  }, [data.characters, globalFilters, data.hab1, data.hab2, data.hab3, data.hab4, data.pets, data.items, activeTab, data.teamsReference]);

  return (
    <div className="space-y-6">
      {/* Abas Superiores */}
      <div className="flex flex-wrap gap-2 border-b border-gray-700 pb-2 no-print">
        {[
            { id: 'ranking', label: 'Ranking Geral', icon: <Trophy size={18} /> },
            { id: 'auditoria', label: 'Auditoria Kills', icon: <Activity size={18} /> },
            { id: 'chars', label: 'Loadouts', icon: <User size={18} /> },
            { id: 'report', label: 'Perfil Individual', icon: <BarChart2 size={18} /> },
            { id: 'compare', label: 'Comparar Jogadores', icon: <Scale size={18} /> },
        ].map(tab => (
            <button 
                key={tab.id} 
                onClick={() => setActiveTab(tab.id as any)} 
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold uppercase transition-all tracking-wider ${activeTab === tab.id ? 'bg-yellow-500 text-black shadow-lg shadow-yellow-500/20 scale-105' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
            >
                {tab.icon} {tab.label}
            </button>
        ))}
      </div>

      {/* Barra de Filtros */}
      {activeTab !== 'compare' && (
        <FilterBar filters={globalFilters} setFilters={setGlobalFilters} options={filterOptions} />
      )}

      {/* Conteúdo das Abas */}
      <div className="min-h-[600px]">
          {activeTab === 'ranking' && (
            <div className="bg-[#1a1a1a] rounded-2xl overflow-hidden border border-gray-800 shadow-xl animate-in fade-in duration-300">
                <div className="overflow-x-auto">
                    <table className="w-full text-left whitespace-nowrap">
                        <thead className="bg-[#0a0a0a] text-gray-500 text-[10px] uppercase font-bold tracking-widest">
                            <tr>
                                <th className="px-6 py-4 w-12 text-center">#</th>
                                <th className="px-6 py-4">Jogador</th>
                                <th className="px-6 py-4">Equipe</th>
                                <th className="px-6 py-4 text-center text-red-500">Abates</th>
                                <th className="px-6 py-4 text-center text-yellow-500">Média</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-800 text-sm font-medium">
                            {rankingData.map((player, idx) => (
                                <tr key={idx} onClick={() => handlePlayerClick(player.name)} className="hover:bg-yellow-900/10 transition-colors cursor-pointer group">
                                    <td className="px-6 py-4 text-gray-600 font-mono text-center">{idx + 1}</td>
                                    <td className="px-6 py-4 font-bold text-white uppercase italic flex items-center gap-2">
                                        {player.name}
                                        <ChevronRight size={14} className="text-yellow-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </td>
                                    <td className="px-6 py-4 text-gray-400 uppercase text-[10px] tracking-widest">{player.team}</td>
                                    <td className="px-6 py-4 text-center text-red-400 font-black text-lg">{player.kills}</td>
                                    <td className="px-6 py-4 text-center text-yellow-400 font-bold">{player.avg}</td>
                                </tr>
                            ))}
                            {rankingData.length === 0 && <tr><td colSpan={5} className="py-20 text-center text-gray-600 font-mono uppercase italic tracking-widest">Nenhum registro encontrado nos filtros atuais</td></tr>}
                        </tbody>
                    </table>
                </div>
            </div>
          )}

          {activeTab === 'auditoria' && (
            <div className="space-y-4 animate-in slide-in-from-bottom-4 duration-300">
                <div className="bg-blue-900/10 border border-blue-500/20 p-4 rounded-xl flex items-start gap-3">
                    <Info size={20} className="text-blue-400 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                        <p className="text-xs text-blue-200 font-bold uppercase tracking-wide">Auditoria Cruzada (RD + Q + Mapa):</p>
                        <p className="text-[11px] text-blue-300/80 leading-relaxed">
                            Cruzamento simultâneo dos dados reportados em <b>fPlayersDados</b> contra os eventos reais de <b>fKillFeed</b>.
                        </p>
                    </div>
                </div>

                <div className="bg-[#1a1a1a] rounded-2xl overflow-hidden border border-gray-800 shadow-2xl">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left whitespace-nowrap">
                            <thead className="bg-[#0f0f0f] text-gray-500 text-[10px] uppercase font-black tracking-widest">
                                <tr>
                                    <th className="px-6 py-4">Jogador</th>
                                    <th className="px-6 py-4">Equipe</th>
                                    <th className="px-6 py-4 text-center bg-yellow-900/10 text-yellow-500 border-l border-gray-800">fPlayersDados</th>
                                    <th className="px-6 py-4 text-center bg-blue-900/10 text-blue-400 border-l border-gray-800">fKillFeed</th>
                                    <th className="px-6 py-4 text-center border-l border-gray-800">Diferença</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-800 text-sm font-medium">
                                {auditData.length > 0 ? auditData.map((player, idx) => {
                                    const diff = Math.abs(player.killsA - player.killsB);
                                    return (
                                        <tr key={idx} className="hover:bg-white/5 transition-colors">
                                            <td className="px-6 py-4 font-bold text-white uppercase italic">{player.name}</td>
                                            <td className="px-6 py-4 text-gray-500 text-[10px] uppercase">{player.team}</td>
                                            <td className="px-6 py-4 text-center font-black text-yellow-500 bg-yellow-900/5 text-lg border-l border-gray-800">{player.killsA}</td>
                                            <td className="px-6 py-4 text-center font-black text-blue-400 bg-blue-900/5 text-lg border-l border-gray-800">{player.killsB}</td>
                                            <td className={`px-6 py-4 text-center font-mono border-l border-gray-800 ${diff !== 0 ? 'text-red-500 font-black' : 'text-green-500 opacity-40'}`}>
                                                {diff === 0 ? 'OK' : `±${diff}`}
                                            </td>
                                        </tr>
                                    );
                                }) : (
                                    <tr><td colSpan={5} className="py-24 text-center text-gray-600 font-mono uppercase tracking-widest">Nenhum dado para auditoria</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
          )}

          {activeTab === 'report' && (
              <div className="animate-in fade-in duration-300">
                  {globalFilters.players.length === 1 ? (
                      <div className="space-y-4">
                           <button onClick={() => { setGlobalFilters((prev: any) => ({...prev, players: []})); setActiveTab('ranking'); }} className="text-xs text-yellow-500 hover:text-yellow-400 flex items-center gap-1 font-black uppercase tracking-widest bg-white/5 px-4 py-2 rounded-lg border border-white/5 transition-colors">
                               <ArrowLeft size={14}/> Voltar para Ranking
                           </button>
                           <PlayerProfile data={data} playerName={globalFilters.players[0]} globalFilters={globalFilters} />
                      </div>
                  ) : (
                      <div className="bg-[#1a1a1a] rounded-2xl p-24 text-center border border-gray-800 shadow-inner">
                          <User size={64} className="mx-auto text-gray-800 mb-6" />
                          <h3 className="text-2xl font-black text-gray-400 uppercase italic tracking-tighter">Selecione um jogador no Ranking para ver o perfil completo</h3>
                      </div>
                  )}
              </div>
          )}

          {activeTab === 'chars' && (
              <div className="space-y-3 animate-in fade-in duration-300">
                    {charactersData.map((char, idx) => (
                        <div key={idx} className="bg-[#1a1a1a] rounded-xl p-4 border border-gray-800 flex flex-col xl:flex-row gap-4 items-center hover:border-yellow-500/30 transition-all shadow-lg">
                            <div className="w-full xl:w-56 flex items-center gap-4 border-b xl:border-b-0 xl:border-r border-gray-800 pb-3 xl:pb-0 pr-0 xl:pr-4">
                                <div className="h-14 w-14 rounded-full bg-black/60 flex items-center justify-center overflow-hidden border border-gray-700 shadow-inner">
                                    {char.teamImg ? <img src={char.teamImg} className="w-full h-full object-contain p-1" alt={char.Time}/> : <User className="text-gray-500" size={24}/>}
                                </div>
                                <div className="overflow-hidden">
                                    <h3 className="font-black text-white text-base truncate uppercase italic leading-none">{char.Player}</h3>
                                    <span className="text-[10px] text-yellow-500 font-bold block mt-1 uppercase tracking-widest">{char.Time}</span>
                                </div>
                            </div>
                            <div className="flex-1 w-full overflow-x-auto flex gap-4 pb-2 custom-scrollbar">
                                <LoadoutCard title="Ativa" name={char.Hab1} img={char.hab1Img} highlight />
                                <LoadoutCard title="Hab 2" name={char.Hab2} img={char.hab2Img} />
                                <LoadoutCard title="Hab 3" name={char.Hab3} img={char.hab3Img} />
                                <LoadoutCard title="Hab 4" name={char.Hab4} img={char.hab4Img} />
                                <LoadoutCard title="Pet" name={char.Pet} img={char.petImg} />
                                <LoadoutCard title="Item" name={char.Item} img={char.itemImg} />
                            </div>
                        </div>
                    ))}
                    {charactersData.length === 0 && <div className="py-20 text-center text-gray-700 font-black uppercase italic border border-dashed border-gray-800 rounded-2xl">Nenhum Loadout Registrado para este filtro</div>}
              </div>
          )}

          {activeTab === 'compare' && (
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 animate-in fade-in duration-300">
                  <div className="space-y-4">
                      <select value={compareA} onChange={e => setCompareA(e.target.value)} className="w-full bg-black text-white p-3 rounded-lg border border-gray-800 font-bold uppercase text-xs">
                          <option value="">Selecione Jogador 1...</option>
                          {filterOptions.players.map(p => <option key={p} value={p}>{p}</option>)}
                      </select>
                      {compareA && <PlayerProfile data={data} playerName={compareA} globalFilters={{...globalFilters, players: [compareA]}} isCompact />}
                  </div>
                  <div className="space-y-4">
                      <select value={compareB} onChange={e => setCompareB(e.target.value)} className="w-full bg-black text-white p-3 rounded-lg border border-gray-800 font-bold uppercase text-xs">
                          <option value="">Selecione Jogador 2...</option>
                          {filterOptions.players.map(p => <option key={p} value={p}>{p}</option>)}
                      </select>
                      {compareB && <PlayerProfile data={data} playerName={compareB} globalFilters={{...globalFilters, players: [compareB]}} isCompact />}
                  </div>
              </div>
          )}
      </div>
    </div>
  );
};

const LoadoutCard = ({ title, name, img, highlight }: any) => (
  <div className={`w-28 flex flex-col items-center p-3 rounded-xl border flex-shrink-0 ${highlight ? 'bg-yellow-900/10 border-yellow-500/50' : 'bg-black/40 border-gray-800'}`}>
    <span className="text-[9px] text-gray-600 uppercase font-black mb-2 truncate w-full text-center tracking-tighter">{title}</span>
    <div className="w-14 h-14 rounded-xl bg-black/60 border border-gray-700 overflow-hidden flex items-center justify-center p-1.5 mb-2 shadow-inner">
      {img ? <img src={img} alt={name} className="w-full h-full object-contain" /> : <div className="text-gray-800 text-[10px] font-black italic">NI</div>}
    </div>
    <span className={`text-[10px] font-black text-center truncate w-full uppercase italic ${highlight ? 'text-yellow-500' : 'text-gray-400'}`}>{name || '-'}</span>
  </div>
);

// --- Componente de Perfil Detalhado ---
const PlayerProfile = ({ data, playerName, globalFilters, isCompact }: { data: DashboardData, playerName: string, globalFilters: any, isCompact?: boolean }) => {
    const normalize = (val: string | undefined) => (val || '').trim().toUpperCase();

    const stats = useMemo(() => {
        // Filtragem dos registros do jogador, respeitando os filtros globais (exceto o próprio jogador que é fixo)
        const records = data.players.filter(p => {
            if (normalize(p.PLAYER) !== normalize(playerName)) return false;
            if (globalFilters.rodada !== 'All' && normalize(p.RD) !== normalize(globalFilters.rodada)) return false;
            if (globalFilters.map !== 'All' && normalize(p.MAPA) !== normalize(globalFilters.map)) return false;
            if (globalFilters.queda !== 'All' && normalize(p.Q) !== normalize(globalFilters.queda)) return false;
            return true;
        });

        const totalKills = records.reduce((acc: number, r: PlayerData) => acc + (parseInt(r.Abates) || 0), 0);
        const totalMatches = records.reduce((acc: number, r: PlayerData) => acc + (parseInt(r.S) || 0), 0);
        const team = records[0]?.TIME || data.players.find(p => normalize(p.PLAYER) === normalize(playerName))?.TIME || 'N/A';
        const teamImg = data.teamsReference.find(t => t.TIME === team)?.IMG;

        // Breakdown por Mapa
        const maps: Record<string, number> = {};
        records.forEach(r => { if (r.MAPA) { maps[r.MAPA] = (maps[r.MAPA] || 0) + (parseInt(r.Abates) || 0); } });

        // Breakdown por Queda (Q)
        const quedas: Record<string, number> = {};
        records.forEach(r => { if (r.Q) { quedas[r.Q] = (quedas[r.Q] || 0) + (parseInt(r.Abates) || 0); } });

        // Histórico por Rodada (RD) - Para o gráfico de evolução
        const historyMap = new Map<string, number>();
        records.forEach(r => {
            if (r.RD) {
                historyMap.set(r.RD, (historyMap.get(r.RD) || 0) + (parseInt(r.Abates) || 0));
            }
        });
        const history = Array.from(historyMap.entries()).map(([rd, kills]) => ({ rd, kills })).sort((a, b) => {
             const numA = parseInt(a.rd.replace(/\D/g, '')) || 0;
             const numB = parseInt(b.rd.replace(/\D/g, '')) || 0;
             return numA - numB;
        });

        return { team, teamImg, kills: totalKills, matches: totalMatches, avg: totalMatches > 0 ? (totalKills / totalMatches).toFixed(2) : '0.00', history, maps, quedas };
    }, [data.players, data.teamsReference, playerName, globalFilters]);

    return (
        <div className={`space-y-6 ${isCompact ? 'bg-[#1a1a1a] p-5 rounded-2xl border border-gray-800 shadow-2xl' : ''}`}>
            {/* Header do Perfil */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-6 bg-gradient-to-br from-[#2d0a31] to-[#050505] p-8 rounded-3xl border border-white/5 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-12 opacity-5">
                    <Crown size={200} className="text-yellow-500" />
                </div>
                <div className="flex items-center gap-6 relative z-10">
                    <div className="w-24 h-24 rounded-full bg-black border-4 border-yellow-500 flex items-center justify-center overflow-hidden p-1 shadow-lg">
                        {stats.teamImg ? <img src={stats.teamImg} className="w-full h-full object-contain" alt={stats.team}/> : <User className="text-gray-500" size={40} />}
                    </div>
                    <div>
                        <h2 className="text-4xl font-black italic text-white uppercase leading-none tracking-tighter">{playerName}</h2>
                        <div className="flex items-center gap-2 mt-2">
                            <span className="text-yellow-500 font-black uppercase tracking-[0.2em] text-xs">{stats.team}</span>
                            <div className="w-1.5 h-1.5 rounded-full bg-gray-700"></div>
                            <span className="text-gray-400 font-bold text-[10px] uppercase">Elite Squad Player</span>
                        </div>
                    </div>
                </div>
                <div className="flex gap-4 relative z-10">
                    <MetricCard label="Abates" value={stats.kills} color="text-red-500" />
                    <MetricCard label="Jogos" value={stats.matches} color="text-blue-500" />
                    <MetricCard label="Média" value={stats.avg} color="text-yellow-500" />
                </div>
            </div>

            {!isCompact && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Gráfico de Evolução por Rodada */}
                <div className="bg-[#1a1a1a] p-6 rounded-2xl border border-gray-800 shadow-xl">
                    <h3 className="text-sm font-black text-white uppercase mb-8 flex items-center gap-3 tracking-widest"><BarChart2 size={18} className="text-yellow-500" /> Evolução por Rodada (RD)</h3>
                    <div className="h-72">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={stats.history} margin={{top: 20, bottom: 20}}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
                                <XAxis dataKey="rd" stroke="#525252" fontSize={11} fontWeight="bold" axisLine={false} tickLine={false} />
                                <YAxis hide />
                                <Tooltip cursor={{fill: 'rgba(255,255,255,0.05)'}} contentStyle={{ backgroundColor: '#111', border: '1px solid #333', borderRadius: '12px' }} />
                                <Bar dataKey="kills" fill="#eab308" radius={[4, 4, 0, 0]} barSize={40}>
                                    <LabelList dataKey="kills" position="top" fill="#D4D4D4" fontSize={12} fontWeight="black" />
                                    {stats.history.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={index === stats.history.length - 1 ? '#f97316' : '#eab308'} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Estatísticas por Queda e Mapa */}
                <div className="space-y-6">
                    <div className="bg-[#1a1a1a] p-6 rounded-2xl border border-gray-800 shadow-xl">
                        <h3 className="text-sm font-black text-white uppercase mb-6 flex items-center gap-3 tracking-widest"><MapIcon size={18} className="text-yellow-500" /> Domínio por Mapa</h3>
                        <div className="space-y-4">
                            {Object.entries(stats.maps).length > 0 ? Object.entries(stats.maps).map(([map, killsCount]) => (
                                <ProgressBar key={map} label={map} value={killsCount} total={stats.kills} color="from-yellow-700 to-yellow-500" />
                            )) : <EmptyState label="Sem dados de mapa" />}
                        </div>
                    </div>

                    <div className="bg-[#1a1a1a] p-6 rounded-2xl border border-gray-800 shadow-xl">
                        <h3 className="text-sm font-black text-white uppercase mb-6 flex items-center gap-3 tracking-widest"><Disc size={18} className="text-orange-500" /> Performance por Queda (Q)</h3>
                        <div className="space-y-4">
                            {Object.entries(stats.quedas).length > 0 ? Object.entries(stats.quedas).map(([queda, killsCount]) => (
                                <ProgressBar key={queda} label={`Queda ${queda}`} value={killsCount} total={stats.kills} color="from-orange-700 to-orange-500" />
                            )) : <EmptyState label="Sem dados de queda" />}
                        </div>
                    </div>
                </div>
              </div>
            )}
        </div>
    );
};

const MetricCard = ({ label, value, color }: any) => (
    <div className="text-center px-6 py-4 rounded-2xl bg-black/60 border border-white/5 backdrop-blur-sm">
        <span className={`block text-3xl font-black ${color}`}>{value}</span>
        <span className="text-[10px] text-gray-500 uppercase font-black tracking-widest">{label}</span>
    </div>
);

const ProgressBar = ({ label, value, total, color }: any) => (
    <div>
        <div className="flex justify-between text-[11px] mb-2 font-black uppercase">
            <span className="text-gray-400 italic tracking-wide">{label}</span>
            <span className="text-white font-mono">{value} Abates</span>
        </div>
        <div className="w-full bg-black rounded-full h-2.5 overflow-hidden border border-white/5 shadow-inner">
            <div className={`bg-gradient-to-r ${color} h-full transition-all duration-700 ease-out`} style={{ width: `${(Number(value) / Math.max(total, 1)) * 100}%` }}></div>
        </div>
    </div>
);

const EmptyState = ({ label }: { label: string }) => (
    <div className="text-center text-gray-700 py-6 uppercase font-black italic text-xs tracking-widest border border-dashed border-gray-800 rounded-xl">
        {label}
    </div>
);

export default Players;
