
import { CSV_URLS, DEFAULT_CONFIG } from '../constants';
import { parseCSV } from '../utils/csvParser';
import { DashboardData, PlayerData, KillFeed, MatchDetails, CharacterData, TeamStats, TeamReference, WeaponData, SafeData, GenericDimData, AppConfig } from '../types';

// Helper to get active URLs (Local Storage > Constants)
export const getActiveUrls = () => {
  try {
    const saved = localStorage.getItem('MUNDIAL_DASHBOARD_URLS');
    if (saved) {
      return { ...CSV_URLS, ...JSON.parse(saved) };
    }
  } catch (e) {
    console.error("Error reading custom URLs", e);
  }
  return CSV_URLS;
};

// Helper to get App Config (Title/Subtitle)
export const getAppConfig = (): AppConfig => {
  try {
    const saved = localStorage.getItem('MUNDIAL_DASHBOARD_CONFIG');
    if (saved) {
      return { ...DEFAULT_CONFIG, ...JSON.parse(saved) };
    }
  } catch (e) {
    console.error("Error reading app config", e);
  }
  return DEFAULT_CONFIG;
};

// Helper to normalize dimension tables that might have different column names for the "Name" (e.g., Hab1 vs Pet)
const normalizeDim = (data: any[], keyName: string): GenericDimData[] => {
  return data.map(row => {
    // Strategy: Look for specific key first, then common fallbacks
    let name = row[keyName] || row[keyName.replace(/(\d)/, ' $1')]; // e.g. 'Hab1' or 'Hab 1'
    
    if (!name) {
        // Fallback checks for common header names in dimension tables (Case insensitive approach manually expanded)
        const possibleHeaders = [
            'Nome', 'Name', 'Personagem', 'Pet', 'Item', 'Arma', 'Safe', 'Habilidade',
            'NOME', 'NAME', 'PERSONAGEM', 'PET', 'ITEM', 'ARMA', 'SAFE', 'HABILIDADE'
        ];
        for (const h of possibleHeaders) {
            if (row[h]) {
                name = row[h];
                break;
            }
        }
    }
    
    // Strategy for Image
    let img = '';
    const possibleImgHeaders = [
        'IMG', 'Img', 'img', 'Imagem', 'URL', 'Url', 'url', 'Link',
        'IMAGEM', 'IMAGE', 'LINK' // Added Uppercase variants
    ];
    for (const h of possibleImgHeaders) {
        if (row[h]) {
            img = row[h];
            break;
        }
    }

    // fallback: if strict keyName didn't work but we have an image and a "Personagem" column, use that.
    return { Name: name || '', IMG: img || '' };
  }).filter(r => r.Name && r.Name.trim() !== '');
};

