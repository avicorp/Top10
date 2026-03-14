import { Routes, Route, Navigate } from 'react-router-dom';
import AppShell from './components/layout/AppShell';
import SysDesignShell from './components/layout/SysDesignShell';
import DomainSelectorPage from './pages/DomainSelectorPage';
import HomePage from './pages/HomePage';
import VersionOverviewPage from './pages/VersionOverviewPage';
import VulnerabilityPage from './pages/VulnerabilityPage';
import QuizPage from './pages/QuizPage';
import ComparisonPage from './pages/ComparisonPage';
import ProgressPage from './pages/ProgressPage';
import SysDesignHomePage from './pages/sysdesign/SysDesignHomePage';
import TopicPage from './pages/sysdesign/TopicPage';
import SysDesignQuizSelectionPage from './pages/sysdesign/SysDesignQuizSelectionPage';
import SysDesignQuizPage from './pages/sysdesign/SysDesignQuizPage';
import InterviewListPage from './pages/sysdesign/InterviewListPage';
import InterviewSessionPage from './pages/sysdesign/InterviewSessionPage';

export default function App() {
  return (
    <Routes>
      {/* Domain Selector */}
      <Route path="/" element={<DomainSelectorPage />} />

      {/* OWASP domain */}
      <Route element={<AppShell />}>
        <Route path="/owasp" element={<HomePage />} />
        <Route path="/owasp/version/:version" element={<VersionOverviewPage />} />
        <Route path="/owasp/version/:version/:slug" element={<VulnerabilityPage />} />
        <Route path="/owasp/quiz" element={<QuizPage />} />
        <Route path="/owasp/quiz/:version" element={<QuizPage />} />
        <Route path="/owasp/quiz/:version/:slug" element={<QuizPage />} />
        <Route path="/owasp/compare" element={<ComparisonPage />} />
      </Route>

      {/* System Design domain */}
      <Route element={<SysDesignShell />}>
        <Route path="/sysdesign" element={<SysDesignHomePage />} />
        <Route path="/sysdesign/topic/:slug" element={<TopicPage />} />
        <Route path="/sysdesign/quiz" element={<SysDesignQuizSelectionPage />} />
        <Route path="/sysdesign/quiz/:slug" element={<SysDesignQuizPage />} />
        <Route path="/sysdesign/interview" element={<InterviewListPage />} />
        <Route path="/sysdesign/interview/:slug" element={<InterviewSessionPage />} />
      </Route>

      {/* Shared */}
      <Route element={<AppShell />}>
        <Route path="/progress" element={<ProgressPage />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
