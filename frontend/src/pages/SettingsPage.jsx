import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams, Link } from 'react-router-dom';
import { 
    Settings, Bell, User, Shield, 
    Trash2, Check, Clock, Info, 
    AlertTriangle, XCircle, CheckCircle, 
    Flame, Calendar, MoreHorizontal,
    Search, Filter, CheckCheck, FileText, Scale
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
        { id: 'privacy', icon: FileText, label: 'Privacy Policies' },
        { id: 'terms', icon: Scale, label: 'Terms & Conditions' },
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

                    {activeTab === 'privacy' && (
                        <div className="p-10 text-center space-y-4">
                             <FileText className="w-16 h-16 text-[var(--primary-accent)] mx-auto opacity-20" />
                             <h3 className="text-xl font-bold text-white">Privacy Policy</h3>
                             <p className="text-sm font-medium text-[var(--text-muted)] mb-8">How 8Track handles and protects your data</p>
                             <div className="max-w-2xl mx-auto space-y-4">
                                 <div className="p-8 rounded-3xl bg-[rgba(255,255,255,0.01)] border border-[var(--active-highlight)] text-left space-y-6">
                                     <div className="border-b border-white/5 pb-4">
                                        <p className="text-xs font-bold text-[var(--primary-accent)] uppercase tracking-widest mb-1">Effective Date: April 9, 2026</p>
                                        <p className="text-[12px] font-medium text-[var(--text-muted)] mt-2">
                                            8Track (&ldquo;we,&rdquo; &ldquo;our,&rdquo; or &ldquo;us&rdquo;) is a personal academic productivity application that helps college students manage attendance, assignments, exams, and schedules. This Privacy Policy describes how we collect, use, store, and protect your information when you use our application and services.
                                        </p>
                                     </div>

                                     <div className="space-y-5 text-[12px] font-medium text-[var(--text-muted)] leading-relaxed">
                                         <div>
                                            <span className="text-white font-bold block mb-1 text-[13px]">1. Information We Collect</span>
                                            <ul className="list-disc pl-4 space-y-1 mt-1">
                                                <li><span className="text-white/80 font-bold">Account Information</span> — your name, email address, and securely hashed password when you register.</li>
                                                <li><span className="text-white/80 font-bold">Academic Data</span> — subjects, attendance records, assignment details, and exam schedules you create within the app.</li>
                                                <li><span className="text-white/80 font-bold">Google Calendar Data</span> — if you choose to connect your Google account, we access your calendar events solely to display upcoming classes, assignments, and exams within the 8Track dashboard. We do not access contacts, emails, files, or any other Google service data.</li>
                                                <li><span className="text-white/80 font-bold">Authentication Tokens</span> — OAuth 2.0 access and refresh tokens issued by Google, used exclusively to sync your calendar data.</li>
                                            </ul>
                                         </div>
                                         <div>
                                            <span className="text-white font-bold block mb-1 text-[13px]">2. How We Use Your Information</span>
                                            <ul className="list-disc pl-4 space-y-1 mt-1">
                                                <li>Displaying your academic schedule, attendance predictions, and assignment deadlines.</li>
                                                <li>Syncing calendar events from Google Calendar to your 8Track dashboard.</li>
                                                <li>Creating calendar events on your behalf when you add assignments or exams (only with your explicit permission).</li>
                                                <li>Authenticating your identity and maintaining your session securely.</li>
                                            </ul>
                                         </div>
                                         <div>
                                            <span className="text-white font-bold block mb-1 text-[13px]">3. Google Calendar API — Limited Use Disclosure</span>
                                            <p className="mb-1">8Track&apos;s use and transfer of information received from Google APIs adheres to the <a href="https://developers.google.com/terms/api-services-user-data-policy" target="_blank" rel="noopener noreferrer" className="text-[var(--primary-accent)] hover:underline">Google API Services User Data Policy</a>, including the Limited Use requirements.</p>
                                            <ul className="list-disc pl-4 space-y-1 mt-1">
                                                <li>We only request the minimum scopes necessary to read and create calendar events.</li>
                                                <li>We do not use Google data for advertising, marketing, or profiling purposes.</li>
                                                <li>We do not sell, lease, or share Google user data with any third party.</li>
                                                <li>We do not allow humans to read your Google data unless you provide explicit consent, it is required for security purposes, or it is required by law.</li>
                                            </ul>
                                         </div>
                                         <div>
                                            <span className="text-white font-bold block mb-1 text-[13px]">4. Data Storage and Security</span>
                                            Your account and academic data are stored in a secure MongoDB database. All communication between your browser and our servers occurs over HTTPS. Passwords are hashed using bcrypt and are never stored in plaintext. OAuth tokens are encrypted at rest, processed only for calendar synchronization, and are never exposed to the frontend.
                                         </div>
                                         <div>
                                            <span className="text-white font-bold block mb-1 text-[13px]">5. Data Sharing</span>
                                            We do not sell, rent, trade, or share your personal data with any third parties. Your data is used solely to operate the 8Track application. We may disclose information only if required to do so by law or to protect the rights, safety, or property of our users.
                                         </div>
                                         <div>
                                            <span className="text-white font-bold block mb-1 text-[13px]">6. Data Retention and Deletion</span>
                                            We retain your data for as long as your account is active. You may request deletion of your account and all associated data at any time by contacting us. To revoke Google Calendar access, disconnect 8Track from your Google Account at <a href="https://myaccount.google.com/permissions" target="_blank" rel="noopener noreferrer" className="text-[var(--primary-accent)] hover:underline">myaccount.google.com/permissions</a>. Upon revocation, all stored Google tokens are deleted immediately.
                                         </div>
                                         <div>
                                            <span className="text-white font-bold block mb-1 text-[13px]">7. Third-Party Services</span>
                                            <ul className="list-disc pl-4 space-y-1 mt-1">
                                                <li><span className="text-white/80 font-bold">Google Calendar API</span> — for calendar synchronization as described above.</li>
                                                <li><span className="text-white/80 font-bold">Vercel</span> — for hosting and serverless deployment.</li>
                                                <li><span className="text-white/80 font-bold">MongoDB Atlas</span> — for secure cloud database storage.</li>
                                            </ul>
                                         </div>
                                         <div>
                                            <span className="text-white font-bold block mb-1 text-[13px]">8. Children&apos;s Privacy</span>
                                            8Track is designed for college students and is not intended for use by children under the age of 13. We do not knowingly collect personal information from children under 13. If we become aware of such data, we will delete it promptly.
                                         </div>
                                         <div>
                                            <span className="text-white font-bold block mb-1 text-[13px]">9. Changes to This Policy</span>
                                            We may update this Privacy Policy from time to time. Any changes will be reflected on this page with an updated effective date. Continued use of 8Track after changes constitutes acceptance of the revised policy.
                                         </div>
                                         <div className="pt-4 border-t border-white/5">
                                            <span className="text-white font-bold block mb-1 text-[13px]">10. Contact Us</span>
                                            If you have questions about this Privacy Policy or wish to request data deletion, contact us at <a href="mailto:hriturajroy3@gmail.com" className="text-[var(--primary-accent)] hover:underline">hriturajroy3@gmail.com</a>.
                                         </div>
                                     </div>
                                 </div>
                             </div>
                        </div>
                    )}

                    {activeTab === 'terms' && (
                        <div className="p-10 text-center space-y-4">
                             <Scale className="w-16 h-16 text-[var(--primary-accent)] mx-auto opacity-20" />
                             <h3 className="text-xl font-bold text-white">Terms of Service</h3>
                             <p className="text-sm font-medium text-[var(--text-muted)] mb-8">Application rules and user agreements</p>
                             <div className="max-w-2xl mx-auto space-y-4">
                                 <div className="p-8 rounded-3xl bg-[rgba(255,255,255,0.01)] border border-[var(--active-highlight)] text-left space-y-6">
                                     <div className="border-b border-white/5 pb-4">
                                        <p className="text-xs font-bold text-[var(--primary-accent)] uppercase tracking-widest mb-1">Effective Date: April 9, 2026</p>
                                        <p className="text-[12px] font-medium text-[var(--text-muted)] mt-2">
                                            These Terms of Service (&ldquo;Terms&rdquo;) govern your access to and use of 8Track, a personal academic management application. By creating an account or using 8Track, you agree to be bound by these Terms. If you do not agree, please do not use the application.
                                        </p>
                                     </div>

                                     <div className="space-y-5 text-[12px] font-medium text-[var(--text-muted)] leading-relaxed">
                                         <div>
                                            <span className="text-white font-bold block mb-1 text-[13px]">1. Description of Service</span>
                                            8Track is a Progressive Web App designed for college students to manage academic tasks including attendance tracking, assignment management, exam scheduling, Pomodoro-based focus sessions, and optional Google Calendar synchronization. The service is provided free of charge and is intended solely for personal, non-commercial academic use.
                                         </div>
                                         <div>
                                            <span className="text-white font-bold block mb-1 text-[13px]">2. Eligibility</span>
                                            You must be at least 13 years of age to use 8Track. By using the application, you represent and warrant that you meet this age requirement and have the legal capacity to enter into these Terms.
                                         </div>
                                         <div>
                                            <span className="text-white font-bold block mb-1 text-[13px]">3. Account Registration and Security</span>
                                            To access 8Track, you must create an account with a valid email address and password. You are responsible for maintaining the confidentiality of your login credentials and for all activity that occurs under your account. You agree to notify us immediately of any unauthorized use of your account.
                                         </div>
                                         <div>
                                            <span className="text-white font-bold block mb-1 text-[13px]">4. Acceptable Use</span>
                                            <p className="mb-1">You agree to use 8Track only for its intended purpose of personal academic management. You shall not:</p>
                                            <ul className="list-disc pl-4 space-y-1 mt-1">
                                                <li>Attempt to gain unauthorized access to the application, its servers, or databases.</li>
                                                <li>Use the application to store, transmit, or distribute malicious content.</li>
                                                <li>Reverse-engineer, decompile, or disassemble any part of the application.</li>
                                                <li>Use automated systems (bots, scrapers) to interact with the service.</li>
                                                <li>Violate any applicable local, national, or international law while using 8Track.</li>
                                            </ul>
                                         </div>
                                         <div>
                                            <span className="text-white font-bold block mb-1 text-[13px]">5. Google Calendar Integration</span>
                                            8Track offers optional integration with Google Calendar. If you connect your Google account, you authorize 8Track to read your calendar events and create new events on your behalf for academic scheduling purposes. 8Track will not access or modify your calendar beyond what is strictly necessary to provide this functionality. You may revoke this access at any time through your <a href="https://myaccount.google.com/permissions" target="_blank" rel="noopener noreferrer" className="text-[var(--primary-accent)] hover:underline">Google Account permissions</a>.
                                         </div>
                                         <div>
                                            <span className="text-white font-bold block mb-1 text-[13px]">6. Intellectual Property</span>
                                            All content, design, code, and branding associated with 8Track are the property of the 8Track team. You retain ownership of any personal data and academic information you enter into the application. By using 8Track, you grant us a limited license to process your data solely for the purpose of delivering the service.
                                         </div>
                                         <div>
                                            <span className="text-white font-bold block mb-1 text-[13px]">7. Data Usage and Privacy</span>
                                            Your use of 8Track is also governed by our Privacy Policy, which describes how we collect, use, and protect your information. We store your data securely, do not sell or share your personal data with third parties, and do not use your data for advertising or profiling.
                                         </div>
                                         <div>
                                            <span className="text-white font-bold block mb-1 text-[13px]">8. Service Availability and Modifications</span>
                                            We strive to keep 8Track available and reliable, but we do not guarantee uninterrupted access. We reserve the right to modify, suspend, or discontinue any part of the service at any time, with or without notice. We will make reasonable efforts to notify users of significant changes.
                                         </div>
                                         <div>
                                            <span className="text-white font-bold block mb-1 text-[13px]">9. Limitation of Liability</span>
                                            8Track is provided on an &ldquo;as is&rdquo; and &ldquo;as available&rdquo; basis. To the fullest extent permitted by law, we disclaim all warranties, express or implied. We are not liable for any data loss, missed deadlines, incorrect attendance predictions, service interruptions, or any indirect, incidental, or consequential damages arising from your use of the application.
                                         </div>
                                         <div>
                                            <span className="text-white font-bold block mb-1 text-[13px]">10. Account Termination</span>
                                            You may delete your account at any time by contacting us. We reserve the right to suspend or terminate accounts that violate these Terms. Upon termination, your data will be deleted in accordance with our Privacy Policy.
                                         </div>
                                         <div>
                                            <span className="text-white font-bold block mb-1 text-[13px]">11. Changes to These Terms</span>
                                            We may update these Terms from time to time. Changes will be posted on this page with an updated effective date. Your continued use of 8Track after any modification constitutes acceptance of the revised Terms.
                                         </div>
                                         <div className="pt-4 border-t border-white/5">
                                            <span className="text-white font-bold block mb-1 text-[13px]">12. Contact</span>
                                            For questions or concerns regarding these Terms, reach out to us at <a href="mailto:hriturajroy3@gmail.com" className="text-[var(--primary-accent)] hover:underline">hriturajroy3@gmail.com</a>.
                                         </div>
                                     </div>
                                 </div>
                             </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
