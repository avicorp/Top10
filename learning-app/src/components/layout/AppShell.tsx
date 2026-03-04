import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import Sidebar from './Sidebar';

export default function AppShell() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen dark:bg-slate-900 dark:text-slate-100 bg-slate-50 text-slate-900">
      <a href="#main-content" className="skip-link">Skip to content</a>
      <Header onToggleSidebar={() => setSidebarOpen(prev => !prev)} />
      <div className="flex">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main id="main-content" className="flex-1 min-w-0" tabIndex={-1}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
