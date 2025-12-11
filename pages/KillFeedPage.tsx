import React, { useState, useMemo } from 'react';
import { DashboardData } from '../types';
import { Crosshair, ShieldAlert, Swords, Disc, List, User, FilterX } from 'lucide-react';
import FilterBar from '../components/FilterBar';

interface KillFeedPageProps {
  data: DashboardData;
}

const KillFeedPage: React.FC<KillFeedPageProps> = ({ data }) => {
  const [tab, setTab] = useState<'kills' | 'deaths'>('kills');
  
  const [filters, setFilters] = useState<{
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
    teams: [], 
    // Players list covers both killers and victims to allow flexible filtering
    players: Array.from(new Set([...data.killFeed.map(k => k.PLAYER), ...data.killFeed.map(k => k.VITIMA)])).filter(Boolean).sort(),
    weapons: Array.from(new Set(data.killFeed.map(k => k.ARMA))).filter(Boolean).sort(),
    safes: Array.from(new Set(data.killFeed.map(k => k.SAFE))).filter(Boolean).sort(),
    maps: Array.from(new Set(data.killFeed.map(k => k.MAPA))).filter(Boolean).sort(),
    rounds: Array.from(new Set(data.killFeed.map(k => k.RD))).filter(Boolean).sort(),
    confrontations: Array.from(new Set(data.killFeed.map(k => k.CONFRONTO))).filter(Boolean).sort(),
  }), [data.killFeed]);

  // Handle drill-down clicks
  const handleToggleFilter = (key: 'weapon' | 'safe', value: string) => {
      setFilters(prev => ({
          ...prev,
          [key]: prev[key] === value ? 'All' : value
      }));
  };

  // Filter Data
  const filteredFeed = useMemo(() => {
    return data.killFeed.filter(k => {
      // Basic Filters
      if (filters.map !== 'All' && k.MAPA !== filters.map) return false;
      if (filters.round !== 'All' && k.RD !== filters.round) return false;
      if (filters.confrontation !== 'All' && k.CONFRONTO !== filters.confrontation) return false;
      if (filters.weapon !== 'All' && k.ARMA !== filters.weapon) return false;
      if (filters.safe !== 'All' && k.SAFE !== filters.safe) return false;

      // Player Filter logic
      if (filters.players.length > 0) {
          const target = tab === 'kills' ? k.PLAYER : k.VITIMA;
          if (!filters.players.includes(target)) return false;
      }
      return true;
    });
  }, [data.killFeed, filters, tab]);

  // Aggregations
  const stats = useMemo(() => {
    const weaponCounts: Record<string, number> = {};
    const safeCounts: Record<string, number> = {};
    const playerCounts: Record<string, number> = {}; 

    // To preserve the full list of items even when filtered (so the grid doesn't disappear),
    // we sometimes want to calculate counts based on a "partial" filter context, 
    // but for true drill-down (requested behavior), we usually use the filtered set.
    // However, to make it user-friendly, if a specific filter is active (e.g. Weapon=M4A1),
    // we might want to show M4A1 as selected, but technically other weapons have 0 counts in this context.
    
    filteredFeed.forEach(row => {
        // Weapon - Filter empty strings
        if (row.ARMA && row.ARMA.trim() !== '') {
            weaponCounts[row.ARMA] = (weaponCounts[row.ARMA] || 0) + 1;
        }
        // Safe - Filter empty strings
        if (row.SAFE && row.SAFE.trim() !== '') {
            safeCounts[row.SAFE] = (safeCounts[row.SAFE] || 0) + 1;
        }
        
        // Player List for Ranking in Killfeed
        const pName = tab === 'kills' ? row.PLAYER : row.VITIMA;
        if (pName && pName.trim() !== '') {
            playerCounts[pName] = (playerCounts[pName] || 0) + 1;
        }
    });

    return { weaponCounts, safeCounts, playerCounts };
  }, [filteredFeed, tab]);

  // Helper to get images with flexible matching (Case insensitive check)
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

  const RenderList = ({ 
    title, 
    items,
    icon,
    totalCount
  }: { 
    title: string, 
    items: {name: string, count: number}[],
    icon: React.ReactNode,
    totalCount?: number
  }) => (
    <div className="bg-[#1a1a1a] rounded-xl border border-gray-800 overflow-hidden flex flex-col h-full shadow-lg transition-all hover:border-yellow-600/30">
        <div className="p-4 border-b border-gray-800 bg-black">
            <h3 className="font-black text-white uppercase text-sm tracking-widest flex items-center gap-2">
                {icon}
                {title}
            </h3>
        </div>
        <div className="overflow-y-auto max-h-[500px] p-2 space-y-1 custom-scrollbar">
            {items.sort((a,b) => b.count - a.count).map((item, i) => {
                const percent = totalCount ? ((item.count / totalCount) * 100).toFixed(1) : "0.0";
                
                return (
                <div key={i} className="flex items-center justify-between p-3 hover:bg-white/5 rounded-lg transition-colors border border-transparent hover:border-gray-700 group">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                        <span className="text-xs font-mono text-gray-600 font-bold w-6">#{i+1}</span>
                        <div className="w-8 h-8 rounded-full bg-gray-900 flex-shrink-0 flex items-center justify-center text-xs text-gray-400 font-bold border border-gray-800 group-hover:border-yellow-500">
                             {item.name.substring(0,1)}
                        </div>
                        <div className="flex-1 min-w-0 pr-2">
                            <span className="text-sm text-gray-300 font-bold truncate block group-hover:text-white uppercase">{item.name}</span>
                            {/* Progress Bar for Contribution */}
                            {totalCount && (
                                <div className="w-full bg-gray-900 h-1 mt-1 rounded-full overflow-hidden border border-gray-800">
                                    <div 
                                        className="h-full bg-yellow-500 rounded-full transition-all duration-500" 
                                        style={{ width: `${Math.max(Number(percent), 5)}%` }} // Min width for visibility
                                    ></div>
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="text-right flex flex-col items-end pl-2">
                        <span className="text-sm font-black text-black bg-yellow-500 px-2 py-0.5 rounded shadow-sm min-w-[30px] text-center">{item.count}</span>
                        {totalCount && (
                            <span className="text-[9px] text-gray-500 mt-0.5 font-bold">{percent}%</span>
                        )}
                    </div>
                </div>
            )})}
            {items.length === 0 && <div className="text-center p-8 text-gray-600 text-sm">Nenhum dado encontrado</div>}
        </div>
    </div>
  );

  const StatGrid = ({ title, items, getImage, icon, color, onSelect, activeValue }: { 
      title: string, 
      items: {name: string, count: number}[], 
      getImage?: (n: string) => string | undefined,
      icon: React.ReactNode,
      color: string,
      onSelect?: (val: string) => void,
      activeValue?: string
  }) => (
    <div className={`bg-[#1a1a1a] rounded-xl border ${activeValue && activeValue !== 'All' ? 'border-yellow-500 shadow-[0_0_15px_rgba(234,179,8,0.2)]' : 'border-gray-800'} flex flex-col h-full shadow-lg overflow-hidden transition-all duration-300`}>
       <div className="p-4 border-b border-gray-800 bg-black flex justify-between items-center">
          <h3 className={`font-black uppercase text-sm tracking-widest flex items-center gap-2 ${color}`}>
            {icon} {title}
          </h3>
          {activeValue && activeValue !== 'All' && (
              <span className="text-[10px] bg-yellow-600 text-black px-2 py-0.5 rounded-full flex items-center gap-1 animate-pulse font-bold">
                  FILTRADO
              </span>
          )}
       </div>
       <div className="p-4 overflow-y-auto max-h-[500px] custom-scrollbar">
            <div className="grid grid-cols-2 gap-3">
                {items.sort((a,b) => b.count - a.count).map((item, i) => {
                    const isActive = activeValue === item.name;
                    return (
                        <div 
                            key={i} 
                            onClick={() => onSelect && onSelect(item.name)}
                            className={`rounded-xl border p-3 flex flex-col items-center relative group cursor-pointer transition-all shadow-md
                                ${isActive 
                                    ? 'bg-yellow-900/20 border-yellow-500 scale-[1.02] z-10' 
                                    : 'bg-[#0f0f0f] border-gray-800 hover:border-yellow-500/50 hover:bg-[#252525]'}
                            `}
                        >
                            <div className={`absolute top-2 left-2 text-[10px] font-mono ${isActive ? 'text-yellow-500' : 'text-gray-600'} group-hover:text-yellow-400 font-bold`}>#{i+1}</div>
                            <div className="absolute top-2 right-2 font-bold text-white text-[10px] bg-gray-900 px-1.5 py-0.5 rounded border border-gray-700">{item.count}</div>
                            
                            <div className="h-16 w-full flex items-center justify-center my-2 mt-4">
                                {getImage && getImage(item.name) ? (
                                    <img src={getImage(item.name)} className="h-full w-full object-contain drop-shadow-lg group-hover:scale-110 transition-transform duration-300" alt={item.name}/>
                                ) : (
                                    <div className="text-gray-700 text-[10px] font-medium italic flex flex-col items-center">
                                        <span className="opacity-20 text-2xl mb-1">?</span>
                                    </div>
                                )}
                            </div>
                            <div className={`text-[11px] font-bold text-center truncate w-full mt-1 px-1 rounded py-1 border uppercase
                                ${isActive ? 'text-black bg-yellow-500 border-yellow-600' : 'text-gray-400 bg-[#151515] border-gray-800/50'}
                            `}>
                                {item.name || "Desconhecido"}
                            </div>
                        </div>
                    );
                })}
                {items.length === 0 && <div className="col-span-full text-center py-8 text-gray-600 text-sm">Nenhum dado encontrado</div>}
                
                {/* Visual Hint if filtered and list is small */}
                {activeValue && activeValue !== 'All' && items.length === 1 && (
                    <div 
                        onClick={() => onSelect && onSelect(activeValue)}
                        className="col-span-full mt-4 p-2 text-center text-xs text-yellow-500 cursor-pointer hover:underline flex items-center justify-center gap-1 font-bold"
                    >
                        <FilterX size={12}/> REMOVER FILTRO
                    </div>
                )}
            </div>
       </div>
    </div>
  )

  const weaponList = Object.entries(stats.weaponCounts).map(([name, count]) => ({name, count: count as number}));
  const safeList = Object.entries(stats.safeCounts).map(([name, count]) => ({name, count: count as number}));
  const playerList = Object.entries(stats.playerCounts).map(([name, count]) => ({name, count: count as number}));

  // Total count for percentage calculation (denominator)
  const totalEvents = filteredFeed.length;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
        {/* Header and Toggle */}
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
        
        {/* Filters */}
        <div className="mb-4">
            <FilterBar 
                filters={filters} 
                setFilters={setFilters} 
                options={{
                    ...filterOptions,
                    teams: [], // Hide team from options if not strictly needed or empty
                }} 
            />
        </div>

        {/* Stats Grid: Weapons, Safes, Players */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[600px] md:h-[600px]">
            {/* Column 1: Weapons (Grid) */}
            <StatGrid 
                title={tab === 'kills' ? "Abates por Arma" : "Mortes por Arma"} 
                items={weaponList} 
                getImage={getWeaponImg}
                icon={<Swords size={16}/>}
                color="text-orange-500"
                onSelect={(val) => handleToggleFilter('weapon', val)}
                activeValue={filters.weapon}
            />
            
            {/* Column 2: Safes (Grid) */}
            <StatGrid 
                title="Abates por Safes" 
                items={safeList} 
                getImage={getSafeImg}
                icon={<Disc size={16}/>}
                color="text-blue-500"
                onSelect={(val) => handleToggleFilter('safe', val)}
                activeValue={filters.safe}
            />
            
            {/* Column 3: Players (List) */}
            <RenderList 
                title={tab === 'kills' ? "Abates por Players" : "Vítimas por Players"} 
                items={playerList}
                icon={<User size={16} className="text-yellow-500"/>}
                totalCount={totalEvents}
            />
        </div>

        {/* CHRONOLOGICAL KILL FEED LIST */}
        <div className="bg-[#1a1a1a] rounded-xl border border-gray-800 shadow-lg overflow-hidden">
             <div className="p-4 border-b border-gray-800 bg-black flex justify-between items-center">
                 <h3 className="font-bold text-white uppercase text-sm tracking-widest flex items-center gap-2">
                     <List size={16} className="text-gray-500" /> Histórico de Abates
                 </h3>
                 <span className="text-xs text-gray-500 font-mono">{filteredFeed.length} registros</span>
             </div>
             <div className="overflow-x-auto">
                 <div className="max-h-[500px] overflow-y-auto custom-scrollbar">
                     <table className="w-full text-left whitespace-nowrap">
                         <thead className="bg-[#0f0f0f] text-gray-500 text-[10px] uppercase font-bold sticky top-0 z-10">
                             <tr>
                                 <th className="px-4 py-3">Player (Killer)</th>
                                 <th className="px-4 py-3 text-center">Arma</th>
                                 <th className="px-4 py-3">Vítima</th>
                                 <th className="px-4 py-3 text-center">Safe</th>
                                 <th className="px-4 py-3 text-center">Detalhes</th>
                             </tr>
                         </thead>
                         <tbody className="divide-y divide-gray-800 text-sm">
                             {filteredFeed.map((row, idx) => (
                                 <tr key={idx} className="hover:bg-yellow-900/5 transition-colors">
                                     <td className="px-4 py-2 font-bold text-green-500">{row.PLAYER}</td>
                                     <td className="px-4 py-2 text-center">
                                         <div className="flex justify-center items-center gap-2" title={row.ARMA}>
                                            {getWeaponImg(row.ARMA) ? (
                                                <img src={getWeaponImg(row.ARMA)} className="h-6 w-12 object-contain" alt={row.ARMA} />
                                            ) : (
                                                <span className="text-gray-600 text-xs uppercase">{row.ARMA}</span>
                                            )}
                                         </div>
                                     </td>
                                     <td className="px-4 py-2 font-bold text-red-500">{row.VITIMA}</td>
                                     <td className="px-4 py-2 text-center">
                                         <div className="flex justify-center items-center gap-2" title={row.SAFE}>
                                            {getSafeImg(row.SAFE) ? (
                                                <img src={getSafeImg(row.SAFE)} className="h-6 w-12 object-contain" alt={row.SAFE} />
                                            ) : (
                                                <span className="text-gray-600 text-xs uppercase">{row.SAFE}</span>
                                            )}
                                         </div>
                                     </td>
                                     <td className="px-4 py-2 text-center text-xs text-gray-500 font-medium">
                                         <span className="bg-black px-2 py-0.5 rounded border border-gray-800">{row.MAPA}</span> • {row.RD} • {row.CONFRONTO}
                                     </td>
                                 </tr>
                             ))}
                             {filteredFeed.length === 0 && (
                                 <tr>
                                     <td colSpan={5} className="px-4 py-8 text-center text-gray-600 text-sm">Nenhum registro encontrado no histórico.</td>
                                 </tr>
                             )}
                         </tbody>
                     </table>
                 </div>
             </div>
        </div>
    </div>
  );
};

export default KillFeedPage;