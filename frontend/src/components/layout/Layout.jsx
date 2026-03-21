import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import DashboardPage from '../../pages/DashboardPage';
import SubjectsPage from '../../pages/SubjectsPage';
import ExamsPage from '../../pages/ExamsPage';
import FocusPage from '../../pages/FocusPage';
import AttendancePage from '../../pages/AttendancePage';
import AttendanceSummaryPage from '../../pages/AttendanceSummaryPage';
import AssignmentsPage from '../../pages/AssignmentsPage';
import ProgressPage from '../../pages/ProgressPage';

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
                        <Route path="attendance" element={<AttendanceSummaryPage />} />
                        <Route path="attendance/:id" element={<AttendancePage />} />
                        <Route path="assignments" element={<AssignmentsPage />} />
                        <Route path="exams" element={<ExamsPage />} />
                        <Route path="progress" element={<ProgressPage />} />
                        <Route path="focus" element={<FocusPage />} />
                        <Route path="subjects" element={<SubjectsPage />} />
                    </Routes>
                </main>
            </div>
        </div>
    );
}

