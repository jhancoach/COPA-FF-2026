
import React, { useState, useEffect } from 'react';
import { Save, RotateCcw, Database, AlertTriangle, Check, Type } from 'lucide-react';
import { CSV_URLS, DEFAULT_CONFIG } from '../constants';
import { getActiveUrls, getAppConfig } from '../services/dataService';

interface AdminProps {
  onRefresh: () => void;
}

const Admin: React.FC<AdminProps> = ({ onRefresh }) => {
  // URLs State
  const [urls, setUrls] = useState<typeof CSV_URLS>(getActiveUrls());
  
  // App Config State
  const [config, setConfig] = useState(getAppConfig());

  const [isSaved, setIsSaved] = useState(false);
  const [activeTab, setActiveTab] = useState<'general' | 'facts' | 'dims'>('general');

  useEffect(() => {
    // Sync state if coming from a fresh load
    setUrls(getActiveUrls());
    setConfig(getAppConfig());
  }, []);

  const handleUrlChange = (key: keyof typeof CSV_URLS, value: string) => {
    setUrls(prev => ({ ...prev, [key]: value }));
    setIsSaved(false);
  };

  const handleConfigChange = (key: keyof typeof DEFAULT_CONFIG, value: string) => {
    setConfig(prev => ({ ...prev, [key]: value }));
    setIsSaved(false);
  };

  const handleSave = () => {
    try {
      localStorage.setItem('MUNDIAL_DASHBOARD_URLS', JSON.stringify(urls));
      localStorage.setItem('MUNDIAL_DASHBOARD_CONFIG', JSON.stringify(config));
      
      setIsSaved(true);
      onRefresh(); // Trigger app-wide reload
      setTimeout(() => setIsSaved(false), 3000);
      alert('Configurações salvas! O dashboard foi atualizado.');
    } catch (e) {
      alert('Erro ao salvar no LocalStorage.');
    }
  };

  const handleReset = () => {
    if (window.confirm('Tem certeza? Isso restaurará todos os links e textos originais do sistema.')) {
      localStorage.removeItem('MUNDIAL_DASHBOARD_URLS');
      localStorage.removeItem('MUNDIAL_DASHBOARD_CONFIG');
      setUrls(CSV_URLS);
      setConfig(DEFAULT_CONFIG);
      onRefresh();
      alert('Configurações restauradas para o padrão.');
    }
  };

  // Group keys for better UI organization
  const factKeys = ['fDetalhes', 'fPlayersDados', 'fKillFeed', 'fPersonagens', 'fKilldia'];
  const dimKeys = Object.keys(CSV_URLS).filter(k => !factKeys.includes(k));

  const InputGroup = ({ keys }: { keys: string[] }) => (
    <div className="space-y-4">
      {keys.map((key) => (
        <div key={key} className="bg-[#0f0f0f] p-4 rounded-xl border border-gray-800 hover:border-yellow-500/30 transition-colors">
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
            {key.replace(/^[fd]/, '')} <span className="text-gray-700 normal-case font-mono text-[10px]">({key})</span>
          </label>
          <div className="flex gap-2">
            <input 
              type="text" 
              value={urls[key as keyof typeof CSV_URLS]} 
              onChange={(e) => handleUrlChange(key as keyof typeof CSV_URLS, e.target.value)}
              className="flex-1 bg-black text-white text-xs p-3 rounded-lg border border-gray-700 focus:border-yellow-500 focus:outline-none font-mono"
              placeholder="https://docs.google.com/..."
            />
            {urls[key as keyof typeof CSV_URLS] !== CSV_URLS[key as keyof typeof CSV_URLS] && (
               <div className="flex items-center px-2 bg-yellow-900/20 rounded border border-yellow-500/20 text-yellow-500 text-[10px] font-bold">
                  MODIFICADO
               </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Header */}
      <div className="bg-[#1a1a1a] p-8 rounded-2xl border border-gray-800 shadow-2xl relative overflow-hidden">
         <div className="absolute top-0 right-0 p-8 opacity-5">
             <Database size={150} />
         </div>
         <div className="relative z-10">
            <h1 className="text-3xl font-black italic text-white flex items-center gap-3 uppercase">
                <Database className="text-yellow-500" /> Painel Admin
            </h1>
            <p className="text-gray-400 mt-2 text-sm max-w-lg">
                Gerencie as fontes de dados e a identidade visual básica do dashboard.
                As alterações são salvas localmente no seu navegador.
            </p>
         </div>
      </div>

      {/* Warning Banner */}
      <div className="bg-yellow-900/10 border border-yellow-500/20 p-4 rounded-xl flex gap-3 items-start">
         <AlertTriangle className="text-yellow-500 shrink-0 mt-0.5" size={18} />
         <div>
            <h4 className="text-yellow-500 font-bold text-sm uppercase">Atenção</h4>
            <p className="text-gray-400 text-xs mt-1">
               Certifique-se de que os links inseridos são públicos e estão no formato CSV. Links quebrados farão o dashboard parar de carregar os dados.
            </p>
         </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-gray-800 pb-1">
          <button 
             onClick={() => setActiveTab('general')}
             className={`px-6 py-3 text-sm font-bold uppercase tracking-wide rounded-t-lg transition-colors border-b-2 ${activeTab === 'general' ? 'text-yellow-500 border-yellow-500 bg-white/5' : 'text-gray-500 border-transparent hover:text-white'}`}
          >
             Geral
          </button>
          <button 
             onClick={() => setActiveTab('facts')}
             className={`px-6 py-3 text-sm font-bold uppercase tracking-wide rounded-t-lg transition-colors border-b-2 ${activeTab === 'facts' ? 'text-yellow-500 border-yellow-500 bg-white/5' : 'text-gray-500 border-transparent hover:text-white'}`}
          >
             Tabelas Principais (Facts)
          </button>
          <button 
             onClick={() => setActiveTab('dims')}
             className={`px-6 py-3 text-sm font-bold uppercase tracking-wide rounded-t-lg transition-colors border-b-2 ${activeTab === 'dims' ? 'text-yellow-500 border-yellow-500 bg-white/5' : 'text-gray-500 border-transparent hover:text-white'}`}
          >
             Dimensões & Imagens
          </button>
      </div>

      {/* Form Content */}
      <div className="bg-[#1a1a1a] p-6 rounded-b-2xl rounded-tr-2xl border border-gray-800 shadow-lg min-h-[400px]">
          {activeTab === 'general' && (
              <div className="space-y-6">
                  <div className="flex items-center gap-2 text-yellow-500 mb-4 pb-2 border-b border-gray-800">
                      <Type size={18} />
                      <h3 className="font-bold uppercase tracking-wide">Identidade do Evento</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-[#0f0f0f] p-4 rounded-xl border border-gray-800">
                          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Título Parte 1 (Branco)</label>
                          <input 
                              type="text" 
                              value={config.titlePart1}
                              onChange={(e) => handleConfigChange('titlePart1', e.target.value)}
                              className="w-full bg-black text-white p-3 rounded-lg border border-gray-700 focus:border-yellow-500 focus:outline-none font-bold"
                          />
                      </div>
                      <div className="bg-[#0f0f0f] p-4 rounded-xl border border-gray-800">
                          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Título Parte 2 (Dourado)</label>
                          <input 
                              type="text" 
                              value={config.titlePart2}
                              onChange={(e) => handleConfigChange('titlePart2', e.target.value)}
                              className="w-full bg-black text-yellow-500 p-3 rounded-lg border border-gray-700 focus:border-yellow-500 focus:outline-none font-bold"
                          />
                      </div>
                  </div>

                  <div className="bg-[#0f0f0f] p-4 rounded-xl border border-gray-800">
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Subtítulo / Descrição</label>
                      <input 
                          type="text" 
                          value={config.subtitle}
                          onChange={(e) => handleConfigChange('subtitle', e.target.value)}
                          className="w-full bg-black text-gray-300 p-3 rounded-lg border border-gray-700 focus:border-yellow-500 focus:outline-none tracking-widest uppercase text-xs font-bold"
                      />
                  </div>

                  {/* Preview */}
                  <div className="mt-8 p-6 bg-black rounded-2xl border border-gray-800 flex justify-center items-center">
                      <div className="text-center">
                          <h2 className="text-3xl font-black italic tracking-widest font-display leading-none text-white uppercase">
                              {config.titlePart1} <span className="text-yellow-500">{config.titlePart2}</span>
                          </h2>
                          <p className="text-[10px] text-gray-400 font-bold tracking-[0.2em] uppercase mt-2">{config.subtitle}</p>
                      </div>
                  </div>
              </div>
          )}

          {activeTab === 'facts' && <InputGroup keys={factKeys} />}
          {activeTab === 'dims' && <InputGroup keys={dimKeys} />}
      </div>

      {/* Action Bar */}
      <div className="sticky bottom-6 bg-[#000]/80 backdrop-blur-md p-4 rounded-xl border border-gray-800 flex justify-between items-center shadow-2xl z-50">
          <button 
            onClick={handleReset}
            className="px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-widest text-red-500 hover:bg-red-900/20 transition-colors flex items-center gap-2"
          >
             <RotateCcw size={16}/> Restaurar Padrões
          </button>

          <div className="flex items-center gap-4">
             {isSaved && <span className="text-green-500 text-xs font-bold animate-pulse flex items-center gap-1"><Check size={14}/> SALVO COM SUCESSO</span>}
             <button 
                onClick={handleSave}
                className="px-8 py-3 bg-yellow-500 hover:bg-yellow-400 text-black rounded-xl font-black text-sm uppercase tracking-widest shadow-lg shadow-yellow-500/20 hover:scale-105 transition-all flex items-center gap-2"
             >
                <Save size={18}/> Salvar Alterações
             </button>
          </div>
      </div>

    </div>
  );
};

export default Admin;
