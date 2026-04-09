import { useEffect, useRef, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { Eye, EyeOff } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import api from '../lib/api';

// ─── Inline Styles for Placeholder ───────────────────────────────────────────
const inputStyles = `
    .auth-input::placeholder {
        color: #4A4A52;
    }
    .auth-input:focus {
        border-color: #F0A830 !important;
        outline: none;
        box-shadow: 0 0 0 3px rgba(240, 168, 48, 0.1);
    }
`;

// ─── Constellation Canvas (amber nodes + lines with center glow) ─────────────
function ConstellationCanvas() {
    const canvasRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        let animationId;
        const nodes = [];
        const NODE_COUNT = 60;
        const CONNECTION_DISTANCE = 150;

        const resize = () => {
            canvas.width = canvas.offsetWidth;
            canvas.height = canvas.offsetHeight;
        };
        resize();
        window.addEventListener('resize', resize);

        // Create nodes
        for (let i = 0; i < NODE_COUNT; i++) {
            nodes.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                r: Math.random() * 1.5 + 0.8,
                vx: (Math.random() - 0.5) * 0.2,
                vy: (Math.random() - 0.5) * 0.2,
            });
        }

        const draw = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Center glow effect
            const centerX = canvas.width / 2;
            const centerY = canvas.height / 2;
            const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, canvas.width * 0.5);
            gradient.addColorStop(0, 'rgba(200, 130, 10, 0.08)'); // #C8820A with alpha
            gradient.addColorStop(1, 'rgba(200, 130, 10, 0)');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Draw connection lines
            for (let i = 0; i < nodes.length; i++) {
                for (let j = i + 1; j < nodes.length; j++) {
                    const dx = nodes[i].x - nodes[j].x;
                    const dy = nodes[i].y - nodes[j].y;
                    const distance = Math.sqrt(dx * dx + dy * dy);

                    if (distance < CONNECTION_DISTANCE) {
                        ctx.beginPath();
                        ctx.moveTo(nodes[i].x, nodes[i].y);
                        ctx.lineTo(nodes[j].x, nodes[j].y);
                        const opacity = (1 - distance / CONNECTION_DISTANCE) * 0.15;
                        ctx.strokeStyle = `rgba(138, 90, 8, ${opacity})`; // #8A5A08
                        ctx.lineWidth = 1;
                        ctx.stroke();
                    }
                }
            }

            // Draw nodes
            nodes.forEach((node) => {
                ctx.beginPath();
                ctx.arc(node.x, node.y, node.r, 0, Math.PI * 2);
                ctx.fillStyle = '#D4920E'; // Constellation node dots
                ctx.fill();

                // Update position
                node.x += node.vx;
                node.y += node.vy;
                if (node.x < 0) node.x = canvas.width;
                if (node.x > canvas.width) node.x = 0;
                if (node.y < 0) node.y = canvas.height;
                if (node.y > canvas.height) node.y = 0;
            });

            animationId = requestAnimationFrame(draw);
        };

        draw();
        return () => {
            cancelAnimationFrame(animationId);
            window.removeEventListener('resize', resize);
        };
    }, []);

    return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />;
}

// ─── Infinity Logo Mark ───────────────────────────────────────────────────────
function LogoMark({ size = 40 }) {
    return (
        <div
            style={{ width: size, height: size, borderRadius: '50%', background: '#2A1F08' }}
            className="flex items-center justify-center shadow-lg flex-shrink-0"
        >
            <svg width={size * 0.55} height={size * 0.55} viewBox="0 0 24 14" fill="none">
                <path
                    d="M6 7C6 4.79 7.79 3 10 3C12.21 3 13.5 4.5 14.5 7C15.5 9.5 16.79 11 19 11C21.21 11 23 9.21 23 7C23 4.79 21.21 3 19 3C17.5 3 16.5 4 15.5 5.5"
                    stroke="#F0A830" strokeWidth="2.2" strokeLinecap="round" fill="none"
                />
                <path
                    d="M18 7C18 9.21 16.21 11 14 11C11.79 11 10.5 9.5 9.5 7C8.5 4.5 7.21 3 5 3C2.79 3 1 4.79 1 7C1 9.21 2.79 11 5 11C6.5 11 7.5 10 8.5 8.5"
                    stroke="#F0A830" strokeWidth="2.2" strokeLinecap="round" fill="none"
                />
            </svg>
        </div>
    );
}