export const fetchDashboardData = async (): Promise<DashboardData> => {
  try {
    const activeUrls = getActiveUrls();

    const urls = [
      activeUrls.fPlayersDados,
      activeUrls.fKillFeed,
      activeUrls.fDetalhes,
      activeUrls.fPersonagens,
      activeUrls.dTime,
      activeUrls.dArma,
      activeUrls.dSafe,
      // New Dimensions
      activeUrls.dHab1,
      activeUrls.dHab2,
      activeUrls.dHab3,
      activeUrls.dHab4,
      activeUrls.dPets,
      activeUrls.dItem
    ];

    const responses = await Promise.all(urls.map(url => fetch(url).then(r => r.text())));
    
    // Parse base data
    const players = parseCSV<PlayerData>(responses[0]);
    const killFeed = parseCSV<KillFeed>(responses[1]);
    const details = parseCSV<MatchDetails>(responses[2]);
    
    // Manual mapping for Characters to handle flexible headers (Hab1 vs Hab 1, etc)
    const rawCharacters = parseCSV<any>(responses[3]);
    const characters: CharacterData[] = rawCharacters.map(row => ({
        Player: row['Player'] || row['Jogador'] || row['PLAYER'] || '',
        Time: row['Time'] || row['Equipe'] || row['TIME'] || '',
        Hab1: row['Hab1'] || row['Hab 1'] || '',
        Hab2: row['Hab2'] || row['Hab 2'] || '',
        Hab3: row['Hab3'] || row['Hab 3'] || '',
        Hab4: row['Hab4'] || row['Hab 4'] || '',
        Pet: row['Pet'] || '',
        Item: row['Item'] || '',
        Rd: row['Rd'] || row['RD'] || row['Rodada'] || '',
        Confronto: row['Confronto'] || row['CONFRONTO'] || '',
        Mapa: row['Mapa'] || row['MAPA'] || '',
        S: row['S'] || row['Partida'] || row['Quedas'] || ''
    })).filter(c => c.Player); // Ensure valid row

    const teamsReference = parseCSV<TeamReference>(responses[4]);
    
    // Robust mapping for Weapons
    const rawWeapons = parseCSV<any>(responses[5]);
    const weapons: WeaponData[] = rawWeapons.map(row => ({
      Arma: row['Arma'] || row['ARMA'] || row['Nome'] || '',
      IMG: row['IMG'] || row['Img'] || row['img'] || row['Imagem'] || row['IMAGEM'] || ''
    })).filter(w => w.Arma);

    // Robust mapping for Safes
    const rawSafes = parseCSV<any>(responses[6]);
    const safes: SafeData[] = rawSafes.map(row => ({
      Safe: row['Safe'] || row['SAFE'] || row['Nome'] || '',
      IMG: row['IMG'] || row['Img'] || row['img'] || row['Imagem'] || row['IMAGEM'] || ''
    })).filter(s => s.Safe);

    // Parse Dimensions
    const hab1Raw = parseCSV<any>(responses[7]);
    const hab2Raw = parseCSV<any>(responses[8]);
    const hab3Raw = parseCSV<any>(responses[9]);
    const hab4Raw = parseCSV<any>(responses[10]);
    const petsRaw = parseCSV<any>(responses[11]);
    const itemsRaw = parseCSV<any>(responses[12]);

    return {
      players,
      killFeed,
      details,
      characters,
      teamsReference,
      weapons,
      safes,
      // Normalize dimensions assuming the CSV column name matches the file concept (e.g. dHab1 -> column Hab1)
      hab1: normalizeDim(hab1Raw, 'Hab1'),
      hab2: normalizeDim(hab2Raw, 'Hab2'),
      hab3: normalizeDim(hab3Raw, 'Hab3'),
      hab4: normalizeDim(hab4Raw, 'Hab4'),
      pets: normalizeDim(petsRaw, 'Pet'),
      items: normalizeDim(itemsRaw, 'Item'),

      loading: false,
      lastUpdated: new Date()
    };
  } catch (error) {
    console.error("Error fetching data:", error);
    return {
      players: [],
      killFeed: [],
      details: [],
      characters: [],
      teamsReference: [],
      weapons: [],
      safes: [],
      hab1: [], hab2: [], hab3: [], hab4: [], pets: [], items: [],
      loading: false,
      lastUpdated: null
    };
  }
};

export const calculateTeamStats = (data: DashboardData): TeamStats[] => {
  const teamMap = new Map<string, TeamStats>();

  // Map for team images
  const teamImages = new Map<string, string>();
  data.teamsReference.forEach(t => {
    if (t.TIME && t.IMG) {
      teamImages.set(t.TIME, t.IMG);
    }
  });

  // Calculate strictly from fDetalhes
  data.details.forEach(row => {
    const teamName = row.TIME;
    // Strict check to remove blank lines
    if (!teamName || teamName.trim() === '') return;

    if (!teamMap.has(teamName)) {
      teamMap.set(teamName, {
        name: teamName,
        image: teamImages.get(teamName),
        s: 0,
        b: 0,
        ptsc: 0,
        abts: 0,
        pts: 0,
        avgAbts: 0,
        avgPts: 0,
        avgPtsc: 0,
        percentPos: 0,
        percentAbts: 0
      });
    }

    const stats = teamMap.get(teamName)!;
    
    // Parse ints
    const ptscVal = parseInt(row.PTSC) || parseInt((row as any)['PTS/C']) || 0;
    const ptsVal = parseInt(row.PTS) || 0;
    const abtsVal = parseInt(row.ABTS) || 0;
    const bVal = parseInt(row.B) || 0;
    const sVal = parseInt(row.S) || 0;

    stats.pts += ptsVal;
    stats.ptsc += ptscVal;
    stats.abts += abtsVal;
    stats.b += bVal;
    stats.s += sVal;
  });

  // Final Averages and Percentages
  const result: TeamStats[] = [];
  teamMap.forEach(stats => {
    if (stats.s > 0) {
      stats.avgAbts = parseFloat((stats.abts / stats.s).toFixed(2));
      stats.avgPts = parseFloat((stats.pts / stats.s).toFixed(2));
      stats.avgPtsc = parseFloat((stats.ptsc / stats.s).toFixed(2));
    }

    if (stats.pts > 0) {
      stats.percentPos = Math.round((stats.ptsc / stats.pts) * 100);
      stats.percentAbts = Math.round((stats.abts / stats.pts) * 100);
    }

    result.push(stats);
  });

  // Sort by Total PTS descending
  return result.sort((a, b) => b.pts - a.pts);
};
