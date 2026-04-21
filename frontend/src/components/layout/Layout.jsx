import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { WifiOff } from 'lucide-react';
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
import SettingsPage from '../../pages/SettingsPage';

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
    '/settings': 'Settings',
};

export default function Layout() {
    const { pathname } = useLocation();
    const title = PAGE_TITLES[pathname] || 'Dashboard';
    const [isOnline, setIsOnline] = useState(navigator.onLine);

    useEffect(() => {
        const handleStatus = () => setIsOnline(navigator.onLine);
        window.addEventListener('online', handleStatus);
        window.addEventListener('offline', handleStatus);
        return () => {
            window.removeEventListener('online', handleStatus);
            window.removeEventListener('offline', handleStatus);
        };
    }, []);

    return (
        <div className="flex min-h-screen" style={{ background: 'var(--main-bg)' }}>
            <Sidebar />
            <div className="flex flex-col flex-1 min-w-0">
                {!isOnline && (
                    <div className="bg-[#E8A838] text-black py-2 px-6 flex items-center justify-center gap-3 animate-in slide-in-from-top duration-300 z-[100]">
                        <WifiOff className="w-4 h-4" />
                        <span className="text-[13px] font-black tracking-widest uppercase">
                            You are offline • Tasks will be queued until connection returns
                        </span>
                    </div>
                )}
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
                        <Route path="settings" element={<SettingsPage />} />
                    </Routes>
                </main>
            </div>
        </div>
    );
}

