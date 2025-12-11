
import React from 'react';
import { Trophy, Flame } from 'lucide-react';
import { AppConfig } from '../types';

interface SplashScreenProps {
  config?: AppConfig;
}

const SplashScreen: React.FC<SplashScreenProps> = ({ config }) => {
  // Fallback if config is not yet loaded (though App handles this)
  const title1 = config?.titlePart1 || "MUNDIAL";
  const title2 = config?.titlePart2 || "2025";
  const sub = config?.subtitle || "Dashboard Competitivo";

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#050505] overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-yellow-900/20 via-[#050505] to-[#050505]"></div>
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-yellow-500 to-transparent opacity-50"></div>
      
      <div className="relative z-10 flex flex-col items-center animate-float">
        {/* Logo Container */}
        <div className="relative mb-8">
            <div className="absolute -inset-4 bg-yellow-600 rounded-full opacity-20 blur-xl animate-pulse"></div>
            <div className="relative bg-gradient-to-br from-[#2a1a05] to-[#000] p-6 rounded-2xl border border-yellow-500/30 shadow-[0_0_40px_rgba(234,179,8,0.3)]">
                <Trophy size={64} className="text-yellow-400" />
                <div className="absolute -bottom-2 -right-2 bg-yellow-500 rounded-full p-1.5 border-4 border-[#050505]">
                    <Flame size={16} className="text-black" fill="black"/>
                </div>
            </div>
        </div>

        {/* Text */}
        <h1 className="text-5xl md:text-7xl font-black italic text-transparent bg-clip-text bg-gradient-to-r from-white via-yellow-200 to-gray-400 tracking-wider font-display mb-2 drop-shadow-lg uppercase">
          {title1} {title2}
        </h1>
        <div className="flex items-center gap-3">
            <div className="h-[2px] w-12 bg-yellow-600"></div>
            <p className="text-yellow-500 tracking-[0.3em] text-sm md:text-base font-bold uppercase">
            {sub}
            </p>
            <div className="h-[2px] w-12 bg-yellow-600"></div>
        </div>
      </div>

      {/* Loading Bar */}
      <div className="relative z-10 mt-12 w-64 h-1 bg-gray-900 rounded-full overflow-hidden border border-gray-800">
        <div className="absolute top-0 left-0 h-full w-1/2 bg-yellow-500 shadow-[0_0_10px_#eab308] animate-[shimmer_1.5s_infinite_linear]"></div>
      </div>
      
      <div className="mt-4 text-xs text-gray-500 font-mono animate-pulse">
        CARREGANDO DADOS...
      </div>

      <style>{`
        @keyframes shimmer {
          0% { left: -50%; }
          100% { left: 100%; }
        }
      `}</style>
    </div>
  );
};

export default SplashScreen;
