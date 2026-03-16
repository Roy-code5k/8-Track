import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { BookOpen, Plus, MoreHorizontal, CheckCircle2, AlertCircle, XCircle, Trash2, Edit2, X } from 'lucide-react';
import api from '../lib/api';

// ─── Helpers ─────────────────────────────────────────────────────────────────
const SUBJECT_COLORS = ['#3b82f6', '#f97316', '#ef4444', '#8b5cf6', '#22c55e', '#ec4899', '#06b6d4'];

const STATUS_STYLE = {
    safe: { label: 'SAFE', color: '#3b82f6', bg: '#3b82f620', icon: CheckCircle2 },
    warning: { label: 'WARNING', color: '#f97316', bg: '#f9731620', icon: AlertCircle },
    danger: { label: 'DANGER', color: '#ef4444', bg: '#ef444420', icon: XCircle },
};

// ─── Subjects Page ───────────────────────────────────────────────────────────
export default function SubjectsPage() {
    const queryClient = useQueryClient();
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [editingSubject, setEditingSubject] = useState(null);

    // Form state
    const [formData, setFormData] = useState({ name: '', totalExpectedClasses: '' });

    const openModal = (subject = null) => {
        if (subject) {
            setEditingSubject(subject);
            setFormData({ name: subject.name, totalExpectedClasses: subject.totalExpectedClasses || '' });
        } else {
            setEditingSubject(null);
            setFormData({ name: '', totalExpectedClasses: '' });
        }
        setIsAddModalOpen(true);
    };

    const closeModal = () => {
        setIsAddModalOpen(false);
        setEditingSubject(null);
        setFormData({ name: '', totalExpectedClasses: '' });
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
    });

    const updateMutation = useMutation({
        mutationFn: (data) => api.put(`/subjects/${editingSubject._id}`, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['subjects'] });
            closeModal();
        },
    });

    const deleteMutation = useMutation({
        mutationFn: (id) => api.delete(`/subjects/${id}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['subjects'] });
        },
    });

    // ── Handlers ──
    const handleSubmit = (e) => {
        e.preventDefault();
        const payload = {
            name: formData.name,
            totalExpectedClasses: formData.totalExpectedClasses ? parseInt(formData.totalExpectedClasses, 10) : 0,
        };

        if (editingSubject) {
            updateMutation.mutate(payload);
        } else {
            createMutation.mutate(payload);
        }
    };

    return (
        <div className="space-y-6 max-w-5xl">
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

                                <div className="flex items-start justify-between mb-4">
                                    <h3 className="text-lg font-bold text-white leading-tight pr-6">{sub.name}</h3>

                                    {/* Action Menu Buttons */}
                                    <div className="absolute top-4 right-4 flex gap-1 transition-opacity">
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
                            <div>
                                <label className="block text-xs font-semibold mb-1.5" style={{ color: 'hsl(240 5% 70%)' }}>
                                    Subject Name <span className="text-red-400">*</span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="e.g. Applied Physics II"
                                    className="w-full px-4 py-2.5 rounded-lg text-sm bg-black/20 border text-white transition-colors focus:outline-none"
                                    style={{ borderColor: 'hsl(240 6% 20%)' }}
                                    onFocus={(e) => e.target.style.borderColor = 'hsl(43 96% 56%)'}
                                    onBlur={(e) => e.target.style.borderColor = 'hsl(240 6% 20%)'}
                                />
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
