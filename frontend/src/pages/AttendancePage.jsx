import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
    ChevronLeft, ChevronRight, Download, Calendar, 
    MoreHorizontal, Check, X, Flame, ArrowUpRight, 
    ArrowDownRight, Info, Plus
} from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, isToday } from 'date-fns';
import api from '../lib/api';
import { useState } from 'react';
import { useToast } from '../components/common/Toast';

// ─── Helpers ─────────────────────────────────────────────────────────────────
const STATUS_STYLE = {
    present: { label: 'PRESENT', color: '#4CAF7D', bg: 'rgba(76, 175, 125, 0.1)', border: '#4CAF7D33' },
    absent: { label: 'ABSENT', color: '#E85C5C', bg: 'rgba(232, 92, 92, 0.1)', border: '#E85C5C33' },
    warning: { label: 'WARNING', color: '#E8A838', bg: 'rgba(232, 168, 56, 0.1)', border: '#E8A83833' },
};

// ─── Attendance Page ──────────────────────────────────────────────────────────
export default function AttendancePage() {
    const { id: subjectId } = useParams();
    const queryClient = useQueryClient();
    const { showToast } = useToast();
    const [currentDate, setCurrentDate] = useState(new Date());

    // ── Queries ──
    const { data, isLoading } = useQuery({
        queryKey: ['attendance', subjectId],
        queryFn: () => api.get(`/attendance/${subjectId}`).then(r => r.data),
    });

    const markMutation = useMutation({
        mutationFn: (status) => api.post('/attendance', { subjectId, status, date: new Date().toISOString() }),
        onSuccess: () => {
             queryClient.invalidateQueries({ queryKey: ['attendance', subjectId] });
             queryClient.invalidateQueries({ queryKey: ['subjects'] });
        },
        onError: (err) => showToast(err.response?.data?.message || 'Failed to mark attendance', 'error'),
    });

    const { history = [], subject = {}, prediction = {} } = data || {};

    // ── Calendar Logic ──
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

    // Map history to days for the calendar
    const attendanceMap = history.reduce((acc, rec) => {
        const d = format(new Date(rec.date), 'yyyy-MM-dd');
        acc[d] = rec.status;
        return acc;
    }, {});

    const presentCount = history.filter(h => h.status === 'present' && isSameMonth(new Date(h.date), currentDate)).length;
    const absentCount = history.filter(h => h.status === 'absent' && isSameMonth(new Date(h.date), currentDate)).length;

    if (isLoading) return <div className="py-20 text-center text-muted-foreground animate-pulse">Loading subject data...</div>;

    // Derived Stats
    const nextAttendancePct = subject.totalClasses > 0 
        ? ((subject.attendedClasses) / (subject.totalClasses + 1)) * 100 
        : 0;

    return (
        <div className="space-y-8 pb-12">
            {/* ── Header Area ── */}
            <div className="flex flex-col gap-6">
                <nav className="flex items-center gap-2 text-[13px] font-bold tracking-tight">
                    <Link to="/attendance" className="text-[var(--text-muted)] hover:text-white transition-colors">Attendance</Link>
                    <span className="text-[var(--text-muted)] opacity-30">/</span>
                    <span className="text-white">{subject.name}</span>
                </nav>

                <div className="flex items-end justify-between">
                    <div className="space-y-4">
                        <h1 className="text-5xl font-black text-white tracking-tighter">{subject.name}</h1>
                        <div className="flex items-center gap-3">
                            <span className="px-3 py-1.5 rounded-lg bg-[var(--active-highlight)] text-white text-[11px] font-black tracking-widest uppercase border border-[rgba(255,255,255,0.05)]">
                                {subject.code || 'CS201'}
                            </span>
                            <span className="text-[13px] font-bold text-[var(--text-muted)]">
                                Prof. {subject.professor || 'R. Sharma'}
                            </span>
                            <div className="w-1 h-1 rounded-full bg-[var(--text-muted)] opacity-30" />
                            <span className="px-3 py-1.5 rounded-lg bg-[rgba(232,168,56,0.1)] text-[var(--primary-accent)] text-[11px] font-black tracking-widest uppercase border border-[rgba(232,168,56,0.2)]">
                                {subject.credits || '3'} Credits
                            </span>
                             <span className="px-3 py-1.5 rounded-lg bg-[var(--active-highlight)] text-[var(--text-muted)] text-[11px] font-black tracking-widest uppercase border border-[rgba(255,255,255,0.05)]">
                                {subject.semester || 'Semester 1'}
                            </span>
                        </div>
                    </div>
                    <button className="flex items-center gap-2 px-5 py-3 rounded-xl bg-[var(--active-highlight)] border border-[rgba(255,255,255,0.05)] text-white text-sm font-bold transition-all hover:bg-[rgba(255,255,255,0.08)]">
                        <Download className="w-4 h-4" />
                        Export Report
                    </button>
                </div>
            </div>

            {/* ── Main Grid ── */}
            <div className="grid grid-cols-[1fr_380px] gap-8 items-start">
                <div className="space-y-8">
                    {/* ── Attendance Log (Calendar) ── */}
                    <div className="bg-[var(--card-bg)] rounded-[32px] border border-[rgba(255,255,255,0.05)] overflow-hidden">
                        <div className="p-8">
                            <div className="flex items-center justify-between mb-10">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-[rgba(232,168,56,0.1)] flex items-center justify-center text-[var(--primary-accent)]">
                                        <Calendar className="w-5 h-5" />
                                    </div>
                                    <h2 className="text-xl font-bold text-white tracking-tight">Attendance Log</h2>
                                </div>
                                <div className="flex items-center gap-6">
                                    <div className="flex items-center gap-6">
                                        <div className="flex items-center gap-2">
                                            <div className="w-3 h-3 rounded bg-[var(--status-safe)] shadow-[0_0_8px_var(--status-safe)]/40" />
                                            <span className="text-[12px] font-bold text-[var(--text-muted)]">Present</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="w-3 h-3 rounded bg-[var(--status-danger)] shadow-[0_0_8px_var(--status-danger)]/40" />
                                            <span className="text-[12px] font-bold text-[var(--text-muted)]">Absent</span>
                                        </div>
                                    </div>
                                    <div className="w-[1px] h-4 bg-[var(--active-highlight)] mx-2" />
                                    <div className="flex items-center gap-4">
                                        <button onClick={() => setCurrentDate(subMonths(currentDate, 1))} className="p-1.5 rounded-lg hover:bg-[var(--active-highlight)] transition-colors text-[var(--text-muted)] hover:text-white">
                                            <ChevronLeft className="w-5 h-5" />
                                        </button>
                                        <span className="text-[13px] font-black uppercase tracking-[0.2em] text-white min-w-[140px] text-center">
                                            {format(currentDate, 'MMMM yyyy')}
                                        </span>
                                        <button onClick={() => setCurrentDate(addMonths(currentDate, 1))} className="p-1.5 rounded-lg hover:bg-[var(--active-highlight)] transition-colors text-[var(--text-muted)] hover:text-white">
                                            <ChevronRight className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-7 gap-3 mb-8">
                                {['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'].map(day => (
                                    <div key={day} className="text-center text-[10px] font-black tracking-widest text-[var(--text-muted)] pb-4 uppercase">
                                        {day}
                                    </div>
                                ))}
                                {Array.from({ length: (monthStart.getDay() + 6) % 7 }).map((_, i) => (
                                    <div key={`empty-${i}`} className="aspect-square" />
                                ))}
                                {days.map((day, i) => {
                                    const dateStr = format(day, 'yyyy-MM-dd');
                                    const status = attendanceMap[dateStr];
                                    const isCurrent = isToday(day);
                                    
                                    return (
                                        <div key={i} className={`aspect-square rounded-2xl border flex items-center justify-center text-sm font-bold transition-all relative group
                                            ${status === 'present' ? 'bg-[#4CAF7D22] border-[#4CAF7D44] text-[#4CAF7D]' : 
                                              status === 'absent' ? 'bg-[#E85C5C22] border-[#E85C5C44] text-[#E85C5C]' : 
                                              'bg-[var(--active-highlight)] border-white/5 text-[var(--text-muted)] hover:border-white/20'}
                                            ${isCurrent ? 'ring-2 ring-[var(--primary-accent)] ring-offset-4 ring-offset-[var(--card-bg)]' : ''}`}
                                        >
                                            {format(day, 'dd')}
                                            {isCurrent && <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[var(--primary-accent)]" />}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                        <div className="bg-[rgba(255,255,255,0.02)] border-t border-[rgba(255,255,255,0.05)] px-8 py-5 flex items-center justify-between">
                            <span className="text-[12px] font-medium text-[var(--text-muted)]">Total this month</span>
                            <div className="flex gap-6">
                                <span className="text-[13px] font-bold text-white"><span className="text-[var(--status-safe)]">{presentCount}</span> present</span>
                                <span className="text-[13px] font-bold text-white"><span className="text-[var(--status-danger)]">{absentCount}</span> absent</span>
                            </div>
                        </div>
                    </div>

                    {/* ── Recent History ── */}
                    <div className="bg-[var(--card-bg)] rounded-[32px] border border-[rgba(255,255,255,0.05)] p-8">
                        <div className="flex items-center justify-between mb-8">
                            <h2 className="text-xl font-bold text-white tracking-tight">Recent History</h2>
                            <button className="text-[11px] font-black tracking-widest uppercase text-[var(--primary-accent)] hover:underline">View All</button>
                        </div>
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-[rgba(255,255,255,0.05)]">
                                    {['DATE', 'STATUS', 'TOPIC', 'TIME'].map(h => (
                                        <th key={h} className="pb-4 text-left text-[10px] font-black tracking-[0.2em] text-[var(--text-muted)] uppercase">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[rgba(255,255,255,0.03)]">
                                {history.slice(0, 5).map((rec, i) => (
                                    <tr key={i} className="group hover:bg-[rgba(255,255,255,0.01)] transition-colors">
                                        <td className="py-5 pr-4">
                                            <span className="text-[14px] font-bold text-white">{format(new Date(rec.date), 'dd/MM/yyyy')}</span>
                                        </td>
                                        <td className="py-5 pr-4">
                                            <span className="px-2.5 py-1 rounded-lg text-[10px] font-black tracking-widest uppercase border"
                                                style={{ color: STATUS_STYLE[rec.status].color, background: STATUS_STYLE[rec.status].bg, borderColor: STATUS_STYLE[rec.status].border }}>
                                                {STATUS_STYLE[rec.status].label}
                                            </span>
                                        </td>
                                        <td className="py-5 pr-4 text-[14px] font-medium text-[var(--text-muted)]">
                                            {rec.topic || 'Regular Session'}
                                        </td>
                                        <td className="py-5 font-mono text-[12px] text-[var(--text-muted)]">
                                            {format(new Date(rec.date), 'hh:mm a')}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* ── Right Column ── */}
                <div className="space-y-8 sticky top-8">
                    {/* ── Attendance Ring ── */}
                    <div className="bg-[var(--card-bg)] rounded-[40px] border border-[rgba(255,255,255,0.05)] p-10 flex flex-col items-center">
                        <div className="relative w-48 h-48 flex items-center justify-center mb-8">
                            <svg className="w-full h-full transform -rotate-90">
                                <circle 
                                    cx="96" cy="96" r="80" 
                                    fill="transparent" 
                                    stroke="var(--active-highlight)" 
                                    strokeWidth="16" 
                                />
                                <circle 
                                    cx="96" cy="96" r="80" 
                                    fill="transparent" 
                                    stroke="var(--primary-accent)" 
                                    strokeWidth="16" 
                                    strokeDasharray={502.6} 
                                    strokeDashoffset={502.6 - (502.6 * (subject.percentage || 0)) / 100}
                                    strokeLinecap="round"
                                    className="transition-all duration-1000 ease-out"
                                />
                                <circle 
                                    cx="96" cy="96" r="88" 
                                    fill="transparent" 
                                    stroke="rgba(255,255,255,0.03)" 
                                    strokeWidth="1" 
                                />
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className="text-5xl font-black text-white font-mono leading-none">{Math.round(subject.percentage || 0)}%</span>
                                <span className="text-[10px] font-black tracking-[0.2em] uppercase text-[var(--primary-accent)] mt-2">
                                    {subject.status || 'WARNING'}
                                </span>
                            </div>
                        </div>

                        <div className="w-full space-y-4">
                            <div className="flex items-center justify-between p-4 rounded-2xl bg-[rgba(58,191,191,0.05)] border border-[rgba(58,191,191,0.1)] group">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-[rgba(58,191,191,0.1)] flex items-center justify-center text-[var(--secondary-accent)]">
                                        <ArrowUpRight className="w-4 h-4" />
                                    </div>
                                    <span className="text-xs font-bold text-[var(--text-muted)]">Need to attend</span>
                                </div>
                                <span className="text-sm font-black text-[var(--secondary-accent)]">{prediction.recoveryNeeded || 0} more classes</span>
                            </div>

                            <div className="flex items-center justify-between p-4 rounded-2xl bg-[rgba(232,168,56,0.05)] border border-[rgba(232,168,56,0.1)]">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-[rgba(232,168,56,0.1)] flex items-center justify-center text-[var(--primary-accent)]">
                                        <Check className="w-4 h-4" />
                                    </div>
                                    <span className="text-xs font-bold text-[var(--text-muted)]">Safe to miss</span>
                                </div>
                                <span className="text-sm font-black text-[var(--primary-accent)] font-mono">{prediction.safeToMiss || 0} classes</span>
                            </div>
                        </div>
                    </div>

                    {/* ── Forecast ── */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-6 rounded-[24px] bg-[var(--card-bg)] border border-[rgba(255,255,255,0.05)]">
                            <p className="text-[10px] font-black tracking-widest text-[var(--text-muted)] uppercase mb-3 text-center">To reach 75%</p>
                            <div className="flex items-center justify-center gap-2 mb-2">
                                <ArrowUpRight className="w-4 h-4 text-[var(--primary-accent)]" />
                                <span className="text-2xl font-black text-white font-mono">+{prediction.recoveryNeeded || 0}</span>
                            </div>
                            <p className="text-[11px] font-medium text-[var(--text-muted)] text-center leading-tight">consecutive classes</p>
                        </div>
                        <div className="p-6 rounded-[24px] bg-[var(--card-bg)] border border-[rgba(255,255,255,0.05)]">
                            <p className="text-[10px] font-black tracking-widest text-[var(--text-muted)] uppercase mb-3 text-center">If you miss next</p>
                            <div className="flex items-center justify-center gap-2 mb-2">
                                <ArrowDownRight className="w-4 h-4 text-[var(--status-danger)]" />
                                <span className="text-2xl font-black text-white font-mono">{Math.round(nextAttendancePct)}%</span>
                            </div>
                            <p className="text-[11px] font-medium text-[var(--text-muted)] text-center leading-tight">attendance drops</p>
                        </div>
                    </div>

                    {/* ── Streak ── */}
                    <div className="bg-[var(--card-bg)] rounded-[32px] border border-[rgba(255,255,255,0.05)] p-8">
                        <div className="flex items-center justify-between mb-8">
                            <span className="text-[13px] font-bold text-white tracking-tight">Current Streak</span>
                            <div className="flex items-center gap-2">
                                <Flame className="w-5 h-5 text-[var(--primary-accent)]" />
                                <span className="text-2xl font-black text-white font-mono">4</span>
                                <span className="text-[12px] font-bold text-[var(--text-muted)] uppercase">days</span>
                            </div>
                        </div>
                        <div className="flex gap-1.5 justify-between">
                            {Array.from({ length: 30 }).map((_, i) => (
                                <div key={i} className={`flex-1 h-1.5 rounded-full ${i < 24 ? (i % 5 === 0 ? 'bg-[var(--status-danger)]' : 'bg-[var(--status-safe)]') : 'bg-[rgba(255,255,255,0.05)]'}`} />
                            ))}
                        </div>
                        <p className="text-[10px] font-black tracking-widest text-right text-[var(--text-muted)] uppercase mt-3">Last 30 classes</p>
                    </div>

                    {/* ── Actions ── */}
                    <div className="grid grid-cols-2 gap-4">
                        <button 
                            onClick={() => markMutation.mutate('present')}
                            className="py-4 px-6 rounded-2xl bg-[rgba(76,175,125,0.1)] border border-[rgba(76,175,125,0.2)] text-[var(--status-safe)] text-sm font-bold flex items-center justify-center gap-2 transition-all hover:bg-[rgba(76,175,125,0.2)] active:scale-95">
                            <Check className="w-4 h-4" />
                            Mark Present
                        </button>
                        <button 
                            onClick={() => markMutation.mutate('absent')}
                            className="py-4 px-6 rounded-2xl bg-[rgba(232,92,92,0.1)] border border-[rgba(232,92,92,0.2)] text-[var(--status-danger)] text-sm font-bold flex items-center justify-center gap-2 transition-all hover:bg-[rgba(232,92,92,0.2)] active:scale-95">
                            <X className="w-4 h-4" />
                            Mark Absent
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
