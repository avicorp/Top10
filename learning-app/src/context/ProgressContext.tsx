import { createContext, useContext, useReducer, useEffect, useCallback, useRef, type ReactNode } from 'react';
import type { UserProgress, OwaspVersion, VulnerabilityProgress, QuizAttempt } from '../types';

const STORAGE_KEY = 'owasp-top10-progress';
const SCHEMA_VERSION = 1;
const DEBOUNCE_MS = 1000;

const defaultProgress: UserProgress = {
  schemaVersion: SCHEMA_VERSION,
  vulnerabilities: {},
  quizAttempts: [],
  theme: 'dark',
  lastVersion: '2025',
};

function loadProgress(): UserProgress {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultProgress;
    const parsed = JSON.parse(raw);
    if (parsed.schemaVersion !== SCHEMA_VERSION) return defaultProgress;
    return parsed;
  } catch {
    return defaultProgress;
  }
}

type Action =
  | { type: 'MARK_SECTION_READ'; slug: string; version: OwaspVersion; section: string }
  | { type: 'TOGGLE_BOOKMARK'; slug: string; version: OwaspVersion }
  | { type: 'SET_NOTE'; slug: string; version: OwaspVersion; note: string }
  | { type: 'RECORD_QUIZ'; attempt: QuizAttempt }
  | { type: 'SET_THEME'; theme: 'dark' | 'light' }
  | { type: 'SET_VERSION'; version: OwaspVersion }
  | { type: 'IMPORT_PROGRESS'; progress: UserProgress }
  | { type: 'RESET' };

function getVulnKey(slug: string, version: OwaspVersion) {
  return `${version}:${slug}`;
}

function reducer(state: UserProgress, action: Action): UserProgress {
  switch (action.type) {
    case 'MARK_SECTION_READ': {
      const key = getVulnKey(action.slug, action.version);
      const existing = state.vulnerabilities[key] || {
        slug: action.slug, version: action.version, sectionsRead: [], lastVisited: 0, bookmarked: false, notes: '',
      };
      if (existing.sectionsRead.includes(action.section)) {
        return { ...state, vulnerabilities: { ...state.vulnerabilities, [key]: { ...existing, lastVisited: Date.now() } } };
      }
      return {
        ...state,
        vulnerabilities: {
          ...state.vulnerabilities,
          [key]: { ...existing, sectionsRead: [...existing.sectionsRead, action.section], lastVisited: Date.now() },
        },
      };
    }
    case 'TOGGLE_BOOKMARK': {
      const key = getVulnKey(action.slug, action.version);
      const existing = state.vulnerabilities[key] || {
        slug: action.slug, version: action.version, sectionsRead: [], lastVisited: 0, bookmarked: false, notes: '',
      };
      return {
        ...state,
        vulnerabilities: { ...state.vulnerabilities, [key]: { ...existing, bookmarked: !existing.bookmarked } },
      };
    }
    case 'SET_NOTE': {
      const key = getVulnKey(action.slug, action.version);
      const existing = state.vulnerabilities[key] || {
        slug: action.slug, version: action.version, sectionsRead: [], lastVisited: 0, bookmarked: false, notes: '',
      };
      return {
        ...state,
        vulnerabilities: { ...state.vulnerabilities, [key]: { ...existing, notes: action.note } },
      };
    }
    case 'RECORD_QUIZ':
      return { ...state, quizAttempts: [...state.quizAttempts, action.attempt] };
    case 'SET_THEME':
      return { ...state, theme: action.theme };
    case 'SET_VERSION':
      return { ...state, lastVersion: action.version };
    case 'IMPORT_PROGRESS':
      return action.progress;
    case 'RESET':
      return defaultProgress;
    default:
      return state;
  }
}

interface ProgressContextValue {
  progress: UserProgress;
  dispatch: React.Dispatch<Action>;
  getVulnProgress: (slug: string, version: OwaspVersion) => VulnerabilityProgress | null;
  isRead: (slug: string, version: OwaspVersion) => boolean;
  exportProgress: () => string;
}

const ProgressContext = createContext<ProgressContextValue | null>(null);

export function ProgressProvider({ children }: { children: ReactNode }) {
  const [progress, dispatch] = useReducer(reducer, null, loadProgress);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Debounced save to localStorage
  useEffect(() => {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
    }, DEBOUNCE_MS);
    return () => { if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current); };
  }, [progress]);

  // Apply theme
  useEffect(() => {
    document.documentElement.classList.toggle('dark', progress.theme === 'dark');
  }, [progress.theme]);

  const getVulnProgress = useCallback((slug: string, version: OwaspVersion) => {
    const key = getVulnKey(slug, version);
    return progress.vulnerabilities[key] || null;
  }, [progress.vulnerabilities]);

  const isRead = useCallback((slug: string, version: OwaspVersion) => {
    const vp = getVulnProgress(slug, version);
    return vp ? vp.sectionsRead.length >= 2 : false;
  }, [getVulnProgress]);

  const exportProgress = useCallback(() => {
    return JSON.stringify(progress, null, 2);
  }, [progress]);

  return (
    <ProgressContext.Provider value={{ progress, dispatch, getVulnProgress, isRead, exportProgress }}>
      {children}
    </ProgressContext.Provider>
  );
}

export function useProgress() {
  const ctx = useContext(ProgressContext);
  if (!ctx) throw new Error('useProgress must be used within ProgressProvider');
  return ctx;
}
