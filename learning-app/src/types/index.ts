export type OwaspVersion = '2017' | '2021' | '2025';

export interface ScoreData {
  cwes_mapped: number;
  max_incidence_rate: string;
  avg_incidence_rate: string;
  max_coverage: string;
  avg_coverage: string;
  avg_weighted_exploit: string;
  avg_weighted_impact: string;
  total_occurrences: string;
  total_cves: string;
}

export interface RiskRating {
  exploitability: number;
  prevalence: number;
  detectability: number;
  technical_impact: number;
}

export interface VulnerabilitySection {
  html: string;
  plainText: string;
}

export interface AttackScenario {
  title: string;
  description: string;
  codeBlocks: CodeBlock[];
}

export interface CodeBlock {
  language: string;
  code: string;
  label?: string;
}

export interface Reference {
  title: string;
  url: string;
  category: 'owasp' | 'external';
}

export interface CweMapping {
  id: number;
  name: string;
  url: string;
}

export interface Vulnerability {
  id: string;
  version: OwaspVersion;
  code: string;
  title: string;
  slug: string;
  rank: number;
  iconPath: string | null;
  backgroundHtml: string | null;
  scoreData: ScoreData | null;
  riskRating: RiskRating | null;
  description: VulnerabilitySection;
  prevention: VulnerabilitySection;
  attackScenarios: AttackScenario[];
  references: Reference[];
  cweMappings: CweMapping[];
}

export interface VersionData {
  version: OwaspVersion;
  vulnerabilities: Vulnerability[];
}

export interface VersionMapping {
  concept: string;
  '2017': string | null;
  '2021': string | null;
  '2025': string | null;
}

// Quiz types
export type QuestionType = 'multiple_choice' | 'true_false' | 'scenario_based' | 'code_review';
export type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced';

export interface QuizQuestion {
  id: string;
  type: QuestionType;
  difficulty: DifficultyLevel;
  version: OwaspVersion | 'cross-version';
  vulnerabilitySlug: string | null;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  codeSnippet?: string;
}

export interface QuizSet {
  version: OwaspVersion | 'cross-version';
  vulnerabilitySlug: string | null;
  questions: QuizQuestion[];
}

// Progress types
export interface VulnerabilityProgress {
  slug: string;
  version: OwaspVersion;
  sectionsRead: string[];
  lastVisited: number;
  bookmarked: boolean;
  notes: string;
}

export interface QuizAttempt {
  quizId: string;
  score: number;
  total: number;
  timestamp: number;
  answers: number[];
}

export interface UserProgress {
  schemaVersion: number;
  vulnerabilities: Record<string, VulnerabilityProgress>;
  quizAttempts: QuizAttempt[];
  theme: 'dark' | 'light';
  lastVersion: OwaspVersion;
}
