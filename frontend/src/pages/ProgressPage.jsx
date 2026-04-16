import { useQuery } from '@tanstack/react-query';
import { 
    Flame, Calendar, TrendingUp, Award, 
    Download, ChevronRight, CheckCircle2,
    Calendar as CalendarIcon, Clock, 
    Activity
} from 'lucide-react';
import { 
    format, subWeeks, eachDayOfInterval, 
    startOfToday, isSameDay, subDays, 
    isWithinInterval, startOfMonth, 
    endOfMonth, isMonday, isTuesday, 
    isWednesday, isThursday, isFriday, 
    isSaturday, isSunday, parseISO,
    startOfWeek, endOfWeek, isToday
} from 'date-fns';
import api from '../lib/api';
import { useState, useMemo } from 'react';

// ─── Helpers ─────────────────────────────────────────────────────────────────
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

function calculateMaxStreak(history) {
    if (!history || history.length === 0) return 0;
    const days = getDistinctDays(history).reverse(); // oldest → newest
    let max = 0;
    let current = 0;
    let prev = null;
    for (let day of days) {
        // subDays(prev, 1) = yesterday relative to prev
        // If today's day is the same as yesterday's prev, it's consecutive
        if (!prev || isSameDay(day, subDays(prev, 1))) {
            current++;
        } else {
            current = 1;
        }
        max = Math.max(max, current);
        prev = day;
    }
    return max;
}

// ─── Heatmap Component ────────────────────────────────────────────────────────
// Uses a per-date scheduledDatesMap (built from historical Schedule docs)
// so each cell correctly reflects whether THAT SPECIFIC DATE had classes,
// not just whether the current week has a slot on that day name.
function Heatmap({ history, scheduledDatesMap }) {
    const today = startOfToday();
    const start = subWeeks(today, 12);
    const days = eachDayOfInterval({ start, end: today });

    // Build counts: { 'yyyy-MM-dd' → number of 'present' records }
    const counts = history.reduce((acc, h) => {
        const d = format(new Date(h.date), 'yyyy-MM-dd');
        acc[d] = (acc[d] || 0) + (h.status === 'present' ? 1 : 0);
        return acc;
    }, {});

    const getColor = (day) => {
        const key = format(day, 'yyyy-MM-dd');
        const count = counts[key] || 0;
        // If we have historical schedule data for this date, use it.
        // If not (e.g. very old date before app was used), fall back to count-based.
        const hasClass = scheduledDatesMap ? scheduledDatesMap.get(key) : undefined;

        if (hasClass === false) {
            // We know this specific date had no class scheduled
            return 'rgba(255, 255, 255, 0.04)';
        }
        if (hasClass === undefined && count === 0) {
            // No schedule record for this week + no attendance = truly unknown
            return 'rgba(255, 255, 255, 0.04)';
        }
        if (hasClass === true && count === 0) {
            // Class was scheduled but user has no attendance marked
            return 'rgba(232, 92, 92, 0.3)';
        }
        // Has attendance data
        if (count >= 3) return '#E8A838';                    // 3+ classes: full gold
        if (count >= 2) return 'rgba(232, 168, 56, 0.7)';   // 2 classes: strong yellow
        return 'rgba(232, 168, 56, 0.3)';                    // 1 class: faint yellow
    };

    const getTooltip = (day) => {
        const key = format(day, 'yyyy-MM-dd');
        const count = counts[key] || 0;
        const hasClass = scheduledDatesMap?.get(key);
        if (hasClass === false) return `${key}: No class scheduled`;
        if (hasClass === true && count === 0) return `${key}: Class scheduled — not attended`;
        return `${key}: ${count} class${count !== 1 ? 'es' : ''} attended`;
    };

    return (
        <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
                <p className="text-[10px] font-black tracking-[0.2em] text-[var(--text-muted)] uppercase">Activity Heatmap (Last 12 Weeks)</p>
                <div className="flex items-center gap-2 text-[8px] font-black text-[var(--text-muted)] uppercase tracking-wider">
                    <div className="flex items-center gap-1">
                        <div className="w-2 h-2 rounded-sm" style={{ background: 'rgba(232, 92, 92, 0.3)' }} />
                        <span>Missed</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <div className="w-2 h-2 rounded-sm" style={{ background: 'rgba(255,255,255,0.04)' }} />
                        <span>No class</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <div className="w-2 h-2 rounded-sm" style={{ background: 'rgba(232,168,56,0.3)' }} />
                        <span>1 class</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <div className="w-2 h-2 rounded-sm" style={{ background: 'rgba(232,168,56,0.7)' }} />
                        <span>2 classes</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <div className="w-2 h-2 rounded-sm" style={{ background: '#E8A838' }} />
                        <span>3+ classes</span>
                    </div>
                </div>
            </div>
            <div className="grid grid-flow-col gap-1.5" style={{ gridTemplateRows: 'repeat(7, 1fr)' }}>
                {days.map(d => {
                    const ds = format(d, 'yyyy-MM-dd');
                    return (
                        <div
                            key={ds}
                            className="w-3.5 h-3.5 rounded-sm transition-colors hover:ring-1 hover:ring-white/20"
                            style={{ background: getColor(d) }}
                            title={getTooltip(d)}
                        />
                    );
                })}
            </div>
        </div>
    );
}


