import { NavLink, useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import {
    LayoutDashboard, CalendarCheck, ClipboardList,
    GraduationCap, TrendingUp, Timer, BookOpen, Zap, LogOut
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import api from '../../lib/api';

const NAV_ITEMS = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/attendance', icon: CalendarCheck, label: 'Attendance' },
    { to: '/assignments', icon: ClipboardList, label: 'Assignments' },
    { to: '/exams', icon: GraduationCap, label: 'Exams' },
    { to: '/progress', icon: TrendingUp, label: 'My Progress' },
    { to: '/focus', icon: Timer, label: 'Focus Mode' },
    { to: '/subjects', icon: BookOpen, label: 'Subjects' },
];

export default function Sidebar() {
    const user = useAuthStore((s) => s.user);
    const logout = useAuthStore((s) => s.logout);
    const navigate = useNavigate();

    const logoutMutation = useMutation({
        mutationFn: () => api.post('/auth/logout'),
        onSettled: () => { logout(); navigate('/auth'); },
    });

    return (
        <aside className="flex flex-col justify-between w-[200px] min-h-screen py-6 px-4 flex-shrink-0 dot-matrix"
            style={{ background: 'var(--sidebar-bg)', borderRight: '1px solid var(--active-highlight)' }}>

            <div>
                {/* Logo */}
                <div className="flex items-center gap-3 px-2 mb-8">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-xl flex-shrink-0"
                        style={{ background: 'var(--primary-accent)', color: 'var(--sidebar-bg)' }}>
                        8
                    </div>
                    <span className="font-bold text-xl text-white tracking-tight">8Track</span>
                </div>

                {/* User profile */}
                <div className="flex items-center gap-3 px-2 mb-8">
                    <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0 border-2 border-[var(--active-highlight)]">
                        <img 
                            src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.name || 'User'}`} 
                            alt="Avatar" 
                            className="w-full h-full object-cover"
                        />
                    </div>
                    <div className="overflow-hidden">
                        <p className="text-[14px] font-bold text-[var(--text-warm)] truncate leading-tight">{user?.name || ''}</p>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="space-y-1">
                    {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
                        <NavLink key={to} to={to}
                            className={({ isActive }) =>
                                `flex items-center gap-3 px-4 py-2.5 rounded-xl text-[14px] font-semibold transition-all group ${
                                    isActive 
                                    ? 'text-[var(--primary-accent)]' 
                                    : 'text-[var(--text-muted)] hover:text-white'
                                }`
                            }
                            style={({ isActive }) => isActive
                                ? { 
                                    background: 'var(--active-highlight)', 
                                    border: '1px solid var(--primary-accent)' 
                                }
                                : {}
                            }
                        >
                            <Icon className={`w-5 h-5 flex-shrink-0 transition-colors ${label === 'Dashboard' ? 'text-inherit' : ''}`} />
                            {label}
                        </NavLink>
                    ))}
                </nav>
            </div>

            {/* Bottom Actions */}
            <div className="space-y-4">
                <button
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all hover:opacity-90 active:scale-[0.98] border border-[var(--primary-accent)]"
                    style={{ color: 'var(--primary-accent)' }}
                >
                    <Zap className="w-4 h-4 fill-[var(--primary-accent)]" />
                    Quick Mark
                </button>

                <div className="flex items-center justify-between px-2">
                    <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-[var(--status-safe)]">
                        <span className="w-1.5 h-1.5 rounded-full bg-[var(--status-safe)] shadow-[0_0_8px_var(--status-safe)]" />
                        Synced
                    </div>
                    <div className="flex gap-2">
                         <button 
                            onClick={() => logoutMutation.mutate()}
                            className="p-1 rounded-lg text-[var(--text-muted)] hover:text-white transition-colors"
                            title="Logout"
                        >
                            <LogOut className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>
        </aside>
    );
}

