import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../store/authStore';
import api from '../lib/api';
import { format } from 'date-fns';
import { Plus, Calendar, ArrowRight } from 'lucide-react';

// ─── Helpers ─────────────────────────────────────────────────────────────────
function getGreeting() {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
}

const STATUS_STYLE = {
    safe: { label: 'SAFE', color: 'var(--status-safe)', bg: 'rgba(76, 175, 125, 0.1)', bar: 'var(--status-safe)' },
    warning: { label: 'WARNING', color: 'var(--status-warning)', bg: 'rgba(232, 168, 56, 0.1)', bar: 'var(--status-warning)' },
    danger: { label: 'DANGER', color: 'var(--status-danger)', bg: 'rgba(232, 92, 92, 0.1)', bar: 'var(--status-danger)' },
};

const SUBJECT_COLORS = ['#3ABFBF', '#E8A838', '#E85C5C', '#8b5cf6', '#22c55e', '#ec4899', '#06b6d4'];

// ─── Streak Heatmap (last 4 weeks) ───────────────────────────────────────────
function StreakHeatmap() {
    const cells = Array.from({ length: 28 }, (_, i) => {
        const r = Math.random();
        return r > 0.55 ? (r > 0.8 ? 'high' : 'med') : r > 0.35 ? 'low' : 'none';
    });
    const colorMap = { none: 'rgba(255, 255, 255, 0.05)', low: 'rgba(232, 168, 56, 0.2)', med: 'rgba(232, 168, 56, 0.5)', high: 'var(--primary-accent)' };

    return (
        <div className="grid gap-1.5" style={{ gridTemplateColumns: 'repeat(7, 1fr)' }}>
            {cells.map((c, i) => (
                <div key={i} className="w-4 h-4 rounded-[4px]"
                    style={{ background: colorMap[c] }} />
            ))}
        </div>
    );
}

// ─── Stat Card ───────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, accent, extra, progress }) {
    return (
        <div className="rounded-2xl p-6 flex flex-col justify-between h-40 transition-all hover:bg-[var(--active-highlight)] border border-[var(--active-highlight)]"
            style={{ background: 'var(--card-bg)' }}>
            <div>
                <p className="text-sm font-semibold tracking-tight text-[var(--text-muted)]">{label}</p>
                <div className="flex items-baseline gap-3 mt-4">
                    <span className="text-4xl font-black font-mono text-white">{value}</span>
                    {extra}
                </div>
            </div>
            <div>
                {progress !== undefined && (
                    <div className="w-full h-1.5 rounded-full bg-[var(--active-highlight)] overflow-hidden mb-2">
                        <div className="h-full rounded-full transition-all duration-500" 
                            style={{ width: `${progress}%`, background: accent || 'var(--primary-accent)' }} />
                    </div>
                )}
                {sub && <div className="text-[13px] font-medium text-[var(--text-muted)]">{sub}</div>}
            </div>
        </div>
    );
}

// ─── Today's Classes ────────────────────────────────────────────────────────
const TODAYS_CLASSES = [
    { time: '09:00', end: '10:30', name: 'Applied Physics II', room: 'Lecture Hall B2', prof: 'Prof. Sharma', now: true },
    { time: '11:00', end: '12:30', name: 'Discrete Math', room: 'Seminar Room 1', prof: 'Dr. Gupta', now: false },
    { time: '14:00', end: '15:30', name: 'Data Structures Lab', room: 'CS Lab 4', prof: 'Asst. Prof. Verma', now: false },
];

