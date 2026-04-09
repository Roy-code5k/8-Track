import { Scale } from 'lucide-react';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';

export default function TermsPage() {
    return (
        <div className="min-h-screen bg-[var(--bg-color)] text-white p-8 py-16 flex justify-center">
            <div className="max-w-3xl w-full">
                <div className="flex items-center justify-between mb-8">
                    <Link to="/auth" className="text-sm font-bold text-[var(--text-muted)] hover:text-[var(--primary-accent)] transition-colors">
                        ← Back to Home
                    </Link>
                </div>
                
                <div className="p-10 text-center space-y-4 rounded-[32px] border border-[var(--active-highlight)] overflow-hidden glass" style={{ background: 'var(--card-bg)' }}>
                    <Scale className="w-16 h-16 text-[var(--primary-accent)] mx-auto opacity-20" />
                    <h3 className="text-3xl font-black text-white tracking-tight">Terms of Service</h3>
                    <p className="text-sm font-medium text-[var(--text-muted)] mb-8">Application rules and user agreements</p>
                    
                    <div className="max-w-2xl mx-auto space-y-4">
                        <div className="p-8 rounded-3xl bg-[rgba(255,255,255,0.01)] border border-[var(--active-highlight)] text-left space-y-6">
                            <div className="border-b border-white/5 pb-4">
                                <p className="text-xs font-bold text-[var(--primary-accent)] uppercase tracking-widest mb-1">Effective Date: April 9, 2026</p>
                                <h4 className="text-lg font-bold text-white">Welcome to 8Track.</h4>
                                <p className="text-[12px] font-medium text-[var(--text-muted)] mt-2">These Terms of Service (“Terms”) govern your access to and use of 8Track, a personal academic management application. By creating an account or using 8Track, you agree to be bound by these Terms. If you do not agree, please do not use the application.</p>
                            </div>

                            <div className="space-y-6 text-[12px] font-medium text-[var(--text-muted)] leading-relaxed">
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
                                    You agree to use 8Track only for its intended purpose of personal academic management. You shall not:
                                    <ul className="list-disc pl-5 mt-2 space-y-1">
                                        <li>Attempt to gain unauthorized access to the application, its servers, or databases.</li>
                                        <li>Use the application to store, transmit, or distribute malicious content.</li>
                                        <li>Reverse-engineer, decompile, or disassemble any part of the application.</li>
                                        <li>Use automated systems (bots, scrapers) to interact with the service.</li>
                                        <li>Violate any applicable local, national, or international law while using 8Track.</li>
                                    </ul>
                                </div>
                                <div>
                                    <span className="text-white font-bold block mb-1 text-[13px]">5. Google Calendar Integration</span>
                                    8Track offers optional integration with Google Calendar. If you connect your Google account, you authorize 8Track to read your calendar events and create new events on your behalf for academic scheduling purposes. 8Track will not access or modify your calendar beyond what is strictly necessary to provide this functionality. You may revoke this access at any time through your Google Account permissions.
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
                                    8Track is provided on an “as is” and “as available” basis. To the fullest extent permitted by law, we disclaim all warranties, express or implied. We are not liable for any data loss, missed deadlines, incorrect attendance predictions, service interruptions, or any indirect, incidental, or consequential damages arising from your use of the application.
                                </div>
                                <div>
                                    <span className="text-white font-bold block mb-1 text-[13px]">10. Account Termination</span>
                                    You may delete your account at any time by contacting us. We reserve the right to suspend or terminate accounts that violate these Terms. Upon termination, your data will be deleted in accordance with our Privacy Policy.
                                </div>
                                <div>
                                    <span className="text-white font-bold block mb-1 text-[13px]">11. Changes to These Terms</span>
                                    We may update these Terms from time to time. Changes will be posted on this page with an updated effective date. Your continued use of 8Track after any modification constitutes acceptance of the revised Terms.
                                </div>
                                <div className="pt-4 border-t border-white/5 pb-6">
                                    <span className="text-white font-bold block mb-1 text-[13px]">12. Contact</span>
                                    For questions or concerns regarding these Terms, reach out to us at <a href="mailto:hriturajroy3@gmail.com" className="text-[var(--primary-accent)] hover:underline">hriturajroy3@gmail.com</a>.
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
