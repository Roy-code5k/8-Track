import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { GraduationCap, Plus, Trash2, X, Award } from 'lucide-react';
import api from '../lib/api';

export default function ExamsPage() {
    const queryClient = useQueryClient();
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);

    // Form state
    const [formData, setFormData] = useState({
        examName: '',
        subjectId: '',
        marksObtained: '',
        maxMarks: '',
    });

    // ── Queries ──
    const { data: subjects = [] } = useQuery({
        queryKey: ['subjects'],
        queryFn: () => api.get('/subjects').then(r => r.data.subjects || r.data),
    });

    const { data: exams = [], isLoading } = useQuery({
        queryKey: ['exams'],
        queryFn: () => api.get('/exams').then(r => r.data.exams || r.data),
    });

    // ── Mutations ──
    const createMutation = useMutation({
        mutationFn: (data) => api.post('/exams', data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['exams'] });
            closeModal();
        },
    });

    const deleteMutation = useMutation({
        mutationFn: (id) => api.delete(`/exams/${id}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['exams'] });
        },
    });

    // ── Handlers ──
    const openModal = () => {
        setFormData({ examName: '', subjectId: subjects[0]?._id || '', marksObtained: '', maxMarks: '' });
        setIsAddModalOpen(true);
    };

    const closeModal = () => {
        setIsAddModalOpen(false);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        createMutation.mutate({
            examName: formData.examName,
            subjectId: formData.subjectId,
            marksObtained: Number(formData.marksObtained),
            maxMarks: Number(formData.maxMarks),
        });
    };

    // ── Group Exams by Exam Name ──
    const groupedExams = useMemo(() => {
        const groups = {};
        exams.forEach(exam => {
            const name = exam.examName;
            if (!groups[name]) groups[name] = [];
            groups[name].push(exam);
        });
        return groups;
    }, [exams]);

    return (
        <div className="space-y-6 max-w-5xl">
            {/* ── Header ── */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                        <GraduationCap className="w-6 h-6" style={{ color: 'hsl(43 96% 56%)' }} />
                        Exams & Results
                    </h2>
                    <p className="text-sm mt-1" style={{ color: 'hsl(240 5% 50%)' }}>
                        Track your performance across different test series
                    </p>
                </div>
                <button
                    onClick={openModal}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold transition-all hover:scale-105 active:scale-95"
                    style={{ background: 'hsl(43 96% 56%)', color: 'hsl(240 5.9% 10%)' }}
                >
                    <Plus className="w-4 h-4" />
                    Log Result
                </button>
            </div>

            {/* ── Content ── */}
            {isLoading ? (
                <div className="py-20 text-center" style={{ color: 'hsl(240 5% 50%)' }}>Loading exams...</div>
            ) : exams.length === 0 ? (
                <div className="py-20 text-center rounded-2xl border border-dashed"
                    style={{ background: 'hsl(240 10% 9%)', borderColor: 'hsl(240 6% 20%)' }}>
                    <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center"
                        style={{ background: 'hsl(240 6% 12%)' }}>
                        <GraduationCap className="w-8 h-8" style={{ color: 'hsl(240 5% 40%)' }} />
                    </div>
                    <h3 className="text-lg font-bold text-white mb-1">No exam records</h3>
                    <p className="text-sm mb-6" style={{ color: 'hsl(240 5% 50%)' }}>Start tracking your midterms, finals, and class tests here.</p>
                    <button
                        onClick={openModal}
                        className="px-5 py-2 rounded-lg text-sm font-semibold transition-colors"
                        style={{ border: '1px solid hsl(43 96% 56%)', color: 'hsl(43 96% 56%)' }}
                    >
                        Log First Result
                    </button>
                </div>
            ) : (
                <div className="space-y-6">
                    {Object.entries(groupedExams).map(([examName, records]) => {
                        // Calculate group totals
                        let totalObtained = 0;
                        let totalMax = 0;
                        records.forEach(r => {
                            totalObtained += r.marksObtained;
                            totalMax += r.maxMarks;
                        });
                        const overallPct = totalMax > 0 ? ((totalObtained / totalMax) * 100).toFixed(1) : 0;

                        return (
                            <div key={examName} className="rounded-2xl overflow-hidden"
                                style={{ background: 'hsl(240 10% 9%)', border: '1px solid hsl(240 6% 15%)' }}>
                                
                                {/* Group Header */}
                                <div className="px-5 py-4 flex items-center justify-between border-b"
                                    style={{ borderColor: 'hsl(240 6% 15%)', background: 'hsl(240 8% 11%)' }}>
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-lg" style={{ background: 'hsl(43 96% 56% / 0.15)', color: 'hsl(43 96% 56%)' }}>
                                            <Award className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-bold text-white">{examName}</h3>
                                            <p className="text-xs font-medium" style={{ color: 'hsl(240 5% 50%)' }}>
                                                {records.length} {records.length === 1 ? 'Subject' : 'Subjects'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs font-bold tracking-widest mb-1" style={{ color: 'hsl(240 5% 50%)' }}>OVERALL SCORE</p>
                                        <div className="flex items-end gap-1.5 justify-end">
                                            <span className="text-2xl font-black text-white">{totalObtained}</span>
                                            <span className="text-sm font-medium mb-1" style={{ color: 'hsl(240 5% 45%)' }}>/ {totalMax}</span>
                                            <span className="text-sm font-bold ml-2 mb-1" style={{ color: 'hsl(43 96% 56%)' }}>({overallPct}%)</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Subjects List */}
                                <table className="w-full">
                                    <thead>
                                        <tr style={{ borderBottom: '1px solid hsl(240 6% 15%)' }}>
                                            <th className="px-5 py-3 text-left text-xs font-bold tracking-widest" style={{ color: 'hsl(240 5% 45%)' }}>SUBJECT</th>
                                            <th className="px-5 py-3 text-right text-xs font-bold tracking-widest" style={{ color: 'hsl(240 5% 45%)' }}>SCORE</th>
                                            <th className="px-5 py-3 text-right text-xs font-bold tracking-widest" style={{ color: 'hsl(240 5% 45%)' }}>PERCENTAGE</th>
                                            <th className="px-5 py-3 w-16"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y" style={{ borderColor: 'hsl(240 6% 13%)' }}>
                                        {records.map(record => (
                                            <tr key={record._id} className="group hover:bg-white/5 transition-colors">
                                                <td className="px-5 py-3.5">
                                                    <span className="text-sm font-semibold text-white">
                                                        {record.subjectId?.name || 'Deleted Subject'}
                                                    </span>
                                                </td>
                                                <td className="px-5 py-3.5 text-right">
                                                    <span className="text-sm font-bold text-white">{record.marksObtained}</span>
                                                    <span className="text-xs" style={{ color: 'hsl(240 5% 50%)' }}> / {record.maxMarks}</span>
                                                </td>
                                                <td className="px-5 py-3.5 text-right">
                                                    <span className="text-sm font-semibold" style={{ color: 'hsl(43 96% 56%)' }}>{record.percentage}%</span>
                                                </td>
                                                <td className="px-5 py-3.5 text-right">
                                                    <button
                                                        onClick={() => {
                                                            if (window.confirm('Delete this exam record?')) {
                                                                deleteMutation.mutate(record._id);
                                                            }
                                                        }}
                                                        className="p-1.5 rounded opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500/20 text-red-400"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* ── Add Modal ── */}
            {isAddModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="w-full max-w-md rounded-2xl shadow-2xl overflow-hidden"
                        style={{ background: 'hsl(240 10% 9%)', border: '1px solid hsl(240 6% 15%)' }}>
                        
                        <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: 'hsl(240 6% 15%)' }}>
                            <h3 className="text-lg font-bold text-white">Log Exam Result</h3>
                            <button onClick={closeModal} className="p-1 rounded-lg hover:bg-white/5 transition-colors">
                                <X className="w-5 h-5" style={{ color: 'hsl(240 5% 50%)' }} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-5 space-y-4">
                            <div>
                                <label className="block text-xs font-semibold mb-1.5" style={{ color: 'hsl(240 5% 70%)' }}>
                                    Exam Series Name <span className="text-red-400">*</span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={formData.examName}
                                    onChange={(e) => setFormData({ ...formData, examName: e.target.value })}
                                    placeholder="e.g. Midterm 1, Final Exam"
                                    className="w-full px-4 py-2.5 rounded-lg text-sm bg-black/20 border text-white transition-colors focus:outline-none"
                                    style={{ borderColor: 'hsl(240 6% 20%)' }}
                                    onFocus={(e) => e.target.style.borderColor = 'hsl(43 96% 56%)'}
                                    onBlur={(e) => e.target.style.borderColor = 'hsl(240 6% 20%)'}
                                />
                                <p className="text-xs mt-1.5" style={{ color: 'hsl(240 5% 45%)' }}>
                                    Use the exact same name across subjects to group them together.
                                </p>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold mb-1.5" style={{ color: 'hsl(240 5% 70%)' }}>
                                    Subject <span className="text-red-400">*</span>
                                </label>
                                {subjects.length === 0 ? (
                                    <div className="text-xs text-red-400 p-2 bg-red-400/10 rounded border border-red-400/20">
                                        Please create a Subject first on the Subjects page.
                                    </div>
                                ) : (
                                    <select
                                        required
                                        value={formData.subjectId}
                                        onChange={(e) => setFormData({ ...formData, subjectId: e.target.value })}
                                        className="w-full px-4 py-2.5 rounded-lg text-sm bg-black/20 border text-white transition-colors focus:outline-none"
                                        style={{ borderColor: 'hsl(240 6% 20%)' }}
                                        onFocus={(e) => e.target.style.borderColor = 'hsl(43 96% 56%)'}
                                        onBlur={(e) => e.target.style.borderColor = 'hsl(240 6% 20%)'}
                                    >
                                        <option value="" disabled>Select a subject...</option>
                                        {subjects.map(s => (
                                            <option key={s._id} value={s._id}>{s.name}</option>
                                        ))}
                                    </select>
                                )}
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold mb-1.5" style={{ color: 'hsl(240 5% 70%)' }}>
                                        Marks Obtained <span className="text-red-400">*</span>
                                    </label>
                                    <input
                                        type="number"
                                        required
                                        min="0"
                                        step="0.5"
                                        value={formData.marksObtained}
                                        onChange={(e) => setFormData({ ...formData, marksObtained: e.target.value })}
                                        className="w-full px-4 py-2.5 rounded-lg text-sm bg-black/20 border text-white transition-colors focus:outline-none"
                                        style={{ borderColor: 'hsl(240 6% 20%)' }}
                                        onFocus={(e) => e.target.style.borderColor = 'hsl(43 96% 56%)'}
                                        onBlur={(e) => e.target.style.borderColor = 'hsl(240 6% 20%)'}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold mb-1.5" style={{ color: 'hsl(240 5% 70%)' }}>
                                        Max Marks <span className="text-red-400">*</span>
                                    </label>
                                    <input
                                        type="number"
                                        required
                                        min="1"
                                        step="1"
                                        value={formData.maxMarks}
                                        onChange={(e) => setFormData({ ...formData, maxMarks: e.target.value })}
                                        className="w-full px-4 py-2.5 rounded-lg text-sm bg-black/20 border text-white transition-colors focus:outline-none"
                                        style={{ borderColor: 'hsl(240 6% 20%)' }}
                                        onFocus={(e) => e.target.style.borderColor = 'hsl(43 96% 56%)'}
                                        onBlur={(e) => e.target.style.borderColor = 'hsl(240 6% 20%)'}
                                    />
                                </div>
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
                                    disabled={createMutation.isPending || subjects.length === 0}
                                    className="flex-1 py-2.5 rounded-lg text-sm font-bold transition-transform active:scale-95 disabled:opacity-50"
                                    style={{ background: 'hsl(43 96% 56%)', color: 'hsl(240 5.9% 10%)' }}
                                >
                                    {createMutation.isPending ? 'Saving...' : 'Save Result'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
