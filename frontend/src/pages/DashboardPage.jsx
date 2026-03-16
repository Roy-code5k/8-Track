import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../store/authStore';
import api from '../lib/api';
import { format } from 'date-fns';

// ─── Helpers ─────────────────────────────────────────────────────────────────
function getGreeting() {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
}

const STATUS_STYLE = {
    safe: { label: 'SAFE', color: '#3b82f6', bg: '#3b82f620', bar: '#3b82f6' },
    warning: { label: 'WARNING', color: '#f97316', bg: '#f9731620', bar: '#f97316' },
    danger: { label: 'DANGER', color: '#ef4444', bg: '#ef444420', bar: '#ef4444' },
};

const SUBJECT_COLORS = ['#3b82f6', '#f97316', '#ef4444', '#8b5cf6', '#22c55e', '#ec4899', '#06b6d4'];

// ─── Streak Heatmap (last 4 weeks) ───────────────────────────────────────────
function StreakHeatmap() {
    const cells = Array.from({ length: 28 }, (_, i) => {
        const r = Math.random();
        return r > 0.55 ? (r > 0.8 ? 'high' : 'med') : r > 0.35 ? 'low' : 'none';
    });
    const colorMap = { none: 'hsl(240 6% 15%)', low: '#92400e55', med: '#b45309', high: '#f59e0b' };

    return (
        <div className="grid gap-1" style={{ gridTemplateColumns: 'repeat(7, 1fr)' }}>
            {cells.map((c, i) => (
                <div key={i} className="w-5 h-5 rounded-sm"
                    style={{ background: colorMap[c] }} />
            ))}
        </div>
    );
}

// ─── Stat Card ───────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, accent, extra }) {
    return (
        <div className="rounded-2xl p-5 flex flex-col gap-2"
            style={{ background: 'hsl(240 10% 9%)', border: '1px solid hsl(240 6% 15%)' }}>
            <p className="text-sm font-medium" style={{ color: 'hsl(240 5% 55%)' }}>{label}</p>
            <div className="flex items-center gap-3">
                <span className="text-3xl font-bold" style={{ color: accent || 'hsl(43 96% 56%)' }}>{value}</span>
                {extra}
            </div>
            {sub && <div className="text-xs" style={{ color: 'hsl(240 5% 50%)' }}>{sub}</div>}
        </div>
    );
}

// ─── Today's Classes (static for now, Phase 6 will be dynamic) ───────────────
const TODAYS_CLASSES = [
    { time: '09:00', end: '10:30', name: 'Applied Physics II', room: 'Lecture Hall B2', prof: 'Prof. Sharma', now: true },
    { time: '11:00', end: '12:30', name: 'Discrete Math', room: 'Seminar Room 1', prof: 'Dr. Gupta', now: false },
    { time: '14:00', end: '15:30', name: 'Data Structures Lab', room: 'CS Lab 4', prof: 'Asst. Prof. Verma', now: false },
];