function TodaysClasses() {
    return (
        <div className="rounded-3xl p-6 border border-[var(--active-highlight)]"
            style={{ background: 'var(--card-bg)' }}>
            <div className="flex items-center justify-between mb-8">
                <h2 className="text-lg font-bold text-white tracking-tight">Today's Classes</h2>
                <button className="p-2 rounded-xl text-[var(--primary-accent)] hover:bg-[rgba(232,168,56,0.1)] transition-colors">
                    <Calendar className="w-5 h-5" />
                </button>
            </div>
            <div className="space-y-6">
                {TODAYS_CLASSES.map((cls) => (
                    <div key={cls.time} className="flex gap-4 group">
                        {/* Time */}
                        <div className="text-right flex-shrink-0 w-14 pt-1">
                            <p className="text-sm font-bold text-white font-mono">{cls.time}</p>
                            <p className="text-[11px] font-medium text-[var(--text-muted)]">{cls.end}</p>
                        </div>
                        {/* Left accent bar */}
                        <div className="w-[3px] rounded-full flex-shrink-0"
                            style={{ background: cls.now ? 'var(--primary-accent)' : 'var(--active-highlight)' }} />
                        {/* Info */}
                        <div className={`flex-1 p-4 rounded-2xl transition-all ${cls.now ? 'bg-[var(--active-highlight)] outline outline-1 outline-[rgba(232,168,56,0.2)]' : 'hover:bg-[rgba(255,255,255,0.02)]'}`}>
                            <div className="flex items-center justify-between">
                                <p className="text-sm font-bold text-white tracking-tight">{cls.name}</p>
                                {cls.now && (
                                    <span className="text-[10px] px-2 py-0.5 rounded-full font-black tracking-widest"
                                        style={{ background: 'var(--primary-accent)', color: 'var(--sidebar-bg)' }}>NOW</span>
                                )}
                            </div>
                            <p className="text-[12px] font-medium mt-1 text-[var(--text-muted)]">
                                {cls.room} • {cls.prof}
                            </p>
                        </div>
                    </div>
                ))}
            </div>
            <button className="w-full mt-10 text-xs font-bold py-3 rounded-xl transition-all hover:bg-[var(--active-highlight)] border border-[var(--active-highlight)] text-[var(--text-muted)]">
                View full schedule
            </button>
        </div>
    );
}

// ─── Subject Attendance Row ───────────────────────────────────────────────────
function SubjectRow({ subject, color, onMark }) {
    const pct = subject.percentage ?? 0;
    const status = subject.status || 'danger';
    const st = STATUS_STYLE[status] || STATUS_STYLE.danger;

    return (
        <tr className="border-b border-[var(--active-highlight)] last:border-0 hover:bg-[rgba(255,255,255,0.02)] transition-colors group">
            <td className="py-5 pr-4 pl-2">
                <div className="flex items-center gap-3">
                    <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: color, boxShadow: `0 0 8px ${color}` }} />
                    <span className="text-[14px] font-bold text-white tracking-tight">{subject.name}</span>
                </div>
            </td>
            <td className="py-5 pr-8" style={{ minWidth: 180 }}>
                <div className="flex items-center gap-4">
                    <div className="flex-1 h-2 rounded-full bg-[var(--active-highlight)] overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-700"
                            style={{ width: `${Math.min(pct, 100)}%`, background: st.bar }} />
                    </div>
                    <span className="text-[14px] font-bold text-white font-mono w-10 text-right">{Math.round(pct)}%</span>
                </div>
            </td>
            <td className="py-5 pr-8">
                <span className="px-3 py-1 rounded-lg text-[10px] font-black tracking-widest uppercase shadow-sm"
                    style={{ color: st.color, background: st.bg, border: `1px solid ${st.color}20` }}>
                    {st.label}
                </span>
            </td>
            <td className="py-5 pr-2">
                <div className="flex gap-2">
                    <button
                        onClick={() => onMark(subject._id, 'present')}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[11px] font-bold transition-all bg-[var(--active-highlight)] border border-[rgba(255,255,255,0.05)] hover:border-[var(--status-safe)] hover:text-[var(--status-safe)]"
                    >
                        <Plus className="w-3 h-3" />
                        Present
                    </button>
                    <button
                        onClick={() => onMark(subject._id, 'absent')}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[11px] font-bold transition-all bg-[var(--active-highlight)] border border-[rgba(255,255,255,0.05)] hover:border-[var(--status-danger)] hover:text-[var(--status-danger)]"
                    >
                        <Plus className="w-3 h-3" />
                        Absent
                    </button>
                </div>
            </td>
        </tr>
    );
}

