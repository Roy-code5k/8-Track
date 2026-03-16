import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import DashboardPage from '../../pages/DashboardPage';
import SubjectsPage from '../../pages/SubjectsPage';
import ExamsPage from '../../pages/ExamsPage';
import FocusPage from '../../pages/FocusPage';

// Stub pages (filled in later phases)
const ComingSoon = ({ name, phase }) => (
    <div className="flex items-center justify-center h-full min-h-[400px]">
        <div className="text-center space-y-2">
            <p className="text-2xl font-bold text-white">{name}</p>
            <p style={{ color: 'hsl(240 5% 50%)' }}>Coming in Phase {phase} 🚀</p>
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
        <div className="flex min-h-screen" style={{ background: 'hsl(240 10% 6%)' }}>
            <Sidebar />
            <div className="flex flex-col flex-1 min-w-0">
                <TopBar title={title} />
                <main className="flex-1 overflow-auto p-6">
                    <Routes>
                        {/* Redirect bare / to /dashboard */}
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

            {/* Floating Action Button */}
            <button
                className="fixed bottom-6 right-6 w-14 h-14 rounded-full flex items-center justify-center text-2xl font-light shadow-2xl z-50 transition-transform hover:scale-110 active:scale-95"
                style={{ background: 'hsl(43 96% 56%)', color: 'hsl(240 5.9% 10%)' }}
                title="Quick Action"
            >
                +
            </button>
        </div>
    );
}