function TodaysClasses() {
    return (
        <div className="rounded-2xl p-5"
            style={{ background: 'hsl(240 10% 9%)', border: '1px solid hsl(240 6% 15%)' }}>
            <div className="flex items-center justify-between mb-5">
                <h2 className="font-bold text-white">Today's Classes</h2>
                <button className="text-xs p-1 rounded" style={{ color: 'hsl(43 96% 56%)' }}>📅</button>
            </div>
            <div className="space-y-4">
                {TODAYS_CLASSES.map((cls) => (
                    <div key={cls.time} className="flex gap-3">
                        {/* Time */}
                        <div className="text-right flex-shrink-0 w-12">
                            <p className="text-xs font-semibold text-white">{cls.time}</p>
                            <p className="text-xs" style={{ color: 'hsl(240 5% 45%)' }}>{cls.end}</p>
                        </div>
                        {/* Left accent bar */}
                        <div className="w-1 rounded-full flex-shrink-0"
                            style={{ background: cls.now ? 'hsl(43 96% 56%)' : 'hsl(240 6% 20%)' }} />
                        {/* Info */}
                        <div className="flex-1">
                            <div className="flex items-center gap-2">
                                <p className="text-sm font-semibold text-white">{cls.name}</p>
                                {cls.now && (
                                    <span className="text-xs px-1.5 py-0.5 rounded font-bold"
                                        style={{ background: 'hsl(43 96% 56%)', color: 'hsl(240 5.9% 10%)' }}>NOW</span>
                                )}
                            </div>
                            <p className="text-xs mt-0.5" style={{ color: 'hsl(240 5% 50%)' }}>
                                {cls.room} • {cls.prof}
                            </p>
                        </div>
                    </div>
                ))}
            </div>
            <button className="w-full mt-5 text-xs py-2 rounded-lg transition-colors hover:opacity-80"
                style={{ color: 'hsl(43 96% 56%)', border: '1px solid hsl(240 6% 18%)' }}>
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
        <tr style={{ borderBottom: '1px solid hsl(240 6% 13%)' }}>
            {/* Subject name */}
            <td className="py-3 pr-4">
                <div className="flex items-center gap-2.5">
                    <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: color }} />
                    <span className="text-sm font-medium text-white">{subject.name}</span>
                </div>
            </td>
            {/* Progress bar */}
            <td className="py-3 pr-6" style={{ minWidth: 140 }}>
                <div className="flex items-center gap-3">
                    <div className="flex-1 h-2 rounded-full" style={{ background: 'hsl(240 6% 18%)' }}>
                        <div className="h-full rounded-full transition-all"
                            style={{ width: `${Math.min(pct, 100)}%`, background: st.bar }} />
                    </div>
                    <span className="text-sm font-semibold text-white w-10 text-right">{Math.round(pct)}%</span>
                </div>
            </td>
            {/* Status badge */}
            <td className="py-3 pr-6">
                <span className="px-2.5 py-1 rounded text-xs font-bold"
                    style={{ color: st.color, background: st.bg }}>
                    {st.label}
                </span>
            </td>
            {/* Action buttons */}
            <td className="py-3">
                <div className="flex gap-2">
                    <button
                        onClick={() => onMark(subject._id, 'present')}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all hover:opacity-80 active:scale-95"
                        style={{ background: 'hsl(240 6% 18%)', color: 'hsl(142 76% 55%)' }}
                    >
                        + Present
                    </button>
                    <button
                        onClick={() => onMark(subject._id, 'absent')}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all hover:opacity-80 active:scale-95"
                        style={{ background: 'hsl(240 6% 18%)', color: 'hsl(0 72% 65%)' }}
                    >
                        + Absent
                    </button>
                </div>
            </td>
        </tr>
    );
}

