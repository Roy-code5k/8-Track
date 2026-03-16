import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    Play, Pause, RotateCcw, SkipForward, Loader2,
    CheckCircle2, Circle, MoreVertical, Plus, Settings2, X
} from 'lucide-react';
import api from '../lib/api';

export default function FocusPage() {
    const queryClient = useQueryClient();

    // ─── Query / Mutation ────────────────────────────────────────────────────
    const { data: tasks = [], isLoading } = useQuery({
        queryKey: ['tasks'],
        queryFn: () => api.get('/tasks').then(r => r.data.tasks || r.data),
    });

    const addMutation = useMutation({
        mutationFn: (data) => api.post('/tasks', data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tasks'] });
            closeAddModal();
        },
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }) => api.put(`/tasks/${id}`, data),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks'] }),
    });

    const deleteMutation = useMutation({
        mutationFn: (id) => api.delete(`/tasks/${id}`),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks'] }),
    });

    // ─── Local State ─────────────────────────────────────────────────────────
    const [activeTaskId, setActiveTaskId] = useState(null);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

    // Form State
    const [taskForm, setTaskForm] = useState({ title: '', subject: '', priority: 'medium', estimatedMinutes: 25 });
    const [tempSettings, setTempSettings] = useState({ work: 25, short: 5, long: 15 });

    // Settings
    const [timerSettings, setTimerSettings] = useState({ work: 25, short: 5, long: 15 });
    const [autoStartBreak, setAutoStartBreak] = useState(false);
    const [playSound, setPlaySound] = useState(true);

    // Timer State
    const [mode, setMode] = useState('work'); // 'work', 'short', 'long'
    const [timeLeft, setTimeLeft] = useState(timerSettings.work * 60);
    const [isRunning, setIsRunning] = useState(false);
    const [sessionCount, setSessionCount] = useState(1);
    
    // Stats State
    const [focusTimeSec, setFocusTimeSec] = useState(0);

    const timerRef = useRef(null);

    // ─── Sort Tasks by Priority ──────────────────────────────────────────────
    const priorityWeight = { high: 3, medium: 2, low: 1 };
    
    const pendingTasks = [...tasks]
        .filter(t => !t.completed)
        .sort((a, b) => priorityWeight[b.priority] - priorityWeight[a.priority]);
        
    const completedTasks = tasks.filter(t => t.completed);
    
    const activeTask = tasks.find(t => t._id === activeTaskId) || pendingTasks[0];

    // ─── Timer Logic ─────────────────────────────────────────────────────────
    const getTotalTime = () => {
        if (mode === 'work') return timerSettings.work * 60;
        if (mode === 'short') return timerSettings.short * 60;
        return timerSettings.long * 60;
    };

    // Update timeleft if settings change while timer is stopped
    useEffect(() => {
        if (!isRunning) {
            setTimeLeft(getTotalTime());
        }
    }, [timerSettings, mode]);

    useEffect(() => {
        if (isRunning) {
            timerRef.current = setInterval(() => {
                setTimeLeft((prev) => {
                    if (prev <= 1) {
                        handleTimerComplete();
                        return 0;
                    }
                    if (mode === 'work') {
                        setFocusTimeSec(s => s + 1);
                    }
                    return prev - 1;
                });
            }, 1000);
        } else {
            clearInterval(timerRef.current);
        }
        return () => clearInterval(timerRef.current);
    }, [isRunning, mode, timerSettings]);

    const handleTimerComplete = () => {
        setIsRunning(false);
        if (playSound) {
            const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
            audio.play().catch(() => {});
        }

        if (mode === 'work') {
            if (sessionCount % 4 === 0) {
                switchMode('long');
            } else {
                switchMode('short');
            }
            if (autoStartBreak) setIsRunning(true);
        } else {
            setSessionCount(s => s + 1);
            switchMode('work');
        }
    };

    const switchMode = (newMode) => {
        setMode(newMode);
        setIsRunning(false);
        if (newMode === 'work') setTimeLeft(timerSettings.work * 60);
        else if (newMode === 'short') setTimeLeft(timerSettings.short * 60);
        else setTimeLeft(timerSettings.long * 60);
    };

    const skipTimer = () => handleTimerComplete();
    const resetTimer = () => {
        setIsRunning(false);
        setTimeLeft(getTotalTime());
    };
    const toggleRunning = () => setIsRunning(!isRunning);

    // ─── Modal & Task Handlers ────────────────────────────────────────────────
    const openAddModal = (initialTitle = '') => {
        setTaskForm({ title: initialTitle, subject: '', priority: 'medium', estimatedMinutes: 25 });
        setIsAddModalOpen(true);
    };

    const closeAddModal = () => setIsAddModalOpen(false);

    const handleAddTask = (e) => {
        e.preventDefault();
        addMutation.mutate({
            title: taskForm.title,
            subject: taskForm.subject || 'General',
            priority: taskForm.priority,
            estimatedMinutes: Number(taskForm.estimatedMinutes)
        });
    };

    const handleQuickAddSubmit = (e) => {
        e.preventDefault();
        const input = e.target.elements.quickAdd.value.trim();
        if(!input) return;
        // Open the modal instead of instantly submitting so they can set priority
        e.target.reset();
        openAddModal(input);
    };

    const toggleTask = (id, currentStatus) => {
        updateMutation.mutate({ id, data: { completed: !currentStatus } });
    };

    const saveSettings = (e) => {
        e.preventDefault();
        setTimerSettings({
            work: Number(tempSettings.work),
            short: Number(tempSettings.short),
            long: Number(tempSettings.long)
        });
        setIsSettingsModalOpen(false);
    };

    // ─── Formatting ──────────────────────────────────────────────────────────
    const formatTime = (seconds) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    const formatFocusTime = (seconds) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        return h > 0 ? `${h}h ${m}m` : `${m}m`;
    };

    // SVG Circle Math
    const radius = 120;
    const circumference = 2 * Math.PI * radius;
    const dashoffset = circumference - (timeLeft / getTotalTime()) * circumference;

    return (
        <div className="max-w-[1200px] mx-auto space-y-6 relative">
            
            {/* ── Header ── */}
            <div className="flex items-center justify-between mb-2">
                <h1 className="text-2xl font-bold text-white">Focus Mode</h1>
                <button 
                    onClick={() => setIsSettingsModalOpen(true)}
                    className="p-2.5 rounded-lg bg-black/40 hover:bg-black/80 transition-colors text-gray-400 hover:text-white"
                >
                    <Settings2 className="w-5 h-5" />
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-6 items-start">
                
                {/* ── LEFT PANE: TASKS ── */}
                <div className="flex flex-col h-[calc(100vh-140px)]">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-bold text-white">Today's Tasks</h2>
                        <span className="px-3 py-1 rounded-full text-xs font-medium"
                            style={{ background: 'hsl(240 6% 15%)', color: 'hsl(240 5% 65%)' }}>
                            {pendingTasks.length} remaining
                        </span>
                    </div>

                    <div className="flex-1 overflow-y-auto space-y-3 pr-2 pb-6" style={{ scrollbarWidth: 'thin', scrollbarColor: 'hsl(240 6% 20%) transparent' }}>
                        {isLoading ? (
                            <div className="flex justify-center py-10"><Loader2 className="w-8 h-8 animate-spin text-gray-500" /></div>
                        ) : (
                            <>
                                {pendingTasks.map((task, index) => {
                                    const isActive = activeTaskId === task._id || (activeTaskId === null && task._id === pendingTasks[0]?._id);
                                    const priorityColors = {
                                        high: { border: '#ef4444', text: '#ef4444' },
                                        medium: { border: '#f59e0b', text: '#f59e0b' },
                                        low: { border: '#3b82f6', text: '#3b82f6' }
                                    };
                                    
                                    return (
                                        <div 
                                            key={task._id} 
                                            onClick={() => {
                                                setActiveTaskId(task._id);
                                                if (task.estimatedMinutes) {
                                                    setTimerSettings(prev => ({ ...prev, work: task.estimatedMinutes }));
                                                    setTempSettings(prev => ({ ...prev, work: task.estimatedMinutes }));
                                                    setIsRunning(false);
                                                    setMode('work');
                                                    setTimeLeft(task.estimatedMinutes * 60);
                                                }
                                            }}
                                            className="p-4 rounded-[20px] cursor-pointer transition-all border-2 group relative"
                                            style={{ 
                                                backgroundColor: isActive ? 'hsl(240 10% 9%)' : 'hsl(240 10% 9%)',
                                                borderColor: isActive ? priorityColors[task.priority].border : 'hsl(240 6% 15%)',
                                                boxShadow: isActive ? `0 0 20px -5px ${priorityColors[task.priority].border}40` : 'none'
                                            }}
                                        >
                                            <div className="flex items-start gap-3">
                                                {/* Task Numbering inside Check Area */}
                                                <button onClick={(e) => { e.stopPropagation(); toggleTask(task._id, task.completed); }} className="mt-0.5 relative group-hover:scale-110 transition-transform">
                                                    <div className="w-7 h-7 rounded-full flex items-center justify-center border-2 border-gray-600 bg-black/40 text-xs font-bold transition-all text-gray-400 group-hover:text-white group-hover:border-white">
                                                        {index + 1}
                                                    </div>
                                                </button>
                                                
                                                <div className="flex-1 min-w-0">
                                                    <h3 className={`text-base font-semibold mb-2 truncate ${isActive ? 'text-white' : 'text-gray-300'}`}>
                                                        {task.title}
                                                    </h3>
                                                    <div className="flex items-center flex-wrap gap-2">
                                                        {/* Priority Badge */}
                                                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border border-current"
                                                            style={{ color: priorityColors[task.priority].text }}>
                                                            {task.priority}
                                                        </span>
                                                        
                                                        {task.subject && (
                                                            <span className="text-xs px-2.5 py-1 rounded-md max-w-[120px] truncate" 
                                                                style={{ background: 'hsl(240 6% 15%)', color: 'hsl(240 5% 60%)' }}>
                                                                {task.subject}
                                                            </span>
                                                        )}
                                                        <span className="text-xs whitespace-nowrap hidden sm:block" style={{ color: 'hsl(240 5% 40%)' }}>
                                                            {task.estimatedMinutes}m est.
                                                        </span>
                                                        
                                                        {isActive && (
                                                            <div className="ml-auto flex items-center gap-2">
                                                                <button 
                                                                    onClick={(e) => { e.stopPropagation(); deleteMutation.mutate(task._id); }}
                                                                    className="px-2 py-1 text-xs rounded hover:bg-red-500/20 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                                                >
                                                                    Delete
                                                                </button>
                                                                <span className="text-xs px-3 py-1.5 rounded-full font-bold whitespace-nowrap bg-white text-black">
                                                                    ▶ Focus
                                                                </span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}

                                {completedTasks.length > 0 && (
                                    <div className="pt-4 space-y-3">
                                        <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-4 px-2">Completed</h3>
                                        {completedTasks.map((task) => (
                                            <div key={task._id} className="p-4 rounded-2xl flex items-start gap-4 opacity-50 transition-opacity hover:opacity-100 group"
                                                style={{ background: 'hsl(240 8% 10%)', border: '1px solid hsl(240 6% 15%)' }}>
                                                <button onClick={() => toggleTask(task._id, task.completed)} className="mt-1">
                                                    <CheckCircle2 className="w-6 h-6 text-green-500" />
                                                </button>
                                                <div className="flex-1 min-w-0">
                                                    <h3 className="text-base font-semibold text-gray-400 line-through decoration-gray-500 truncate">
                                                        {task.title}
                                                    </h3>
                                                </div>
                                                <button 
                                                    onClick={() => deleteMutation.mutate(task._id)}
                                                    className="opacity-0 group-hover:opacity-100 p-1 text-red-500 hover:bg-red-500/20 rounded transition-all"
                                                >
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </>
                        )}
                    </div>

                    {/* Bottom Area: Stats & Add Quick Task */}
                    <div className="mt-auto pt-4 border-t" style={{ borderColor: 'hsl(240 6% 15%)' }}>
                        <div className="flex justify-between items-center text-xs font-semibold mb-4 text-gray-500 tracking-wider">
                            <span>TODAY: {completedTasks.length} COMPLETED</span>
                            <span>{pendingTasks.length} REMAINING</span>
                        </div>
                        <form onSubmit={handleQuickAddSubmit} className="relative cursor-text flex gap-2">
                            <input 
                                type="text"
                                name="quickAdd"
                                placeholder="+ What do you want to accomplish?"
                                className="flex-1 bg-transparent border-2 border-dashed rounded-xl py-3 px-4 text-sm font-medium transition-colors focus:outline-none text-white placeholder-gray-500"
                                style={{ borderColor: 'hsl(240 6% 20%)' }}
                                onFocus={(e) => { e.target.style.borderColor = 'hsl(43 96% 56%)'; e.target.style.background = 'hsl(240 10% 9%)'; }}
                                onBlur={(e) => { if(!e.target.value) { e.target.style.borderColor = 'hsl(240 6% 20%)'; e.target.style.background = 'transparent'; } }}
                            />
                            <button type="button" onClick={() => openAddModal()} className="px-4 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors text-white flex items-center justify-center">
                                <Plus className="w-5 h-5" />
                            </button>
                        </form>
                    </div>
                </div>

                {/* ── RIGHT PANE: TIMER ── */}
                <div className="rounded-[24px] overflow-hidden sticky top-6"
                    style={{ background: 'hsl(240 10% 9%)', border: '1px solid hsl(240 6% 12%)' }}>
                    
                    {/* Top Stats */}
                    <div className="flex justify-between items-center p-6 border-b" style={{ borderColor: 'hsl(240 6% 12%)' }}>
                        <span className="px-3 py-1 bg-yellow-500/10 text-yellow-500 text-xs font-bold rounded-full tracking-wider">
                            {mode === 'work' ? 'WORK SESSION' : mode === 'short' ? 'SHORT BREAK' : 'LONG BREAK'}
                        </span>
                        <span className="text-xs font-semibold text-gray-400 tracking-wider">
                            SESSION {sessionCount} OF 4
                        </span>
                    </div>

                    <div className="p-8 flex flex-col items-center">
                        
                        {/* Circular Progress Timer */}
                        <div className="relative w-64 h-64 mb-10 flex items-center justify-center">
                            <svg className="w-full h-full -rotate-90 absolute inset-0">
                                <circle cx="128" cy="128" r={radius} strokeWidth="12" stroke="hsl(240 6% 15%)" fill="transparent" />
                                <circle 
                                    cx="128" cy="128" r={radius} 
                                    strokeWidth="12" 
                                    stroke={mode === 'work' ? "hsl(43 96% 56%)" : "hsl(142 76% 55%)"} 
                                    fill="transparent" strokeLinecap="round"
                                    style={{ strokeDasharray: circumference, strokeDashoffset: dashoffset, transition: 'stroke-dashoffset 1s linear, stroke 0.5s ease' }} 
                                />
                            </svg>
                            <div className="text-center z-10">
                                <h2 className="text-[3.5rem] font-black tracking-tighter text-white tabular-nums leading-none mb-2">
                                    {formatTime(timeLeft)}
                                </h2>
                                <p className="text-sm font-medium text-gray-500">
                                    {mode === 'work' ? 'Until break' : 'Until work'}
                                </p>
                            </div>
                        </div>

                        {/* Current Focus Meta */}
                        <div className="text-center mb-8 h-16 w-full px-4">
                            <p className="text-xs font-bold tracking-[0.2em] text-gray-500 mb-2">CURRENT FOCUS</p>
                            <h3 className="text-lg font-bold text-white flex items-center justify-center gap-2 truncate w-full">
                                <span className={`w-4 h-4 rounded-full border flex-shrink-0 flex items-center justify-center ${mode === 'work' ? 'border-yellow-500' : 'border-green-500'}`}>
                                    <span className={`w-1.5 h-1.5 rounded-full ${mode === 'work' ? 'bg-yellow-500' : 'bg-green-500'}`}></span>
                                </span>
                                {activeTask?.title || "No active task"}
                            </h3>
                            {activeTask?.subject && (
                                <span className="inline-block mt-2 px-3 py-0.5 rounded-full text-xs font-medium" 
                                    style={{ border: '1px solid hsl(240 6% 25%)', color: 'hsl(240 5% 60%)' }}>
                                    {activeTask.subject}
                                </span>
                            )}
                        </div>

                        {/* Controls */}
                        <div className="flex items-center justify-center gap-6 w-full mb-6">
                            <button onClick={resetTimer} className="p-3 rounded-full hover:bg-white/10 transition-colors text-gray-400 hover:text-white">
                                <RotateCcw className="w-5 h-5" />
                            </button>
                            
                            <button 
                                onClick={toggleRunning} 
                                className="w-24 h-16 flex items-center justify-center rounded-[20px] transition-transform active:scale-95 text-black"
                                style={{ background: mode === 'work' ? 'hsl(43 96% 56%)' : 'hsl(142 76% 55%)', boxShadow: `0 0 30px -5px ${mode === 'work' ? 'hsl(43 96% 56% / 0.3)' : 'hsl(142 76% 55% / 0.3)'}` }}
                            >
                                {isRunning ? <Pause className="w-8 h-8 fill-black" /> : <Play className="w-8 h-8 fill-black" />}
                            </button>

                            <button onClick={skipTimer} className="p-3 rounded-full hover:bg-white/10 transition-colors text-gray-400 hover:text-white">
                                <SkipForward className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Mode Switches */}
                        <p className="text-xs font-medium text-gray-500 flex gap-4">
                            <button onClick={() => switchMode('work')} className={`hover:text-white transition-colors ${mode === 'work' ? 'text-white font-bold' : ''}`}>Work ({timerSettings.work}m)</button>
                            <span>•</span>
                            <button onClick={() => switchMode('short')} className={`hover:text-white transition-colors ${mode === 'short' ? 'text-white font-bold' : ''}`}>Break ({timerSettings.short}m)</button>
                        </p>
                    </div>

                    {/* Footer Settings Row */}
                    <div className="bg-black/30 w-full p-4 flex items-center justify-between text-xs font-medium border-t" style={{ borderColor: 'hsl(240 6% 12%)' }}>
                        <div className="flex gap-4 text-gray-400">
                            <div>
                                <span className="opacity-50 block mb-1">Focus time</span>
                                <span className="text-white font-bold">{formatFocusTime(focusTimeSec)}</span>
                            </div>
                            <div>
                                <span className="opacity-50 block mb-1">Sessions</span>
                                <span className="text-white font-bold">{sessionCount - 1}</span>
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <label className="flex items-center gap-2 cursor-pointer group">
                                <div className="text-gray-500 group-hover:text-gray-300 transition-colors">
                                    <span className="block">Auto-start</span>
                                </div>
                                <div className={`w-8 h-4 rounded-full relative transition-colors ${autoStartBreak ? 'bg-teal-500' : 'bg-gray-700'}`}>
                                    <input type="checkbox" checked={autoStartBreak} onChange={(e) => setAutoStartBreak(e.target.checked)} className="sr-only" />
                                    <div className={`w-3 h-3 rounded-full bg-white absolute top-0.5 transition-all ${autoStartBreak ? 'left-4' : 'left-0.5'}`}></div>
                                </div>
                            </label>
                            
                            <label className="flex items-center gap-2 cursor-pointer group">
                                <div className="text-gray-500 group-hover:text-gray-300 transition-colors">
                                    <span className="block">Sound</span>
                                </div>
                                <div className={`w-8 h-4 rounded-full relative transition-colors ${playSound ? 'bg-teal-500' : 'bg-gray-700'}`}>
                                    <input type="checkbox" checked={playSound} onChange={(e) => setPlaySound(e.target.checked)} className="sr-only" />
                                    <div className={`w-3 h-3 rounded-full bg-white absolute top-0.5 transition-all ${playSound ? 'left-4' : 'left-0.5'}`}></div>
                                </div>
                            </label>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── MODALS ── */}

            {/* ADD TASK MODAL */}
            {isAddModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="w-full max-w-md rounded-2xl shadow-2xl overflow-hidden"
                        style={{ background: 'hsl(240 10% 9%)', border: '1px solid hsl(240 6% 15%)' }}>
                        
                        <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: 'hsl(240 6% 15%)' }}>
                            <h3 className="text-lg font-bold text-white">Create Task</h3>
                            <button onClick={closeAddModal} className="p-1 rounded-lg hover:bg-white/5 transition-colors">
                                <X className="w-5 h-5" style={{ color: 'hsl(240 5% 50%)' }} />
                            </button>
                        </div>

                        <form onSubmit={handleAddTask} className="p-5 space-y-4">
                            <div>
                                <label className="block text-xs font-semibold mb-1.5 text-gray-400">Task Title <span className="text-red-400">*</span></label>
                                <input type="text" required value={taskForm.title} onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                                    className="w-full px-4 py-2.5 rounded-lg text-sm bg-black/20 border text-white transition-colors focus:outline-none"
                                    style={{ borderColor: 'hsl(240 6% 20%)' }}
                                    onFocus={(e) => e.target.style.borderColor = 'hsl(43 96% 56%)'} onBlur={(e) => e.target.style.borderColor = 'hsl(240 6% 20%)'}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold mb-1.5 text-gray-400">Subject / Category</label>
                                    <input type="text" value={taskForm.subject} onChange={(e) => setTaskForm({ ...taskForm, subject: e.target.value })} placeholder="e.g. Physics"
                                        className="w-full px-4 py-2.5 rounded-lg text-sm bg-black/20 border text-white transition-colors focus:outline-none"
                                        style={{ borderColor: 'hsl(240 6% 20%)' }}
                                        onFocus={(e) => e.target.style.borderColor = 'hsl(43 96% 56%)'} onBlur={(e) => e.target.style.borderColor = 'hsl(240 6% 20%)'}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold mb-1.5 text-gray-400">Est. Mins</label>
                                    <input type="number" required min="5" step="5" value={taskForm.estimatedMinutes} onChange={(e) => setTaskForm({ ...taskForm, estimatedMinutes: e.target.value })}
                                        className="w-full px-4 py-2.5 rounded-lg text-sm bg-black/20 border text-white transition-colors focus:outline-none"
                                        style={{ borderColor: 'hsl(240 6% 20%)' }}
                                        onFocus={(e) => e.target.style.borderColor = 'hsl(43 96% 56%)'} onBlur={(e) => e.target.style.borderColor = 'hsl(240 6% 20%)'}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold mb-1.5 text-gray-400">Priority Level</label>
                                <div className="flex gap-2">
                                    {['high', 'medium', 'low'].map(level => (
                                        <button
                                            key={level}
                                            type="button"
                                            onClick={() => setTaskForm({ ...taskForm, priority: level })}
                                            className={`flex-1 py-2 rounded-lg text-xs font-bold transition-colors uppercase tracking-wider
                                                ${taskForm.priority === level 
                                                    ? (level==='high' ? 'bg-red-500/20 text-red-400 border border-red-500' : level==='medium' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500' : 'bg-blue-500/20 text-blue-400 border border-blue-500')
                                                    : 'bg-black/20 text-gray-500 border border-gray-800 hover:border-gray-600'
                                                }
                                            `}
                                        >
                                            {level}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <button type="submit" disabled={addMutation.isPending}
                                className="w-full mt-2 py-3 rounded-lg text-sm font-bold transition-transform active:scale-95 disabled:opacity-50 text-black bg-white hover:bg-gray-200">
                                {addMutation.isPending ? 'Saving...' : 'Drop Task'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* TIMER SETTINGS MODAL */}
            {isSettingsModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden"
                        style={{ background: 'hsl(240 10% 9%)', border: '1px solid hsl(240 6% 15%)' }}>
                        
                        <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: 'hsl(240 6% 15%)' }}>
                            <h3 className="text-lg font-bold text-white">Timer Settings (Minutes)</h3>
                        </div>

                        <form onSubmit={saveSettings} className="p-5 space-y-4">
                            <div className="flex justify-between items-center bg-black/20 p-3 rounded-lg border border-gray-800">
                                <label className="text-sm font-semibold text-gray-300">Focus Session</label>
                                <input type="number" required min="1" max="120" value={tempSettings.work} onChange={(e) => setTempSettings({ ...tempSettings, work: e.target.value })}
                                    className="w-20 text-center bg-transparent border-b-2 outline-none text-white font-bold" style={{ borderColor: 'hsl(43 96% 56%)' }} />
                            </div>
                            <div className="flex justify-between items-center bg-black/20 p-3 rounded-lg border border-gray-800">
                                <label className="text-sm font-semibold text-gray-300">Short Break</label>
                                <input type="number" required min="1" max="30" value={tempSettings.short} onChange={(e) => setTempSettings({ ...tempSettings, short: e.target.value })}
                                    className="w-20 text-center bg-transparent border-b-2 border-gray-600 outline-none text-white font-bold focus:border-green-500" />
                            </div>
                            <div className="flex justify-between items-center bg-black/20 p-3 rounded-lg border border-gray-800">
                                <label className="text-sm font-semibold text-gray-300">Long Break</label>
                                <input type="number" required min="1" max="60" value={tempSettings.long} onChange={(e) => setTempSettings({ ...tempSettings, long: e.target.value })}
                                    className="w-20 text-center bg-transparent border-b-2 border-gray-600 outline-none text-white font-bold focus:border-green-500" />
                            </div>

                            <div className="pt-2 flex gap-3">
                                <button type="button" onClick={() => setIsSettingsModalOpen(false)} className="flex-1 py-2.5 rounded-lg text-sm font-semibold transition-colors hover:bg-white/5 text-gray-400">
                                    Cancel
                                </button>
                                <button type="submit" className="flex-1 py-2.5 rounded-lg text-sm font-bold transition-transform active:scale-95 text-black bg-white hover:bg-gray-200">
                                    Save
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

        </div>
    );
}