// ─── Study Pattern Chart ─────────────────────────────────────────────────────
function StudyPatternChart({ history }) {
    const days = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
    const dayCounts = history.reduce((acc, h) => {
        if (h.status !== 'present') return acc;
        const d = new Date(h.date).getDay();
        const normalized = (d + 6) % 7;
        acc[normalized] = (acc[normalized] || 0) + 1;
        return acc;
    }, {});

    const max = Math.max(...Object.values(dayCounts), 1);
    const topDays = Object.entries(dayCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 2)
        .map(([idx]) => days[idx]);

    const consistentText = topDays.length >= 1 
        ? `"${topDays.includes('TUE') && topDays.includes('THU') ? "You're most consistent on Tuesdays and Thursdays" : `You're most consistent on ${dayNames(topDays)}`}"`
        : "Start tracking to see your patterns";

    function dayNames(arr) {
        const fullNames = {
            'MON': 'Mondays', 'TUE': 'Tuesdays', 'WED': 'Wednesdays', 
            'THU': 'Thursdays', 'FRI': 'Fridays', 'SAT': 'Saturdays', 'SUN': 'Sundays'
        };
        return arr.map(d => fullNames[d]).join(' and ');
    }

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-xl font-bold text-white tracking-tight">Your Study Pattern</h3>
                    <p className="text-sm font-medium italic mt-1 text-[var(--secondary-accent)] opacity-80">{consistentText}</p>
                </div>
                <div className="flex gap-4">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-[var(--primary-accent)]" />
                        <span className="text-[10px] font-black text-[var(--text-muted)] tracking-widest uppercase">Weekday</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-[var(--secondary-accent)]" />
                        <span className="text-[10px] font-black text-[var(--text-muted)] tracking-widest uppercase">Weekend</span>
                    </div>
                </div>
            </div>

            <div className="flex items-end justify-between h-[280px] px-4">
                {days.map((d, i) => {
                    const count = dayCounts[i] || 0;
                    const height = (count / max) * 100;
                    const isWeekend = d === 'SAT' || d === 'SUN';
                    return (
                        <div key={d} className="flex flex-col items-center gap-4 flex-1">
                            <div className="w-full flex justify-center">
                                <div 
                                    className="w-12 rounded-lg transition-all duration-700 relative group overflow-hidden"
                                    style={{ 
                                        height: `${Math.max(height, 5)}%`, 
                                        background: isWeekend ? 'var(--secondary-accent)' : 'var(--primary-accent)',
                                        opacity: count > 0 ? 1 : 0.1
                                    }}
                                >
                                    <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity" />
                                </div>
                            </div>
                            <span className="text-[11px] font-black text-[var(--text-muted)] tracking-widest">{d}</span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

// ─── Monthly Summary Card ────────────────────────────────────────────────────
function SummaryCard({ title, stats, isCurrent }) {
    const { attendancePct, tasks, exams, maxStreak, sparkline } = stats;
    
    return (
        <div className="group relative bg-[var(--card-bg)] rounded-3xl p-8 border border-white/5 overflow-hidden">
            <div className={`absolute top-0 left-0 right-0 h-1 ${isCurrent ? 'bg-[var(--primary-accent)]' : 'bg-white/10'}`} />
            
            <div className="flex items-center justify-between mb-8">
                <h3 className="text-[11px] font-black tracking-[0.2em] text-white uppercase">{title}</h3>
                <span className={`text-[10px] font-black tracking-widest uppercase px-2 py-0.5 rounded-md ${
                    isCurrent ? 'bg-[var(--primary-accent)] text-[var(--sidebar-bg)]' : 'bg-white/10 text-[var(--text-muted)]'
                }`}>
                    {isCurrent ? 'Current' : 'Past'}
                </span>
            </div>

            <div className="grid grid-cols-2 gap-y-8">
                <div>
                    <p className="text-[10px] font-black text-[var(--text-muted)] tracking-widest uppercase mb-1">Attendance</p>
                    <p className="text-2xl font-black text-white">{attendancePct}%</p>
                </div>
                <div>
                    <p className="text-[10px] font-black text-[var(--text-muted)] tracking-widest uppercase mb-1">Tasks Done</p>
                    <p className="text-2xl font-black text-white">{tasks}</p>
                </div>
                <div>
                    <p className="text-[10px] font-black text-[var(--text-muted)] tracking-widest uppercase mb-1">Exams Taken</p>
                    <p className="text-2xl font-black text-white">{exams.toString().padStart(2, '0')}</p>
                </div>
                <div>
                    <p className="text-[10px] font-black text-[var(--text-muted)] tracking-widest uppercase mb-1">Max Streak</p>
                    <p className="text-2xl font-black text-white">{maxStreak}d</p>
                </div>
            </div>

            <div className="mt-8 pt-8 border-t border-white/5 space-y-3">
                <p className="text-[10px] font-black text-[var(--text-muted)] tracking-widest uppercase">Daily Activity Sparkline</p>
                <div className="flex gap-1 items-end h-8">
                    {sparkline.map((val, i) => (
                        <div key={i} className="flex-1 bg-white/5 rounded-full transition-all" 
                            style={{ 
                                height: `${Math.min(val * 40 + 10, 100)}%`, 
                                background: isCurrent && val > 0 ? 'var(--primary-accent)' : 'rgba(255,255,255,0.1)' 
                            }} />
                    ))}
                </div>
            </div>
        </div>
    );
}

// ─── Main Page ───────────────────────────────────────────────────────────────
export default function ProgressPage() {
    const { data: subjects = [] } = useQuery({
        queryKey: ['subjects'],
        queryFn: () => api.get('/subjects').then(r => r.data.subjects || r.data),
    });

    const { data: attendanceHistory = [] } = useQuery({
        queryKey: ['global-attendance'],
        queryFn: () => api.get('/attendance').then(r => r.data.history || r.data),
    });

    const { data: assignments = [] } = useQuery({
        queryKey: ['assignments'],
        queryFn: () => api.get('/assignments').then(r => r.data.assignments || r.data),
    });

    const { data: exams = [] } = useQuery({
        queryKey: ['exams'],
        queryFn: () => api.get('/exams').then(r => r.data.exams || r.data),
    });

    const { data: scheduleData = [] } = useQuery({
        queryKey: ['schedule'],
        queryFn: () => api.get('/schedule').then(r => r.data.schedule || []),
    });

    // ── Historical schedule for the heatmap (long-term fix) ──────────────────
    // We fetch ALL schedule docs across the last 13 weeks so the heatmap can
    // correctly color each specific date based on what was scheduled THAT week,
    // not just what is scheduled in the current active week.
    const heatmapStart = subWeeks(startOfToday(), 13); // a little extra buffer
    const { data: scheduleHistory = [] } = useQuery({
        queryKey: ['schedule-history', format(heatmapStart, 'yyyy-MM-dd')],
        queryFn: () =>
            api.get(`/schedule/history?from=${heatmapStart.toISOString()}`)
               .then(r => r.data.schedule || []),
    });

    // Build a Map<'yyyy-MM-dd', boolean> from historical schedule docs.
    // For each doc: compute the actual calendar date (weekOf + day offset),
    // then mark it true if it has slots and isn't a holiday.
    const DAY_OFFSET_MAP = {
        Monday: 0, Tuesday: 1, Wednesday: 2, Thursday: 3,
        Friday: 4, Saturday: 5, Sunday: 6,
    };
    const scheduledDatesMap = useMemo(() => {
        const map = new Map();
        for (const doc of scheduleHistory) {
            const weekOf = new Date(doc.weekOf);
            const offset = DAY_OFFSET_MAP[doc.day] ?? 0;
            const exactDate = new Date(weekOf);
            exactDate.setDate(exactDate.getDate() + offset);
            const key = format(exactDate, 'yyyy-MM-dd');
            // true = class day, false = no class (holiday or empty)
            map.set(key, !doc.isHoliday && (doc.slots || []).length > 0);
        }
        return map;
    }, [scheduleHistory]);

    const currentStreak = useMemo(() => calculateStreak(attendanceHistory), [attendanceHistory]);
    const maxStreakEver = useMemo(() => calculateMaxStreak(attendanceHistory), [attendanceHistory]);
    const totalDays = useMemo(() => getDistinctDays(attendanceHistory).length, [attendanceHistory]);
    
    // Monthly stats calculation
    const getMonthStats = (date) => {
        const start = startOfMonth(date);
        const end = endOfMonth(isToday(date) ? new Date() : endOfMonth(date));
        
        const inMonth = attendanceHistory.filter(h => isWithinInterval(new Date(h.date), { start, end }));
        const attended = inMonth.filter(h => h.status === 'present').length;
        const totalPossible = inMonth.length || 1;
        
        const tasks = assignments.filter(a => (a.status === 'completed' || a.completed) && isWithinInterval(new Date(a.updatedAt || new Date()), { start, end })).length;
        const examCount = exams.filter(e => isWithinInterval(new Date(e.date), { start, end })).length;
        
        // Max streak in month
        const monthlyMax = calculateMaxStreak(inMonth);

        // Daily activity sparkline (last 15 days of that period)
        const sparkDays = Array.from({ length: 15 }).map((_, i) => subDays(end, i)).reverse();
        const sparkline = sparkDays.map(d => inMonth.filter(h => isSameDay(new Date(h.date), d) && h.status === 'present').length);

        return {
            attendancePct: Math.round((attended / totalPossible) * 100),
            attended,
            totalPossible,
            tasks,
            exams: examCount,
            maxStreak: monthlyMax,
            sparkline
        };
    };

    const currentMonthStats = useMemo(() => getMonthStats(new Date()), [attendanceHistory, assignments, exams]);
    const prevMonthStats = useMemo(() => getMonthStats(subDays(startOfMonth(new Date()), 1)), [attendanceHistory, assignments, exams]);

    return (
        <div className="space-y-10 pb-20">
            {/* Header Area */}
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-4xl font-black text-white tracking-tighter flex items-center gap-4">
                        My Progress <Flame className="w-8 h-8 text-[var(--primary-accent)]" />
                    </h1>
                    <p className="text-sm font-medium mt-2 text-[var(--secondary-accent)]">Your consistency, visualized.</p>
                </div>
                <button className="flex items-center gap-2 px-6 py-3 rounded-xl bg-white/5 border border-white/10 text-[11px] font-black tracking-widest uppercase text-white hover:bg-white/10 transition-all">
                    <Download className="w-4 h-4 text-[var(--primary-accent)]" />
                    Export Analytics Report
                </button>
            </div>

            {/* Hero Card */}
            <div className="grid grid-cols-[1fr_400px_1fr] gap-1 bg-[var(--card-bg)] rounded-[40px] border border-white/5 overflow-hidden p-1">
                <div className="p-10 flex flex-col items-center justify-center border-r border-white/5">
                    <div className="flex items-center gap-10">
                        <Flame className="w-24 h-24 text-[var(--primary-accent)] filter drop-shadow-[0_0_20px_rgba(232,168,56,0.3)]" />
                        <div>
                            <div className="flex items-baseline gap-4">
                                <span className="text-[100px] font-black text-white font-mono leading-none">{currentStreak}</span>
                                <div className="flex flex-col">
                                    <span className="text-xs font-black tracking-[0.2em] text-[var(--text-muted)] uppercase">Day Streak</span>
                                    <span className="text-[10px] px-2 py-0.5 mt-2 rounded-md bg-[rgba(58,191,191,0.1)] text-[var(--secondary-accent)] font-bold">
                                        Active Now
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-10 border-r border-white/5 flex flex-col justify-center">
                    <Heatmap history={attendanceHistory} scheduledDatesMap={scheduledDatesMap} />
                </div>

                <div className="p-10 space-y-8 flex flex-col justify-center">
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black text-[var(--text-muted)] tracking-widest uppercase">Best Streak</span>
                        <span className="text-lg font-black text-[var(--secondary-accent)]">{maxStreakEver} days</span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black text-[var(--text-muted)] tracking-widest uppercase">Total Days</span>
                        <span className="text-lg font-black text-white">{totalDays}</span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black text-[var(--text-muted)] tracking-widest uppercase">This Month</span>
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-1.5 rounded-full bg-white/5 overflow-hidden">
                                <div className="h-full bg-[var(--secondary-accent)] rounded-full transition-all duration-1000" 
                                    style={{ width: `${currentMonthStats.attendancePct}%` }} />
                            </div>
                            <span className="text-[13px] font-black text-white">
                                {currentMonthStats.attended}/{currentMonthStats.totalPossible}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* By Subject Section */}
            <div className="space-y-6">
                <h2 className="text-[11px] font-black tracking-[0.3em] text-[var(--text-muted)] uppercase">By Subject</h2>
                <div className="grid grid-cols-4 gap-6">
                    {subjects.map(s => {
                        const subHistory = attendanceHistory.filter(h => h.subjectId === s._id);
                        const subStreak = calculateStreak(subHistory);
                        const last12Days = Array.from({ length: 12 }).map((_, i) => subDays(startOfToday(), i)).reverse();
                        
                        return (
                            <div key={s._id} className="bg-[var(--card-bg)] rounded-3xl p-6 border border-white/5 hover:border-white/10 transition-all cursor-pointer group">
                                <h3 className="text-[15px] font-bold text-white mb-2">{s.name}</h3>
                                <div className="flex items-center gap-2 mb-6">
                                    <Flame className="w-4 h-4 text-[var(--primary-accent)]" />
                                    <span className="text-[13px] font-black text-[var(--primary-accent)] uppercase">
                                        {subStreak} day streak
                                    </span>
                                </div>
                                <div className="flex gap-1.5">
                                    {last12Days.map((date, i) => {
                                        const record = subHistory.find(h => isSameDay(new Date(h.date), date));
                                        let dotColor = '#2E2E38'; // No record
                                        if (record) dotColor = record.status === 'present' ? 'var(--primary-accent)' : '#E85C5C';
                                        
                                        return (
                                            <div key={i} className="w-2 h-2 rounded-full transition-colors" 
                                                style={{ background: dotColor }}
                                                title={format(date, 'dd/MM/yyyy')} />
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Bottom Row: Charts & Summaries */}
            <div className="grid grid-cols-[1fr_400px] gap-8">
                <div className="bg-[var(--card-bg)] rounded-[40px] border border-white/5 p-10">
                    <StudyPatternChart history={attendanceHistory} />
                </div>

                <div className="space-y-8">
                    <SummaryCard 
                        title={`${format(new Date(), 'MMMM')} Summary`}
                        stats={currentMonthStats}
                        isCurrent={true}
                    />
                    <SummaryCard 
                        title={`${format(subDays(startOfMonth(new Date()), 1), 'MMMM')} Summary`}
                        stats={prevMonthStats}
                        isCurrent={false}
                    />
                </div>
            </div>
        </div>
    );
}
