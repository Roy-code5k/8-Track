import { Calendar, FileText } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function PrivacyPage() {
    return (
        <div className="min-h-screen bg-[var(--bg-color)] text-white p-8 py-16 flex justify-center">
            <div className="max-w-2xl w-full">
                <div className="flex items-center justify-between mb-8">
                    <Link to="/" className="text-sm font-bold text-[var(--text-muted)] hover:text-[var(--primary-accent)] transition-colors">
                        ← Back to Home
                    </Link>
                </div>
                
                <div className="p-10 text-center space-y-4 rounded-[32px] border border-[var(--active-highlight)] overflow-hidden glass" style={{ background: 'var(--card-bg)' }}>
                    <FileText className="w-16 h-16 text-[var(--primary-accent)] mx-auto opacity-20" />
                    <h3 className="text-3xl font-black text-white tracking-tight">Privacy Policies</h3>
                    <p className="text-sm font-medium text-[var(--text-muted)] mb-8">How we handle and protect your data</p>
                    
                    <div className="max-w-3xl mx-auto space-y-4">
                        <div className="p-8 rounded-3xl bg-[rgba(255,255,255,0.01)] border border-[var(--active-highlight)] text-left space-y-6">
                            <div className="border-b border-white/5 pb-4">
                                <p className="text-xs font-bold text-[var(--primary-accent)] uppercase tracking-widest mb-1">Effective Date: April 9, 2026</p>
                                <p className="text-[12px] font-medium text-[var(--text-muted)] mt-2">
                                    8Track (“we,” “our,” or “us”) is a personal academic productivity application that helps college students manage attendance, assignments, exams, and schedules. This Privacy Policy describes how we collect, use, store, and protect your information when you use our application and services.
                                </p>
                            </div>

                            <div className="space-y-6 text-[12px] font-medium text-[var(--text-muted)] leading-relaxed">
                                <div>
                                    <span className="text-white font-bold block mb-1 text-[13px]">1. Information We Collect</span>
                                    <ul className="list-disc pl-5 mt-2 space-y-1">
                                        <li><span className="text-white/80 font-bold">Account Information</span> — your name, email address, and securely hashed password when you register.</li>
                                        <li><span className="text-white/80 font-bold">Academic Data</span> — subjects, attendance records, assignment details, and exam schedules you create within the app.</li>
                                        <li><span className="text-white/80 font-bold">Google Calendar Data</span> — if you choose to connect your Google account, we access your calendar events solely to display upcoming classes, assignments, and exams within the 8Track dashboard. We do not access contacts, emails, files, or any other Google service data.</li>
                                        <li><span className="text-white/80 font-bold">Authentication Tokens</span> — OAuth 2.0 access and refresh tokens issued by Google, used exclusively to sync your calendar data.</li>
                                    </ul>
                                </div>
                                <div>
                                    <span className="text-white font-bold block mb-1 text-[13px]">2. How We Use Your Information</span>
                                    <ul className="list-disc pl-5 mt-2 space-y-1">
                                        <li>Displaying your academic schedule, attendance predictions, and assignment deadlines.</li>
                                        <li>Syncing calendar events from Google Calendar to your 8Track dashboard.</li>
                                        <li>Creating calendar events on your behalf when you add assignments or exams (only with your explicit permission).</li>
                                        <li>Authenticating your identity and maintaining your session securely.</li>
                                    </ul>
                                </div>
                                <div>
                                    <span className="text-white font-bold block mb-1 text-[13px]">3. Google Calendar API — Limited Use Disclosure</span>
                                    <p className="mb-2">8Track's use and transfer of information received from Google APIs adheres to the Google API Services User Data Policy, including the Limited Use requirements.</p>
                                    <ul className="list-disc pl-5 space-y-1">
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
                                    We retain your data for as long as your account is active. You may request deletion of your account and all associated data at any time by contacting us. To revoke Google Calendar access, disconnect 8Track from your Google Account at myaccount.google.com/permissions. Upon revocation, all stored Google tokens are deleted immediately.
                                </div>
                                <div>
                                    <span className="text-white font-bold block mb-1 text-[13px]">7. Third-Party Services</span>
                                    <ul className="list-disc pl-5 mt-2 space-y-1">
                                        <li>Google Calendar API — for calendar synchronization as described above.</li>
                                        <li>Vercel — for hosting and serverless deployment.</li>
                                        <li>MongoDB Atlas — for secure cloud database storage.</li>
                                    </ul>
                                </div>
                                <div>
                                    <span className="text-white font-bold block mb-1 text-[13px]">8. Children's Privacy</span>
                                    8Track is designed for college students and is not intended for use by children under the age of 13. We do not knowingly collect personal information from children under 13. If we become aware of such data, we will delete it promptly.
                                </div>
                                <div>
                                    <span className="text-white font-bold block mb-1 text-[13px]">9. Changes to This Policy</span>
                                    We may update this Privacy Policy from time to time. Any changes will be reflected on this page with an updated effective date. Continued use of 8Track after changes constitutes acceptance of the revised policy.
                                </div>
                                <div className="pt-4 border-t border-white/5 pb-6">
                                    <span className="text-white font-bold block mb-1 text-[13px]">10. Contact Us</span>
                                    If you have questions about this Privacy Policy or wish to request data deletion, contact us at <a href="mailto:hriturajroy3@gmail.com" className="text-[var(--primary-accent)] hover:underline">hriturajroy3@gmail.com</a>.
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
