import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { BookOpen, Plus, CheckCircle2, AlertCircle, XCircle, Trash2, Edit2, X, CalendarX, Clock, CalendarCheck, RefreshCw, Unlink, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';
import api from '../lib/api';
import { useToast } from '../components/common/Toast';

// ─── Week Helpers (mirrors backend logic) ─────────────────────────────────────
function getMondayOfWeek(date = new Date()) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    d.setDate(d.getDate() + diff);
    d.setHours(0, 0, 0, 0);
    return d;
}

function getActiveWeekMonday() {
    const today = new Date();
    const day = today.getDay();
    if (day === 6) {
        // Saturday → show upcoming week
        const next = getMondayOfWeek(today);
        next.setDate(next.getDate() + 7);
        return next;
    }
    return getMondayOfWeek(today);
}

// Given the Monday anchor and a day name, return the specific Date for that day
const DAY_OFFSET = { Monday: 0, Tuesday: 1, Wednesday: 2, Thursday: 3, Friday: 4, Saturday: 5, Sunday: 6 };
function getDateForDay(mondayAnchor, dayName) {
    const d = new Date(mondayAnchor);
    d.setDate(d.getDate() + DAY_OFFSET[dayName]);
    return d;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
const SUBJECT_COLORS = ['#3b82f6', '#f97316', '#ef4444', '#8b5cf6', '#22c55e', '#ec4899', '#06b6d4'];
const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const DAY_SHORT = { Monday: 'Mon', Tuesday: 'Tue', Wednesday: 'Wed', Thursday: 'Thu', Friday: 'Fri', Saturday: 'Sat', Sunday: 'Sun' };
const SLOT_COLORS = ['#3b82f6', '#f97316', '#ef4444', '#8b5cf6', '#22c55e', '#ec4899', '#06b6d4', '#3ABFBF'];

function getSlotColor(name) {
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    return SLOT_COLORS[Math.abs(hash) % SLOT_COLORS.length];
}

const STATUS_STYLE = {
    safe: { label: 'SAFE', color: '#3b82f6', bg: '#3b82f620', icon: CheckCircle2 },
    warning: { label: 'WARNING', color: '#f97316', bg: '#f9731620', icon: AlertCircle },
    danger: { label: 'DANGER', color: '#ef4444', bg: '#ef444420', icon: XCircle },
};

// ─── Custom Time Picker ───────────────────────────────────────────────────────
function TimeInput({ value, onChange, label, align = "left" }) {
    const [isOpen, setIsOpen] = useState(false);
    const hours = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));
    const minutes = ['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55'];

    const [h, m] = (value || '00:00').split(':');

    return (
        <div className="relative">
            <label className="text-[9px] font-black uppercase tracking-widest mb-1 block opacity-40 ml-1">{label}</label>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-center gap-2 px-2 py-2 rounded-xl bg-black/20 border transition-all text-[11px] font-bold"
                style={{ borderColor: isOpen ? 'hsl(43 96% 56%)' : 'hsl(240 6% 20%)', color: value ? 'white' : 'hsl(240 5% 45%)' }}
            >
                                <Clock className="w-3.5 h-3.5 text-yellow-500/80" />
                <span>{value || "--:--"}</span>
            </button>

            {isOpen && (
                <>
                    <div className="fixed inset-0 z-[110]" onClick={() => setIsOpen(false)} />
                    <div className={`absolute bottom-[calc(100%+12px)] ${align === "right" ? "right-0" : "left-0"} z-[120] w-40 p-3 rounded-2xl shadow-2xl border flex flex-col gap-3 backdrop-blur-md`}
                        style={{ background: 'hsl(240 10% 9% / 0.95)', borderColor: 'hsl(240 6% 25%)' }}>
                        
                        <div className="flex gap-2">
                            {/* Hours */}
                            <div className="flex-1 flex flex-col">
                                <p className="text-[10px] font-black uppercase text-white/20 mb-2 ml-2">Hour</p>
                                <div className="h-40 overflow-y-auto pr-1 custom-scrollbar scroll-smooth">
                                    {hours.map(hour => (
                                        <button
                                            key={hour}
                                            type="button"
                                            onClick={() => onChange(`${hour}:${m || '00'}`)}
                                            className={`w-full text-left px-2 py-1.5 rounded-lg text-xs font-bold transition-colors mb-1 ${h === hour ? 'bg-yellow-500 text-black' : 'hover:bg-white/5 text-white/70'}`}
                                        >
                                            {hour}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            {/* Minutes */}
                            <div className="flex-1 flex flex-col">
                                <p className="text-[10px] font-black uppercase text-white/20 mb-2 ml-2">Min</p>
                                <div className="h-40 overflow-y-auto pr-1 custom-scrollbar scroll-smooth">
                                    {minutes.map(min => (
                                        <button
                                            key={min}
                                            type="button"
                                            onClick={() => {
                                                onChange(`${h || '00'}:${min}`);
                                                setIsOpen(false);
                                            }}
                                            className={`w-full text-left px-2 py-1.5 rounded-lg text-xs font-bold transition-colors mb-1 ${m === min ? 'bg-yellow-500 text-black' : 'hover:bg-white/5 text-white/70'}`}
                                        >
                                            {min}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}

// ─── Weekly Schedule Component ────────────────────────────────────────────────
function WeeklySchedule({ subjects = [] }) {
    const queryClient = useQueryClient();
    const { showToast } = useToast();
    const [addingDay, setAddingDay] = useState(null);
    const [form, setForm] = useState({ subjectName: '', startTime: '', endTime: '', room: '' });

    const handleSubjectNameChange = (val) => {
        let newName = val;
        let newStartTime = form.startTime;
        let newEndTime = form.endTime;

        // Try to detect time pattern like "09:30-10:45" or "9:30 - 10:45"
        const timeRegex = /([01]?\d|2[0-3])[:.]([0-5]\d)\s*-\s*([01]?\d|2[0-3])[:.]([0-5]\d)/;
        const match = val.match(timeRegex);

        if (match) {
            newStartTime = `${match[1].padStart(2, '0')}:${match[2]}`;
            newEndTime = `${match[3].padStart(2, '0')}:${match[4]}`;

            // Clean up the name (remove the time part)
            newName = val.replace(timeRegex, '').trim();
        }

        setForm({ ...form, subjectName: newName, startTime: newStartTime, endTime: newEndTime });
    };

    const { data, isLoading } = useQuery({
        queryKey: ['schedule'],
        queryFn: () => api.get('/schedule').then(r => r.data.schedule),
    });

    const addSlotMutation = useMutation({
        mutationFn: ({ day, slot }) => api.post(`/schedule/${day}/slots`, slot),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['schedule'] });
            setAddingDay(null);
            setForm({ subjectName: '', startTime: '', endTime: '', room: '' });
        },
        onError: (err) => showToast(err.response?.data?.message || 'Failed to add class slot', 'error'),
    });

    const deleteSlotMutation = useMutation({
        mutationFn: ({ day, slotId }) => api.delete(`/schedule/${day}/slots/${slotId}`),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['schedule'] }),
        onError: (err) => showToast(err.response?.data?.message || 'Failed to delete class slot', 'error'),
    });

    const toggleHolidayMutation = useMutation({
        mutationFn: ({ day, isHoliday }) => api.patch(`/schedule/${day}/holiday`, { isHoliday }),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['schedule'] }),
        onError: (err) => showToast(err.response?.data?.message || 'Failed to update holiday', 'error'),
    });

    const handleAddSlot = (e, day) => {
        e.preventDefault();
        if (!form.subjectName || !form.startTime || !form.endTime) return;
        
        // Time validation: Ensure end time is after start time
        if (form.startTime >= form.endTime) {
            showToast('End time must be after start time', 'error');
            return;
        }

        addSlotMutation.mutate({ day, slot: form });
    };

    const schedule = data || [];

    const weekMonday = getActiveWeekMonday();
    const weekSunday = new Date(weekMonday);
    weekSunday.setDate(weekSunday.getDate() + 6);
    const isCurrentWeekSaturday = new Date().getDay() === 6;

    return (
        <div className="mt-10">
            {/* Section Header */}
            <div className="mb-6">
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                            <Clock className="w-6 h-6" style={{ color: 'hsl(43 96% 56%)' }} />
                            Weekly Schedule
                        </h2>
                        <p className="text-sm mt-1" style={{ color: 'hsl(240 5% 50%)' }}>
                            Your class schedule is specific to this week and resets every Saturday.
                        </p>
                    </div>
                    {/* Week Range Badge */}
                    <div className="flex-shrink-0 px-4 py-2 rounded-xl border text-center"
                        style={{ background: isCurrentWeekSaturday ? 'rgba(232,168,56,0.08)' : 'hsl(240 6% 12%)', borderColor: isCurrentWeekSaturday ? 'rgba(232,168,56,0.3)' : 'hsl(240 6% 20%)' }}>
                        <p className="text-[10px] font-black uppercase tracking-widest mb-0.5" style={{ color: isCurrentWeekSaturday ? 'hsl(43 96% 56%)' : 'hsl(240 5% 50%)' }}>
                            {isCurrentWeekSaturday ? '⚡ Upcoming Week' : 'Current Week'}
                        </p>
                        <p className="text-xs font-bold text-white">
                            {format(weekMonday, 'MMM d')} – {format(weekSunday, 'MMM d, yyyy')}
                        </p>
                    </div>
                </div>
            </div>

            {isLoading ? (
                <div className="py-10 text-center animate-pulse" style={{ color: 'hsl(240 5% 50%)' }}>Loading schedule...</div>
            ) : (
                <div className="grid grid-cols-7 gap-3">
                    {DAYS.map(day => {
                        const dayData = schedule.find(d => d.day === day) || { day, isHoliday: false, slots: [] };
                        const isHoliday = dayData.isHoliday;

                        return (
                            <div
                                key={day}
                                className="rounded-2xl flex flex-col min-h-[260px]"
                                style={{
                                    background: isHoliday ? 'hsl(240 8% 8%)' : 'hsl(240 10% 9%)',
                                    border: `1px solid ${isHoliday ? 'hsl(0 60% 25%)' : 'hsl(240 6% 15%)'}`,
                                    opacity: isHoliday ? 0.7 : 1,
                                }}
                            >
                                {/* Day Header */}
                                <div
                                    className="px-3 py-2.5 flex items-center justify-between"
                                    style={{ background: isHoliday ? 'rgba(232,92,92,0.12)' : 'hsl(240 6% 12%)' }}
                                >
                                    <div className="flex flex-col">
                                        <span className="text-[13px] font-black tracking-widest uppercase leading-tight" style={{ color: isHoliday ? '#E85C5C' : 'white' }}>
                                            {DAY_SHORT[day]}
                                        </span>
                                        <span className="text-[10px] font-semibold" style={{ color: isHoliday ? 'hsl(0 50% 55%)' : 'hsl(240 5% 40%)' }}>
                                            {format(getDateForDay(weekMonday, day), 'MMM d')}
                                        </span>
                                    </div>
                                    <button
                                        onClick={() => toggleHolidayMutation.mutate({ day, isHoliday: !isHoliday })}
                                        title={isHoliday ? 'Unmark holiday' : 'Mark as holiday'}
                                        className="p-1 rounded-md transition-colors hover:bg-white/10"
                                        style={{ color: isHoliday ? '#E85C5C' : 'hsl(240 5% 45%)' }}
                                    >
                                        <CalendarX className="w-3.5 h-3.5" />
                                    </button>
                                </div>

                                {/* Slots List */}
                                <div className="flex flex-col gap-2 p-2 flex-1">
                                    {isHoliday ? (
                                        <div className="flex-1 flex flex-col items-center justify-center gap-1 py-4">
                                            <CalendarX className="w-5 h-5" style={{ color: '#E85C5C' }} />
                                            <span className="text-[10px] font-bold text-center uppercase tracking-wider" style={{ color: 'hsl(0 60% 55%)' }}>Holiday</span>
                                        </div>
                                    ) : (
                                        <>
                                            {dayData.slots.length === 0 && addingDay !== day && (
                                                <div className="flex-1 flex items-center justify-center">
                                                    <span className="text-[11px] font-medium" style={{ color: 'hsl(240 5% 35%)' }}>No classes</span>
                                                </div>
                                            )}

                                            {dayData.slots.map(slot => {
                                                const color = getSlotColor(slot.subjectName);
                                                return (
                                                    <div
                                                        key={slot._id}
                                                        className="relative rounded-xl p-2.5 group"
                                                        style={{ background: `${color}14`, border: `1px solid ${color}30` }}
                                                    >
                                                        <button
                                                            onClick={() => deleteSlotMutation.mutate({ day, slotId: slot._id })}
                                                            className="absolute top-1 right-1 p-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500/20"
                                                            style={{ color: '#E85C5C' }}
                                                        >
                                                            <X className="w-3 h-3" />
                                                        </button>
                                                        <p className="text-[12px] font-bold leading-tight pr-4 truncate" style={{ color }}>{slot.subjectName}</p>
                                                        <p className="text-[10px] font-semibold mt-1" style={{ color: 'hsl(240 5% 55%)' }}>{slot.startTime} – {slot.endTime}</p>
                                                        {slot.room && <p className="text-[9px] font-medium mt-0.5 truncate" style={{ color: 'hsl(240 5% 45%)' }}>{slot.room}</p>}
                                                    </div>
                                                );
                                            })}

                                            {/* Inline Add Form */}
                                            {addingDay === day ? (
                                                <form onSubmit={(e) => handleAddSlot(e, day)} className="space-y-1.5 mt-1 p-2 rounded-xl" style={{ background: 'hsl(240 6% 12%)', border: '1px solid hsl(240 6% 20%)' }}>
                                                    <input
                                                        autoFocus
                                                        placeholder="Subject name* (e.g. Maths 09:30-10:45)"
                                                        value={form.subjectName}
                                                        onChange={e => handleSubjectNameChange(e.target.value)}
                                                        list="subject-suggestions"
                                                        required
                                                        className="w-full px-2 py-1.5 rounded-lg text-[11px] font-bold bg-black/30 border text-white focus:outline-none"
                                                        style={{ borderColor: 'hsl(240 6% 20%)' }}
                                                        onFocus={e => e.target.style.borderColor = 'hsl(43 96% 56%)'}
                                                        onBlur={e => e.target.style.borderColor = 'hsl(240 6% 20%)'}
                                                    />
                                                    <datalist id="subject-suggestions">
                                                        {subjects.map(s => (
                                                            <option key={s._id} value={s.name} />
                                                        ))}
                                                    </datalist>
                                                    <div className="flex flex-col gap-2 pt-1">
                                                        {form.startTime && form.endTime && form.startTime >= form.endTime && (
                                                            <div className="flex items-center gap-1 text-[9px] font-black uppercase text-red-500 mb-1 ml-1 animate-pulse">
                                                                <AlertCircle className="w-3 h-3" />
                                                                End time is before start time
                                                            </div>
                                                        )}
                                                        <TimeInput
                                                            label="Start"
                                                            value={form.startTime}
                                                            onChange={val => setForm({ ...form, startTime: val })}
                                                        />
                                                        <TimeInput
                                                            label="End"
                                                            value={form.endTime}
                                                            onChange={val => setForm({ ...form, endTime: val })}
                                                            align="left"
                                                        />
                                                    </div>
                                                    <div className="pt-1">
                                                        <label className="text-[9px] font-black uppercase tracking-widest mb-1 block opacity-40 ml-1">Location</label>
                                                        <input
                                                            placeholder="Room (optional)"
                                                            value={form.room}
                                                            onChange={e => setForm({ ...form, room: e.target.value })}
                                                            className="w-full px-3 py-2 rounded-xl text-[11px] font-medium bg-black/20 border text-white focus:outline-none transition-all"
                                                            style={{ borderColor: "hsl(240 6% 20%)" }}
                                                            onFocus={e => e.target.style.borderColor = "hsl(43 96% 56%)"}
                                                            onBlur={e => e.target.style.borderColor = "hsl(240 6% 20%)"}
                                                        />
                                                    </div>
                                                    <div className="flex gap-1 pt-0.5">
                                                        <button
                                                            type="button"
                                                            onClick={() => { setAddingDay(null); setForm({ subjectName: '', startTime: '', endTime: '', room: '' }); }}
                                                            className="flex-1 py-1.5 rounded-lg text-[10px] font-bold transition-colors hover:bg-white/5"
                                                            style={{ color: 'hsl(240 5% 50%)' }}
                                                        >
                                                            Cancel
                                                        </button>
                                                        <button
                                                            type="submit"
                                                            disabled={addSlotMutation.isPending}
                                                            className="flex-1 py-1.5 rounded-lg text-[10px] font-black transition-all active:scale-95 disabled:opacity-50"
                                                            style={{ background: 'hsl(43 96% 56%)', color: 'hsl(240 5.9% 10%)' }}
                                                        >
                                                            Add
                                                        </button>
                                                    </div>
                                                </form>
                                            ) : (
                                                <button
                                                    onClick={() => setAddingDay(day)}
                                                    className="w-full mt-auto py-2 rounded-xl flex items-center justify-center gap-1 transition-colors hover:bg-white/5 border border-dashed"
                                                    style={{ borderColor: 'hsl(240 6% 20%)', color: 'hsl(240 5% 40%)' }}
                                                >
                                                    <Plus className="w-3.5 h-3.5" />
                                                    <span className="text-[11px] font-bold">Add</span>
                                                </button>
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

// ─── Google Calendar Sync Panel ───────────────────────────────────────────────
function GoogleCalendarSync() {
    const { showToast } = useToast();
    const queryClient = useQueryClient();

    const { data: statusData, isLoading: statusLoading, refetch: refetchStatus } = useQuery({
        queryKey: ['google-calendar-status'],
        queryFn: () => api.get('/google/status').then(r => r.data),
        retry: false,
    });

    const connected = statusData?.connected ?? false;

    const handleConnect = useCallback(async () => {
        try {
            const { data } = await api.get('/google/auth-url');
            const popup = window.open(data.url, 'googleOAuth', 'width=520,height=620');

            const listener = (event) => {
                if (event.data === 'google-auth-success') {
                    window.removeEventListener('message', listener);
                    popup?.close();
                    refetchStatus();
                    showToast('Google Calendar connected!', 'success');
                }
            };
            window.addEventListener('message', listener);
        } catch (err) {
            showToast('Failed to start Google OAuth', 'error');
        }
    }, [refetchStatus, showToast]);

    const syncMutation = useMutation({
        mutationFn: () => api.post('/google/sync'),
        onSuccess: (res) => showToast(res.data.message, 'success'),
        onError: (err) => showToast(err.response?.data?.message || 'Sync failed', 'error'),
    });

    const disconnectMutation = useMutation({
        mutationFn: () => api.delete('/google/disconnect'),
        onSuccess: () => {
            refetchStatus();
            showToast('Google Calendar disconnected', 'success');
        },
        onError: (err) => showToast(err.response?.data?.message || 'Disconnect failed', 'error'),
    });

    return (
        <div
            className="rounded-2xl p-5 flex items-center justify-between gap-6 mb-8"
            style={{
                background: connected
                    ? 'linear-gradient(135deg, rgba(66,133,244,0.1), rgba(52,168,83,0.08))'
                    : 'hsl(240 10% 9%)',
                border: `1px solid ${connected ? 'rgba(66,133,244,0.3)' : 'hsl(240 6% 18%)'}`,
            }}
        >
            {/* Left: Icon + Text */}
            <div className="flex items-center gap-4">
                <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{
                        background: connected ? 'rgba(66,133,244,0.15)' : 'hsl(240 6% 14%)',
                        border: `1px solid ${connected ? 'rgba(66,133,244,0.3)' : 'hsl(240 6% 22%)'}`,
                    }}
                >
                    <CalendarCheck
                        className="w-5 h-5"
                        style={{ color: connected ? '#4285F4' : 'hsl(240 5% 45%)' }}
                    />
                </div>
                <div>
                    <p className="text-sm font-bold text-white tracking-tight">Google Calendar Sync</p>
                    {statusLoading ? (
                        <p className="text-xs mt-0.5 animate-pulse" style={{ color: 'hsl(240 5% 50%)' }}>Checking status...</p>
                    ) : connected ? (
                        <p className="text-xs mt-0.5" style={{ color: '#34A853' }}>
                            ✓ Connected — your schedule syncs to Google Calendar
                        </p>
                    ) : (
                        <p className="text-xs mt-0.5" style={{ color: 'hsl(240 5% 50%)' }}>
                            Connect to push your weekly timetable to Google Calendar
                        </p>
                    )}
                </div>
            </div>

            {/* Right: Action Buttons */}
            <div className="flex items-center gap-2 flex-shrink-0">
                {connected ? (
                    <>
                        <button
                            onClick={() => syncMutation.mutate()}
                            disabled={syncMutation.isPending}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all active:scale-95 disabled:opacity-50"
                            style={{ background: 'rgba(66,133,244,0.15)', color: '#4285F4', border: '1px solid rgba(66,133,244,0.3)' }}
                            title="Push your 8-Track schedule to Google Calendar as recurring events"
                        >
                            <RefreshCw className={`w-3.5 h-3.5 ${syncMutation.isPending ? 'animate-spin' : ''}`} />
                            {syncMutation.isPending ? 'Syncing...' : 'Sync Now'}
                        </button>
                        <button
                            onClick={() => disconnectMutation.mutate()}
                            disabled={disconnectMutation.isPending}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all active:scale-95 disabled:opacity-50 hover:bg-red-500/10"
                            style={{ color: 'hsl(240 5% 50%)', border: '1px solid hsl(240 6% 22%)' }}
                            title="Disconnect Google Calendar"
                        >
                            <Unlink className="w-3.5 h-3.5" />
                            Disconnect
                        </button>
                    </>
                ) : (
                    <button
                        onClick={handleConnect}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all hover:scale-105 active:scale-95"
                        style={{ background: '#4285F4', color: 'white' }}
                    >
                        <ExternalLink className="w-3.5 h-3.5" />
                        Connect Google
                    </button>
                )}
            </div>
        </div>
    );
}

// ─── Subjects Page ───────────────────────────────────────────────────────────
export default function SubjectsPage() {
    const queryClient = useQueryClient();
    const { showToast } = useToast();
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [editingSubject, setEditingSubject] = useState(null);

    // Form state
    const [formData, setFormData] = useState({ 
        name: '', 
        totalExpectedClasses: '',
        code: '',
        professor: '',
        credits: '',
        semester: ''
    });

    const openModal = (subject = null) => {
        if (subject) {
            setEditingSubject(subject);
            setFormData({ 
                name: subject.name, 
                totalExpectedClasses: subject.totalExpectedClasses || '',
                code: subject.code || '',
                professor: subject.professor || '',
                credits: subject.credits || '',
                semester: subject.semester || ''
            });
        } else {
            setEditingSubject(null);
            setFormData({ 
                name: '', 
                totalExpectedClasses: '',
                code: '',
                professor: '',
                credits: '',
                semester: ''
            });
        }
        setIsAddModalOpen(true);
    };

    const closeModal = () => {
        setIsAddModalOpen(false);
        setEditingSubject(null);
        setFormData({ 
            name: '', 
            totalExpectedClasses: '',
            code: '',
            professor: '',
            credits: '',
            semester: ''
        });
    };

    // ── Queries and Mutations ──
    const { data: subjects = [], isLoading } = useQuery({
        queryKey: ['subjects'],
        queryFn: () => api.get('/subjects').then(r => r.data.subjects || r.data),
    });

    const createMutation = useMutation({
        mutationFn: (data) => api.post('/subjects', data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['subjects'] });
            closeModal();
        },
        onError: (err) => showToast(err.response?.data?.message || 'Failed to create subject', 'error'),
    });

    const updateMutation = useMutation({
        mutationFn: (data) => api.put(`/subjects/${editingSubject._id}`, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['subjects'] });
            closeModal();
        },
        onError: (err) => showToast(err.response?.data?.message || 'Failed to update subject', 'error'),
    });

    const deleteMutation = useMutation({
        mutationFn: (id) => api.delete(`/subjects/${id}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['subjects'] });
        },
        onError: (err) => showToast(err.response?.data?.message || 'Failed to delete subject', 'error'),
    });

    // ── Handlers ──
    const handleSubmit = (e) => {
        e.preventDefault();
        const payload = {
            name: formData.name,
            totalExpectedClasses: formData.totalExpectedClasses ? parseInt(formData.totalExpectedClasses, 10) : 0,
            code: formData.code,
            professor: formData.professor,
            credits: formData.credits ? parseInt(formData.credits, 10) : 0,
            semester: formData.semester ? parseInt(formData.semester, 10) : 1,
        };

        if (editingSubject) {
            updateMutation.mutate(payload);
        } else {
            createMutation.mutate(payload);
        }
    };

    return (
        <div className="space-y-6 max-w-6xl">
            {/* ── Header ── */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                        <BookOpen className="w-6 h-6" style={{ color: 'hsl(43 96% 56%)' }} />
                        My Subjects
                    </h2>
                    <p className="text-sm mt-1" style={{ color: 'hsl(240 5% 50%)' }}>
                        Manage your courses and tracking parameters
                    </p>
                </div>
                <button
                    onClick={() => openModal()}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold transition-all hover:scale-105 active:scale-95"
                    style={{ background: 'hsl(43 96% 56%)', color: 'hsl(240 5.9% 10%)' }}
                >
                    <Plus className="w-4 h-4" />
                    Add Subject
                </button>
            </div>

            {/* ── Content ── */}
            {isLoading ? (
                <div className="py-20 text-center" style={{ color: 'hsl(240 5% 50%)' }}>Loading subjects...</div>
            ) : subjects.length === 0 ? (
                <div className="py-20 text-center rounded-2xl border border-dashed"
                    style={{ background: 'hsl(240 10% 9%)', borderColor: 'hsl(240 6% 20%)' }}>
                    <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center"
                        style={{ background: 'hsl(240 6% 12%)' }}>
                        <BookOpen className="w-8 h-8" style={{ color: 'hsl(240 5% 40%)' }} />
                    </div>
                    <h3 className="text-lg font-bold text-white mb-1">No subjects found</h3>
                    <p className="text-sm mb-6" style={{ color: 'hsl(240 5% 50%)' }}>Add your first subject to start tracking attendance.</p>
                    <button
                        onClick={() => openModal()}
                        className="px-5 py-2 rounded-lg text-sm font-semibold transition-colors"
                        style={{ border: '1px solid hsl(43 96% 56%)', color: 'hsl(43 96% 56%)' }}
                    >
                        Add Subject
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {subjects.map((sub, i) => {
                        const color = SUBJECT_COLORS[i % SUBJECT_COLORS.length];
                        const status = sub.status || 'danger';
                        const st = STATUS_STYLE[status];
                        const StatusIcon = st.icon;

                        return (
                            <div key={sub._id} className="relative rounded-2xl p-5 overflow-hidden group"
                                style={{ background: 'hsl(240 10% 9%)', border: '1px solid hsl(240 6% 15%)' }}>

                                {/* Top Accent Bar */}
                                <div className="absolute top-0 left-0 right-0 h-1" style={{ background: color }} />

                                <div className="flex items-start justify-between mb-4 gap-4">
                                    <h3 className="text-lg font-bold text-white leading-tight break-all flex-1 min-w-0">{sub.name}</h3>

                                    {/* Action Menu Buttons */}
                                    <div className="flex gap-1 shrink-0 transition-opacity translate-y-[-2px]">
                                        <button onClick={() => openModal(sub)} className="p-1.5 rounded bg-black/40 hover:bg-black/80 text-white transition-colors">
                                            <Edit2 className="w-3.5 h-3.5" />
                                        </button>
                                        <button onClick={() => {
                                            if (window.confirm('Delete this subject and all its attendance?')) {
                                                deleteMutation.mutate(sub._id);
                                            }
                                        }} className="p-1.5 rounded bg-black/40 hover:bg-red-500/80 text-white transition-colors">
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                </div>

                                {/* Stats Grid */}
                                <div className="grid grid-cols-2 gap-3 mb-4">
                                    <div className="p-3 rounded-xl" style={{ background: 'hsl(240 6% 12%)' }}>
                                        <p className="text-xs font-semibold mb-1" style={{ color: 'hsl(240 5% 55%)' }}>ATTENDED</p>
                                        <p className="text-xl font-black text-white">{sub.attendedClasses} <span className="text-sm font-medium" style={{ color: 'hsl(240 5% 45%)' }}>/ {sub.totalClasses}</span></p>
                                    </div>
                                    <div className="p-3 rounded-xl" style={{ background: 'hsl(240 6% 12%)' }}>
                                        <p className="text-xs font-semibold mb-1" style={{ color: 'hsl(240 5% 55%)' }}>PERCENTAGE</p>
                                        <p className="text-xl font-black text-white">{Math.round(sub.percentage ?? 0)}%</p>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between mt-auto pt-2">
                                    {/* Status Badge */}
                                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md"
                                        style={{ background: st.bg, color: st.color }}>
                                        <StatusIcon className="w-3.5 h-3.5" />
                                        <span className="text-xs font-bold">{st.label}</span>
                                    </div>

                                    {/* Target Check */}
                                    {sub.totalExpectedClasses > 0 && (
                                        <div className="text-xs font-medium" style={{ color: 'hsl(240 5% 50%)' }}>
                                            Target: {sub.totalExpectedClasses} classes
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* ── Weekly Schedule Section ── */}
            <GoogleCalendarSync />
            <WeeklySchedule subjects={subjects} />

            {/* ── Modal ── */}
            {isAddModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="w-full max-w-md rounded-2xl shadow-2xl overflow-hidden"
                        style={{ background: 'hsl(240 10% 9%)', border: '1px solid hsl(240 6% 15%)' }}>

                        <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: 'hsl(240 6% 15%)' }}>
                            <h3 className="text-lg font-bold text-white">
                                {editingSubject ? 'Edit Subject' : 'Add New Subject'}
                            </h3>
                            <button onClick={closeModal} className="p-1 rounded-lg hover:bg-white/5 transition-colors">
                                <X className="w-5 h-5" style={{ color: 'hsl(240 5% 50%)' }} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-5 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-black uppercase tracking-widest mb-1.5 opacity-40 ml-1">Course Code</label>
                                    <input
                                        type="text"
                                        value={formData.code}
                                        onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                                        placeholder="e.g. CS201"
                                        className="w-full px-4 py-2.5 rounded-xl text-sm bg-black/20 border text-white transition-all focus:outline-none"
                                        style={{ borderColor: 'hsl(240 6% 20%)' }}
                                        onFocus={(e) => e.target.style.borderColor = 'hsl(43 96% 56%)'}
                                        onBlur={(e) => e.target.style.borderColor = 'hsl(240 6% 20%)'}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-black uppercase tracking-widest mb-1.5 opacity-40 ml-1">Credits</label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={formData.credits}
                                        onChange={(e) => setFormData({ ...formData, credits: e.target.value })}
                                        placeholder="e.g. 3"
                                        className="w-full px-4 py-2.5 rounded-xl text-sm bg-black/20 border text-white transition-all focus:outline-none"
                                        style={{ borderColor: 'hsl(240 6% 20%)' }}
                                        onFocus={(e) => e.target.style.borderColor = 'hsl(43 96% 56%)'}
                                        onBlur={(e) => e.target.style.borderColor = 'hsl(240 6% 20%)'}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-black uppercase tracking-widest mb-1.5 opacity-40 ml-1">Subject Name*</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="e.g. Data Structure & Algorithm"
                                    className="w-full px-4 py-2.5 rounded-xl text-sm bg-black/20 border text-white transition-all focus:outline-none"
                                    style={{ borderColor: 'hsl(240 6% 20%)' }}
                                    onFocus={(e) => e.target.style.borderColor = 'hsl(43 96% 56%)'}
                                    onBlur={(e) => e.target.style.borderColor = 'hsl(240 6% 20%)'}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-black uppercase tracking-widest mb-1.5 opacity-40 ml-1">Professor</label>
                                    <input
                                        type="text"
                                        value={formData.professor}
                                        onChange={(e) => setFormData({ ...formData, professor: e.target.value })}
                                        placeholder="e.g. Dr. Sharma"
                                        className="w-full px-4 py-2.5 rounded-xl text-sm bg-black/20 border text-white transition-all focus:outline-none"
                                        style={{ borderColor: 'hsl(240 6% 20%)' }}
                                        onFocus={(e) => e.target.style.borderColor = 'hsl(43 96% 56%)'}
                                        onBlur={(e) => e.target.style.borderColor = 'hsl(240 6% 20%)'}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-black uppercase tracking-widest mb-1.5 opacity-40 ml-1">Semester</label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={formData.semester}
                                        onChange={(e) => setFormData({ ...formData, semester: e.target.value })}
                                        placeholder="e.g. 1"
                                        className="w-full px-4 py-2.5 rounded-xl text-sm bg-black/20 border text-white transition-all focus:outline-none"
                                        style={{ borderColor: 'hsl(240 6% 20%)' }}
                                        onFocus={(e) => e.target.style.borderColor = 'hsl(43 96% 56%)'}
                                        onBlur={(e) => e.target.style.borderColor = 'hsl(240 6% 20%)'}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold mb-1.5" style={{ color: 'hsl(240 5% 70%)' }}>
                                    Total Expected Classes (Optional)
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    value={formData.totalExpectedClasses}
                                    onChange={(e) => setFormData({ ...formData, totalExpectedClasses: e.target.value })}
                                    placeholder="Enter total classes for the sem..."
                                    className="w-full px-4 py-2.5 rounded-lg text-sm bg-black/20 border text-white transition-colors focus:outline-none"
                                    style={{ borderColor: 'hsl(240 6% 20%)' }}
                                    onFocus={(e) => e.target.style.borderColor = 'hsl(43 96% 56%)'}
                                    onBlur={(e) => e.target.style.borderColor = 'hsl(240 6% 20%)'}
                                />
                                <p className="text-xs mt-1.5" style={{ color: 'hsl(240 5% 45%)' }}>
                                    Set this if you know exactly how many classes there will be this semester/year.
                                </p>
                            </div>

                            <div className="pt-2 flex gap-3">
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    className="flex-1 py-2.5 rounded-lg text-sm font-semibold transition-colors hover:bg-white/5"
                                    style={{ color: 'hsl(240 5% 60%)' }}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={createMutation.isPending || updateMutation.isPending}
                                    className="flex-1 py-2.5 rounded-lg text-sm font-bold transition-transform active:scale-95 disabled:opacity-50"
                                    style={{ background: 'hsl(43 96% 56%)', color: 'hsl(240 5.9% 10%)' }}
                                >
                                    {createMutation.isPending || updateMutation.isPending ? 'Saving...' : 'Save Subject'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}












