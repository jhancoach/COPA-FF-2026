
import React, { useState, useMemo } from 'react';
import { DashboardData } from '../types';
import { Crosshair, ShieldAlert, Swords, Disc, List, User, FilterX } from 'lucide-react';
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

  const filterOptions = useMemo(() => ({
    teams: [], 
    players: Array.from(new Set([...data.killFeed.map(k => k.PLAYER), ...data.killFeed.map(k => k.VITIMA)])).filter(Boolean).sort(),
    weapons: Array.from(new Set(data.killFeed.map(k => k.ARMA))).filter(Boolean).sort(),
    safes: Array.from(new Set(data.killFeed.map(k => k.SAFE))).filter(Boolean).sort(),
    maps: Array.from(new Set(data.killFeed.map(k => k.MAPA))).filter(Boolean).sort(),
    rounds: Array.from(new Set(data.killFeed.map(k => k.RD))).filter(Boolean).sort(),
    confrontations: Array.from(new Set(data.killFeed.map(k => k.CONFRONTO))).filter(Boolean).sort(),
    quedas: Array.from(new Set(data.killFeed.map(k => k.Q))).filter(Boolean).sort(),
  }), [data.killFeed]);

  const normalize = (val: string | undefined) => (val || '').trim().toUpperCase();

  const handleToggleFilter = (key: 'weapon' | 'safe', value: string) => {
      setFilters(prev => {
          const current = prev[key];
          const next = current.includes(value) ? current.filter(v => v !== value) : [...current, value];
          return { ...prev, [key]: next };
      });
  };

  const filteredFeed = useMemo(() => {
    return data.killFeed.filter(k => {
      if (filters.map.length > 0 && !filters.map.some(m => normalize(m) === normalize(k.MAPA))) return false;
      if (filters.rodada.length > 0 && !filters.rodada.some(r => normalize(r) === normalize(k.RD))) return false;
      if (filters.confrontation.length > 0 && !filters.confrontation.includes(k.CONFRONTO)) return false;
      if (filters.weapon.length > 0 && !filters.weapon.includes(k.ARMA)) return false;
      if (filters.safe.length > 0 && !filters.safe.includes(k.SAFE)) return false;

      if (filters.players.length > 0) {
          const target = tab === 'kills' ? k.PLAYER : k.VITIMA;
          if (!filters.players.includes(target)) return false;
      }
      return true;
    });
  }, [data.killFeed, filters, tab]);

  const stats = useMemo(() => {
    const weaponCounts: Record<string, number> = {};
    const safeCounts: Record<string, number> = {};
    const playerCounts: Record<string, number> = {}; 

    filteredFeed.forEach(row => {
        if (row.ARMA && row.ARMA.trim() !== '') {
            weaponCounts[row.ARMA] = (weaponCounts[row.ARMA] || 0) + 1;
        }
        if (row.SAFE && row.SAFE.trim() !== '') {
            safeCounts[row.SAFE] = (safeCounts[row.SAFE] || 0) + 1;
        }
        const pName = tab === 'kills' ? row.PLAYER : row.VITIMA;
        if (pName && pName.trim() !== '') {
            playerCounts[pName] = (playerCounts[pName] || 0) + 1;
        }
    });

    return { weaponCounts, safeCounts, playerCounts };
  }, [filteredFeed, tab]);

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

  const weaponList = Object.entries(stats.weaponCounts).map(([name, count]) => ({name, count: count as number}));
  const safeList = Object.entries(stats.safeCounts).map(([name, count]) => ({name, count: count as number}));
  const playerList = Object.entries(stats.playerCounts).map(([name, count]) => ({name, count: count as number}));
  const totalEvents = filteredFeed.length;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <h2 className="text-2xl font-black italic text-white flex items-center gap-2 uppercase tracking-wide">
                {tab === 'kills' ? <Crosshair className="text-green-500" size={28}/> : <ShieldAlert className="text-red-600" size={28}/>}
                {tab === 'kills' ? 'Análise de Abates' : 'Análise de Mortes'}
            </h2>
            <div className="flex bg-black p-1.5 rounded-xl border border-gray-800">
                <button 
                    onClick={() => { setTab('kills'); setFilters(prev => ({...prev, players: []})); }}
                    className={`px-6 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 uppercase tracking-wider ${tab === 'kills' ? 'bg-green-600 text-white shadow-lg shadow-green-900/50' : 'text-gray-500 hover:text-white hover:bg-gray-900'}`}
                >
                    <Crosshair size={16} /> ABATES
                </button>
                <button 
                    onClick={() => { setTab('deaths'); setFilters(prev => ({...prev, players: []})); }}
                    className={`px-6 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 uppercase tracking-wider ${tab === 'deaths' ? 'bg-red-600 text-white shadow-lg shadow-red-900/50' : 'text-gray-500 hover:text-white hover:bg-gray-900'}`}
                >
                    <ShieldAlert size={16} /> MORTES
                </button>
            </div>
        </div>
        
        <FilterBar filters={filters} setFilters={setFilters} options={filterOptions} />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StatGrid title={tab === 'kills' ? "Armas Letais" : "Vítimas por Arma"} items={weaponList} getImage={getWeaponImg} icon={<Swords size={16}/>} color="text-orange-500" onSelect={(val) => handleToggleFilter('weapon', val)} activeValues={filters.weapon} />
            <StatGrid title="Atividade por Safe" items={safeList} getImage={getSafeImg} icon={<Disc size={16}/>} color="text-blue-500" onSelect={(val) => handleToggleFilter('safe', val)} activeValues={filters.safe} />
            <RenderList title={tab === 'kills' ? "Top Atiradores" : "Top Vítimas"} items={playerList} icon={<User size={16} className="text-yellow-500"/>} totalCount={totalEvents} />
        </div>
    </div>
  );
};

