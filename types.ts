
export interface RowData {
  Original: string;
  Duplicates: string;
}

export enum AnalysisStatus {
  SAME = "SAME",
  DIFFERENT = "DIFFERENT",
  ERROR = "ERROR",
}

export interface AnalysisResult extends RowData {
  status: AnalysisStatus;
  correctName?: string;
  errorMessage?: string;
}

export interface GroundingChunk {
  web?: {
    uri: string;
    title: string;
  };
  maps?: {
    uri: string;
    title: string;
  };
}
