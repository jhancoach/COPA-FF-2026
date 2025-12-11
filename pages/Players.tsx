import React, { useMemo, useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { DashboardData } from '../types';
import { Trophy, Shield, Crown, User, Swords, Zap, Filter as FilterIcon, BarChart2, Scale, List as ListIcon, Crosshair, Map as MapIcon, Skull, ChevronRight, Sparkles, X } from 'lucide-react';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, LabelList } from 'recharts';
import FilterBar from '../components/FilterBar';

interface PlayersProps {
  data: DashboardData;
}

const Players: React.FC<PlayersProps> = ({ data }) => {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState<'ranking' | 'chars' | 'report' | 'compare'>('ranking');
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

  // Handle incoming navigation from Teams page
  useEffect(() => {
    if (location.state?.player) {
      setFilters(prev => ({ ...prev, players: [location.state.player] }));
      setActiveTab('report');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      // Clear state
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const [compareA, setCompareA] = useState<string>('');
  const [compareB, setCompareB] = useState<string>('');

  // --- Filter Options ---
  const filterOptions = useMemo(() => {
    const teams = Array.from(new Set(data.players.map(p => p.TIME))).filter(Boolean).sort();
    const players = Array.from(new Set(data.players.map(p => p.PLAYER))).filter(Boolean).sort();
    const maps = Array.from(new Set(data.players.map(p => p.MAPA))).filter(Boolean).sort();
    const rounds = Array.from(new Set(data.players.map(p => p.RD))).filter(Boolean).sort();

    return { teams, players, weapons: [], safes: [], maps, rounds, confrontations: [] };
  }, [data.players]);

  // --- Ranking Logic ---
  const rankingData = useMemo(() => {
    if (activeTab !== 'ranking') return [];

    const filtered = data.players.filter(p => {
        if (filters.team !== 'All' && p.TIME !== filters.team) return false;
        if (filters.players.length > 0 && !filters.players.includes(p.PLAYER)) return false;
        if (filters.map !== 'All' && p.MAPA !== filters.map) return false;
        if (filters.round !== 'All' && p.RD !== filters.round) return false;
        return true;
    });

    const stats = new Map<string, { kills: number; matches: number; team: string }>();

    filtered.forEach(p => {
        if (!p.PLAYER) return;
        const kills = parseInt(p.Abates || '0');
        const matches = parseInt(p.S || '0'); 

        if (!stats.has(p.PLAYER)) {
            stats.set(p.PLAYER, { kills, matches, team: p.TIME });
        } else {
            const s = stats.get(p.PLAYER)!;
            s.kills += kills;
            s.matches += matches;
        }
    });

    return Array.from(stats.entries()).map(([name, stat]) => ({
        name,
        team: stat.team,
        kills: stat.kills,
        matches: stat.matches,
        avg: stat.matches > 0 ? (stat.kills / stat.matches).toFixed(2) : '0.00'
    })).sort((a, b) => b.kills - a.kills);
  }, [data.players, filters, activeTab]);


  // --- Characters Logic (Tab 2) ---
  const charactersData = useMemo(() => {
    if (activeTab !== 'chars') return [];

    return data.characters.filter(c => {
        if (filters.team !== 'All' && c.Time !== filters.team) return false;
        if (filters.players.length > 0 && !filters.players.includes(c.Player)) return false;
        if (filters.map !== 'All' && c.Mapa !== filters.map) return false;
        if (filters.round !== 'All' && c.Rd !== filters.round) return false;
        return true;
    }).map(c => {
         // Safe findDim with check
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
  }, [data.characters, filters, data.hab1, data.hab2, data.hab3, data.hab4, data.pets, data.items, activeTab]);

  const globalUsageStats = useMemo(() => {
    if (activeTab !== 'chars') return { topActive: [], topPassive: [], topPets: [], topItems: [] };
    return calculateUsageStats(charactersData);
  }, [charactersData, activeTab]);

  const handlePlayerClick = (playerName: string) => {
      setFilters(prev => ({ ...prev, players: [playerName] }));
      setActiveTab('report');
      // Scroll to top
      window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="space-y-6">
      
      {/* Navigation Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-gray-700 pb-2">
        {[
            { id: 'ranking', label: 'Ranking', icon: <Trophy size={18} /> },
            { id: 'chars', label: 'Personagens & Itens', icon: <User size={18} /> },
            { id: 'report', label: 'Relatório', icon: <BarChart2 size={18} /> },
            { id: 'compare', label: 'Comparativo', icon: <Scale size={18} /> },
        ].map(tab => (
            <button 
                key={tab.id}
                onClick={() => { setActiveTab(tab.id as any); }}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold uppercase transition-all tracking-wide ${activeTab === tab.id ? 'bg-yellow-500 text-black shadow-lg shadow-yellow-500/20' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
            >
                {tab.icon}
                {tab.label}
            </button>
        ))}
      </div>

      {/* Filter Bar (Only show in Ranking and Chars tabs, and Report tab) */}
      {activeTab !== 'compare' && (
          <FilterBar 
            filters={filters as any} 
            setFilters={setFilters as any} 
            options={filterOptions} 
          />
      )}

      {/* --- TAB 1: RANKING --- */}
      {activeTab === 'ranking' && (
          <div className="bg-[#1a1a1a] rounded-2xl overflow-hidden border border-gray-800 shadow-xl animate-in fade-in duration-300">
            <div className="p-6 border-b border-gray-800 flex justify-between items-center">
                <h2 className="text-xl font-bold text-white flex items-center gap-2 uppercase italic">
                    <Crown className="text-yellow-500" size={20} />
                    Ranking de Jogadores
                </h2>
                <div className="text-xs text-gray-400 font-mono">
                    {rankingData.length} Jogadores
                </div>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left whitespace-nowrap">
                    <thead className="bg-black text-gray-500 text-xs uppercase font-bold tracking-wider">
                        <tr>
                            <th className="px-6 py-4">#</th>
                            <th className="px-6 py-4">Jogador</th>
                            <th className="px-6 py-4">Equipe</th>
                            <th className="px-6 py-4 text-center text-red-500">Abates</th>
                            <th className="px-6 py-4 text-center text-blue-400">Partidas (S)</th>
                            <th className="px-6 py-4 text-center text-yellow-500">Média</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800 text-sm font-medium">
                        {rankingData.length > 0 ? rankingData.map((player, idx) => (
                            <tr 
                                key={idx} 
                                onClick={() => handlePlayerClick(player.name)}
                                className="hover:bg-yellow-900/10 transition-colors cursor-pointer group"
                            >
                                <td className="px-6 py-4 text-gray-600 font-mono">{idx + 1}</td>
                                <td className="px-6 py-4 font-bold text-white flex items-center gap-2">
                                    {player.name}
                                    <ChevronRight size={14} className="text-yellow-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                                </td>
                                <td className="px-6 py-4 text-gray-400 uppercase text-xs tracking-wider">{player.team}</td>
                                <td className="px-6 py-4 text-center text-red-400 font-black bg-red-900/5 rounded">{player.kills}</td>
                                <td className="px-6 py-4 text-center text-blue-400 font-bold">{player.matches}</td>
                                <td className="px-6 py-4 text-center text-yellow-400 font-bold">{player.avg}</td>
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan={6} className="px-6 py-8 text-center text-gray-500">Nenhum dado encontrado.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
          </div>
      )}

      {/* --- TAB 2: CHARACTERS (Cards) --- */}
      {activeTab === 'chars' && (
          <div className="space-y-8 animate-in fade-in duration-300">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
               <UsageCard title="Habs Ativas (Hab 1)" items={globalUsageStats.topActive} icon={<Zap size={16}/>} color="text-yellow-400" />
               <UsageCard title="Habs Passivas (Mix)" items={globalUsageStats.topPassive} icon={<Sparkles size={16}/>} color="text-orange-400" />
               <UsageCard title="Top 5 Pets" items={globalUsageStats.topPets} icon={<Shield size={16}/>} color="text-blue-400" />
               <UsageCard title="Top 5 Itens" items={globalUsageStats.topItems} icon={<Swords size={16}/>} color="text-red-400" />
            </div>

            <div className="space-y-2">
                 {charactersData.map((char, idx) => (
                     <div key={idx} className="bg-[#1a1a1a] rounded-xl p-4 border border-gray-800 flex flex-col xl:flex-row gap-4 items-center shadow-lg hover:border-yellow-500/30 transition-colors">
                        <div className="w-full xl:w-48 flex items-center gap-3 border-b xl:border-b-0 xl:border-r border-gray-800 pb-3 xl:pb-0 pr-0 xl:pr-4">
                            <div className="h-12 w-12 rounded-full bg-black/40 flex items-center justify-center overflow-hidden border border-gray-700 flex-shrink-0">
                                {char.teamImg ? <img src={char.teamImg} className="w-full h-full object-cover"/> : <User className="text-gray-500"/>}
                            </div>
                            <div className="overflow-hidden">
                                <h3 className="font-bold text-white text-sm truncate">{char.Player}</h3>
                                <span className="text-xs text-yellow-500 font-bold font-mono block truncate uppercase">{char.Time}</span>
                                <div className="flex gap-2 text-[10px] text-gray-500 mt-1">
                                    <span>RD: {char.Rd}</span>
                                    <span>Mapa: {char.Mapa}</span>
                                </div>
                            </div>
                        </div>
                        <div className="flex-1 w-full overflow-x-auto custom-scrollbar">
                           <div className="flex gap-3 min-w-max pb-2 px-1">
                              <LoadoutCard title="Ativa (Hab 1)" name={char.Hab1} img={char.hab1Img} isPet={false} isItem={false} highlight />
                              <LoadoutCard title="Hab 2" name={char.Hab2} img={char.hab2Img} />
                              <LoadoutCard title="Hab 3" name={char.Hab3} img={char.hab3Img} />
                              <LoadoutCard title="Hab 4" name={char.Hab4} img={char.hab4Img} />
                              <LoadoutCard title="Pet" name={char.Pet} img={char.petImg} isPet />
                              <LoadoutCard title="Item" name={char.Item} img={char.itemImg} isItem />
                           </div>
                        </div>
                     </div>
                 ))}
                 {charactersData.length === 0 && (
                     <div className="text-center text-gray-500 py-12">Nenhum dado encontrado para os filtros selecionados.</div>
                 )}
            </div>
          </div>
      )}

      {/* --- TAB 3: RELATÓRIO --- */}
      {activeTab === 'report' && (
          <div className="animate-in fade-in duration-300">
              {filters.players.length === 1 ? (
                  <div className="space-y-4">
                       <button onClick={() => { setFilters(prev => ({...prev, players: []})); setActiveTab('ranking'); }} className="text-xs text-yellow-500 hover:text-yellow-400 flex items-center gap-1 font-bold">
                           &larr; Voltar para Ranking
                       </button>
                       <PlayerProfile data={data} playerName={filters.players[0]} />
                  </div>
              ) : (
                  <div className="bg-[#1a1a1a] rounded-xl p-12 text-center border border-gray-800 flex flex-col items-center">
                      <User size={48} className="text-gray-600 mb-4" />
                      <h3 className="text-xl font-bold text-gray-200 uppercase">Selecione um Jogador</h3>
                      <p className="text-gray-500 mt-2">Utilize o filtro de jogadores acima ou clique em um nome na aba Ranking.</p>
                      <button onClick={() => setActiveTab('ranking')} className="mt-4 px-6 py-2 bg-yellow-500 hover:bg-yellow-400 rounded-lg text-black font-black text-sm uppercase tracking-wider">
                          Ir para Ranking
                      </button>
                  </div>
              )}
          </div>
      )}

      {/* --- TAB 4: COMPARATIVO --- */}
      {activeTab === 'compare' && (
          <div className="animate-in fade-in duration-300">
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                  {/* Left Player */}
                  <div className="space-y-4">
                      <div className="bg-[#1a1a1a] p-4 rounded-xl border border-gray-800">
                          <label className="text-xs text-gray-400 uppercase font-bold mb-2 block">Jogador 1</label>
                          <select 
                             className="w-full bg-black text-white p-3 rounded-lg border border-gray-700 focus:border-yellow-500 outline-none font-medium"
                             value={compareA}
                             onChange={(e) => setCompareA(e.target.value)}
                          >
                              <option value="">Selecione...</option>
                              {filterOptions.players.map(p => <option key={p} value={p}>{p}</option>)}
                          </select>
                      </div>
                      {compareA ? (
                          <div className="bg-[#0f0f0f] rounded-xl p-2 border border-gray-800">
                            <PlayerProfile data={data} playerName={compareA} isCompact />
                          </div>
                      ) : (
                          <div className="text-center py-20 text-gray-600 font-mono">Selecione o jogador 1</div>
                      )}
                  </div>

                  {/* Right Player */}
                  <div className="space-y-4">
                      <div className="bg-[#1a1a1a] p-4 rounded-xl border border-gray-800">
                          <label className="text-xs text-gray-400 uppercase font-bold mb-2 block">Jogador 2</label>
                          <select 
                             className="w-full bg-black text-white p-3 rounded-lg border border-gray-700 focus:border-yellow-500 outline-none font-medium"
                             value={compareB}
                             onChange={(e) => setCompareB(e.target.value)}
                          >
                              <option value="">Selecione...</option>
                              {filterOptions.players.map(p => <option key={p} value={p}>{p}</option>)}
                          </select>
                      </div>
                      {compareB ? (
                          <div className="bg-[#0f0f0f] rounded-xl p-2 border border-gray-800">
                            <PlayerProfile data={data} playerName={compareB} isCompact />
                          </div>
                      ) : (
                          <div className="text-center py-20 text-gray-600 font-mono">Selecione o jogador 2</div>
                      )}
                  </div>
              </div>
          </div>
      )}

    </div>
  );
};

// --- Reusable Component for Player Report ---
const PlayerProfile = ({ data, playerName, isCompact = false }: { data: DashboardData, playerName: string, isCompact?: boolean }) => {
    // Local state for filtering by Active Skill (Hab 1)
    const [selectedHab1, setSelectedHab1] = useState<string | null>(null);

    // 1. Basic Stats
    const stats = useMemo(() => {
        let kills = 0;
        let matches = 0;
        data.players.filter(p => p.PLAYER === playerName).forEach(p => {
            kills += parseInt(p.Abates || '0');
            matches += parseInt(p.S || '0');
        });
        return { kills, matches, avg: matches > 0 ? (kills/matches).toFixed(2) : '0.00' };
    }, [data.players, playerName]);

    // 2. Loadout Analysis (Aggregate Most Used)
    const { loadoutCards, usageStats } = useMemo(() => {
        const playerChars = data.characters.filter(c => c.Player === playerName);
        
        // Filter character data if an active skill is selected to calculate specific loadout
        const filteredChars = selectedHab1 
            ? playerChars.filter(c => c.Hab1 === selectedHab1) 
            : playerChars;

        const countOccurrences = (arr: string[]) => {
            const counts: Record<string, number> = {};
            arr.forEach(x => { if(x && x.trim()) counts[x] = (counts[x] || 0) + 1; });
            return Object.entries(counts).sort((a,b) => b[1] - a[1]);
        }

        const hab1 = countOccurrences(filteredChars.map(c => c.Hab1))[0]?.[0];
        const hab2 = countOccurrences(filteredChars.map(c => c.Hab2))[0]?.[0];
        const hab3 = countOccurrences(filteredChars.map(c => c.Hab3))[0]?.[0];
        const hab4 = countOccurrences(filteredChars.map(c => c.Hab4))[0]?.[0];
        const pet = countOccurrences(filteredChars.map(c => c.Pet))[0]?.[0];
        const item = countOccurrences(filteredChars.map(c => c.Item))[0]?.[0];

        // Resolve Images with robust trim/lowercase matching
        const findDim = (dims: any[], name: string) => {
            if (!name) return undefined;
            return dims.find(d => d.Name.trim().toLowerCase() === name.trim().toLowerCase())?.IMG;
        };

        return {
            loadoutCards: {
                hab1: { name: hab1, img: findDim(data.hab1, hab1) },
                hab2: { name: hab2, img: findDim(data.hab2, hab2) },
                hab3: { name: hab3, img: findDim(data.hab3, hab3) },
                hab4: { name: hab4, img: findDim(data.hab4, hab4) },
                pet: { name: pet, img: findDim(data.pets, pet) },
                item: { name: item, img: findDim(data.items, item) },
            },
            // We use the full playerChars history for the stats lists, so the user can see all options available to click
            usageStats: calculateUsageStats(playerChars)
        };
    }, [data, playerName, selectedHab1]);

    // 3. Lists (Weapons, Safes, Maps, Victims) & Chart
    const { weaponList, safeList, mapList, victimList, chartData } = useMemo(() => {
        const kills = data.killFeed.filter(k => k.PLAYER === playerName);
        
        const count = (arr: string[]) => {
            const counts: Record<string, number> = {};
            arr.forEach(x => { if(x && x.trim()) counts[x] = (counts[x] || 0) + 1; });
            return Object.entries(counts).map(([name, count]) => ({ name, count })).sort((a,b) => b.count - a.count);
        };

        // Attach Images for Weapons and Safes
        const weaponListWithImg = count(kills.map(k => k.ARMA)).map(item => ({
            ...item,
            img: data.weapons.find(w => w.Arma.trim().toLowerCase() === item.name.trim().toLowerCase())?.IMG
        }));

        const safeListWithImg = count(kills.map(k => k.SAFE)).map(item => ({
             ...item,
             img: data.safes.find(s => s.Safe.trim().toLowerCase() === item.name.trim().toLowerCase())?.IMG
        }));

        const chartMap = new Map<string, number>();
        kills.forEach(k => {
             chartMap.set(k.RD, (chartMap.get(k.RD) || 0) + 1);
        });
        const chartData = Array.from(chartMap.entries()).map(([rd, kills]) => ({ rd, kills })).sort((a,b) => {
            const numA = parseInt(a.rd.replace(/\D/g, ''));
            const numB = parseInt(b.rd.replace(/\D/g, ''));
            return (numA || 0) - (numB || 0);
        });

        return {
            weaponList: weaponListWithImg,
            safeList: safeListWithImg,
            mapList: count(kills.map(k => k.MAPA)), // Added Map List calculation
            victimList: count(kills.map(k => k.VITIMA)),
            chartData
        };
    }, [data.killFeed, playerName, data.weapons, data.safes]);


    return (
        <div className="space-y-6">
            <h3 className="text-xl font-black italic text-center text-white border-b border-gray-800 pb-2 uppercase tracking-wide">{playerName}</h3>
            
            {/* Header / Stats */}
            <div className="grid grid-cols-3 gap-2 sm:gap-4">
                 <div className="bg-[#1a1a1a] p-3 rounded-xl border border-gray-800 text-center">
                     <div className="text-gray-500 text-[10px] uppercase mb-1 font-bold tracking-wider">Abates</div>
                     <div className="text-xl sm:text-2xl font-black text-red-500">{stats.kills}</div>
                 </div>
                 <div className="bg-[#1a1a1a] p-3 rounded-xl border border-gray-800 text-center">
                     <div className="text-gray-500 text-[10px] uppercase mb-1 font-bold tracking-wider">Partidas</div>
                     <div className="text-xl sm:text-2xl font-black text-blue-400">{stats.matches}</div>
                 </div>
                 <div className="bg-[#1a1a1a] p-3 rounded-xl border border-gray-800 text-center">
                     <div className="text-gray-500 text-[10px] uppercase mb-1 font-bold tracking-wider">Média</div>
                     <div className="text-xl sm:text-2xl font-black text-yellow-500">{stats.avg}</div>
                 </div>
            </div>

            {/* Loadout (Most Used) */}
            <div className={`bg-[#1a1a1a] p-3 rounded-xl border transition-all duration-300 ${selectedHab1 ? 'border-yellow-500/50 shadow-[0_0_15px_rgba(234,179,8,0.1)]' : 'border-gray-800'}`}>
                 <div className="flex justify-between items-center mb-3">
                     <h4 className="text-gray-200 text-xs font-bold flex items-center gap-2 uppercase tracking-wide">
                        <User size={14}/> 
                        Loadout Principal
                        {selectedHab1 && (
                            <span className="text-[10px] bg-yellow-500 text-black px-2 py-0.5 rounded-full font-bold">
                                Com {selectedHab1}
                            </span>
                        )}
                     </h4>
                     {selectedHab1 && (
                         <button 
                            onClick={() => setSelectedHab1(null)}
                            className="text-[10px] text-gray-400 hover:text-white flex items-center gap-1 bg-gray-800 px-2 py-1 rounded"
                         >
                             <X size={10} /> Limpar
                         </button>
                     )}
                 </div>
                 <div className="flex gap-2 overflow-x-auto custom-scrollbar pb-2">
                      <LoadoutCard title="Ativa (Hab 1)" name={loadoutCards.hab1.name} img={loadoutCards.hab1.img} highlight />
                      <LoadoutCard title="Hab 2" name={loadoutCards.hab2.name} img={loadoutCards.hab2.img} />
                      <LoadoutCard title="Hab 3" name={loadoutCards.hab3.name} img={loadoutCards.hab3.img} />
                      <LoadoutCard title="Hab 4" name={loadoutCards.hab4.name} img={loadoutCards.hab4.img} />
                      <LoadoutCard title="Pet" name={loadoutCards.pet.name} img={loadoutCards.pet.img} isPet />
                      <LoadoutCard title="Item" name={loadoutCards.item.name} img={loadoutCards.item.img} isItem />
                 </div>
            </div>

            {/* Usage Stats Lists */}
            <div className={`grid grid-cols-1 sm:grid-cols-2 ${isCompact ? 'xl:grid-cols-1' : 'xl:grid-cols-4'} gap-3`}>
               <UsageCard 
                    title="Habs Ativas (Hab 1)" 
                    items={usageStats.topActive} 
                    icon={<Zap size={14}/>} 
                    color="text-yellow-500" 
                    onItemClick={(name: string) => setSelectedHab1(prev => prev === name ? null : name)}
                    activeItem={selectedHab1}
               />
               <UsageCard title="Habs Passivas (Mix)" items={usageStats.topPassive} icon={<Sparkles size={14}/>} color="text-orange-400" />
               <UsageCard title="Pets Mais Usados" items={usageStats.topPets} icon={<Shield size={14}/>} color="text-blue-400" />
               <UsageCard title="Itens Mais Usados" items={usageStats.topItems} icon={<Swords size={14}/>} color="text-red-400" />
            </div>

            {/* Kills Chart */}
            <div className="bg-[#1a1a1a] p-3 rounded-xl border border-gray-800 shadow-lg">
                <h4 className="text-gray-200 text-xs font-bold mb-3 flex items-center gap-2 uppercase tracking-wide"><Crosshair size={14} className="text-red-500"/> Abates por Rodada</h4>
                <div className="h-40">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData} margin={{ top: 20, right: 5, left: -25, bottom: 0 }}>
                            <XAxis dataKey="rd" stroke="#525252" fontSize={10} tickLine={false} axisLine={false} />
                            <Tooltip contentStyle={{ backgroundColor: '#171717', border: '1px solid #404040' }} itemStyle={{ color: '#E5E7EB' }} cursor={{fill: 'rgba(234, 179, 8, 0.1)'}} />
                            <Bar dataKey="kills" fill="#EF4444" radius={[2, 2, 0, 0]}>
                                <LabelList dataKey="kills" position="top" fill="#D4D4D4" fontSize={10} fontWeight="bold" />
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Detailed Lists (Weapons, Maps, Safes, Victims) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <SimpleList title="Por Arma" items={weaponList} color="text-orange-500" icon={<Swords size={14}/>} />
                <SimpleList title="Por Mapa" items={mapList} color="text-green-500" icon={<MapIcon size={14}/>} />
                <SimpleList title="Por Safe" items={safeList} color="text-blue-500" icon={<Shield size={14}/>} />
                <SimpleList title="Principais Vítimas" items={victimList} color="text-purple-400" icon={<Skull size={14}/>} />
            </div>
        </div>
    );
};


// --- Helpers & Sub-Components ---

const calculateUsageStats = (charsData: any[]) => {
    const activeCounts: Record<string, number> = {}; // Hab 1
    const passiveCounts: Record<string, number> = {}; // Hab 2, 3, 4
    const petCounts: Record<string, number> = {};
    const itemCounts: Record<string, number> = {};

    charsData.forEach(c => {
        // Hab 1 (Active)
        if(c.Hab1) activeCounts[c.Hab1] = (activeCounts[c.Hab1] || 0) + 1;
        
        // Hab 2-4 (Passive)
        [c.Hab2, c.Hab3, c.Hab4].forEach(h => { 
            if(h) passiveCounts[h] = (passiveCounts[h] || 0) + 1; 
        });

        if(c.Pet) petCounts[c.Pet] = (petCounts[c.Pet] || 0) + 1;
        if(c.Item) itemCounts[c.Item] = (itemCounts[c.Item] || 0) + 1;
    });

    const getTop = (record: Record<string, number>, limit: number) => Object.entries(record).sort((a,b) => b[1] - a[1]).slice(0, limit);

    return {
        topActive: getTop(activeCounts, 5),
        topPassive: getTop(passiveCounts, 5), 
        topPets: getTop(petCounts, 5), 
        topItems: getTop(itemCounts, 5) 
    };
};

const UsageCard = ({ title, items, icon, color, onItemClick, activeItem }: any) => (
    <div className={`bg-[#1a1a1a] rounded-xl p-3 border transition-all duration-300 max-h-48 overflow-y-auto custom-scrollbar ${activeItem ? 'border-yellow-500/50' : 'border-gray-800'}`}>
        <h3 className={`text-[10px] uppercase font-bold mb-2 flex items-center gap-1 tracking-wider ${color}`}>{icon} {title}</h3>
        <ul className="space-y-1">
            {items.map(([name, count]: any, i: number) => {
                const isActive = activeItem === name;
                return (
                    <li 
                        key={i} 
                        onClick={() => onItemClick && onItemClick(name)}
                        className={`flex justify-between items-center text-xs p-1.5 rounded border transition-all cursor-pointer group
                            ${isActive 
                                ? 'bg-yellow-500 text-black border-yellow-500 font-bold' 
                                : 'bg-[#0f0f0f] border-gray-800 text-gray-300 hover:border-gray-600 hover:bg-[#252525]'}
                        `}
                    >
                        <span className={`truncate pr-2 ${isActive ? 'font-black' : ''}`}>{name}</span>
                        <span className={`font-mono font-bold px-1.5 rounded text-[10px] ${isActive ? 'bg-black text-yellow-500' : 'bg-white/5 text-white'}`}>
                            {count}
                        </span>
                    </li>
                );
            })}
            {items.length === 0 && <li className="text-gray-500 text-[10px]">Sem dados</li>}
        </ul>
    </div>
);

const SimpleList = ({ title, items, color, icon }: any) => (
    <div className="bg-[#1a1a1a] rounded-xl border border-gray-800 flex flex-col max-h-60">
        <div className="p-3 border-b border-gray-800 bg-[#0f0f0f] flex items-center gap-2">
             <span className={color}>{icon}</span>
             <h3 className={`text-xs font-bold uppercase tracking-wider ${color}`}>{title}</h3>
        </div>
        <div className="overflow-y-auto p-2 custom-scrollbar">
             {items.map((item: any, i: number) => (
                 <div key={i} className="flex justify-between items-center py-1 border-b border-gray-800 last:border-0 hover:bg-white/5 px-1 rounded group">
                     <div className="flex items-center gap-2 truncate pr-2">
                         {item.img && <img src={item.img} alt={item.name} className="w-6 h-6 object-contain" />}
                         <span className="text-xs text-gray-300 truncate group-hover:text-white transition-colors uppercase font-medium">{item.name}</span>
                     </div>
                     <span className="text-xs font-bold text-black bg-gray-500 group-hover:bg-white transition-colors px-1.5 rounded">{item.count}</span>
                 </div>
             ))}
             {items.length === 0 && <div className="text-center text-gray-500 text-xs py-2">Vazio</div>}
        </div>
    </div>
);

const LoadoutCard = ({ title, name, img, isPet, isItem, highlight }: any) => (
    <div className={`w-24 h-32 flex-shrink-0 bg-[#0f0f0f] rounded-xl border ${highlight ? 'border-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.2)]' : isPet ? 'border-blue-500/20' : isItem ? 'border-red-500/20' : 'border-gray-800'} relative group hover:border-yellow-500 transition-all overflow-hidden shadow-lg`}>
        <div className={`absolute top-1.5 left-2 text-[8px] font-bold uppercase z-20 tracking-wider bg-black/60 px-1.5 py-0.5 rounded backdrop-blur-sm ${highlight ? 'text-yellow-400' : 'text-gray-400'}`}>{title}</div>
        
        <div className="w-full h-full flex items-center justify-center p-2 relative z-10">
            {img ? (
                <img src={img} alt={name} className="w-full h-full object-contain drop-shadow-xl transform group-hover:scale-110 transition-transform duration-300" />
            ) : (
                <div className="flex flex-col items-center justify-center text-gray-700 opacity-20">
                     <User size={24} />
                     <span className="text-[9px] mt-1 uppercase">{name || '-'}</span>
                </div>
            )}
        </div>
        
        {/* Name Overlay */}
        <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-black via-black/90 to-transparent pt-8 pb-2 px-1 flex items-end justify-center z-20 pointer-events-none">
            <p className="text-[10px] text-gray-300 font-bold uppercase tracking-wider text-center leading-tight drop-shadow-md truncate w-full px-1 group-hover:text-white">
                {name || ''}
            </p>
        </div>
    </div>
);

export default Players;