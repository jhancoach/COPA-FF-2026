
import React, { useState, useEffect, useCallback } from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Leaderboard from './pages/Leaderboard';
import Players from './pages/Players';
import Teams from './pages/Teams';
import KillFeedPage from './pages/KillFeedPage';
import Admin from './pages/Admin';
import SplashScreen from './components/SplashScreen';
import { fetchDashboardData, getAppConfig } from './services/dataService';
import { DashboardData } from './types';
import { DEFAULT_CONFIG } from './constants';

const App: React.FC = () => {
  const [data, setData] = useState<DashboardData>({
    players: [],
    killFeed: [],
    details: [],
    characters: [],
    teamsReference: [],
    weapons: [],
    safes: [],
    hab1: [],
    hab2: [],
    hab3: [],
    hab4: [],
    pets: [],
    items: [],
    loading: true,
    lastUpdated: null
  });

  const [config, setConfig] = useState(DEFAULT_CONFIG);
  const [showSplash, setShowSplash] = useState(true);

  const loadData = useCallback(async () => {
    // 1. Refresh Config
    setConfig(getAppConfig());

    setData(prev => ({ ...prev, loading: true }));
    
    // 2. Fetch Data
    const newData = await fetchDashboardData();
    
    // Update data immediately
    setData(newData);
    
    // Hide splash screen with a small buffer for smooth transition if it's showing
    if (showSplash) {
        setTimeout(() => {
            setShowSplash(false);
        }, 800); 
    }
  }, [showSplash]);

  useEffect(() => {
    loadData();
  }, []); // Run once on mount

  if (showSplash) {
      return <SplashScreen config={config} />;
  }

  return (
    <HashRouter>
      <Layout onRefresh={loadData} loading={data.loading} lastUpdated={data.lastUpdated} config={config}>
        <Routes>
          <Route path="/" element={<Leaderboard data={data} />} />
          <Route path="/players" element={<Players data={data} />} />
          <Route path="/teams" element={<Teams data={data} />} />
          <Route path="/killfeed" element={<KillFeedPage data={data} />} />
          <Route path="/admin" element={<Admin onRefresh={loadData} />} />
        </Routes>
      </Layout>
    </HashRouter>
  );
};

export default App;
