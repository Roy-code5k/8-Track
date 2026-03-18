import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import DashboardPage from '../../pages/DashboardPage';
import SubjectsPage from '../../pages/SubjectsPage';
import ExamsPage from '../../pages/ExamsPage';
import FocusPage from '../../pages/FocusPage';
import { Plus } from 'lucide-react';

// Stub pages (filled in later phases)
const ComingSoon = ({ name, phase }) => (
    <div className="flex items-center justify-center h-full min-h-[400px]">
        <div className="text-center space-y-2">
            <p className="text-2xl font-bold text-white">{name}</p>
            <p className="text-[15px] font-medium" style={{ color: 'var(--text-muted)' }}>Coming in Phase {phase} 🚀</p>
        </div>
    </div>
);

const PAGE_TITLES = {
    '/dashboard': 'Dashboard',
    '/attendance': 'Attendance',
    '/assignments': 'Assignments',
    '/exams': 'Exams',
    '/progress': 'My Progress',
    '/focus': 'Focus Mode',
    '/subjects': 'Subjects',
};

export default function Layout() {
    const { pathname } = useLocation();
    const title = PAGE_TITLES[pathname] || 'Dashboard';

    return (
        <div className="flex min-h-screen" style={{ background: 'var(--main-bg)' }}>
            <Sidebar />
            <div className="flex flex-col flex-1 min-w-0">
                <TopBar title={title} />
                <main className="flex-1 overflow-auto px-10 py-8">
                    <Routes>
                        <Route index element={<Navigate to="/dashboard" replace />} />
                        <Route path="dashboard" element={<DashboardPage />} />
                        <Route path="attendance" element={<ComingSoon name="Attendance" phase="3" />} />
                        <Route path="assignments" element={<ComingSoon name="Assignments" phase="4" />} />
                        <Route path="exams" element={<ExamsPage />} />
                        <Route path="progress" element={<ComingSoon name="My Progress" phase="6" />} />
                        <Route path="focus" element={<FocusPage />} />
                        <Route path="subjects" element={<SubjectsPage />} />
                    </Routes>
                </main>
            </div>

            {/* Global Floating Action Button */}
            <button className="fixed bottom-10 right-10 w-16 h-16 rounded-full flex items-center justify-center shadow-[0_8px_24px_rgba(232,168,56,0.3)] z-50 transition-all hover:scale-110 active:scale-95 group overflow-hidden"
                style={{ background: 'var(--primary-accent)' }}
                title="Quick Action"
            >
                <Plus className="w-8 h-8 text-[#0F0F13] transition-transform group-hover:rotate-90" />
                <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity" />
            </button>
        </div>
    );
}