// ─── Dashboard Page ───────────────────────────────────────────────────────────
export default function DashboardPage() {
    const user = useAuthStore((s) => s.user);
    const firstName = user?.name?.split(' ')[0] || 'Student';
    const today = format(new Date(), 'EEEE, MMMM d');
    const queryClient = useQueryClient();

    // Fetch subjects
    const { data: subjects = [], isLoading } = useQuery({
        queryKey: ['subjects'],
        queryFn: () => api.get('/subjects').then(r => r.data.subjects || r.data),
        retry: 1,
    });

    // Mark attendance mutation
    const markMutation = useMutation({
        mutationFn: ({ subjectId, status }) =>
            api.post('/attendance/mark', { subjectId, status, date: new Date().toISOString() }),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['subjects'] }),
    });

    // Derived stats
    const avgPct = subjects.length
        ? Math.round(subjects.reduce((s, sub) => s + (sub.percentage || 0), 0) / subjects.length)
        : 0;
    const atRisk = subjects.filter(s => s.status === 'warning' || s.status === 'danger').length;

    return (
        <div className="space-y-5">
            {/* ── Top Row: Greeting + Streak ── */}
            <div className="flex items-start justify-between gap-5">
                {/* Greeting */}
                <div>
                    <h2 className="text-2xl font-bold text-white">
                        {getGreeting()}, {firstName} 👋
                    </h2>
                    <p className="text-sm mt-1" style={{ color: 'hsl(240 5% 50%)' }}>{today}</p>
                </div>

                {/* Streak card */}
                <div className="rounded-2xl p-5 flex items-center gap-6 flex-shrink-0"
                    style={{ background: 'hsl(240 10% 9%)', border: '1px solid hsl(240 6% 15%)' }}>
                    <div>
                        <p className="text-xs font-semibold mb-2 tracking-widest" style={{ color: 'hsl(240 5% 50%)' }}>CURRENT STREAK</p>
                        <div className="flex items-center gap-2">
                            <span className="text-2xl">🔥</span>
                            <span className="text-3xl font-black text-white">12</span>
                            <span className="text-base font-medium" style={{ color: 'hsl(240 5% 55%)' }}>days</span>
                        </div>
                    </div>
                    <div>
                        <StreakHeatmap />
                        <div className="flex justify-between mt-1.5">
                            <p className="text-xs" style={{ color: 'hsl(240 5% 45%)' }}>ACTIVITY</p>
                            <p className="text-xs" style={{ color: 'hsl(240 5% 45%)' }}>Last 4 Weeks</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Stat Cards ── */}
            <div className="grid grid-cols-4 gap-4">
                <StatCard
                    label="Overall Attendance"
                    value={subjects.length ? `${avgPct}%` : '—'}
                    accent="hsl(43 96% 56%)"
                    sub={
                        <div className="w-full h-1.5 rounded-full mt-1" style={{ background: 'hsl(240 6% 18%)' }}>
                            <div className="h-full rounded-full" style={{ width: `${avgPct}%`, background: 'hsl(43 96% 56%)' }} />
                        </div>
                    }
                />
                <StatCard
                    label="At Risk Subjects"
                    value={atRisk}
                    accent="hsl(43 96% 56%)"
                    extra={atRisk > 0 && (
                        <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                            style={{ background: 'hsl(43 96% 56% / 0.15)', color: 'hsl(43 96% 56%)' }}>
                            {atRisk} {atRisk === 1 ? 'subject' : 'subjects'}
                        </span>
                    )}
                />
                <StatCard
                    label="Due Today"
                    value="3"
                    accent="hsl(43 96% 56%)"
                    sub="Tasks & Assignments"
                />
                <StatCard
                    label="Next Exam"
                    value="2d 14h"
                    accent="hsl(43 96% 56%)"
                    sub="Applied Physics II"
                />
            </div>

            {/* ── Main Grid: Attendance Table + Today's Classes ── */}
            <div className="grid grid-cols-[1fr_280px] gap-5 items-start">
                {/* Subject Attendance Table */}
                <div className="rounded-2xl p-5"
                    style={{ background: 'hsl(240 10% 9%)', border: '1px solid hsl(240 6% 15%)' }}>
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="font-bold text-white">Subject Attendance</h2>
                        <button className="text-xs hover:underline" style={{ color: 'hsl(43 96% 56%)' }}>View All</button>
                    </div>

                    {isLoading ? (
                        <div className="py-10 text-center text-sm" style={{ color: 'hsl(240 5% 50%)' }}>Loading subjects…</div>
                    ) : subjects.length === 0 ? (
                        <div className="py-10 text-center">
                            <p className="text-sm font-medium text-white mb-1">No subjects yet</p>
                            <p className="text-xs" style={{ color: 'hsl(240 5% 50%)' }}>Add subjects from the Subjects page to start tracking attendance.</p>
                        </div>
                    ) : (
                        <table className="w-full">
                            <thead>
                                <tr style={{ borderBottom: '1px solid hsl(240 6% 18%)' }}>
                                    {['SUBJECT', 'PROGRESS', 'STATUS', 'ACTIONS'].map(h => (
                                        <th key={h} className="pb-2 text-left text-xs font-semibold tracking-widest"
                                            style={{ color: 'hsl(240 5% 45%)' }}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {subjects.slice(0, 6).map((sub, i) => (
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

                {/* Today's Classes */}
                <TodaysClasses />
            </div>
        </div>
    );
}
