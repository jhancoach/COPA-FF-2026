
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

// Helper to normalize dimension tables
const normalizeDim = (data: any[], keyName: string): GenericDimData[] => {
  return data.map(row => {
    let name = row[keyName] || row[keyName.replace(/(\d)/, ' $1')]; 
    
    if (!name) {
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
    
    let img = '';
    const possibleImgHeaders = [
        'IMG', 'Img', 'img', 'Imagem', 'URL', 'Url', 'url', 'Link',
        'IMAGEM', 'IMAGE', 'LINK'
    ];
    for (const h of possibleImgHeaders) {
        if (row[h]) {
            img = row[h];
            break;
        }
    }

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
      activeUrls.dHab1,
      activeUrls.dHab2,
      activeUrls.dHab3,
      activeUrls.dHab4,
      activeUrls.dPets,
      activeUrls.dItem
    ];

    const responses = await Promise.all(urls.map(url => fetch(url).then(r => r.text())));
    
    // Parse players (Fonte A)
    const rawPlayers = parseCSV<any>(responses[0]);
    const players: PlayerData[] = rawPlayers.map(row => ({
        PLAYER: row['PLAYER'] || row['Player'] || row['Jogador'] || '',
        TIME: row['TIME'] || row['Time'] || row['Equipe'] || '',
        S: row['S'] || row['Partida'] || row['Quedas'] || '',
        Abates: row['ABATES'] || row['Abates'] || row['Kills'] || row['KILLS'] || row['ABTS'] || '0',
        MAPA: (row['MAPA'] || row['Mapa'] || row['Map'] || '').trim(),
        RD: (row['RD'] || row['Rd'] || row['Rodada'] || row['Round'] || '').trim(),
        Q: (row['Q'] || row['QUEDA'] || row['Queda'] || '').trim() || (row['S'] || '').trim()
    })).filter(p => p.PLAYER);

    // Parse KillFeed (Fonte B)
    const rawKillFeed = parseCSV<any>(responses[1]);
    const killFeed: KillFeed[] = rawKillFeed.map(row => ({
        PLAYER: row['PLAYER'] || row['Player'] || row['Killer'] || row['Matador'] || '',
        VITIMA: row['VITIMA'] || row['Vitima'] || row['Victim'] || '',
        ARMA: row['ARMA'] || row['Arma'] || row['Weapon'] || '',
        CONFRONTO: row['CONFRONTO'] || row['Confronto'] || '',
        MAPA: (row['MAPA'] || row['Mapa'] || row['Map'] || '').trim(),
        RD: (row['RD'] || row['Rd'] || row['Rodada'] || row['Round'] || '').trim(),
        Q: (row['Q'] || row['QUEDA'] || row['Queda'] || '').trim(),
        SAFE: row['SAFE'] || row['Safe'] || ''
    })).filter(k => k.PLAYER);

    // Parse Detalhes (Fonte C)
    const rawDetails = parseCSV<any>(responses[2]);
    const details: MatchDetails[] = rawDetails.map(row => ({
        TIME: row['TIME'] || row['Time'] || '',
        MAPA: (row['MAPA'] || row['Mapa'] || '').trim(),
        RD: (row['RD'] || row['Rd'] || row['Rodada'] || row['Round'] || '').trim(),
        CONFRONTO: row['CONFRONTO'] || row['Confronto'] || '',
        PTS: row['PTS'] || '0',
        PTSC: row['PTSC'] || row['PTS/C'] || '0',
        POS: row['POS'] || '0',
        ABTS: row['ABTS'] || '0',
        B: row['B'] || '0',
        S: row['S'] || '1',
        Q: (row['Q'] || row['QUEDA'] || row['Queda'] || row['S'] || '').trim()
    })).filter(d => d.TIME);
    
    // Parse Personagens (Fonte D)
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
        Rd: (row['Rd'] || row['RD'] || row['Rodada'] || '').trim(),
        Confronto: row['Confronto'] || row['CONFRONTO'] || '',
        Mapa: (row['Mapa'] || row['MAPA'] || '').trim(),
        S: (row['S'] || row['Partida'] || row['Quedas'] || row['Q'] || '').trim()
    })).filter(c => c.Player);

    const teamsReference = parseCSV<TeamReference>(responses[4]);
    
    const rawWeapons = parseCSV<any>(responses[5]);
    const weapons: WeaponData[] = rawWeapons.map(row => ({
      Arma: row['Arma'] || row['ARMA'] || row['Nome'] || '',
      IMG: row['IMG'] || row['Img'] || row['img'] || row['Imagem'] || row['IMAGEM'] || ''
    })).filter(w => w.Arma);

    const rawSafes = parseCSV<any>(responses[6]);
    const safes: SafeData[] = rawSafes.map(row => ({
      Safe: row['Safe'] || row['SAFE'] || row['Nome'] || '',
      IMG: row['IMG'] || row['Img'] || row['img'] || row['Imagem'] || row['IMAGEM'] || ''
    })).filter(s => s.Safe);

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
  const teamImages = new Map<string, string>();
  data.teamsReference.forEach(t => {
    if (t.TIME && t.IMG) {
      teamImages.set(t.TIME, t.IMG);
    }
  });

  data.details.forEach(row => {
    const teamName = row.TIME;
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
    const ptscVal = parseInt(row.PTSC) || 0;
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

  return result.sort((a, b) => b.pts - a.pts);
};
