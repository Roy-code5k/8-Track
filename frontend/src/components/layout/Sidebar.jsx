import { NavLink, useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import {
    LayoutDashboard, CalendarCheck, ClipboardList,
    GraduationCap, TrendingUp, Timer, BookOpen, Settings, Zap, LogOut
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

    // Logout — calls backend to clear the HttpOnly refresh cookie
    const logoutMutation = useMutation({
        mutationFn: () => api.post('/auth/logout'),
        onSettled: () => { logout(); navigate('/auth'); },
    });

    const initials = user?.name
        ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
        : 'U';

    return (
        <aside className="flex flex-col justify-between w-[168px] min-h-screen py-5 px-3 flex-shrink-0"
            style={{ background: 'hsl(240 10% 7%)', borderRight: '1px solid hsl(240 6% 13%)' }}>

            {/* Logo */}
            <div>
                <div className="flex items-center gap-2.5 px-2 mb-7">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center font-black text-sm flex-shrink-0"
                        style={{ background: 'hsl(43 96% 56%)', color: 'hsl(240 5.9% 10%)' }}>
                        8
                    </div>
                    <span className="font-bold text-base text-white">8Track</span>
                </div>

                {/* User profile + Logout button */}
                <div className="flex items-center gap-2 px-2 mb-6">
                    <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0"
                        style={{ background: 'hsl(43 96% 56%)', color: 'hsl(240 5.9% 10%)' }}>
                        {initials}
                    </div>
                    <div className="overflow-hidden flex-1">
                        <p className="text-sm font-semibold text-white truncate">{user?.name || 'Student'}</p>
                        <p className="text-xs truncate" style={{ color: 'hsl(240 5% 50%)' }}>
                            {user?.semester || 'Semester 1'}
                        </p>
                    </div>
                    {/* Logout icon button */}
                    <button
                        onClick={() => logoutMutation.mutate()}
                        disabled={logoutMutation.isPending}
                        title="Log out"
                        className="p-1.5 rounded-lg transition-colors hover:text-red-400 flex-shrink-0"
                        style={{ color: 'hsl(240 5% 50%)' }}
                    >
                        <LogOut className="w-3.5 h-3.5" />
                    </button>
                </div>

                {/* Nav */}
                <nav className="space-y-0.5">
                    {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
                        <NavLink key={to} to={to}
                            className={({ isActive }) =>
                                `flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isActive ? 'text-white' : 'hover:text-white'
                                }`
                            }
                            style={({ isActive }) => isActive
                                ? { background: 'hsl(43 96% 56% / 0.15)', color: 'hsl(43 96% 56%)' }
                                : { color: 'hsl(240 5% 50%)' }
                            }
                        >
                            <Icon className="w-4 h-4 flex-shrink-0" />
                            {label}
                        </NavLink>
                    ))}
                </nav>
            </div>

            {/* Bottom — Quick Mark (attendance shortcut) + Synced status */}
            <div className="space-y-3">
                <button
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all hover:opacity-90 active:scale-[0.98]"
                    style={{ background: 'hsl(43 96% 56%)', color: 'hsl(240 5.9% 10%)' }}
                    title="Quick attendance mark"
                >
                    <Zap className="w-4 h-4" />
                    Quick Mark
                </button>

                <div className="flex items-center justify-between px-1">
                    <div className="flex items-center gap-1.5 text-xs" style={{ color: 'hsl(142 76% 44%)' }}>
                        <span className="w-2 h-2 rounded-full bg-green-400 inline-block" />
                        Synced
                    </div>
                    <button className="p-1 rounded transition-colors hover:text-white" style={{ color: 'hsl(240 5% 50%)' }}>
                        <Settings className="w-3.5 h-3.5" />
                    </button>
                </div>
            </div>
        </aside>
    );
}
