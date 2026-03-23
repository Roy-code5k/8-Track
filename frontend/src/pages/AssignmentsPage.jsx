import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
    Plus, Filter, ChevronDown, 
    MoreHorizontal, Calendar, CheckCircle2, 
    Clock, AlertCircle, X, Check, ArrowRight, ArrowLeft,
    Pencil, Trash2, MoreVertical
} from 'lucide-react';
import { format, isToday, isThisWeek, parseISO } from 'date-fns';
import api from '../lib/api';
import { useToast } from '../components/common/Toast';

// ─── Constants & Colors ───────────────────────────────────────────────────────
const SUBJECT_STYLING = {
    'PHYSICS': { color: '#4A90E2', bg: 'rgba(74, 144, 226, 0.15)' },
    'DBMS': { color: '#3ABFBF', bg: 'rgba(58, 191, 191, 0.15)' },
    'MATH': { color: '#9B51E0', bg: 'rgba(155, 81, 224, 0.15)' },
    'HISTORY': { color: '#D08035', bg: 'rgba(208, 128, 53, 0.15)' },
    'CS 101': { color: '#E8A838', bg: 'rgba(232, 168, 56, 0.15)' },
    'CHEMISTRY': { color: '#E85C5C', bg: 'rgba(232, 92, 92, 0.15)' },
    'BIOLOGY': { color: '#4CAF7D', bg: 'rgba(76, 175, 125, 0.15)' },
    'ENGLISH': { color: '#F48FB1', bg: 'rgba(244, 143, 177, 0.15)' },
};

const EXTRA_COLORS = [
    { color: '#4A90E2', bg: 'rgba(74, 144, 226, 0.15)' },
    { color: '#3ABFBF', bg: 'rgba(58, 191, 191, 0.15)' },
    { color: '#9B51E0', bg: 'rgba(155, 81, 224, 0.15)' },
    { color: '#D08035', bg: 'rgba(208, 128, 53, 0.15)' },
    { color: '#E8A838', bg: 'rgba(232, 168, 56, 0.15)' },
    { color: '#E85C5C', bg: 'rgba(232, 92, 92, 0.15)' },
    { color: '#4CAF7D', bg: 'rgba(76, 175, 125, 0.15)' },
];

