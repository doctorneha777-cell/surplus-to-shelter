export interface AnalysisResult {
  cropName: string;
  healthStatus: string;
  likelyDisease: string;
  confidencePercentage: number;
  severity: string;
  symptoms: string[];
  recommendations: string[];
}

export interface Disease {
  id: number;
  name: string;
  symptoms: string[];
  causes: string[];
  preventionTips: string[];
}

export interface ApiResponse<T> {
  data: T;
  message: string;
  success: boolean;
}