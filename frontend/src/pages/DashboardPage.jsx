import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../store/authStore';
import { Link } from 'react-router-dom';
import api from '../lib/api';
import { format, isToday, isFuture, parseISO, differenceInDays, differenceInHours, isSameDay, subDays, startOfToday } from 'date-fns';
import { Plus, Calendar, ArrowRight, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import { useToast } from '../components/common/Toast';

// ─── Helpers ─────────────────────────────────────────────────────────────────
function getGreeting() {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
}

function formatCountdown(date) {
    const now = new Date();
    const target = new Date(date);
    const days = differenceInDays(target, now);
    const hours = differenceInHours(target, now) % 24;
    
    if (days < 0) return 'Passed';
    if (days === 0 && hours === 0) return 'Now';
    
    let parts = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0) parts.push(`${hours}h`);
    
    return parts.join(' ') || '< 1h';
}

function getDistinctDays(history) {
    return [...new Set(history.map(h => format(new Date(h.date), 'yyyy-MM-dd')))]
        .map(d => new Date(d))
        .sort((a, b) => b - a);
}

function calculateStreak(history) {
    if (!history || history.length === 0) return 0;
    const distinctDays = getDistinctDays(history);
    let streak = 0;
    let curr = startOfToday();
    const attendedToday = distinctDays.some(d => isSameDay(d, curr));
    const attendedYesterday = distinctDays.some(d => isSameDay(d, subDays(curr, 1)));
    if (!attendedToday && !attendedYesterday) return 0;
    let checkDate = attendedToday ? curr : subDays(curr, 1);
    for (let day of distinctDays) {
        if (isSameDay(day, checkDate)) {
            streak++;
            checkDate = subDays(checkDate, 1);
        } else if (day < checkDate) break;
    }
    return streak;
}

const STATUS_STYLE = {
    safe: { label: 'SAFE', color: 'var(--status-safe)', bg: 'rgba(76, 175, 125, 0.1)', bar: 'var(--status-safe)' },
    warning: { label: 'WARNING', color: 'var(--status-warning)', bg: 'rgba(232, 168, 56, 0.1)', bar: 'var(--status-warning)' },
    danger: { label: 'DANGER', color: 'var(--status-danger)', bg: 'rgba(232, 92, 92, 0.1)', bar: 'var(--status-danger)' },
};

const SUBJECT_COLORS = ['#3ABFBF', '#E8A838', '#E85C5C', '#8b5cf6', '#22c55e', '#ec4899', '#06b6d4'];

