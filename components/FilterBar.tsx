
import React, { useState, useRef, useEffect } from 'react';
import { Filter, X, Search, Check, ChevronDown } from 'lucide-react';

interface FilterState {
  team: string;
  players: string[]; 
  weapon: string;
  safe: string;
  map: string;
  rodada: string; // RD
  queda: string;  // Q
  confrontation: string;
}

interface FilterBarProps {
  filters: FilterState;
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
  options: {
    teams: string[];
    players: string[];
    weapons: string[];
    safes: string[];
    maps: string[];
    rounds: string[];  // For RD
    quedas: string[];  // For Q
    confrontations: string[];
  };
}

const FilterBar: React.FC<FilterBarProps> = ({ filters, setFilters, options }) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleChange = (key: keyof FilterState, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      team: 'All',
      players: [],
      weapon: 'All',
      safe: 'All',
      map: 'All',
      rodada: 'All',
      queda: 'All',
      confrontation: 'All'
    });
  };

  const hasActiveFilters = 
    filters.team !== 'All' || 
    filters.players.length > 0 ||
    filters.weapon !== 'All' ||
    filters.safe !== 'All' ||
    filters.map !== 'All' ||
    filters.rodada !== 'All' ||
    filters.queda !== 'All' ||
    filters.confrontation !== 'All';

  return (
    <div className="bg-[#1a1a1a] rounded-xl p-4 mb-6 border border-gray-800 shadow-md relative z-40">
      <div className="flex justify-between items-center md:hidden mb-4" onClick={() => setIsOpen(!isOpen)}>
        <span className="text-white font-bold flex items-center gap-2 uppercase tracking-wide"><Filter size={18}/> Filtros</span>
        <span className="text-yellow-500 text-sm font-bold">{isOpen ? 'FECHAR' : 'ABRIR'}</span>
      </div>

      <div className={`${isOpen ? 'block' : 'hidden'} md:grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4`}>
        {/* Multi-Select for Players - Takes up 2 cols on lg */}
        <div className="lg:col-span-2">
            <MultiSelectPlayer 
                options={options.players} 
                selected={filters.players} 
                onChange={(newSelected) => setFilters(prev => ({...prev, players: newSelected}))}
            />
        </div>

        {/* Use Searchable Selects for fields that might have many options */}
        {options.teams && options.teams.length > 0 && <SearchableSelect label="Time" value={filters.team} options={options.teams} onChange={(v) => handleChange('team', v)} />}
        
        {/* Novos Filtros RD e Queda */}
        {options.rounds && options.rounds.length > 0 && <SearchableSelect label="Rodada (RD)" value={filters.rodada} options={options.rounds} onChange={(v) => handleChange('rodada', v)} />}
        {options.quedas && options.quedas.length > 0 && <SearchableSelect label="Queda (Q)" value={filters.queda} options={options.quedas} onChange={(v) => handleChange('queda', v)} />}
        
        {options.maps && options.maps.length > 0 && <SearchableSelect label="Mapa" value={filters.map} options={options.maps} onChange={(v) => handleChange('map', v)} />}
        
        {options.weapons && options.weapons.length > 0 && <SearchableSelect label="Arma" value={filters.weapon} options={options.weapons} onChange={(v) => handleChange('weapon', v)} />}
        {options.safes && options.safes.length > 0 && <SearchableSelect label="Safe" value={filters.safe} options={options.safes} onChange={(v) => handleChange('safe', v)} />}
        {options.confrontations && options.confrontations.length > 0 && <SearchableSelect label="Confronto" value={filters.confrontation} options={options.confrontations} onChange={(v) => handleChange('confrontation', v)} />}
      </div>

      {hasActiveFilters && (
        <div className="mt-4 flex justify-end">
          <button onClick={clearFilters} className="text-red-500 text-sm flex items-center gap-1 hover:text-red-400 font-bold uppercase tracking-wider">
            <X size={14} /> Limpar Filtros
          </button>
        </div>
      )}
    </div>
  );
};

