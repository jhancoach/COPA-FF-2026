
export interface PlayerData {
  PLAYER: string; 
  TIME: string;   
  S: string;      
  Abates: string;
  MAPA?: string;
  RD?: string;
}

export interface KillFeed {
  PLAYER: string;
  VITIMA: string;
  ARMA: string;
  CONFRONTO: string;
  MAPA: string;
  RD: string;
  SAFE: string;
  Tempo?: string;
}

export interface MatchDetails {
  TIME: string;
  MAPA: string;
  RD: string;
  CONFRONTO: string;
  PTS: string;
  PTSC: string; 
  POS: string;
  ABTS: string;
  B: string;
  S: string;
}

export interface CharacterData {
  Player: string;
  Time: string;
  Hab1: string;
  Hab2: string;
  Hab3: string;
  Hab4: string;
  Pet: string;
  Item: string;
  Rd: string;        // Added
  Confronto: string; // Added
  Mapa: string;      // Added
  S: string;         // Added
}

export interface TeamReference {
  TIME: string;
  IMG?: string;
}

export interface WeaponData {
  Arma: string;
  IMG: string;
}

export interface SafeData {
  Safe: string;
  IMG: string;
}

export interface GenericDimData {
  Name: string; 
  IMG: string;
}

// Configuration Interface
export interface AppConfig {
  titlePart1: string;
  titlePart2: string;
  subtitle: string;
}

// Global State Interface
export interface DashboardData {
  players: PlayerData[];
  killFeed: KillFeed[];
  details: MatchDetails[];
  characters: CharacterData[];
  teamsReference: TeamReference[];
  weapons: WeaponData[];
  safes: SafeData[];
  // Dimensions
  hab1: GenericDimData[];
  hab2: GenericDimData[];
  hab3: GenericDimData[];
  hab4: GenericDimData[];
  pets: GenericDimData[];
  items: GenericDimData[];
  
  loading: boolean;
  lastUpdated: Date | null;
}

export interface TeamStats {
  name: string;
  image?: string;
  s: number; // Partidas
  b: number; // Booyahs
  ptsc: number; // Pontos de colocação
  abts: number; // Abates
  pts: number; // Pontos Totais
  
  avgAbts: number;
  avgPts: number;
  avgPtsc: number;
  
  percentPos: number;
  percentAbts: number;
}