function getSubjectStyle(name) {
    if (!name) return { color: '#888888', bg: 'rgba(136, 136, 136, 0.1)' };
    const upper = name.toUpperCase();
    if (SUBJECT_STYLING[upper]) return SUBJECT_STYLING[upper];
    
    // Simple hashing for dynamic subjects
    let hash = 0;
    for (let i = 0; i < upper.length; i++) {
        hash = upper.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % EXTRA_COLORS.length;
    return EXTRA_COLORS[index];
}

const PRIORITY_COLORS = {
    'high': '#E85C5C',
    'medium': '#E8A838',
    'low': '#4CAF7D'
};

const COLUMN_CONFIG = [
    { id: 'pending', label: 'TO DO', color: '#4A90E2' },
    { id: 'in-progress', label: 'IN PROGRESS', color: '#E8A838' },
    { id: 'completed', label: 'COMPLETED', color: '#4CAF7D' }
];

const NEXT_STATUS = {
    'pending': 'in-progress',
    'in-progress': 'completed'
};

const PREV_STATUS = {
    'in-progress': 'pending',
    'completed': 'in-progress'
};

// ─── Task Card Component ─────────────────────────────────────────────────────
// ─── Task Card Component ─────────────────────────────────────────────────────
function TaskCard({ task, onEdit, onDelete, onStatusChange }) {
    const rawName = task.subjectId?.name || 'General';
    const styling = getSubjectStyle(rawName);
    const dueDate = parseISO(task.dueDate);
    
    let dueLabel = '';
    if (task.status === 'completed') {
        dueLabel = `Completed ${format(new Date(task.updatedAt || new Date()), 'dd/MM/yyyy')}`;
    } else {
        if (isToday(dueDate)) dueLabel = 'Due Today';
        else if (isThisWeek(dueDate)) dueLabel = `Due in ${format(dueDate, 'd')} days`; // Simplified
        else dueLabel = `Due ${format(dueDate, 'dd/MM/yyyy')}`;
    }

    const isCompleted = task.status === 'completed';
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    return (
        <div className={`group relative bg-[var(--card-bg)] rounded-3xl p-6 border transition-all ${
            isCompleted 
                ? 'border-transparent opacity-60' 
                : 'border-[rgba(255,255,255,0.05)] hover:border-[rgba(255,255,255,0.1)] hover:shadow-xl'
        }`}>
             {/* Side strip (Only for active tasks) */}
             {!isCompleted && (
                 <div className="absolute left-0 top-6 bottom-6 w-[4px] rounded-r-full shadow-[2px_0_12px_rgba(0,0,0,0.3)]" 
                    style={{ background: styling.color, boxShadow: `0 0 10px ${styling.color}44` }} />
             )}

             {/* Task Card Menu */}
             <div className="absolute top-4 right-4 z-10">
                <button 
                    onClick={(e) => { e.stopPropagation(); setIsMenuOpen(!isMenuOpen); }}
                    className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-white/5 text-[var(--text-muted)] hover:text-white transition-all">
                    <MoreHorizontal className="w-4 h-4" />
                </button>
                {isMenuOpen && (
                    <>
                        <div className="fixed inset-0 z-10" onClick={() => setIsMenuOpen(false)} />
                        <div className="absolute right-0 mt-2 w-32 bg-[var(--sidebar-bg)] border border-white/5 rounded-2xl shadow-2xl py-2 z-20 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                            <button 
                                onClick={(e) => { e.stopPropagation(); onEdit(task); setIsMenuOpen(false); }}
                                className="w-full px-4 py-2 text-left text-[12px] font-bold text-white hover:bg-white/5 flex items-center gap-3">
                                <Pencil className="w-3.5 h-3.5 text-[var(--primary-accent)]" />
                                Edit
                            </button>
                            <button 
                                onClick={(e) => { e.stopPropagation(); if(window.confirm('Delete task?')) onDelete(task._id); setIsMenuOpen(false); }}
                                className="w-full px-4 py-2 text-left text-[12px] font-bold text-[#E85C5C] hover:bg-red-500/5 flex items-center gap-3 border-t border-white/5">
                                <Trash2 className="w-3.5 h-3.5" />
                                Delete
                            </button>
                        </div>
                    </>
                )}
             </div>
             
             <div className="flex items-start justify-between mb-4 pr-6">
                <span className={`px-3 py-1.5 rounded-lg text-[10px] font-black tracking-widest uppercase border ${
                    isCompleted 
                        ? 'bg-white/5 border-white/5 text-[var(--text-muted)]' 
                        : 'border-white/5'
                }`}
                style={!isCompleted ? { color: styling.color, background: styling.bg } : {}}>
                    {rawName}
                </span>
                <div className="flex items-center gap-2">
                    {!isCompleted && <div className="w-2 h-2 rounded-full" style={{ background: PRIORITY_COLORS[task.priority || 'medium'] }} />}
                    {isCompleted && (
                        <div className="w-6 h-6 rounded-full bg-[rgba(76,175,125,0.1)] flex items-center justify-center border border-[rgba(76,175,125,0.2)]">
                            <CheckCircle2 className="w-4 h-4 text-[var(--status-safe)]" />
                        </div>
                    )}
                </div>
             </div>

             <h3 className={`text-[15px] font-bold leading-snug mb-4 pr-4 ${
                isCompleted ? 'text-[var(--text-muted)] line-through' : 'text-white'
             }`}>
                {task.title}
             </h3>

             <div className="flex items-center justify-between mt-6">
                <div className="flex items-center gap-2 text-[12px] font-medium" 
                    style={{ color: !isCompleted && isToday(dueDate) ? 'var(--primary-accent)' : 'var(--text-muted)' }}>
                    {isCompleted ? <Calendar className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
                    <span>{dueLabel}</span>
                </div>

                <div className="flex items-center gap-2">
                    {PREV_STATUS[task.status] && (
                        <button 
                            onClick={(e) => {
                                e.stopPropagation();
                                onStatusChange(PREV_STATUS[task.status]);
                            }}
                            className="p-2 rounded-xl bg-white/5 border border-white/5 text-[var(--text-muted)] hover:text-white hover:bg-white/10 transition-all group"
                            title="Revert Status"
                        >
                            <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5" />
                        </button>
                    )}

                    {NEXT_STATUS[task.status] && (
                        <button 
                            onClick={(e) => {
                                e.stopPropagation();
                                onStatusChange(NEXT_STATUS[task.status]);
                            }}
                            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/5 border border-white/5 text-[10px] font-black tracking-widest uppercase text-white hover:bg-[var(--primary-accent)] hover:text-[var(--sidebar-bg)] hover:border-transparent transition-all group"
                        >
                            <span>{task.status === 'pending' ? 'Start' : 'Complete'}</span>
                            <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                        </button>
                    )}
                </div>
             </div>
        </div>
    );
}

// ─── Assignments Page ────────────────────────────────────────────────────────
export default function AssignmentsPage() {
    const queryClient = useQueryClient();
    const { showToast } = useToast();
    const [filter, setFilter] = useState('all');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTask, setEditingTask] = useState(null);


    // ── Queries and Mutations ──
    const { data: assignmentsData, isLoading: tasksLoading } = useQuery({
        queryKey: ['assignments'],
        queryFn: () => api.get('/assignments').then(r => r.data.assignments),
    });

    const { data: subjects = [] } = useQuery({
        queryKey: ['subjects'],
        queryFn: () => api.get('/subjects').then(r => r.data.subjects || r.data),
    });

    const saveMutation = useMutation({
        mutationFn: (data) => data._id 
            ? api.put(`/assignments/${data._id}`, data)
            : api.post('/assignments', data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['assignments'] });
            closeModal();
        },
        onError: (err) => showToast(err.response?.data?.message || 'Failed to save assignment', 'error'),
    });

    const deleteMutation = useMutation({
        mutationFn: (id) => api.delete(`/assignments/${id}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['assignments'] });
            closeModal();
        },
        onError: (err) => showToast(err.response?.data?.message || 'Failed to delete assignment', 'error'),
    });

    // ── Column Data ──
    const tasks = assignmentsData || [];
    const getTasksByStatus = (statusId) => {
        let filtered = tasks.filter(t => t.status === statusId);
        
        if (filter === 'today') {
            filtered = filtered.filter(t => isToday(parseISO(t.dueDate)));
        } else if (filter === 'this-week') {
            filtered = filtered.filter(t => isThisWeek(parseISO(t.dueDate)));
        } else if (filter === 'high-priority') {
            filtered = filtered.filter(t => t.priority === 'high');
        }
        
        return filtered;
    };

    // ── Modal Handlers ──
    const openModal = (task = null) => {
        if (!task || !task._id) {
            setEditingTask({ status: 'pending' });
        } else {
            setEditingTask(task);
        }
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setEditingTask(null);
        setIsModalOpen(false);
    };

    const handleFormSubmit = (e) => {
        e.preventDefault();
        const fd = new FormData(e.target);
        const payload = {
            _id: editingTask?._id,
            title: fd.get('title'),
            subjectId: fd.get('subjectId'),
            dueDate: fd.get('dueDate'),
            priority: fd.get('priority'),
            status: fd.get('status')
        };
        saveMutation.mutate(payload);
    };

    return (
        <div className="space-y-10 pb-10">
            {/* ── Header Area ── */}
            <div className="flex items-center justify-between">
                <div>
                    <div className="flex items-center gap-3">
                        <h1 className="text-4xl font-black text-white tracking-tight leading-none">Assignments</h1>
                        <span className="px-3 py-1 rounded-full bg-[var(--active-highlight)] text-[11px] font-black text-[var(--text-muted)] tracking-widest uppercase">
                            {tasks.length} tasks total
                        </span>
                    </div>
                    <p className="text-[15px] font-medium mt-3 text-[var(--text-muted)]">Manage your upcoming deliverables.</p>
                </div>
                <button 
                    onClick={() => openModal()}
                    className="flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-[var(--primary-accent)] text-[var(--sidebar-bg)] font-black text-sm transition-all hover:scale-105 active:scale-95 shadow-[0_8px_20px_rgba(232,168,56,0.3)]">
                    <Plus className="w-5 h-5" />
                    New Task
                </button>
            </div>

            {/* ── Filters Row ── */}
            <div className="flex items-center gap-4">
                <div className="flex p-1.5 rounded-2xl bg-[var(--active-highlight)] border border-white/5">
                    {[
                        { id: 'all', label: 'All' },
                        { id: 'today', label: 'Due Today' },
                        { id: 'this-week', label: 'This Week' },
                        { id: 'high-priority', label: 'High Priority' }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setFilter(tab.id)}
                            className={`px-5 py-2.5 rounded-xl text-[13px] font-bold transition-all ${
                                filter === tab.id ? 'bg-white text-[var(--sidebar-bg)] shadow-lg' : 'text-[var(--text-muted)] hover:text-white'
                            }`}>
                            {tab.label}
                        </button>
                    ))}
                </div>

                <button className="flex items-center gap-3 px-6 py-3.5 rounded-2xl bg-[var(--active-highlight)] border border-white/5 text-[13px] font-bold text-[var(--text-muted)] hover:text-white transition-all ml-auto">
                    By Subject
                    <ChevronDown className="w-4 h-4 opacity-50" />
                </button>
            </div>

            {/* ── Kanban Board ── */}
            {tasksLoading ? (
                 <div className="py-20 text-center animate-pulse text-[var(--text-muted)]">Syncing tasks...</div>
            ) : (
                <div className="grid grid-cols-3 gap-8 items-start">
                    {COLUMN_CONFIG.map(col => {
                        const colTasks = getTasksByStatus(col.id);
                        return (
                            <div key={col.id} className="space-y-6">
                                <div className="flex items-center justify-between px-2">
                                    <div className="flex items-center gap-3">
                                        <div className="w-2.5 h-2.5 rounded-full" 
                                            style={{ background: col.color, boxShadow: `0 0 12px ${col.color}` }} />
                                        <h2 className="text-[13px] font-black tracking-[0.2em] text-white uppercase">{col.label}</h2>
                                        <span className="text-[13px] font-bold text-[var(--text-muted)] ml-1">{colTasks.length}</span>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    {colTasks.map(task => (
                                        <TaskCard 
                                            key={task._id} 
                                            task={task} 
                                            onEdit={openModal}
                                            onDelete={(id) => deleteMutation.mutate(id)}
                                            onStatusChange={(newStatus) => saveMutation.mutate({...task, status: newStatus})}
                                        />
                                    ))}
                                    
                                    {/* Empty State / Add Task Placeholder */}
                                    <button 
                                        onClick={() => openModal({ status: col.id })}
                                        className="w-full py-10 rounded-3xl border-2 border-dashed border-white/5 flex flex-col items-center justify-center gap-3 text-[var(--text-muted)] hover:border-[rgba(255,255,255,0.1)] hover:bg-white/5 transition-all group">
                                        <Plus className="w-6 h-6 opacity-30 group-hover:opacity-100 transition-opacity" />
                                        <span className="text-[13px] font-bold">Add Task</span>
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* ── Task Modal ── */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-xl">
                    <div className="w-full max-w-lg bg-[var(--card-bg)] rounded-[40px] border border-white/10 shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="p-10">
                            <div className="flex items-center justify-between mb-10">
                                <h3 className="text-2xl font-black text-white">{editingTask?._id ? 'Rename Task' : 'New Task'}</h3>
                                <button onClick={closeModal} className="p-2 rounded-xl hover:bg-white/5 text-[var(--text-muted)] transition-colors"><X className="w-6 h-6" /></button>
                            </div>

                            <form onSubmit={handleFormSubmit} className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[11px] font-black tracking-widest text-[var(--text-muted)] uppercase px-1">Task Title</label>
                                    <input 
                                        name="title" 
                                        required 
                                        defaultValue={editingTask?.title || ''}
                                        placeholder="e.g., Quantum Mechanics Lab Report"
                                        className="w-full px-6 py-4 rounded-2xl bg-white/5 border border-white/10 text-white placeholder:text-white/20 focus:outline-none focus:border-[var(--primary-accent)] transition-all font-bold"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[11px] font-black tracking-widest text-[var(--text-muted)] uppercase px-1">Subject</label>
                                        <select 
                                            name="subjectId" 
                                            defaultValue={editingTask?.subjectId?._id || ''}
                                            className="w-full px-6 py-4 rounded-2xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-[var(--primary-accent)] transition-all font-bold appearance-none cursor-pointer">
                                            <option value="" className="bg-[var(--card-bg)]">General</option>
                                            {subjects.map(sub => (
                                                <option key={sub._id} value={sub._id} className="bg-[var(--card-bg)]">{sub.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[11px] font-black tracking-widest text-[var(--text-muted)] uppercase px-1">Priority</label>
                                        <select 
                                            name="priority" 
                                            defaultValue={editingTask?.priority || 'medium'}
                                            className="w-full px-6 py-4 rounded-2xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-[var(--primary-accent)] transition-all font-bold appearance-none cursor-pointer">
                                            <option value="low" className="bg-[var(--card-bg)] text-[var(--status-safe)]">Low</option>
                                            <option value="medium" className="bg-[var(--card-bg)] text-[var(--primary-accent)]">Medium</option>
                                            <option value="high" className="bg-[var(--card-bg)] text-[var(--status-danger)]">High</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[11px] font-black tracking-widest text-[var(--text-muted)] uppercase px-1">Due Date</label>
                                        <input 
                                            type="date" 
                                            name="dueDate" 
                                            required 
                                            defaultValue={editingTask?.dueDate ? format(parseISO(editingTask.dueDate), 'yyyy-MM-dd') : ''}
                                            className="w-full px-6 py-4 rounded-2xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-[var(--primary-accent)] transition-all font-bold"
                                        />
                                    </div>
                                    {editingTask?._id && (
                                        <div className="space-y-2">
                                            <label className="text-[11px] font-black tracking-widest text-[var(--text-muted)] uppercase px-1">Status</label>
                                            <select 
                                                name="status" 
                                                defaultValue={editingTask?.status || 'pending'}
                                                className="w-full px-6 py-4 rounded-2xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-[var(--primary-accent)] transition-all font-bold appearance-none cursor-pointer">
                                                <option value="pending" className="bg-[var(--card-bg)]">To Do</option>
                                                <option value="in-progress" className="bg-[var(--card-bg)]">In Progress</option>
                                                <option value="completed" className="bg-[var(--card-bg)]">Completed</option>
                                            </select>
                                        </div>
                                    )}
                                    {!editingTask?._id && <input type="hidden" name="status" value="pending" />}
                                </div>

                                <div className="flex gap-4 mt-6">
                                    {editingTask?._id && (
                                        <button 
                                            type="button" 
                                            onClick={() => { if(window.confirm('Delete this task?')) deleteMutation.mutate(editingTask._id); }}
                                            className="px-6 py-4 rounded-2xl bg-red-500/10 text-red-500 font-bold hover:bg-red-500/20 transition-all">
                                            Delete
                                        </button>
                                    )}
                                    <button 
                                        type="submit" 
                                        disabled={saveMutation.isPending}
                                        className="flex-1 px-6 py-4 rounded-2xl bg-[var(--primary-accent)] text-[var(--sidebar-bg)] font-black transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50">
                                        {saveMutation.isPending ? 'Saving...' : editingTask?._id ? 'Save Changes' : 'Create Task'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
