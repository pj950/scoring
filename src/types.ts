export interface Team {
  id: string;
  name: string;
}

export interface Judge {
  id:string;
  name: string;
  secret_id: string;
}

export interface Criterion {
  id: string;
  name: string;
  max_score: number;
}

export interface Score {
  teamId: string;
  judgeId: string;
  scores: Record<string, number>;
}

export interface AppData {
  teams?: Team[];
  judges?: Judge[];
  criteria?: Criterion[];
  scores?: Score[];
  activeTeamId?: string | null;
}

export interface FinalScore {
  teamId: string;
  teamName: string;
  weightedScore: number;
  rank: number;
}