// ─── Streak Heatmap (last 4 weeks) ───────────────────────────────────────────
// Colors each day purely by attendance count (not schedule-dependent),
// because schedule is now week-specific and we'd need historical schedule
// data to correctly know which days had classes in past weeks.
function StreakHeatmap({ attendanceHistory }) {
    const today = new Date();

    // Build a map: 'yyyy-MM-dd' → total present count for that day
    const attendedMap = (attendanceHistory || []).reduce((acc, h) => {
        if (h.status === 'present') {
            const key = format(new Date(h.date), 'yyyy-MM-dd');
            acc[key] = (acc[key] || 0) + 1;
        }
        return acc;
    }, {});

    // 28 cells: 27 days ago → today (left-to-right, top-to-bottom in 7-col grid)
    const cells = Array.from({ length: 28 }, (_, i) => {
        const d = new Date(today);
        d.setDate(d.getDate() - (27 - i));
        const key = format(d, 'yyyy-MM-dd');
        const attended = attendedMap[key] || 0;

        if (attended === 0) return 'none';   // no attendance recorded
        if (attended >= 3)  return 'high';   // 3+ subjects attended
        if (attended >= 2)  return 'med';    // 2 subjects attended
        return 'low';                        // 1 subject attended
    });

    const colorMap = {
        none: 'rgba(255, 255, 255, 0.05)',
        low:  'rgba(232, 168, 56, 0.25)',   // 1 class
        med:  'rgba(232, 168, 56, 0.6)',    // 2 classes
        high: 'var(--primary-accent)',      // 3+ classes (full gold)
    };

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
function TodaysClasses({ dayData, isLoading }) {
    if (isLoading) {
        return (
            <div className="rounded-3xl p-6 border border-[var(--active-highlight)] flex items-center justify-center h-64" style={{ background: 'var(--card-bg)' }}>
                <p className="text-sm font-medium text-[var(--text-muted)] animate-pulse">Loading schedule...</p>
            </div>
        );
    }

    if (!dayData) {
         return (
            <div className="rounded-3xl p-6 border border-[var(--active-highlight)] flex flex-col items-center justify-center h-64 text-center" style={{ background: 'var(--card-bg)' }}>
                <Calendar className="w-8 h-8 text-[var(--text-muted)] mb-3 opacity-50" />
                <p className="text-sm font-bold text-white mb-1">No schedule found</p>
                <p className="text-xs font-medium text-[var(--text-muted)]">Set up your schedule in Subjects.</p>
            </div>
        );
    }

    if (dayData.isHoliday) {
        return (
            <div className="rounded-3xl p-6 border flex flex-col items-center justify-center h-64 text-center" style={{ background: 'var(--card-bg)', borderColor: 'rgba(232, 92, 92, 0.2)' }}>
                <div className="w-12 h-12 rounded-full mb-3 flex items-center justify-center" style={{ background: 'rgba(232, 92, 92, 0.1)' }}>
                    <Calendar className="w-6 h-6" style={{ color: 'var(--status-danger)' }} />
                </div>
                <p className="text-lg font-bold text-white mb-1 tracking-tight">It's a Holiday!</p>
                <p className="text-sm font-medium text-[var(--text-muted)]">Take a break and relax today.</p>
            </div>
        );
    }

    const slots = dayData.slots || [];

    // Figure out which class is "now"
    const nowHHMM = format(new Date(), 'HH:mm');
    const enrichedSlots = slots.map(slot => {
        const isNow = nowHHMM >= slot.startTime && nowHHMM <= slot.endTime;
        return { ...slot, isNow };
    }).sort((a, b) => a.startTime.localeCompare(b.startTime));

    return (
        <div className="rounded-3xl p-6 border border-[var(--active-highlight)] flex flex-col"
            style={{ background: 'var(--card-bg)' }}>
            <div className="flex items-center justify-between mb-8">
                <h2 className="text-lg font-bold text-white tracking-tight">Today's Classes</h2>
                <Link to="/subjects" className="p-2 rounded-xl text-[var(--primary-accent)] hover:bg-[rgba(232,168,56,0.1)] transition-colors" title="Edit Schedule">
                    <Calendar className="w-5 h-5" />
                </Link>
            </div>

            {enrichedSlots.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center">
                     <p className="text-sm font-bold text-white mb-1">No classes today</p>
                     <p className="text-xs font-medium text-[var(--text-muted)]">You're completely free!</p>
                </div>
            ) : (
                <div className="space-y-6 flex-1">
                    {enrichedSlots.map((cls) => (
                        <div key={cls._id} className="flex gap-4 group">
                            {/* Time */}
                            <div className="text-right flex-shrink-0 w-14 pt-1">
                                <p className="text-sm font-bold text-white font-mono">{cls.startTime}</p>
                                <p className="text-[11px] font-medium text-[var(--text-muted)]">{cls.endTime}</p>
                            </div>
                            {/* Left accent bar */}
                            <div className="w-[3px] rounded-full flex-shrink-0"
                                style={{ background: cls.isNow ? 'var(--primary-accent)' : 'var(--active-highlight)' }} />
                            {/* Info */}
                            <div className={`flex-1 p-4 rounded-2xl transition-all ${cls.isNow ? 'bg-[var(--active-highlight)] outline outline-1 outline-[rgba(232,168,56,0.2)]' : 'hover:bg-[rgba(255,255,255,0.02)]'}`}>
                                <div className="flex flex-col">
                                    <div className="flex items-center justify-between mb-1">
                                         <p className="text-sm font-bold text-white tracking-tight leading-tight">{cls.subjectName}</p>
                                         {cls.isNow && (
                                            <span className="text-[9px] px-2 py-0.5 rounded-full font-black tracking-widest"
                                                style={{ background: 'var(--primary-accent)', color: 'var(--sidebar-bg)' }}>NOW</span>
                                        )}
                                    </div>
                                    {cls.room && (
                                        <p className="text-[12px] font-medium text-[var(--text-muted)]">
                                            {cls.room}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
            
            <Link to="/subjects" className="block text-center w-full mt-10 text-xs font-bold py-3 rounded-xl transition-all hover:bg-[var(--active-highlight)] border border-[var(--active-highlight)] text-[var(--text-muted)]">
                View full schedule
            </Link>
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
                <Link to={`/attendance/${subject._id}`} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                    <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: color, boxShadow: `0 0 8px ${color}` }} />
                    <span className="text-[14px] font-bold text-white tracking-tight">{subject.name}</span>
                </Link>
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
    const [isExpanded, setIsExpanded] = useState(false);
    const user = useAuthStore((s) => s.user);
    const firstName = user?.name?.split(' ')[0] || '';
    const queryClient = useQueryClient();
    const { showToast } = useToast();

    const { data: subjects = [], isLoading } = useQuery({
        queryKey: ['subjects'],
        queryFn: () => api.get('/subjects').then(r => {
            const raw = r.data.subjects || r.data;
            return Array.isArray(raw) ? raw : [];
        }),
        retry: 1,
    });

    const { data: assignments = [] } = useQuery({
        queryKey: ['assignments'],
        queryFn: () => api.get('/assignments').then(r => {
            const raw = r.data.assignments || r.data;
            return Array.isArray(raw) ? raw : [];
        }),
    });

    const { data: tasks = [] } = useQuery({
        queryKey: ['tasks'],
        queryFn: () => api.get('/tasks').then(r => {
            const raw = r.data.tasks || r.data;
            return Array.isArray(raw) ? raw : [];
        }),
    });

    const { data: scheduleData, isLoading: scheduleLoading } = useQuery({
        queryKey: ['schedule'],
        queryFn: () => api.get('/schedule').then(r => r.data.schedule),
    });

    const { data: attendanceHistory = [] } = useQuery({
        queryKey: ['global-attendance'],
        queryFn: () => api.get('/attendance').then(r => {
            const raw = r.data.history || r.data;
            return Array.isArray(raw) ? raw : [];
        }),
    });

    const { data: exams = [] } = useQuery({
        queryKey: ['exams'],
        queryFn: () => api.get('/exams').then(r => {
            const raw = r.data.exams || r.data;
            return Array.isArray(raw) ? raw : [];
        }),
    });

    const markMutation = useMutation({
        mutationFn: ({ subjectId, status }) =>
            api.post('/attendance/mark', { subjectId, status, date: new Date().toISOString() }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['subjects'] });
            queryClient.invalidateQueries({ queryKey: ['global-attendance'] });
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
        },
        onError: (err) => showToast(err.response?.data?.message || 'Failed to mark attendance', 'error'),
    });

    const currentStreak = useMemo(() => calculateStreak(attendanceHistory), [attendanceHistory]);

    // Calculations
    const pendingCount = [...assignments, ...tasks].filter(t => {
        const isComp = t.status === 'completed' || t.completed === true;
        return !isComp;
    }).length;

    // Find Next Exam from Exams collection
    const nextExamRecord = [...exams]
        .filter(e => e.status === 'upcoming' && e.date && isFuture(new Date(e.date)))
        .sort((a, b) => new Date(a.date) - new Date(b.date))[0];

    // Fallback to assignments if no upcoming exams record found
    const nextExam = nextExamRecord || [...assignments]
        .filter(t => {
            const isActive = t.status !== 'completed' && !t.completed;
            const isExam = t.title?.toLowerCase().includes('exam') || t.title?.toLowerCase().includes('test');
            return isActive && isExam && t.dueDate && isFuture(parseISO(t.dueDate));
        })
        .sort((a, b) => parseISO(a.dueDate) - parseISO(b.dueDate))[0];

    const nextExamDate = nextExamRecord ? nextExamRecord.date : (nextExam ? (nextExam.dueDate || nextExam.date) : null);
    const nextExamTitle = nextExamRecord ? `${nextExamRecord.examName} (${nextExamRecord.subjectId?.name || 'Exam'})` : (nextExam ? nextExam.title : 'No upcoming exams');

    const avgPct = subjects.length
        ? Math.round(subjects.reduce((s, sub) => s + (sub.percentage || 0), 0) / subjects.length)
        : 0;
    const atRisk = subjects.filter(s => s.status === 'warning' || s.status === 'danger').length;

    // Get today's schedule data
    const currentDayName = format(new Date(), 'EEEE'); // e.g., 'Monday'
    const today = format(new Date(), 'dd/MM/yyyy');
    
    const todaysSchedule = scheduleData?.find(d => d.day === currentDayName);

    return (
        <div className="space-y-8 pb-10 relative">
            {/* ── Top Row: Greeting + Streak ── */}
            <div className="flex items-start justify-between gap-6">
                <div>
                    <h2 className="text-4xl font-black text-white tracking-tighter leading-tight">
                        {getGreeting()}, {firstName} 👋
                    </h2>
                    <p className="text-[15px] font-medium mt-2 text-[var(--secondary-accent)]">{today}</p>
                </div>

                {/* Streak Card */}
                <div className="rounded-3xl p-6 flex items-center gap-8 flex-shrink-0 border border-[var(--active-highlight)]"
                    style={{ background: 'var(--card-bg)' }}>
                    <div className="flex flex-col items-center">
                        <p className="text-[10px] font-black mb-3 tracking-[0.2em] text-[var(--text-muted)] uppercase">Current Streak</p>
                        <div className="flex items-center gap-3">
                            <span className="text-3xl filter drop-shadow-[0_0_8px_rgba(232,168,56,0.5)]">🔥</span>
                            <span className="text-4xl font-black text-white font-mono">{currentStreak}</span>
                            <span className="text-sm font-bold text-[var(--text-muted)]">days</span>
                        </div>
                    </div>
                    <div>
                        <StreakHeatmap attendanceHistory={attendanceHistory} />
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
                    label="Active Tasks"
                    value={pendingCount}
                    accent="var(--primary-accent)"
                    sub="Tasks & Assignments"
                />

                <StatCard
                    label="Next Exam"
                    value={nextExamDate ? formatCountdown(nextExamDate) : '—'}
                    accent="var(--secondary-accent)"
                    sub={nextExamTitle}
                />
            </div>

            {/* ── Main Grid: Attendance Table + Today's Classes ── */}
            <div className="grid grid-cols-[1fr_360px] gap-8 items-start">
                <div className="rounded-3xl p-8 border border-[var(--active-highlight)]"
                    style={{ background: 'var(--card-bg)' }}>
                    <div className="flex items-center justify-between mb-8">
                        <h2 className="text-lg font-bold text-white tracking-tight">Subject Attendance</h2>
                        {subjects.length > 5 && (
                            <button 
                                onClick={() => setIsExpanded(!isExpanded)}
                                className="flex items-center gap-2 text-xs font-black tracking-widest uppercase text-[var(--primary-accent)] hover:underline"
                            >
                                {isExpanded ? 'Show Less' : 'View All'} 
                                {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                            </button>
                        )}
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
                                {subjects.slice(0, isExpanded ? subjects.length : 5).map((sub, i) => (
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

                <TodaysClasses dayData={todaysSchedule} isLoading={scheduleLoading} />
            </div>
        </div>
    );
}


