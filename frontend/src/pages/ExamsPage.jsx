import { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { GraduationCap, Plus, Trash2, X, Award } from 'lucide-react';
import { format } from 'date-fns';
import api from '../lib/api';
import { useToast } from '../components/common/Toast';

export default function ExamsPage() {
    const queryClient = useQueryClient();
    const { showToast } = useToast();
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);

    const [pendingExams, setPendingExams] = useState(() => {
        try {
            return JSON.parse(localStorage.getItem('pending_exams') || '[]');
        } catch {
            return [];
        }
    });

    // Save pending exams to localStorage
    useEffect(() => {
        localStorage.setItem('pending_exams', JSON.stringify(pendingExams));
    }, [pendingExams]);

    // Handle online/offline sync
    useEffect(() => {
        if (navigator.onLine && pendingExams.length > 0) {
            processSyncQueue();
        }

        const handleOnline = () => {
            processSyncQueue();
        };

        window.addEventListener('online', handleOnline);
        return () => window.removeEventListener('online', handleOnline);
    }, [pendingExams.length]);

    const processSyncQueue = async () => {
        if (!navigator.onLine || pendingExams.length === 0) return;
        
        showToast(`Syncing ${pendingExams.length} offline exam records...`, 'info');
        
        const examsToSync = [...pendingExams];
        let successCount = 0;
        const failed = [];

        for (const exam of examsToSync) {
            try {
                // eslint-disable-next-line no-unused-vars
                const { _id, isPending, subjectId, percentage, ...payload } = exam;
                
                const finalPayload = { ...payload };
                if (subjectId && typeof subjectId === 'object' && subjectId._id) {
                    finalPayload.subjectId = subjectId._id;
                }

                await api.post('/exams', finalPayload);
                successCount++;
            } catch (err) {
                console.error(`[Sync] Failed to sync exam "${exam.examName}":`, err.response?.data || err.message);
                failed.push(exam);
            }
        }

        setPendingExams(failed);
        if (successCount > 0) {
            showToast(`Successfully synced ${successCount} exam records!`, 'success');
            queryClient.invalidateQueries({ queryKey: ['exams'] });
        }
    };

    // Form state
    const [formData, setFormData] = useState({
        examName: '',
        subjectId: '',
        marksObtained: '',
        maxMarks: '',
        status: 'completed',
        date: new Date().toISOString().slice(0, 16) // format for datetime-local
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
        onError: (err) => showToast(err.response?.data?.message || 'Failed to save exam', 'error'),
    });

    const deleteMutation = useMutation({
        mutationFn: (id) => api.delete(`/exams/${id}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['exams'] });
        },
        onError: (err) => showToast(err.response?.data?.message || 'Failed to delete exam', 'error'),
    });

    // ── Handlers ──
    const openModal = () => {
        setFormData({ 
            examName: '', 
            subjectId: subjects[0]?._id || '', 
            marksObtained: '', 
            maxMarks: '', 
            status: 'completed',
            date: new Date().toISOString().slice(0, 16)
        });
        setIsAddModalOpen(true);
    };

    const closeModal = () => {
        setIsAddModalOpen(false);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const isCompleted = formData.status === 'completed';
        let payload = {};

        if (isCompleted) {
            const obtained = Number(formData.marksObtained);
            const max = Number(formData.maxMarks);

            if (obtained > max) {
                showToast('Obtained marks cannot be greater than maximum marks', 'error');
                return;
            }

            payload = {
                examName: formData.examName,
                subjectId: formData.subjectId,
                marksObtained: obtained,
                maxMarks: max,
                status: 'completed',
                date: formData.date
            };
        } else {
            payload = {
                examName: formData.examName,
                subjectId: formData.subjectId,
                status: 'upcoming',
                date: formData.date
            };
        }

        if (!navigator.onLine) {
            const tempId = `temp_${Date.now()}`;
            const queuedExam = {
                ...payload,
                _id: tempId,
                isPending: true,
                percentage: isCompleted ? ((payload.marksObtained / payload.maxMarks) * 100).toFixed(1) : 0,
                subjectId: subjects.find(s => s._id === payload.subjectId) || { name: 'Subject' }
            };

            setPendingExams(prev => [...prev, queuedExam]);
            showToast('Offline: Exam record queued', 'info');
            closeModal();
            return;
        }

        createMutation.mutate(payload);
    };

    // ── Group Exams by Exam Name ──
    const groupedExams = useMemo(() => {
        const groups = {};
        const allExams = [...exams, ...pendingExams];
        allExams.forEach(exam => {
            const name = exam.examName;
            if (!groups[name]) groups[name] = [];
            groups[name].push(exam);
        });
        return groups;
    }, [exams, pendingExams]);

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
            ) : Object.keys(groupedExams).length === 0 ? (
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
                            totalObtained += Number(r.marksObtained || 0);
                            totalMax += Number(r.maxMarks || 0);
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
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-semibold text-white flex items-center gap-2">
                                                            {record.subjectId?.name || 'Deleted Subject'}
                                                            {record.isPending && (
                                                                <span className="px-1.5 py-0.5 rounded text-[8px] font-black tracking-widest bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 animate-pulse">
                                                                    QUEUED
                                                                </span>
                                                            )}
                                                        </span>
                                                        <span className="text-[10px] font-bold uppercase tracking-wider mt-0.5 opacity-40">
                                                            {format(new Date(record.date), 'MMM dd, yyyy • hh:mm a')}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-5 py-3.5 text-right">
                                                    {record.status === 'upcoming' ? (
                                                        <span className="px-2 py-0.5 rounded text-[9px] font-black tracking-widest bg-blue-500/10 text-blue-400 border border-blue-500/20">
                                                            UPCOMING
                                                        </span>
                                                    ) : (
                                                        <>
                                                            <span className="text-sm font-bold text-white">{record.marksObtained}</span>
                                                            <span className="text-xs" style={{ color: 'hsl(240 5% 50%)' }}> / {record.maxMarks}</span>
                                                        </>
                                                    )}
                                                </td>
                                                <td className="px-5 py-3.5 text-right">
                                                    {record.status === 'upcoming' ? (
                                                        <span className="text-sm font-semibold text-white/10">—</span>
                                                    ) : (
                                                        <span className="text-sm font-semibold" style={{ color: 'hsl(43 96% 56%)' }}>{record.percentage}%</span>
                                                    )}
                                                </td>
                                                <td className="px-5 py-3.5 text-right">
                                                    <button
                                                        onClick={() => {
                                                            if (window.confirm('Delete this exam record?')) {
                                                                deleteMutation.mutate(record._id);
                                                            }
                                                        }}
                                                        className="p-1.5 rounded opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500/20 text-red-500"
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
                            <h3 className="text-lg font-bold text-white">
                                {formData.status === 'upcoming' ? 'Schedule Upcoming Exam' : 'Log Exam Result'}
                            </h3>
                            <button onClick={closeModal} className="p-1 rounded-lg hover:bg-white/5 transition-colors">
                                <X className="w-5 h-5" style={{ color: 'hsl(240 5% 50%)' }} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-5 space-y-4">
                            {/* Status Toggle */}
                            <div className="flex p-1 rounded-xl bg-black/40 border" style={{ borderColor: 'hsl(240 6% 15%)' }}>
                                <button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, status: 'completed' })}
                                    className={`flex-1 py-2 rounded-lg text-xs font-black transition-all ${formData.status === 'completed' ? 'bg-yellow-500 text-black shadow-lg shadow-yellow-500/20' : 'text-white/40 hover:text-white'}`}
                                >
                                    RESULT / GRADE
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, status: 'upcoming' })}
                                    className={`flex-1 py-2 rounded-lg text-xs font-black transition-all ${formData.status === 'upcoming' ? 'bg-yellow-500 text-black shadow-lg shadow-yellow-500/20' : 'text-white/40 hover:text-white'}`}
                                >
                                    UPCOMING / SCHEDULE
                                </button>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2">
                                    <label className="block text-xs font-black uppercase tracking-widest mb-1.5 opacity-40 ml-1">Exam Series Name*</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.examName}
                                        onChange={(e) => setFormData({ ...formData, examName: e.target.value })}
                                        placeholder="e.g. Midterm 1, Final Exam"
                                        className="w-full px-4 py-2.5 rounded-xl text-sm bg-black/20 border text-white transition-all focus:outline-none"
                                        style={{ borderColor: 'hsl(240 6% 20%)' }}
                                        onFocus={(e) => e.target.style.borderColor = 'hsl(43 96% 56%)'}
                                        onBlur={(e) => e.target.style.borderColor = 'hsl(240 6% 20%)'}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-black uppercase tracking-widest mb-1.5 opacity-40 ml-1">Subject*</label>
                                {subjects.length === 0 ? (
                                    <div className="text-xs text-red-400 p-3 bg-red-400/10 rounded-xl border border-red-400/20">
                                        Please create a Subject first on the Subjects page.
                                    </div>
                                ) : (
                                    <select
                                        required
                                        value={formData.subjectId}
                                        onChange={(e) => setFormData({ ...formData, subjectId: e.target.value })}
                                        className="w-full px-4 py-2.5 rounded-xl text-sm bg-black/20 border text-white transition-all focus:outline-none"
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

                            <div>
                                <label className="block text-xs font-black uppercase tracking-widest mb-1.5 opacity-40 ml-1">Date & Time*</label>
                                <input
                                    type="datetime-local"
                                    required
                                    value={formData.date}
                                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                    className="w-full px-4 py-2.5 rounded-xl text-sm bg-black/20 border text-white transition-all focus:outline-none"
                                    style={{ borderColor: 'hsl(240 6% 20%)' }}
                                    onFocus={(e) => e.target.style.borderColor = 'hsl(43 96% 56%)'}
                                    onBlur={(e) => e.target.style.borderColor = 'hsl(240 6% 20%)'}
                                />
                            </div>

                            {formData.status === 'completed' && (
                                <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
                                    <div>
                                        <label className="block text-xs font-black uppercase tracking-widest mb-1.5 opacity-40 ml-1">Marks Obtained*</label>
                                        <input
                                            type="number"
                                            required
                                            min="0"
                                            step="0.5"
                                            value={formData.marksObtained}
                                            onChange={(e) => setFormData({ ...formData, marksObtained: e.target.value })}
                                            className="w-full px-4 py-2.5 rounded-xl text-sm bg-black/20 border text-white transition-all focus:outline-none"
                                            style={{ borderColor: 'hsl(240 6% 20%)' }}
                                            onFocus={(e) => e.target.style.borderColor = 'hsl(43 96% 56%)'}
                                            onBlur={(e) => e.target.style.borderColor = 'hsl(240 6% 20%)'}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-black uppercase tracking-widest mb-1.5 opacity-40 ml-1">Max Marks*</label>
                                        <input
                                            type="number"
                                            required
                                            min="1"
                                            step="1"
                                            value={formData.maxMarks}
                                            onChange={(e) => setFormData({ ...formData, maxMarks: e.target.value })}
                                            className="w-full px-4 py-2.5 rounded-xl text-sm bg-black/20 border text-white transition-all focus:outline-none"
                                            style={{ borderColor: 'hsl(240 6% 20%)' }}
                                            onFocus={(e) => e.target.style.borderColor = 'hsl(43 96% 56%)'}
                                            onBlur={(e) => e.target.style.borderColor = 'hsl(240 6% 20%)'}
                                        />
                                    </div>
                                </div>
                            )}

                            <div className="pt-2 flex gap-3">
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    className="flex-1 py-3 rounded-xl text-sm font-bold transition-all hover:bg-white/5"
                                    style={{ color: 'hsl(240 5% 60%)' }}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={createMutation.isPending || subjects.length === 0}
                                    className="flex-1 py-3 rounded-xl text-sm font-black transition-all active:scale-95 disabled:opacity-50"
                                    style={{ background: 'hsl(43 96% 56%)', color: 'hsl(240 5.9% 10%)' }}
                                >
                                    {createMutation.isPending ? 'Processing...' : (!navigator.onLine ? 'Queue Result' : (formData.status === 'upcoming' ? 'Schedule Exam' : 'Save Result'))}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
