import { useMemo } from 'react';
import type { SysDesignTopic, SysDesignQuizQuestion } from '../types';

import topicsData from '../data/sysdesign-topics.json';
import quizzesData from '../data/sysdesign-quizzes.json';

export function useSysDesignTopics(): SysDesignTopic[] {
  return topicsData as SysDesignTopic[];
}

export function useSysDesignTopic(slug: string): SysDesignTopic | null {
  return useMemo(() => {
    return (topicsData as SysDesignTopic[]).find(t => t.slug === slug) ?? null;
  }, [slug]);
}

export function useSysDesignQuizzes(topicSlug?: string): SysDesignQuizQuestion[] {
  return useMemo(() => {
    let qs = quizzesData as SysDesignQuizQuestion[];
    if (topicSlug && topicSlug !== 'mixed') {
      qs = qs.filter(q => q.topicSlug === topicSlug);
    }
    return qs;
  }, [topicSlug]);
}