// ─── Dashboard Page ───────────────────────────────────────────────────────────
export default function DashboardPage() {
    const user = useAuthStore((s) => s.user);
    const firstName = user?.name?.split(' ')[0] || 'Ayush';
    const today = format(new Date(), 'EEEE, MMMM d');
    const queryClient = useQueryClient();

    const { data: subjects = [], isLoading } = useQuery({
        queryKey: ['subjects'],
        queryFn: () => api.get('/subjects').then(r => r.data.subjects || r.data),
        retry: 1,
    });

    const markMutation = useMutation({
        mutationFn: ({ subjectId, status }) =>
            api.post('/attendance/mark', { subjectId, status, date: new Date().toISOString() }),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['subjects'] }),
    });

    const avgPct = subjects.length
        ? Math.round(subjects.reduce((s, sub) => s + (sub.percentage || 0), 0) / subjects.length)
        : 0;
    const atRisk = subjects.filter(s => s.status === 'warning' || s.status === 'danger').length;

    return (
        <div className="space-y-8 pb-10 relative">
            {/* ── Top Row: Greeting + Streak ── */}
            <div className="flex items-start justify-between gap-6">
                <div>
                    <h2 className="text-4xl font-black text-white tracking-tighter leading-tight">
                        {getGreeting()}, {firstName} 👋
                    </h2>
                    <p className="text-[15px] font-medium mt-2 text-[var(--text-muted)]">{today}</p>
                </div>

                {/* Streak Card */}
                <div className="rounded-3xl p-6 flex items-center gap-8 flex-shrink-0 border border-[var(--active-highlight)]"
                    style={{ background: 'var(--card-bg)' }}>
                    <div className="flex flex-col items-center">
                        <p className="text-[10px] font-black mb-3 tracking-[0.2em] text-[var(--text-muted)] uppercase">Current Streak</p>
                        <div className="flex items-center gap-3">
                            <span className="text-3xl filter drop-shadow-[0_0_8px_rgba(232,168,56,0.5)]">🔥</span>
                            <span className="text-4xl font-black text-white font-mono">12</span>
                            <span className="text-sm font-bold text-[var(--text-muted)]">days</span>
                        </div>
                    </div>
                    <div>
                        <StreakHeatmap />
                        <div className="flex justify-between mt-3 px-0.5">
                            <p className="text-[10px] font-black tracking-widest text-[rgba(255,255,255,0.2)] uppercase">Activity</p>
                            <p className="text-[10px] font-black tracking-widest text-[rgba(255,255,255,0.2)] uppercase">Last 4 Weeks</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Stat Cards ── */}
            <div className="grid grid-cols-4 gap-6">
                <StatCard
                    label="Overall Attendance"
                    value={subjects.length ? `${avgPct}%` : '—'}
                    accent="var(--primary-accent)"
                    progress={avgPct}
                />
                <StatCard
                    label="At Risk Subjects"
                    value={atRisk}
                    accent="var(--status-danger)"
                    extra={atRisk > 0 && (
                        <span className="text-[11px] px-3 py-1 rounded-full font-black tracking-tight"
                            style={{ background: 'rgba(232, 92, 92, 0.15)', color: 'var(--status-danger)', border: '1px solid rgba(232, 92, 92, 0.3)' }}>
                            {atRisk} {atRisk === 1 ? 'subject' : 'subjects'}
                        </span>
                    )}
                    sub="Subjects below threshold"
                />
                <StatCard
                    label="Due Today"
                    value="3"
                    accent="var(--primary-accent)"
                    sub="Tasks & Assignments"
                />
                <StatCard
                    label="Next Exam"
                    value="2d 14h"
                    accent="var(--secondary-accent)"
                    sub="Applied Physics II"
                />
            </div>

            {/* ── Main Grid: Attendance Table + Today's Classes ── */}
            <div className="grid grid-cols-[1fr_360px] gap-8 items-start">
                <div className="rounded-3xl p-8 border border-[var(--active-highlight)]"
                    style={{ background: 'var(--card-bg)' }}>
                    <div className="flex items-center justify-between mb-8">
                        <h2 className="text-lg font-bold text-white tracking-tight">Subject Attendance</h2>
                        <button className="flex items-center gap-2 text-xs font-black tracking-widest uppercase text-[var(--primary-accent)] hover:underline">
                            View All <ArrowRight className="w-3 h-3" />
                        </button>
                    </div>

                    {isLoading ? (
                        <div className="py-20 text-center text-sm font-medium text-[var(--text-muted)] animate-pulse">Loading subjects...</div>
                    ) : subjects.length === 0 ? (
                        <div className="py-20 text-center bg-[rgba(255,255,255,0.01)] rounded-2xl border border-dashed border-[var(--active-highlight)]">
                            <p className="text-sm font-bold text-white mb-2 tracking-tight">No subjects found</p>
                            <p className="text-xs text-[var(--text-muted)] font-medium">Add subjects to start tracking attendance.</p>
                        </div>
                    ) : (
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-[var(--active-highlight)]">
                                    {['Subject', 'Progress', 'Status', 'Actions'].map(h => (
                                        <th key={h} className="pb-4 text-left text-[11px] font-black tracking-[0.2em] text-[var(--text-muted)] uppercase">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {subjects.slice(0, 5).map((sub, i) => (
                                    <SubjectRow
                                        key={sub._id}
                                        subject={sub}
                                        color={SUBJECT_COLORS[i % SUBJECT_COLORS.length]}
                                        onMark={(subjectId, status) => markMutation.mutate({ subjectId, status })}
                                    />
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

                <TodaysClasses />
            </div>
        </div>
    );
}


