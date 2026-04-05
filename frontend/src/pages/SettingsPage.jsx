import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams, Link } from 'react-router-dom';
import { 
    Settings, Bell, User, Shield, 
    Trash2, Check, Clock, Info, 
    AlertTriangle, XCircle, CheckCircle, 
    Flame, Calendar, MoreHorizontal,
    Search, Filter, CheckCheck
} from 'lucide-react';
import { format, formatDistanceToNow, isToday, isYesterday } from 'date-fns';
import api from '../lib/api';
import { useToast } from '../components/common/Toast';

const TYPE_ICONS = {
    info: <Info className="w-5 h-5 text-blue-400" />,
    warning: <AlertTriangle className="w-5 h-5 text-amber-400" />,
    error: <XCircle className="w-5 h-5 text-red-400" />,
    success: <CheckCircle className="w-5 h-5 text-green-400" />,
    attendance: <Check className="w-5 h-5 text-emerald-400" />,
    assignment: <Calendar className="w-5 h-5 text-purple-400" />,
    exam: <Flame className="w-5 h-5 text-orange-400" />,
    streak: <Flame className="w-5 h-5 text-orange-500" />,
};

import { useAuthStore } from '../store/authStore';

export default function SettingsPage() {
    const user = useAuthStore((s) => s.user);
    const updateUser = useAuthStore((s) => s.updateUser);
    const [searchParams, setSearchParams] = useSearchParams();
    const activeTab = searchParams.get('tab') || 'profile';
    const queryClient = useQueryClient();
    const { showToast } = useToast();
    const [searchQuery, setSearchQuery] = useState('');
    const [filter, setFilter] = useState('all'); // all, read, unread

    const urlBase64ToUint8Array = (base64String) => {
        const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
        const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
        const rawData = window.atob(base64);
        const outputArray = new Uint8Array(rawData.length);
        for (let i = 0; i < rawData.length; ++i) outputArray[i] = rawData.charCodeAt(i);
        return outputArray;
    };

    const handleEnablePush = async () => {
        try {
            if (!('serviceWorker' in navigator)) return showToast('Notifications not supported in this browser', 'error');
            
            // IF ALREADY ENABLED -> DISABLE IT
            if (user?.pushSubscription) {
                 const registration = await navigator.serviceWorker.ready;
                 const subscription = await registration.pushManager.getSubscription();
                 if (subscription) await subscription.unsubscribe();
                 
                 // Notify backend
                 await api.delete('/push/unsubscribe').catch(() => {}); 
                 updateUser({ pushSubscription: null });
                 return showToast('System notifications disabled', 'info');
            }

            // IF DISABLED -> ENABLE IT
            const permission = await Notification.requestPermission();
            if (permission !== 'granted') {
                 return showToast('Notification permission was denied by your browser', 'error');
            }

            // Ensure SW is ready
            const registration = await navigator.serviceWorker.getRegistration();
            if (!registration) {
                 return showToast('Browser communication error. Please refresh the page.', 'error');
            }

            const subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array('BOFTEAR6miNWeLidfifbRztCeGK6DozslH877QJR6WlTduTNSklq4ZeKsMoDGN3LWsXqqIwiKTbrc_RhdfKhdl0'),
            }).catch(e => {
                 if (e.name === 'NotAllowedError') throw new Error('Notifications are blocked in your browser settings');
                 if (e.name === 'InvalidCharacterError') throw new Error('Security key mismatch. Contact admin.');
                 throw e;
            });

            // Save subscription to backend
            await api.post('/push/subscribe', { subscription });
            
            // Sync with local store
            updateUser({ pushSubscription: subscription });
            showToast('System notifications active!', 'success');
        } catch (err) {
            console.error('Push operation failed:', err);
            showToast(err.message || 'Something went wrong. Please refresh and try again.', 'error');
        }
    };

    const { data: notificationsData, isLoading } = useQuery({
        queryKey: ['notifications'],
        queryFn: () => api.get('/notifications').then(r => r.data.notifications),
    });

    const deleteMutation = useMutation({
        mutationFn: (id) => api.delete(`/notifications/${id}`),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
    });

    const clearHistoryMutation = useMutation({
        mutationFn: () => api.delete('/notifications/history/clear'),
        onSuccess: () => {
             queryClient.invalidateQueries({ queryKey: ['notifications'] });
             showToast('Read notifications cleared', 'success');
        },
    });

    const markReadMutation = useMutation({
        mutationFn: (id) => api.patch(`/notifications/${id}/read`),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
    });

    const notifications = useMemo(() => {
        let list = notificationsData || [];
        if (filter === 'unread') list = list.filter(n => !n.read);
        if (filter === 'read') list = list.filter(n => n.read);
        if (searchQuery) {
            list = list.filter(n => 
                n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                n.message.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }
        return list;
    }, [notificationsData, filter, searchQuery]);

    const readCount = (notificationsData || []).filter(n => n.read).length;

    const TABS = [
        { id: 'profile', icon: User, label: 'Profile' },
        { id: 'notifications', icon: Bell, label: 'Notifications' },
        { id: 'security', icon: Shield, label: 'Security' },
    ];

    return (
        <div className="max-w-6xl space-y-8 pb-20">
            <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-[var(--active-highlight)] border border-white/5 flex items-center justify-center">
                    <Settings className="w-6 h-6 text-[var(--primary-accent)]" />
                </div>
                <div>
                    <h2 className="text-3xl font-black text-white tracking-tight">Settings</h2>
                    <p className="text-sm font-medium text-[var(--text-muted)]">Customize your experience and manage history</p>
                </div>
            </div>

            <div className="grid grid-cols-[240px_1fr] gap-8 items-start">
                {/* Sidebar */}
                <div className="space-y-1">
                    {TABS.map(tab => (
                        <button 
                            key={tab.id}
                            onClick={() => setSearchParams({ tab: tab.id })}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all ${activeTab === tab.id ? 'bg-[var(--active-highlight)] text-white shadow-xl' : 'text-[var(--text-muted)] hover:bg-[rgba(255,255,255,0.02)] hover:text-white'}`}
                        >
                            <tab.icon className={`w-5 h-5 ${activeTab === tab.id ? 'text-[var(--primary-accent)]' : ''}`} />
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Content */}
                <div className="rounded-[32px] border border-[var(--active-highlight)] overflow-hidden glass"
                    style={{ background: 'var(--card-bg)' }}>
                    
                    {activeTab === 'notifications' && (
                        <div className="p-8 space-y-8">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-xl font-bold text-white tracking-tight">Notification History</h3>
                                    <p className="text-xs font-semibold text-[var(--text-muted)] mt-1 uppercase tracking-widest leading-none">
                                        All your past alerts and messages
                                    </p>
                                </div>
                                <div className="flex items-center gap-3">
                                     {readCount > 0 && (
                                        <button 
                                            onClick={() => clearHistoryMutation.mutate()}
                                            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all text-red-500 bg-red-500/10 border border-red-500/20 hover:bg-red-500/20"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                            Clear History
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* System Push Notifications Toggle */}
                            <div className="p-6 rounded-3xl bg-[rgba(232,168,56,0.05)] border border-[rgba(232,168,56,0.1)] flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-[var(--active-highlight)] flex items-center justify-center text-[var(--primary-accent)]">
                                        <Bell className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-bold text-white">System Push Notifications</h4>
                                        <p className="text-[11px] font-medium text-[var(--text-muted)]">Receive alerts even when the app is closed</p>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => handleEnablePush()}
                                    className="relative flex items-center group focus:outline-none"
                                >
                                    <div className={`w-12 h-6 rounded-full transition-all duration-300 border ${user?.pushSubscription ? 'bg-[var(--primary-accent)] border-[var(--primary-accent)]' : 'bg-black/40 border-white/10'}`}>
                                        <div className={`absolute top-1 w-4 h-4 rounded-full transition-all duration-300 ${user?.pushSubscription ? 'left-7 bg-[var(--sidebar-bg)]' : 'left-1 bg-[var(--text-muted)]'}`} />
                                    </div>
                                    <span className="ml-3 text-[10px] font-black tracking-[0.2em] uppercase text-white/40 group-hover:text-white transition-colors">
                                        {user?.pushSubscription ? 'Active' : 'Inactive'}
                                    </span>
                                </button>
                            </div>

                            {/* Filters Bar */}
                            <div className="flex items-center gap-4 py-4 px-5 rounded-2xl bg-[rgba(255,255,255,0.02)] border border-[var(--active-highlight)]">
                                <div className="flex-1 relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                                    <input 
                                        type="text" 
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        placeholder="Search history..." 
                                        className="w-full bg-transparent pl-10 pr-4 text-xs font-bold text-white focus:outline-none"
                                    />
                                </div>
                                <div className="h-4 w-[1px] bg-[var(--active-highlight)]" />
                                <div className="flex items-center gap-2">
                                    {['all', 'unread', 'read'].map((f) => (
                                        <button 
                                            key={f}
                                            onClick={() => setFilter(f)}
                                            className={`px-3 py-1.5 rounded-lg text-[10px] font-black tracking-widest uppercase transition-all ${filter === f ? 'bg-[var(--primary-accent)] text-[var(--sidebar-bg)]' : 'text-[var(--text-muted)] hover:bg-[var(--active-highlight)] hover:text-white'}`}
                                        >
                                            {f}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-4">
                                {isLoading ? (
                                    <div className="py-20 text-center text-sm font-bold text-[var(--text-muted)] animate-pulse">Fetching history...</div>
                                ) : notifications.length === 0 ? (
                                    <div className="py-20 text-center bg-[rgba(255,255,255,0.01)] rounded-3xl border border-dashed border-[var(--active-highlight)]">
                                        <Bell className="w-10 h-10 text-[var(--active-highlight)] mx-auto mb-4 opacity-20" />
                                        <p className="text-sm font-bold text-white mb-1">No notifications found</p>
                                        <p className="text-xs font-medium text-[var(--text-muted)]">Your history matches current filters.</p>
                                    </div>
                                ) : (
                                    notifications.map((n) => (
                                        <div key={n._id} className={`group relative p-6 rounded-3xl border transition-all hover:bg-[rgba(255,255,255,0.02)] ${n.read ? 'bg-transparent border-[rgba(255,255,255,0.03)]' : 'bg-[rgba(232,168,56,0.03)] border-[rgba(232,168,56,0.15)] shadow-lg shadow-[rgba(232,168,56,0.03)]'}`}>
                                            <div className="flex gap-6">
                                                <div className="mt-1 flex-shrink-0">
                                                    <div className={`p-3 rounded-2xl bg-[var(--active-highlight)] border border-white/5`}>
                                                        {TYPE_ICONS[n.type] || TYPE_ICONS.info}
                                                    </div>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center justify-between mb-2">
                                                        <div className="flex items-center gap-3">
                                                            <h4 className="text-[15px] font-black text-white tracking-tight leading-none">{n.title}</h4>
                                                            {!n.read && (
                                                                <span className="px-2 py-0.5 rounded bg-[var(--primary-accent)] text-[var(--sidebar-bg)] text-[9px] font-black tracking-widest uppercase">New</span>
                                                            )}
                                                        </div>
                                                        <span className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-tighter opacity-50">
                                                            {isToday(new Date(n.createdAt)) 
                                                                ? format(new Date(n.createdAt), 'hh:mm a') 
                                                                : isYesterday(new Date(n.createdAt))
                                                                    ? 'Yesterday'
                                                                    : format(new Date(n.createdAt), 'dd/MM/yyyy')}
                                                        </span>
                                                    </div>
                                                    <p className="text-[14px] font-medium text-[var(--text-muted)] leading-relaxed mb-4">
                                                        {n.message}
                                                    </p>
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-4">
                                                            {!n.read && (
                                                                <button 
                                                                    onClick={() => markReadMutation.mutate(n._id)}
                                                                    className="flex items-center gap-2 text-[10px] font-black tracking-widest text-[var(--status-safe)] uppercase hover:opacity-80 border border-[var(--status-safe)]/20 px-3 py-1.5 rounded-lg"
                                                                >
                                                                    <CheckCheck className="w-3.5 h-3.5" />
                                                                    Mark as seen
                                                                </button>
                                                            )}
                                                            {n.link && (
                                                                <Link to={n.link} className="flex items-center gap-2 text-[10px] font-black tracking-widest text-[var(--primary-accent)] uppercase hover:opacity-80 px-3 py-1.5 rounded-lg bg-[var(--primary-accent)]/10">
                                                                    View Action
                                                                </Link>
                                                            )}
                                                        </div>
                                                        <button 
                                                            onClick={() => deleteMutation.mutate(n._id)}
                                                            className="p-2 rounded-lg text-red-500/50 hover:text-red-500 hover:bg-red-500/10 transition-all opacity-0 group-hover:opacity-100"
                                                            title="Delete forever"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )}

                    {activeTab === 'profile' && (
                        <div className="p-10 flex flex-col items-center justify-center text-center space-y-6">
                            <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-[var(--primary-accent)] shadow-2xl">
                                 <img 
                                    src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.name || 'User'}`} 
                                    alt="Avatar" 
                                    className="w-full h-full object-cover"
                                />
                            </div>
                            <div className="space-y-1">
                                <h3 className="text-2xl font-black text-white">{user?.name}</h3>
                                <p className="text-[var(--text-muted)] font-medium">{user?.email}</p>
                            </div>
                            <div className="w-full max-w-md pt-6 space-y-4">
                                <div className="p-5 rounded-[24px] bg-[rgba(255,255,255,0.02)] border border-white/5 text-left">
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)] mb-2">Member Since</p>
                                    <p className="text-sm font-bold text-white">{format(new Date(), 'MMMM yyyy')}</p>
                                </div>
                                <button disabled className="w-full py-4 rounded-xl bg-[var(--active-highlight)] text-[var(--text-muted)] font-bold opacity-50 cursor-not-allowed">
                                    Update Profile (Coming Soon)
                                </button>
                            </div>
                        </div>
                    )}

                    {activeTab === 'security' && (
                        <div className="p-10 text-center space-y-4">
                             <Shield className="w-16 h-16 text-[var(--primary-accent)] mx-auto opacity-20" />
                             <h3 className="text-xl font-bold text-white">Security Settings</h3>
                             <p className="text-sm font-medium text-[var(--text-muted)] mb-8">Password management and 2FA options</p>
                             <div className="max-w-md mx-auto space-y-4">
                                 <div className="p-6 rounded-3xl bg-[rgba(255,255,255,0.01)] border border-[var(--active-highlight)] flex items-center justify-between text-left">
                                     <div>
                                         <p className="text-sm font-bold text-white">Two-Factor Authentication</p>
                                         <p className="text-[11px] font-medium text-[var(--text-muted)]">Currently Disabled</p>
                                     </div>
                                     <button className="px-4 py-2 rounded-lg bg-[var(--primary-accent)] text-[var(--sidebar-bg)] text-[11px] font-black uppercase tracking-widest">Enable</button>
                                 </div>
                             </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
