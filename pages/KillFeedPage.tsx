
import React, { useState, useMemo } from 'react';
import { DashboardData } from '../types';
import { Crosshair, ShieldAlert, Swords, Disc, List, User, FilterX, Shield, History, Clock, MapPin, Target, Skull } from 'lucide-react';
import FilterBar from '../components/FilterBar';

interface KillFeedPageProps {
  data: DashboardData;
}

const KillFeedPage: React.FC<KillFeedPageProps> = ({ data }) => {
  const [tab, setTab] = useState<'kills' | 'deaths'>('kills');
  
  const [filters, setFilters] = useState({
    team: [] as string[], 
    players: [] as string[], 
    weapon: [] as string[], 
    safe: [] as string[], 
    map: [] as string[], 
    rodada: [] as string[], 
    queda: [] as string[],
    confrontation: [] as string[]
  });

  const normalize = (val: string | undefined) => (val || '').trim().toUpperCase();

  // Mapeamento de Jogador para Time para estatísticas de equipe
  const playerToTeamMap = useMemo(() => {
    const map = new Map<string, string>();
    data.players.forEach(p => {
      if (p.PLAYER && p.TIME) map.set(normalize(p.PLAYER), p.TIME);
    });
    return map;
  }, [data.players]);

  const filterOptions = useMemo(() => ({
    teams: Array.from(new Set(data.players.map(p => p.TIME))).filter(Boolean).sort(),
    players: Array.from(new Set([...data.killFeed.map(k => k.PLAYER), ...data.killFeed.map(k => k.VITIMA)])).filter(Boolean).sort(),
    weapons: Array.from(new Set(data.killFeed.map(k => k.ARMA))).filter(Boolean).sort(),
    safes: Array.from(new Set(data.killFeed.map(k => k.SAFE))).filter(Boolean).sort(),
    maps: Array.from(new Set(data.killFeed.map(k => k.MAPA))).filter(Boolean).sort(),
    rounds: Array.from(new Set(data.killFeed.map(k => k.RD))).filter(Boolean).sort(),
    confrontations: Array.from(new Set(data.killFeed.map(k => k.CONFRONTO))).filter(Boolean).sort(),
    quedas: Array.from(new Set(data.killFeed.map(k => k.Q))).filter(Boolean).sort(),
  }), [data.killFeed, data.players]);

  const handleToggleFilter = (key: keyof typeof filters, value: string) => {
      setFilters(prev => {
          const current = prev[key] as string[];
          const next = current.includes(value) ? current.filter(v => v !== value) : [...current, value];
          return { ...prev, [key]: next };
      });
  };

  const filteredFeed = useMemo(() => {
    return data.killFeed.filter(k => {
      if (filters.map.length > 0 && !filters.map.some(m => normalize(m) === normalize(k.MAPA))) return false;
      
      // FILTRO ESTRITO RD + Q
      const matchRD = filters.rodada.length === 0 || filters.rodada.some(r => normalize(r) === normalize(k.RD));
      const matchQ = filters.queda.length === 0 || filters.queda.some(q => normalize(q) === normalize(k.Q));
      if (!(matchRD && matchQ)) return false;

      if (filters.confrontation.length > 0 && !filters.confrontation.includes(k.CONFRONTO)) return false;
      if (filters.weapon.length > 0 && !filters.weapon.includes(k.ARMA)) return false;
      if (filters.safe.length > 0 && !filters.safe.includes(k.SAFE)) return false;

      // Filtro de time (baseado no killer ou na vítima dependendo da aba)
      if (filters.team.length > 0) {
        const pName = tab === 'kills' ? k.PLAYER : k.VITIMA;
        const pTeam = playerToTeamMap.get(normalize(pName));
        if (!pTeam || !filters.team.includes(pTeam)) return false;
      }

      if (filters.players.length > 0) {
          const target = tab === 'kills' ? k.PLAYER : k.VITIMA;
          if (!filters.players.includes(target)) return false;
      }
      return true;
    });
  }, [data.killFeed, filters, tab, playerToTeamMap]);

  const stats = useMemo(() => {
    const weaponCounts: Record<string, number> = {};
    const safeCounts: Record<string, number> = {};
    const playerCounts: Record<string, number> = {}; 
    const killerTeamCounts: Record<string, number> = {};
    const victimTeamCounts: Record<string, number> = {};

    filteredFeed.forEach(row => {
        if (row.ARMA && row.ARMA.trim() !== '') {
            weaponCounts[row.ARMA] = (weaponCounts[row.ARMA] || 0) + 1;
        }
        if (row.SAFE && row.SAFE.trim() !== '') {
            safeCounts[row.SAFE] = (safeCounts[row.SAFE] || 0) + 1;
        }
        
        // Jogadores (Contextual à aba)
        const pName = tab === 'kills' ? row.PLAYER : row.VITIMA;
        if (pName && pName.trim() !== '') {
            playerCounts[pName] = (playerCounts[pName] || 0) + 1;
        }

        // Times (Calculamos ambos sempre para exibir na aba de Letais)
        const kTeam = playerToTeamMap.get(normalize(row.PLAYER));
        if (kTeam) killerTeamCounts[kTeam] = (killerTeamCounts[kTeam] || 0) + 1;

        const vTeam = playerToTeamMap.get(normalize(row.VITIMA));
        if (vTeam) victimTeamCounts[vTeam] = (victimTeamCounts[vTeam] || 0) + 1;
    });

    return { weaponCounts, safeCounts, playerCounts, killerTeamCounts, victimTeamCounts };
  }, [filteredFeed, tab, playerToTeamMap]);

  const getWeaponImg = (name: string) => {
      if (!name) return undefined;
      const w = data.weapons.find(w => w.Arma.trim().toLowerCase() === name.trim().toLowerCase());
      return w?.IMG;
  };

  const getSafeImg = (name: string) => {
      if (!name) return undefined;
      const s = data.safes.find(s => s.Safe.trim().toLowerCase() === name.trim().toLowerCase());
      return s?.IMG;
  };

  const getTeamImg = (name: string) => {
    if (!name) return undefined;
    return data.teamsReference.find(t => normalize(t.TIME) === normalize(name))?.IMG;
  };

  const weaponList = Object.entries(stats.weaponCounts).map(([name, count]) => ({name, count: count as number}));
  const safeList = Object.entries(stats.safeCounts).map(([name, count]) => ({name, count: count as number}));
  const playerList = Object.entries(stats.playerCounts).map(([name, count]) => ({name, count: count as number}));
  const killerTeamList = Object.entries(stats.killerTeamCounts).map(([name, count]) => ({name, count: count as number}));
  const victimTeamList = Object.entries(stats.victimTeamCounts).map(([name, count]) => ({name, count: count as number}));
  const totalEvents = filteredFeed.length;

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <h2 className="text-2xl font-black italic text-white flex items-center gap-2 uppercase tracking-wide">
                {tab === 'kills' ? <Crosshair className="text-green-500" size={28}/> : <ShieldAlert className="text-red-600" size={28}/>}
                {tab === 'kills' ? 'Central de Abates' : 'Análise de Baixas'}
            </h2>
            <div className="flex bg-black p-1.5 rounded-xl border border-gray-800">
                <button 
                    onClick={() => { setTab('kills'); setFilters(prev => ({...prev, players: [], team: []})); }}
                    className={`px-6 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 uppercase tracking-wider ${tab === 'kills' ? 'bg-green-600 text-white shadow-lg shadow-green-900/50' : 'text-gray-500 hover:text-white hover:bg-gray-900'}`}
                >
                    <Crosshair size={16} /> LETAIS
                </button>
                <button 
                    onClick={() => { setTab('deaths'); setFilters(prev => ({...prev, players: [], team: []})); }}
                    className={`px-6 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 uppercase tracking-wider ${tab === 'deaths' ? 'bg-red-600 text-white shadow-lg shadow-red-900/50' : 'text-gray-500 hover:text-white hover:bg-gray-900'}`}
                >
                    <ShieldAlert size={16} /> VÍTIMAS
                </button>
            </div>
        </div>
        
        <FilterBar filters={filters} setFilters={setFilters} options={filterOptions} />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
            <StatGrid 
                title={tab === 'kills' ? "Arsenal Fatal" : "Armas que mais eliminam"} 
                items={weaponList} 
                getImage={getWeaponImg} 
                icon={<Swords size={16}/>} 
                color="text-orange-500" 
                onSelect={(val) => handleToggleFilter('weapon', val)} 
                activeValues={filters.weapon} 
            />
            
            <StatGrid 
                title="Pico por Safe" 
                items={safeList} 
                getImage={getSafeImg} 
                icon={<Disc size={16}/>} 
                color="text-blue-500" 
                onSelect={(val) => handleToggleFilter('safe', val)} 
                activeValues={filters.safe} 
            />

            <RenderList 
                title={tab === 'kills' ? "Equipes que mais Abatem" : "Equipes Vítimas"} 
                items={tab === 'kills' ? killerTeamList : victimTeamList} 
                icon={<Shield size={16} className="text-yellow-500"/>} 
                totalCount={totalEvents} 
                getImage={getTeamImg}
                isTeam
                onSelect={(name) => handleToggleFilter('team', name)}
                activeValues={filters.team}
            />

            {/* NOVA LISTA: Times que mais Morrem (Sempre visível na aba Letais para contexto) */}
            <RenderList 
                title={tab === 'kills' ? "Equipes que mais Morrem" : "Equipes que mais Abatem"} 
                items={tab === 'kills' ? victimTeamList : killerTeamList} 
                icon={<Skull size={16} className="text-red-500"/>} 
                totalCount={totalEvents} 
                getImage={getTeamImg}
                isTeam
                isVictimList
            />

            <RenderList 
                title={tab === 'kills' ? "Top Atiradores" : "Top Vítimas"} 
                items={playerList} 
                icon={<User size={16} className="text-yellow-500"/>} 
                totalCount={totalEvents} 
                onSelect={(name) => handleToggleFilter('players', name)}
                activeValues={filters.players}
            />
        </div>

        {/* Histórico Detalhado */}
        <div className="bg-[#1a1a1a] rounded-2xl border border-gray-800 shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="bg-black/60 p-6 border-b border-gray-800 flex items-center justify-between">
                <h3 className="text-lg font-black italic text-white flex items-center gap-3 uppercase tracking-tighter">
                    <History className="text-yellow-500" size={20} />
                    Log de Eventos - {tab === 'kills' ? 'ABATES' : 'MORTES'}
                </h3>
                <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">{totalEvents} Registros encontrados</span>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-[#050505] text-[10px] text-gray-500 uppercase font-bold tracking-[0.2em]">
                        <tr>
                            <th className="px-6 py-4">Evento</th>
                            <th className="px-6 py-4">Arma</th>
                            <th className="px-6 py-4">Local / Safe</th>
                            <th className="px-6 py-4">Mapa / Rd</th>
                            <th className="px-6 py-4 text-center">Infor</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800/50">
                        {filteredFeed.length > 0 ? filteredFeed.map((k, i) => (
                            <tr key={i} className="hover:bg-white/5 transition-colors group">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-4">
                                        <div className="flex flex-col">
                                            <div className="flex items-center gap-2">
                                                <span className={`text-sm font-black italic uppercase ${tab === 'kills' ? 'text-green-500' : 'text-gray-400'}`}>
                                                    {k.PLAYER}
                                                </span>
                                                <Swords size={12} className="text-gray-700" />
                                                <span className={`text-sm font-black italic uppercase ${tab === 'deaths' ? 'text-red-500' : 'text-gray-400'}`}>
                                                    {k.VITIMA}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className="text-[9px] text-gray-600 font-bold uppercase tracking-widest">
                                                    {playerToTeamMap.get(normalize(k.PLAYER)) || 'N/A'}
                                                </span>
                                                <span className="text-gray-800">•</span>
                                                <span className="text-[9px] text-gray-600 font-bold uppercase tracking-widest">
                                                    {playerToTeamMap.get(normalize(k.VITIMA)) || 'N/A'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 bg-black rounded border border-gray-800 p-1 flex items-center justify-center">
                                            {getWeaponImg(k.ARMA) ? <img src={getWeaponImg(k.ARMA)} alt={k.ARMA} className="w-full h-full object-contain" /> : <Swords size={14} className="opacity-20 text-gray-400" />}
                                        </div>
                                        <span className="text-[11px] font-black text-white uppercase italic">{k.ARMA}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <Disc size={14} className="text-blue-500 opacity-50" />
                                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Safe {k.SAFE}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex flex-col">
                                        <div className="flex items-center gap-2">
                                            <MapPin size={12} className="text-yellow-500 opacity-50" />
                                            <span className="text-[10px] font-black text-gray-300 uppercase tracking-tight">{k.MAPA}</span>
                                        </div>
                                        <span className="text-[9px] text-gray-600 font-bold mt-1">Rodada {k.RD} • Q{k.Q}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-center">
                                    <div className="inline-flex items-center gap-2 bg-black/40 px-3 py-1 rounded-full border border-white/5 text-[9px] font-mono text-gray-500 group-hover:text-yellow-500 transition-colors">
                                        <Target size={10} /> {k.CONFRONTO}
                                    </div>
                                </td>
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan={5} className="py-20 text-center text-gray-700 font-black italic uppercase tracking-widest opacity-20">
                                    Nenhum registro encontrado para os filtros aplicados
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

const RenderList = ({ title, items, icon, totalCount, getImage, isTeam, onSelect, activeValues = [], isVictimList }: any) => (
    <div className={`bg-[#1a1a1a] rounded-xl border ${isVictimList ? 'border-red-500/30' : 'border-gray-800'} overflow-hidden flex flex-col h-full shadow-lg transition-all hover:border-yellow-600/30`}>
        <div className="p-4 border-b border-gray-800 bg-black"><h3 className={`font-black uppercase text-sm tracking-widest flex items-center gap-2 ${isVictimList ? 'text-red-500' : 'text-white'}`}>{icon}{title}</h3></div>
        <div className="overflow-y-auto max-h-[400px] p-2 space-y-1 custom-scrollbar bg-black/20">
            {items.sort((a:any,b:any) => b.count - a.count).map((item:any, i:number) => {
                const percent = totalCount ? ((item.count / totalCount) * 100).toFixed(1) : "0.0";
                const img = getImage && getImage(item.name);
                const isActive = activeValues.includes(item.name);
                
                return (
                <div 
                    key={i} 
                    onClick={() => onSelect && onSelect(item.name)}
                    className={`flex items-center justify-between p-3 rounded-lg transition-all border cursor-pointer group ${isActive ? 'bg-yellow-500/10 border-yellow-500/50 shadow-[0_0_10px_rgba(234,179,8,0.1)]' : 'hover:bg-white/5 border-transparent hover:border-gray-700'}`}
                >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                        <span className={`text-xs font-mono font-bold w-4 ${isActive ? 'text-yellow-500' : 'text-gray-600'}`}>#{i+1}</span>
                        {isTeam && (
                            <div className={`w-8 h-8 rounded border p-1 flex items-center justify-center shrink-0 transition-colors ${isActive ? 'bg-black border-yellow-500' : 'bg-black border-gray-800'}`}>
                                {img ? <img src={img} className="w-full h-full object-contain" alt={item.name}/> : <Shield size={14} className="opacity-20" />}
                            </div>
                        )}
                        <div className="flex-1 min-w-0 pr-2">
                            <span className={`text-sm font-bold truncate block group-hover:text-white uppercase italic ${isActive ? 'text-yellow-400' : isVictimList ? 'text-red-400' : 'text-gray-300'}`}>
                                {item.name}
                            </span>
                            <div className="w-full bg-gray-900 h-1 mt-1 rounded-full overflow-hidden border border-gray-800">
                                <div className={`h-full rounded-full transition-all duration-500 ${isVictimList ? 'bg-red-600/60' : isActive ? 'bg-yellow-400' : 'bg-yellow-600/60'}`} style={{ width: `${percent}%` }}></div>
                            </div>
                        </div>
                    </div>
                    <div className="text-right flex flex-col items-end pl-2">
                        <span className={`text-sm font-black px-2 py-0.5 rounded shadow-sm transition-colors ${isVictimList ? 'bg-red-500 text-white' : isActive ? 'bg-white text-black' : 'bg-yellow-500 text-black'}`}>
                            {item.count}
                        </span>
                    </div>
                </div>
            )})}
        </div>
    </div>
);

const StatGrid = ({ title, items, getImage, icon, color, onSelect, activeValues }: any) => (
    <div className={`bg-[#1a1a1a] rounded-xl border ${activeValues.length > 0 ? 'border-yellow-500 shadow-[0_0_15px_rgba(234,179,8,0.2)]' : 'border-gray-800'} flex flex-col h-full shadow-lg overflow-hidden transition-all duration-300`}>
       <div className="p-4 border-b border-gray-800 bg-black flex justify-between items-center"><h3 className={`font-black uppercase text-sm tracking-widest flex items-center gap-2 ${color}`}>{icon} {title}</h3></div>
       <div className="p-4 overflow-y-auto max-h-[400px] custom-scrollbar bg-black/10">
            <div className="grid grid-cols-2 gap-3">
                {items.sort((a:any,b:any) => b.count - a.count).map((item:any, i:number) => (
                    <div key={i} onClick={() => onSelect && onSelect(item.name)} className={`rounded-xl border p-3 flex flex-col items-center relative group cursor-pointer transition-all shadow-md ${activeValues.includes(item.name) ? 'bg-yellow-900/20 border-yellow-500 scale-[1.02] z-10' : 'bg-[#0f0f0f] border-gray-800 hover:border-yellow-500/50 hover:bg-[#252525]'}`}>
                        <div className="absolute top-2 left-2 text-[10px] font-mono text-gray-600 font-bold">#{i+1}</div>
                        <div className="absolute top-2 right-2 font-bold text-white text-[10px] bg-gray-900 px-1.5 py-0.5 rounded border border-gray-700">{item.count}</div>
                        <div className="h-10 w-full flex items-center justify-center my-2 mt-4">{getImage && getImage(item.name) ? <img src={getImage(item.name)} className="h-full w-full object-contain group-hover:scale-110 transition-transform duration-300" alt={item.name}/> : <div className="text-gray-700 text-xl opacity-20">?</div>}</div>
                        <div className={`text-[10px] font-black text-center truncate w-full mt-1 px-1 rounded py-1 border uppercase italic tracking-tighter ${activeValues.includes(item.name) ? 'text-black bg-yellow-500 border-yellow-600' : 'text-gray-400 bg-[#151515] border-gray-800/50'}`}>{item.name || "N/A"}</div>
                    </div>
                ))}
            </div>
       </div>
    </div>
);

export default KillFeedPage;