// ─── Google Icon ──────────────────────────────────────────────────────────────
function GoogleIcon() {
    return (
        <svg width="18" height="18" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
        </svg>
    );
}

// ─── Password Strength Indicator ──────────────────────────────────────────────
function PasswordStrength({ password = '' }) {
    const requirements = [
        { label: '8 characters minimum', met: password.length >= 8 },
        { label: 'At least one digit', met: /\d/.test(password) },
        { label: 'At least one uppercase', met: /[A-Z]/.test(password) },
        { label: 'One special character', met: /[!@#$%^&*(),.?":{}|<>]/.test(password) },
    ];

    if (!password) return null;

    return (
        <div className="grid grid-cols-2 gap-x-4 gap-y-2 mt-3 px-1">
            {requirements.map((req) => (
                <div key={req.label} className="flex items-center gap-2">
                    <div 
                        className="w-1.5 h-1.5 rounded-full transition-all duration-300"
                        style={{ 
                            background: req.met ? '#F0A830' : '#2A2A30',
                            boxShadow: req.met ? '0 0 8px rgba(240, 168, 48, 0.4)' : 'none'
                        }} 
                    />
                    <span 
                        className="text-[10px] font-medium transition-colors duration-300"
                        style={{ color: req.met ? '#F0EEE8' : '#4A4A52' }}
                    >
                        {req.label}
                    </span>
                </div>
            ))}
        </div>
    );
}

// ─── Auth Page ────────────────────────────────────────────────────────────────
function AuthPage() {
    const [tab, setTab] = useState('signin');
    const [showPassword, setShowPassword] = useState(false);
    const [otpStep, setOtpStep] = useState(false);
    const [pendingEmail, setPendingEmail] = useState('');
    const [otpValues, setOtpValues] = useState(['', '', '', '', '', '']);
    const [resendTimer, setResendTimer] = useState(0);
    const navigate = useNavigate();
    const setAuth = useAuthStore((s) => s.setAuth);

    const { register, handleSubmit, formState: { errors }, reset, watch, getValues } = useForm();
    const password = watch('password', '');

    const isPasswordValid = password.length >= 8 &&
                            /\d/.test(password) &&
                            /[A-Z]/.test(password) &&
                            /[!@#$%^&*(),.?":{}|<>]/.test(password);

    const loginMutation = useMutation({
        mutationFn: (data) => api.post('/auth/login', data),
        onSuccess: ({ data }) => { setAuth(data.user, data.accessToken); navigate('/dashboard'); },
    });

    const sendOtpMutation = useMutation({
        mutationFn: (data) => api.post('/auth/send-otp', data),
        onSuccess: (_, variables) => {
            setPendingEmail(variables.email);
            setOtpStep(true);
            setOtpValues(['', '', '', '', '', '']);
            startResendTimer();
        },
    });

    const verifyOtpMutation = useMutation({
        mutationFn: (data) => api.post('/auth/verify-otp', data),
        onSuccess: ({ data }) => { setAuth(data.user, data.accessToken); navigate('/dashboard'); },
    });

    const startResendTimer = () => {
        setResendTimer(30);
        const interval = setInterval(() => {
            setResendTimer((prev) => {
                if (prev <= 1) { clearInterval(interval); return 0; }
                return prev - 1;
            });
        }, 1000);
    };

    const onSubmit = (data) => {
        if (tab === 'signin') {
            loginMutation.mutate({ email: data.email, password: data.password });
        } else {
            if (!isPasswordValid) return;
            sendOtpMutation.mutate(data);
        }
    };

    const handleOtpChange = (index, value) => {
        if (!/^\d?$/.test(value)) return;
        const next = [...otpValues];
        next[index] = value;
        setOtpValues(next);
        if (value && index < 5) {
            document.getElementById(`otp-${index + 1}`)?.focus();
        }
    };

    const handleOtpKeyDown = (index, e) => {
        if (e.key === 'Backspace' && !otpValues[index] && index > 0) {
            document.getElementById(`otp-${index - 1}`)?.focus();
        }
    };

    const handleOtpPaste = (e) => {
        e.preventDefault();
        const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
        const next = [...otpValues];
        text.split('').forEach((char, i) => { next[i] = char; });
        setOtpValues(next);
        const lastFilled = Math.min(text.length, 5);
        document.getElementById(`otp-${lastFilled}`)?.focus();
    };

    const handleVerifyOtp = () => {
        const otp = otpValues.join('');
        if (otp.length !== 6) return;
        verifyOtpMutation.mutate({ email: pendingEmail, otp });
    };

    const handleResendOtp = () => {
        if (resendTimer > 0) return;
        const data = getValues();
        sendOtpMutation.mutate(data);
    };

    const isLoading = loginMutation.isPending || sendOtpMutation.isPending;
    const error = loginMutation.error?.response?.data?.message ||
                  sendOtpMutation.error?.response?.data?.message ||
                  verifyOtpMutation.error?.response?.data?.message;

    const handleTabChange = (newTab) => {
        setTab(newTab);
        setOtpStep(false);
        setPendingEmail('');
        setOtpValues(['', '', '', '', '', '']);
        reset();
        loginMutation.reset();
        sendOtpMutation.reset();
        verifyOtpMutation.reset();
    };

    // ── Input class helper ──
    const inputCls = 'auth-input w-full px-4 py-3 rounded-lg text-sm border transition-all focus:outline-none';

    return (
        <>
            <style>{inputStyles}</style>
            <div className="flex min-h-screen" style={{ background: '#141416' }}>

            {/* ── Left Panel ── */}
            <div className="hidden lg:flex lg:w-5/12 relative flex-col justify-between p-10 overflow-hidden"
                style={{ background: '#0C0C0E' }}>
                <ConstellationCanvas />

                {/* Logo */}
                <div className="relative z-10 flex items-center gap-3">
                    <LogoMark size={42} />
                    <div>
                        <p className="text-lg font-bold leading-tight" style={{ color: '#F0EEE8' }}>8Track</p>
                        <p className="text-xs" style={{ color: '#5A5A62' }}>Study smarter. Never miss a class.</p>
                    </div>
                </div>

                {/* Badge pills */}
                <div className="relative z-10 flex flex-wrap gap-2">
                    {[
                        { icon: '👥', label: '10K+ students' },
                        { icon: '📡', label: 'Works offline' },
                        { icon: '⚡', label: '98% accuracy' },
                    ].map(({ icon, label }) => (
                        <span key={label}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium"
                            style={{ background: '#1E1E22', border: '1px solid #2E2E35', color: '#8A8A95' }}
                        >
                            <span style={{ color: '#F0A830' }}>{icon}</span> {label}
                        </span>
                    ))}
                </div>
            </div>

            {/* ── Right Panel ── */}
            <div className="flex-1 flex flex-col items-center justify-center px-6 py-10 relative">

                {/* Mobile Logo */}
                <div className="lg:hidden flex items-center gap-2 mb-8">
                    <LogoMark size={36} />
                    <span className="text-lg font-bold" style={{ color: '#F0EEE8' }}>8Track</span>
                </div>

                <div className="w-full max-w-sm">

                    {/* ── OTP Step ── */}
                    {otpStep ? (
                        <div>
                            <button
                                type="button"
                                onClick={() => { setOtpStep(false); verifyOtpMutation.reset(); sendOtpMutation.reset(); }}
                                className="flex items-center gap-1.5 text-xs mb-6 transition-colors"
                                style={{ color: '#6B6B72' }}
                            >
                                ← Back
                            </button>
                            <h1 className="text-2xl font-bold text-center mb-1" style={{ color: '#F0EEE8' }}>Check your email</h1>
                            <p className="text-sm text-center mb-6" style={{ color: '#6B6B72' }}>
                                We sent a 6-digit code to <span style={{ color: '#F0A830' }}>{pendingEmail}</span>
                            </p>

                            {/* OTP Digit Inputs */}
                            <div className="flex justify-center gap-3 mb-5" onPaste={handleOtpPaste}>
                                {otpValues.map((val, i) => (
                                    <input
                                        key={i}
                                        id={`otp-${i}`}
                                        type="text"
                                        inputMode="numeric"
                                        maxLength={1}
                                        value={val}
                                        onChange={(e) => handleOtpChange(i, e.target.value)}
                                        onKeyDown={(e) => handleOtpKeyDown(i, e)}
                                        className="text-center text-xl font-bold rounded-lg transition-all focus:outline-none"
                                        style={{
                                            width: '46px',
                                            height: '56px',
                                            background: '#1C1C1F',
                                            border: val ? '2px solid #F0A830' : '1px solid #2A2A30',
                                            color: '#F0EEE8',
                                            boxShadow: val ? '0 0 10px rgba(240,168,48,0.2)' : 'none',
                                        }}
                                    />
                                ))}
                            </div>

                            {error && (
                                <div className="px-4 py-2.5 rounded-lg text-sm text-red-400 mb-3"
                                    style={{ background: 'hsl(0 72% 51% / 0.1)', border: '1px solid hsl(0 72% 51% / 0.2)' }}>
                                    {error}
                                </div>
                            )}

                            <button
                                type="button"
                                onClick={handleVerifyOtp}
                                disabled={otpValues.join('').length !== 6 || verifyOtpMutation.isPending}
                                className="w-full py-3 rounded-lg text-sm font-bold transition-all duration-150 active:scale-[0.98] disabled:opacity-60"
                                style={{ background: '#F0A830', color: '#1A1208', boxShadow: '0 4px 24px rgba(240, 168, 48, 0.25)' }}
                            >
                                {verifyOtpMutation.isPending ? 'Verifying…' : 'Verify & Create Account'}
                            </button>

                            <p className="text-xs text-center mt-4" style={{ color: '#4A4A52' }}>
                                Didn't receive the code?{' '}
                                <button
                                    type="button"
                                    onClick={handleResendOtp}
                                    disabled={resendTimer > 0 || sendOtpMutation.isPending}
                                    className="transition-colors disabled:opacity-50"
                                    style={{ color: resendTimer > 0 ? '#4A4A52' : '#F0A830' }}
                                >
                                    {resendTimer > 0 ? `Resend in ${resendTimer}s` : 'Resend OTP'}
                                </button>
                            </p>
                        </div>
                    ) : (
                        <>
                        {/* Heading */}
                        <h1 className="text-2xl font-bold text-center mb-1" style={{ color: '#F0EEE8' }}>
                            {tab === 'signin' ? 'Welcome back' : 'Create your account'}
                        </h1>
                        <p className="text-sm text-center mb-7" style={{ color: '#6B6B72' }}>
                            {tab === 'signin' ? 'Log in to manage your academic track.' : 'Start tracking your attendance today.'}
                        </p>

                        {/* Tab Toggle */}
                        <div className="flex rounded-full p-1 mb-7"
                            style={{ background: '#1E1E22' }}>
                            {['signin', 'register'].map((t) => (
                                <button key={t}
                                    onClick={() => handleTabChange(t)}
                                    style={tab === t
                                        ? { background: '#F0A830', color: '#1A1208' }
                                        : { color: '#8A8A95' }
                                    }
                                    className="flex-1 py-2 text-sm font-semibold rounded-full transition-all duration-200"
                                >
                                    {t === 'signin' ? 'Sign In' : 'Create Account'}
                                </button>
                            ))}
                        </div>

                        {/* Form */}
                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
                            {tab === 'register' && (
                                <div>
                                    <input {...register('name', { required: 'Name is required' })}
                                        type="text"
                                        placeholder="Full name"
                                        className={inputCls}
                                        style={{
                                            background: '#1C1C1F',
                                            border: '1px solid #2A2A30',
                                            color: '#F0EEE8'
                                        }}
                                    />
                                    {errors.name && <p className="text-xs text-red-400 mt-1">{errors.name.message}</p>}
                                </div>
                            )}

                            <div>
                                <input {...register('email', { required: 'Email is required', pattern: { value: /\S+@\S+\.\S+/, message: 'Invalid email' } })}
                                    type="email"
                                    placeholder="Email address"
                                    className={inputCls}
                                    style={{
                                        background: '#1C1C1F',
                                        border: '1px solid #2A2A30',
                                        color: '#F0EEE8'
                                    }}
                                />
                                {errors.email && <p className="text-xs text-red-400 mt-1">{errors.email.message}</p>}
                            </div>

                            <div className="relative">
                                <input {...register('password', { required: 'Password is required' })}
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder="Password"
                                    className={inputCls + ' pr-12'}
                                    style={{
                                        background: '#1C1C1F',
                                        border: '1px solid #2A2A30',
                                        color: '#F0EEE8'
                                    }}
                                />
                                <button type="button" onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                                    style={{ color: '#4A4A52' }}
                                >
                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                                {errors.password && <p className="text-xs text-red-400 mt-1">{errors.password.message}</p>}
                            </div>

                            {tab === 'register' && <PasswordStrength password={password} />}

                            {tab === 'signin' && (
                                <div className="text-right">
                                    <button type="button" className="text-xs transition-colors" style={{ color: '#6B6B72' }}>
                                        Forgot password?
                                    </button>
                                </div>
                            )}

                            {error && (
                                <div className="px-4 py-2.5 rounded-lg text-sm text-red-400"
                                    style={{ background: 'hsl(0 72% 51% / 0.1)', border: '1px solid hsl(0 72% 51% / 0.2)' }}>
                                    {error}
                                </div>
                            )}

                            {/* Primary CTA */}
                            <button type="submit" disabled={isLoading || (tab === 'register' && !isPasswordValid)}
                                className="w-full py-3 rounded-lg text-sm font-bold transition-all duration-150 active:scale-[0.98] disabled:opacity-60 mt-1"
                                style={{ background: '#F0A830', color: '#1A1208', boxShadow: '0 4px 24px rgba(240, 168, 48, 0.25)' }}
                            >
                                {isLoading ? 'Please wait…' : tab === 'signin' ? 'Sign In' : 'Create Account'}
                            </button>
                        </form>

                        {/* OR divider */}
                        <div className="flex items-center gap-3 my-5">
                            <div className="flex-1 h-px" style={{ background: '#2A2A30' }} />
                            <span className="text-xs" style={{ color: '#3A3A42' }}>OR</span>
                            <div className="flex-1 h-px" style={{ background: '#2A2A30' }} />
                        </div>

                        {/* Continue with Google */}
                        <button type="button"
                            className="w-full flex items-center justify-center gap-3 py-3 rounded-lg text-sm font-medium transition-all hover:opacity-80"
                            style={{ background: '#1C1C1F', border: '1px solid #2A2A2E', color: '#F0EEE8' }}
                        >
                            <GoogleIcon />
                            Continue with Google
                        </button>

                        {/* Terms */}
                        <p className="text-xs text-center mt-6" style={{ color: '#8A8A95' }}>
                            By continuing, you agree to our{' '}
                            <Link to="/terms" className="cursor-pointer transition-all hover:text-white hover:underline" style={{ color: '#8A8A95' }}>
                                Terms
                            </Link>
                            {' '}and{' '}
                            <Link to="/privacy" className="cursor-pointer transition-all hover:text-white hover:underline" style={{ color: '#8A8A95' }}>
                                Privacy Policy
                            </Link>.
                        </p>
                        </>
                    )}
                </div>
            </div>
        </div>
        </>
    );
}

export default AuthPage;
