
import React, { useMemo, useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { DashboardData, PlayerData } from '../types';
import { Trophy, Crown, User, Swords, Zap, BarChart2, Scale, Map as MapIcon, Skull, ChevronRight, Sparkles, X, Activity, Info, Crosshair, Shield, ArrowLeft } from 'lucide-react';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, LabelList } from 'recharts';
import FilterBar from '../components/FilterBar';

interface PlayersProps {
  data: DashboardData;
  globalFilters: any;
  setGlobalFilters: any;
}

const Players: React.FC<PlayersProps> = ({ data, globalFilters, setGlobalFilters }) => {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState<'ranking' | 'chars' | 'report' | 'compare' | 'auditoria'>('ranking');

  useEffect(() => {
    if (location.state?.player) {
      setGlobalFilters((prev: any) => ({ ...prev, players: [location.state.player] }));
      setActiveTab('report');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

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

  // Mapeamento rápido de Jogador -> Time para filtrar Killfeed por Time
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

    // Filtra fPlayersDados (Fonte A - Soma Informada)
    const filteredA = data.players.filter(p => {
      if (globalFilters.team !== 'All' && p.TIME !== globalFilters.team) return false;
      if (globalFilters.players.length > 0 && !globalFilters.players.includes(p.PLAYER)) return false;
      if (globalFilters.map !== 'All' && normalize(p.MAPA) !== filterMap) return false;
      if (globalFilters.rodada !== 'All' && normalize(p.RD) !== filterRd) return false;
      if (globalFilters.queda !== 'All' && normalize(p.Q) !== filterQ) return false;
      return true;
    });

    // Filtra fKillFeed (Fonte B - Eventos Reais)
    const filteredB = data.killFeed.filter(k => {
      // Filtros de Local e Tempo
      if (globalFilters.map !== 'All' && normalize(k.MAPA) !== filterMap) return false;
      if (globalFilters.rodada !== 'All' && normalize(k.RD) !== filterRd) return false;
      if (globalFilters.queda !== 'All' && normalize(k.Q) !== filterQ) return false;
      
      // Filtro de Jogador
      if (globalFilters.players.length > 0 && !globalFilters.players.includes(k.PLAYER)) return false;

      // Filtro de Time (Fonte B não tem coluna TIME, então buscamos do mapeamento)
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

  const handlePlayerClick = (playerName: string) => {
      setGlobalFilters((prev: any) => ({ ...prev, players: [playerName] }));
      setActiveTab('report');
      window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2 border-b border-gray-700 pb-2">
        {[
            { id: 'ranking', label: 'Ranking Geral', icon: <Trophy size={18} /> },
            { id: 'auditoria', label: 'Auditoria Kills', icon: <Activity size={18} /> },
            { id: 'chars', label: 'Loadouts', icon: <User size={18} /> },
            { id: 'report', label: 'Perfil', icon: <BarChart2 size={18} /> },
            { id: 'compare', label: 'Versus', icon: <Scale size={18} /> },
        ].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold uppercase transition-all ${activeTab === tab.id ? 'bg-yellow-500 text-black shadow-lg shadow-yellow-500/20' : 'text-gray-400 hover:text-white'}`}>{tab.icon} {tab.label}</button>
        ))}
      </div>

      {activeTab !== 'compare' && <FilterBar filters={globalFilters} setFilters={setGlobalFilters} options={filterOptions} />}

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
                                <td className="px-6 py-4 font-bold text-white uppercase italic">{player.name}</td>
                                <td className="px-6 py-4 text-gray-400 uppercase text-[10px] tracking-widest">{player.team}</td>
                                <td className="px-6 py-4 text-center text-red-400 font-black text-lg">{player.kills}</td>
                                <td className="px-6 py-4 text-center text-yellow-400 font-bold">{player.avg}</td>
                            </tr>
                        ))}
                        {rankingData.length === 0 && <tr><td colSpan={5} className="py-20 text-center text-gray-600 font-mono uppercase">Nenhum registro encontrado</td></tr>}
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
                    <p className="text-xs text-blue-200 font-bold uppercase tracking-wide">Relatório de Auditoria Cruzada:</p>
                    <p className="text-[11px] text-blue-300/80 leading-relaxed">
                        Este painel compara o total de abates reportado (fPlayersDados) com o total de eventos registrados individualmente (fKillFeed). 
                        A filtragem por <b>Rodada (RD)</b>, <b>Queda (Q)</b> e <b>Mapa</b> é aplicada simultaneamente em ambos os bancos de dados.
                    </p>
                </div>
            </div>

            <div className="bg-[#1a1a1a] rounded-2xl overflow-hidden border border-gray-800 shadow-2xl">
                <div className="p-6 border-b border-gray-800 bg-black flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <h2 className="text-xl font-bold text-white flex items-center gap-3 uppercase italic">
                        <Activity className="text-blue-500" size={20} />
                        Auditoria de Kills
                    </h2>
                    <div className="flex flex-wrap gap-3 text-[10px] text-gray-500 font-mono uppercase font-bold bg-white/5 px-4 py-2 rounded-lg">
                        <div>TIME: <span className="text-white">{globalFilters.team === 'All' ? 'TODOS' : globalFilters.team}</span></div>
                        <div className="w-px h-3 bg-gray-700 hidden sm:block"></div>
                        <div>RD: <span className="text-yellow-500">{globalFilters.rodada === 'All' ? 'TODAS' : globalFilters.rodada}</span></div>
                        <div className="w-px h-3 bg-gray-700 hidden sm:block"></div>
                        <div>QUEDA: <span className="text-yellow-500">{globalFilters.queda === 'All' ? 'TODAS' : globalFilters.queda}</span></div>
                    </div>
                </div>
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
                                    <tr key={idx} className="hover:bg-white/5 transition-colors group">
                                        <td className="px-6 py-4 font-bold text-white uppercase italic">{player.name}</td>
                                        <td className="px-6 py-4 text-gray-500 text-[10px] uppercase tracking-tighter">{player.team}</td>
                                        <td className="px-6 py-4 text-center font-black text-yellow-500 bg-yellow-900/5 text-lg border-l border-gray-800">{player.killsA}</td>
                                        <td className="px-6 py-4 text-center font-black text-blue-400 bg-blue-900/5 text-lg border-l border-gray-800">{player.killsB}</td>
                                        <td className={`px-6 py-4 text-center font-mono border-l border-gray-800 ${diff !== 0 ? 'text-red-500 font-black' : 'text-green-500 opacity-40'}`}>
                                            {diff === 0 ? 'OK' : `±${diff}`}
                                        </td>
                                    </tr>
                                );
                            }) : (
                                <tr><td colSpan={5} className="py-24 text-center text-gray-600 font-mono uppercase tracking-widest">Nenhum dado para os filtros selecionados</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
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

export default Players;
