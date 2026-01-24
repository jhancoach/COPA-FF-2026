import React from 'react';
import { Trophy, Flame } from 'lucide-react';
import { AppConfig } from '../types';

interface SplashScreenProps {
  config?: AppConfig;
}

const SplashScreen: React.FC<SplashScreenProps> = ({ config }) => {
  const title1 = config?.titlePart1 || "COPA FF";
  const title2 = config?.titlePart2 || "2026";
  const sub = config?.subtitle || "Elite Competitiva";

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#0a050a] overflow-hidden">
      {/* Background Effects baseados na imagem */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_#4b164c_0%,_#0a050a_100%)]"></div>
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#f97316] to-transparent opacity-50"></div>
      
      <div className="relative z-10 flex flex-col items-center animate-float">
        {/* Logo Container */}
        <div className="relative mb-8">
            <div className="absolute -inset-6 bg-[#f97316] rounded-full opacity-10 blur-2xl animate-pulse"></div>
            <div className="relative bg-gradient-to-br from-[#2d0a31] to-[#000] p-7 rounded-3xl border border-[#f97316]/40 shadow-[0_0_50px_rgba(249,115,22,0.3)]">
                <Trophy size={70} className="text-[#facc15]" />
                <div className="absolute -bottom-2 -right-2 bg-gradient-to-tr from-[#f97316] to-[#facc15] rounded-full p-2 border-4 border-[#0a050a]">
                    <Flame size={18} className="text-black" fill="black"/>
                </div>
            </div>
        </div>

        {/* Text */}
        <h1 className="text-6xl md:text-8xl font-black italic text-transparent bg-clip-text bg-gradient-to-r from-white via-[#facc15] to-[#f97316] tracking-tight font-display mb-2 drop-shadow-[0_5px_15px_rgba(0,0,0,0.5)] uppercase">
          {title1} {title2}
        </h1>
        <div className="flex items-center gap-4">
            <div className="h-[2px] w-16 bg-gradient-to-r from-transparent to-[#f97316]"></div>
            <p className="text-[#f97316] tracking-[0.4em] text-sm md:text-lg font-extrabold uppercase drop-shadow-sm">
            {sub}
            </p>
            <div className="h-[2px] w-16 bg-gradient-to-l from-transparent to-[#f97316]"></div>
        </div>
      </div>

      {/* Loading Bar */}
      <div className="relative z-10 mt-16 w-72 h-1.5 bg-gray-950 rounded-full overflow-hidden border border-white/5">
        <div className="absolute top-0 left-0 h-full w-1/3 bg-gradient-to-r from-[#701a75] via-[#f97316] to-[#facc15] shadow-[0_0_15px_#f97316] animate-[shimmer_2s_infinite_linear]"></div>
      </div>
      
      <div className="mt-5 text-[10px] text-gray-500 font-mono tracking-widest uppercase opacity-60">
        Iniciando Protocolo de Elite...
      </div>

      <style>{`
        @keyframes shimmer {
          0% { left: -100%; }
          100% { left: 100%; }
        }
      `}</style>
    </div>
  );
};

export default SplashScreen;