
import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, Shield, Skull, RefreshCw, Menu, X, Printer, Download, Trophy, Settings } from 'lucide-react';
import { CSV_URLS } from '../constants';
import { AppConfig } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  onRefresh: () => void;
  loading: boolean;
  lastUpdated: Date | null;
  config: AppConfig;
}

const Layout: React.FC<LayoutProps> = ({ children, onRefresh, loading, lastUpdated, config }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  const navItems = [
    { name: 'Classificação', path: '/', icon: <LayoutDashboard size={20} /> },
    { name: 'Jogadores', path: '/players', icon: <Users size={20} /> },
    { name: 'Times', path: '/teams', icon: <Shield size={20} /> },
    { name: 'Killfeed', path: '/killfeed', icon: <Skull size={20} /> },
  ];

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
      const link = document.createElement('a');
      link.href = CSV_URLS.fDetalhes;
      link.setAttribute('download', 'Mundial2025_Dados.csv');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      alert("Download iniciado para os dados principais.");
  };

  return (
    <div className="min-h-screen text-gray-100 flex flex-col bg-transparent">
      {/* Navbar with Glassmorphism */}
      <nav className="glass sticky top-0 z-50 no-print">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-20 items-center">
            
            {/* Logo Section */}
            <div className="flex items-center gap-4 group cursor-default">
              <div className="relative">
                 <div className="absolute inset-0 bg-yellow-500 rounded-xl blur opacity-30 group-hover:opacity-60 transition-opacity duration-500"></div>
                 <div className="relative bg-[#0f0f11] p-2.5 rounded-xl border border-yellow-500/30">
                    <Trophy className="text-yellow-400" size={26} />
                 </div>
              </div>
              <div className="flex flex-col">
                <h1 className="text-2xl font-black italic tracking-widest font-display leading-none text-white drop-shadow-md uppercase">
                  {config.titlePart1} <span className="text-yellow-500">{config.titlePart2}</span>
                </h1>
                <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse"></span>
                    <p className="text-[10px] text-gray-400 font-bold tracking-[0.2em] uppercase">{config.subtitle}</p>
                </div>
              </div>
            </div>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center space-x-2 bg-[#000]/40 p-1.5 rounded-xl border border-white/5 backdrop-blur-sm">
              {navItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold transition-all duration-300 font-display uppercase tracking-wide ${
                      isActive
                        ? 'bg-yellow-500 text-black shadow-[0_0_20px_rgba(234,179,8,0.5)] scale-105'
                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                    }`
                  }
                >
                  {item.icon}
                  {item.name}
                </NavLink>
              ))}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-4">
               {/* Last Updated */}
               {lastUpdated && (
                <div className="hidden xl:flex flex-col items-end mr-2">
                    <span className="text-[9px] text-gray-500 uppercase tracking-wider font-bold">Última Atualização</span>
                    <span className="text-xs text-yellow-500 font-mono font-bold">{lastUpdated.toLocaleTimeString()}</span>
                </div>
              )}

              {/* Tools Group */}
              <div className="flex items-center bg-[#0f0f11]/80 rounded-xl border border-white/10 p-1">
                  <button
                    onClick={handlePrint}
                    title="Imprimir / Relatório"
                    className="p-2.5 text-gray-400 hover:text-yellow-400 hover:bg-white/5 rounded-lg transition-colors"
                  >
                    <Printer size={18} />
                  </button>
                  <div className="w-px h-4 bg-white/10 mx-1"></div>
                  <button
                    onClick={handleExportCSV}
                    title="Baixar Dados"
                    className="p-2.5 text-gray-400 hover:text-yellow-400 hover:bg-white/5 rounded-lg transition-colors"
                  >
                    <Download size={18} />
                  </button>
                  <div className="w-px h-4 bg-white/10 mx-1"></div>
                  <NavLink
                    to="/admin"
                    title="Configurações (Admin)"
                    className={({ isActive }) => `p-2.5 rounded-lg transition-colors ${isActive ? 'text-yellow-500 bg-white/5' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                  >
                    <Settings size={18} />
                  </NavLink>
              </div>

              <button
                onClick={onRefresh}
                disabled={loading}
                className={`flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-yellow-600 to-yellow-500 hover:from-yellow-500 hover:to-yellow-400 text-black rounded-xl font-bold text-sm transition-all shadow-[0_0_20px_rgba(234,179,8,0.2)] border border-yellow-400/20 ${loading ? 'opacity-70 cursor-not-allowed' : 'hover:scale-105 active:scale-95'}`}
              >
                <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                <span className="hidden sm:inline font-display uppercase tracking-wide">{loading ? '...' : 'Atualizar'}</span>
              </button>

              <div className="md:hidden">
                <button
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  className="text-gray-300 hover:text-white p-2"
                >
                  {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-[#0f0f11] border-b border-gray-800 animate-in slide-in-from-top-2">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
              {navItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 block px-4 py-3 rounded-lg text-base font-bold font-display uppercase ${
                      isActive
                        ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/30'
                        : 'text-gray-400 hover:bg-white/5 hover:text-white'
                    }`
                  }
                >
                  {item.icon}
                  {item.name}
                </NavLink>
              ))}
              <div className="pt-4 border-t border-gray-800 mt-2 flex gap-3 px-3">
                  <button 
                    onClick={handlePrint}
                    className="flex-1 flex justify-center items-center gap-2 py-3 bg-gray-800 rounded-lg text-sm font-bold text-gray-300 hover:bg-gray-700"
                  >
                      <Printer size={18}/> Relatório
                  </button>
                  <button 
                    onClick={handleExportCSV}
                    className="flex-1 flex justify-center items-center gap-2 py-3 bg-gray-800 rounded-lg text-sm font-bold text-gray-300 hover:bg-gray-700"
                  >
                      <Download size={18}/> Dados
                  </button>
                  <NavLink
                    to="/admin"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex-1 flex justify-center items-center gap-2 py-3 bg-gray-800 rounded-lg text-sm font-bold text-gray-300 hover:bg-gray-700"
                  >
                      <Settings size={18}/> Admin
                  </NavLink>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 relative">
        {children}
      </main>
      
      {/* Footer */}
      <footer className="border-t border-white/5 py-6 mt-8 bg-black/20 no-print">
        <div className="max-w-7xl mx-auto px-4 text-center text-gray-500 text-xs font-mono flex flex-col items-center gap-2">
            <span>&copy; 2025 {config.titlePart1} {config.titlePart2} DASHBOARD.</span>
            <div className="flex gap-2 text-[10px] text-gray-600 uppercase">
                <span>Dúvida Zero</span>
                <span>•</span>
                <span>Brilho Máximo</span>
            </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
