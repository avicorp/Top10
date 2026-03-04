import { Routes, Route, Navigate } from 'react-router-dom';
import AppShell from './components/layout/AppShell';
import HomePage from './pages/HomePage';
import VersionOverviewPage from './pages/VersionOverviewPage';
import VulnerabilityPage from './pages/VulnerabilityPage';
import QuizPage from './pages/QuizPage';
import ComparisonPage from './pages/ComparisonPage';
import ProgressPage from './pages/ProgressPage';

export default function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/version/:version" element={<VersionOverviewPage />} />
        <Route path="/version/:version/:slug" element={<VulnerabilityPage />} />
        <Route path="/quiz" element={<QuizPage />} />
        <Route path="/quiz/:version" element={<QuizPage />} />
        <Route path="/quiz/:version/:slug" element={<QuizPage />} />
        <Route path="/compare" element={<ComparisonPage />} />
        <Route path="/progress" element={<ProgressPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