// New Searchable Select Component
const SearchableSelect = ({ label, value, options, onChange }: { label: string, value: string, options: string[], onChange: (v: string) => void }) => {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState('');
    const wrapperRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [wrapperRef]);

    const filteredOptions = ['All', ...options].filter(o => 
        o === 'All' ? true : o.toLowerCase().includes(search.toLowerCase())
    );

    const displayValue = value === 'All' ? 'Todos' : value;

    return (
        <div className="flex flex-col relative" ref={wrapperRef}>
            <label className="text-[10px] text-gray-500 uppercase mb-1 font-bold tracking-wider">{label}</label>
            <div 
                className="bg-black text-gray-300 text-xs rounded-lg border border-gray-700 px-3 py-2.5 flex justify-between items-center cursor-pointer hover:border-yellow-500 transition-colors"
                onClick={() => setOpen(!open)}
            >
                <span className="truncate font-medium">{displayValue}</span>
                <ChevronDown size={14} className="text-gray-500" />
            </div>

            {open && (
                <div className="absolute top-full left-0 w-full mt-1 bg-[#1a1a1a] border border-gray-700 rounded-lg shadow-xl z-50 max-h-60 overflow-hidden flex flex-col">
                    <input 
                        type="text" 
                        placeholder="Buscar..." 
                        className="p-2 bg-black text-white border-b border-gray-700 text-xs focus:outline-none placeholder-gray-600"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        autoFocus
                    />
                    <div className="overflow-y-auto flex-1 custom-scrollbar">
                        {filteredOptions.map((opt, i) => (
                            <div 
                                key={i} 
                                className={`px-3 py-2 hover:bg-yellow-900/20 cursor-pointer flex items-center justify-between text-xs ${value === opt ? 'text-yellow-500 font-bold' : 'text-gray-300'}`}
                                onClick={() => {
                                    onChange(opt);
                                    setOpen(false);
                                    setSearch('');
                                }}
                            >
                                <span>{opt === 'All' ? 'Todos' : opt}</span>
                                {value === opt && <Check size={12} />}
                            </div>
                        ))}
                        {filteredOptions.length === 0 && <div className="p-3 text-gray-500 text-xs text-center">Nenhum resultado</div>}
                    </div>
                </div>
            )}
        </div>
    );
};


const MultiSelectPlayer = ({ options, selected, onChange }: { options: string[], selected: string[], onChange: (s: string[]) => void }) => {
    const [search, setSearch] = useState('');
    const [open, setOpen] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [wrapperRef]);

    const toggleOption = (option: string) => {
        if (selected.includes(option)) {
            onChange(selected.filter(s => s !== option));
        } else {
            onChange([...selected, option]);
        }
    };

    const filteredOptions = options.filter(o => o.toLowerCase().includes(search.toLowerCase()));

    return (
        <div className="flex flex-col relative" ref={wrapperRef}>
            <label className="text-[10px] text-gray-500 uppercase mb-1 font-bold tracking-wider">Jogadores</label>
            <div 
                className="bg-black text-white text-xs rounded-lg border border-gray-700 px-3 py-2.5 flex justify-between items-center cursor-pointer hover:border-yellow-500 transition-colors"
                onClick={() => setOpen(!open)}
            >
                <span className="truncate font-black">
                    {selected.length === 0 ? 'Selecionar Jogadores...' : `${selected.length} selecionado(s)`}
                </span>
                <Search size={14} className="text-gray-500" />
            </div>
            
            {open && (
                <div className="absolute top-full left-0 w-full mt-1 bg-[#1a1a1a] border border-gray-700 rounded-lg shadow-xl z-50 max-h-60 overflow-hidden flex flex-col">
                    <input 
                        type="text" 
                        placeholder="Pesquisar nome..." 
                        className="p-3 bg-black text-white border-b border-gray-700 text-sm focus:outline-none placeholder-gray-600 font-bold"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        autoFocus
                    />
                    <div className="overflow-y-auto flex-1 custom-scrollbar bg-black">
                        {filteredOptions.map(opt => (
                            <div 
                                key={opt} 
                                className="px-4 py-3 hover:bg-yellow-500/10 cursor-pointer flex items-center justify-between text-xs text-white font-bold border-b border-white/5 last:border-0"
                                onClick={() => toggleOption(opt)}
                            >
                                <span className="uppercase italic tracking-tighter">{opt}</span>
                                {selected.includes(opt) && <Check size={16} className="text-yellow-500" />}
                            </div>
                        ))}
                        {filteredOptions.length === 0 && <div className="p-4 text-gray-500 text-xs text-center font-mono italic">Nenhum competidor encontrado</div>}
                    </div>
                </div>
            )}
            {selected.length > 0 && (
                 <div className="flex flex-wrap gap-1 mt-2">
                    {selected.map(s => (
                        <span key={s} className="text-[10px] bg-yellow-500 text-black px-2 py-0.5 rounded-full flex items-center gap-1 font-black uppercase italic shadow-sm">
                            {s}
                            <X size={12} className="cursor-pointer hover:text-red-900" onClick={() => toggleOption(s)}/>
                        </span>
                    ))}
                 </div>
            )}
        </div>
    );
};

export default FilterBar;
