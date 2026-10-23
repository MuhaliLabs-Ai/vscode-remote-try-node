export type SessionStatus =
  | 'idle'
  | 'requesting_permission'
  | 'listening'
  | 'processing'
  | 'answer_ready'
  | 'paused'
  | 'error'
  | 'ended';

export type QuestionType =
  | 'technical'
  | 'behavioural'
  | 'coding'
  | 'architecture'
  | 'security'
  | 'troubleshooting'
  | 'general';

export interface TranscriptSegment {
  id: string;
  text: string;
  timestamp: number;
  isFinal: boolean;
  confidence?: number;
  speaker?: 'interviewer' | 'candidate' | 'assistant' | 'unknown';
}

export interface SourceReference {
  title: string;
  url: string;
  domain: string;
  excerpt: string;
  verificationStatus: 'verified_doc' | 'consensus' | 'unverified';
}

export interface VisualizationModel {
  type:
    | 'architecture'
    | 'flowchart'
    | 'decision_tree'
    | 'comparison'
    | 'coding'
    | 'star'
    | 'security_threat'
    | 'sequence'
    | 'summary';
  title: string;
  description: string;
  data: any;
}

export interface AnswerModel {
  id: string;
  question: string;
  questionType: QuestionType;
  quickAnswer: string;
  talkingPoints: string[];
  explanation: string;
  tradeoffs: string[];
  visualization: VisualizationModel | null;
  followUps: string[];
  sources: SourceReference[];
  verificationStatus: 'verified_doc' | 'consensus' | 'unverified';
  uncertainties: string[];
  timestamp: number;
  searchGrounded?: boolean;
  webSearchQueries?: string[];
  personalizedProjectContext?: string;
  generationMode?: 'ai' | 'local_fallback';
}

export type WidgetCorner =
  | 'bottom-right'
  | 'bottom-left'
  | 'top-right'
  | 'top-left'
  | 'custom';

export interface WidgetPosition {
  x: number;
  y: number;
}

export interface WidgetPreferences {
  theme: 'dark' | 'light';
  corner: WidgetCorner;
  customPosition: WidgetPosition | null;
  autoDetectQuestions: boolean;
  soundAlerts: boolean;
  fontSize: 'compact' | 'normal' | 'relaxed';
  isMinimized: boolean;
  showTranscriptPanel: boolean;
  useGoogleSearchGrounding: boolean;
  voiceMode: boolean;
  voicePersona: 'Zephyr' | 'Kore' | 'Fenrir' | 'Puck' | 'Charon';
}

export interface CandidateProfile {
  name: string;
  targetRole: string;
  yearsOfExperience: number;
  primarySkills: string[];
  cloudPlatforms: string[];
  frameworks: string[];
  verifiedProjects: Array<{
    id: string;
    title: string;
    role: string;
    techStack: string;
    architectureSummary: string;
    measurableOutcome: string;
  }>;
  leadershipHighlights: string[];
}

export interface MockEvaluationResult {
  score: number;
  evaluationMode?: 'ai' | 'heuristic';
  feedback: string;
  rubricScores: {
    clarityAndStructure: number;
    technicalDepth: number;
    tradeoffsArticulation: number;
    productionReadiness: number;
  };
  strengths: string[];
  improvements: string[];
}

export interface ReadinessMetrics {
  topicCoverage: {
    systemDesign: number;
    azureDotNetCloud: number;
    codingAlgorithms: number;
    securityZeroTrust: number;
    behavioralLeadership: number;
  };
  totalQuestionsAnswered: number;
  averageConfidence: number;
  revisionItems: string[];
}