const RenderList = ({ title, items, icon, totalCount }: any) => (
    <div className="bg-[#1a1a1a] rounded-xl border border-gray-800 overflow-hidden flex flex-col h-full shadow-lg transition-all hover:border-yellow-600/30">
        <div className="p-4 border-b border-gray-800 bg-black"><h3 className="font-black text-white uppercase text-sm tracking-widest flex items-center gap-2">{icon}{title}</h3></div>
        <div className="overflow-y-auto max-h-[500px] p-2 space-y-1 custom-scrollbar bg-black/20">
            {items.sort((a:any,b:any) => b.count - a.count).map((item:any, i:number) => {
                const percent = totalCount ? ((item.count / totalCount) * 100).toFixed(1) : "0.0";
                return (
                <div key={i} className="flex items-center justify-between p-3 hover:bg-white/5 rounded-lg transition-colors border border-transparent hover:border-gray-700 group">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                        <span className="text-xs font-mono text-gray-600 font-bold w-6">#{i+1}</span>
                        <div className="flex-1 min-w-0 pr-2">
                            <span className="text-sm text-gray-300 font-bold truncate block group-hover:text-white uppercase italic">{item.name}</span>
                            <div className="w-full bg-gray-900 h-1 mt-1 rounded-full overflow-hidden border border-gray-800">
                                <div className="h-full bg-yellow-500 rounded-full transition-all duration-500" style={{ width: `${percent}%` }}></div>
                            </div>
                        </div>
                    </div>
                    <div className="text-right flex flex-col items-end pl-2">
                        <span className="text-sm font-black text-black bg-yellow-500 px-2 py-0.5 rounded shadow-sm">{item.count}</span>
                    </div>
                </div>
            )})}
        </div>
    </div>
);

const StatGrid = ({ title, items, getImage, icon, color, onSelect, activeValues }: any) => (
    <div className={`bg-[#1a1a1a] rounded-xl border ${activeValues.length > 0 ? 'border-yellow-500 shadow-[0_0_15px_rgba(234,179,8,0.2)]' : 'border-gray-800'} flex flex-col h-full shadow-lg overflow-hidden transition-all duration-300`}>
       <div className="p-4 border-b border-gray-800 bg-black flex justify-between items-center"><h3 className={`font-black uppercase text-sm tracking-widest flex items-center gap-2 ${color}`}>{icon} {title}</h3></div>
       <div className="p-4 overflow-y-auto max-h-[500px] custom-scrollbar bg-black/10">
            <div className="grid grid-cols-2 gap-3">
                {items.sort((a:any,b:any) => b.count - a.count).map((item:any, i:number) => (
                    <div key={i} onClick={() => onSelect && onSelect(item.name)} className={`rounded-xl border p-3 flex flex-col items-center relative group cursor-pointer transition-all shadow-md ${activeValues.includes(item.name) ? 'bg-yellow-900/20 border-yellow-500 scale-[1.02] z-10' : 'bg-[#0f0f0f] border-gray-800 hover:border-yellow-500/50 hover:bg-[#252525]'}`}>
                        <div className="absolute top-2 left-2 text-[10px] font-mono text-gray-600 font-bold">#{i+1}</div>
                        <div className="absolute top-2 right-2 font-bold text-white text-[10px] bg-gray-900 px-1.5 py-0.5 rounded border border-gray-700">{item.count}</div>
                        <div className="h-12 w-full flex items-center justify-center my-2 mt-4">{getImage && getImage(item.name) ? <img src={getImage(item.name)} className="h-full w-full object-contain group-hover:scale-110 transition-transform duration-300" alt={item.name}/> : <div className="text-gray-700 text-xl opacity-20">?</div>}</div>
                        <div className={`text-[10px] font-black text-center truncate w-full mt-1 px-1 rounded py-1 border uppercase italic tracking-tighter ${activeValues.includes(item.name) ? 'text-black bg-yellow-500 border-yellow-600' : 'text-gray-400 bg-[#151515] border-gray-800/50'}`}>{item.name || "N/A"}</div>
                    </div>
                ))}
            </div>
       </div>
    </div>
);

export default KillFeedPage;
