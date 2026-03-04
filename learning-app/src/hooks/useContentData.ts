import { useMemo } from 'react';
import type { OwaspVersion, Vulnerability, VersionMapping, QuizQuestion } from '../types';

import content2025 from '../data/content-2025.json';
import content2021 from '../data/content-2021.json';
import content2017 from '../data/content-2017.json';
import versionMap from '../data/version-map.json';
import quizzes from '../data/quizzes.json';

const contentMap: Record<OwaspVersion, { version: string; vulnerabilities: Vulnerability[] }> = {
  '2025': content2025 as any,
  '2021': content2021 as any,
  '2017': content2017 as any,
};

export function useVersionData(version: OwaspVersion): Vulnerability[] {
  return useMemo(() => contentMap[version]?.vulnerabilities ?? [], [version]);
}

export function useVulnerability(version: OwaspVersion, slug: string): Vulnerability | null {
  const vulns = useVersionData(version);
  return useMemo(() => vulns.find(v => v.slug === slug) ?? null, [vulns, slug]);
}

export function useAllVulnerabilities(): Vulnerability[] {
  return useMemo(() => [
    ...(content2025 as any).vulnerabilities,
    ...(content2021 as any).vulnerabilities,
    ...(content2017 as any).vulnerabilities,
  ], []);
}

export function useVersionMap(): VersionMapping[] {
  return versionMap as VersionMapping[];
}

export function useQuizQuestions(version?: OwaspVersion | 'cross-version', slug?: string): QuizQuestion[] {
  return useMemo(() => {
    let qs = quizzes as QuizQuestion[];
    if (version) qs = qs.filter(q => q.version === version);
    if (slug) qs = qs.filter(q => q.vulnerabilitySlug === slug);
    return qs;
  }, [version, slug]);
}
