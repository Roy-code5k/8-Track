import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { Sun, Moon, Eye, EyeOff } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useThemeStore } from '../store/themeStore';
import api from '../lib/api';

// ─── Starfield Canvas (sparse floating dots, no lines) ────────────────────────
function StarfieldCanvas() {
    const canvasRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        let animationId;
        const stars = [];
        const STAR_COUNT = 80;

        const resize = () => {
            canvas.width = canvas.offsetWidth;
            canvas.height = canvas.offsetHeight;
        };
        resize();
        window.addEventListener('resize', resize);

        for (let i = 0; i < STAR_COUNT; i++) {
            stars.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                r: Math.random() * 1.8 + 0.4,
                vx: (Math.random() - 0.5) * 0.25,
                vy: (Math.random() - 0.5) * 0.25,
                alpha: Math.random() * 0.5 + 0.3,
            });
        }

        const draw = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            stars.forEach((s) => {
                ctx.beginPath();
                ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(251, 191, 36, ${s.alpha})`;
                ctx.fill();

                s.x += s.vx;
                s.y += s.vy;
                if (s.x < 0) s.x = canvas.width;
                if (s.x > canvas.width) s.x = 0;
                if (s.y < 0) s.y = canvas.height;
                if (s.y > canvas.height) s.y = 0;
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
            style={{ width: size, height: size, borderRadius: '50%', background: 'hsl(43 96% 56%)' }}
            className="flex items-center justify-center shadow-lg flex-shrink-0"
        >
            <svg width={size * 0.55} height={size * 0.55} viewBox="0 0 24 14" fill="none">
                <path
                    d="M6 7C6 4.79 7.79 3 10 3C12.21 3 13.5 4.5 14.5 7C15.5 9.5 16.79 11 19 11C21.21 11 23 9.21 23 7C23 4.79 21.21 3 19 3C17.5 3 16.5 4 15.5 5.5"
                    stroke="hsl(240 5.9% 10%)" strokeWidth="2.2" strokeLinecap="round" fill="none"
                />
                <path
                    d="M18 7C18 9.21 16.21 11 14 11C11.79 11 10.5 9.5 9.5 7C8.5 4.5 7.21 3 5 3C2.79 3 1 4.79 1 7C1 9.21 2.79 11 5 11C6.5 11 7.5 10 8.5 8.5"
                    stroke="hsl(240 5.9% 10%)" strokeWidth="2.2" strokeLinecap="round" fill="none"
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

// ─── Auth Page ────────────────────────────────────────────────────────────────
function AuthPage() {
    const [tab, setTab] = useState('signin');
    const [showPassword, setShowPassword] = useState(false);
    const navigate = useNavigate();
    const setAuth = useAuthStore((s) => s.setAuth);
    const { theme, toggleTheme } = useThemeStore();

    const { register, handleSubmit, formState: { errors }, reset } = useForm();

    const loginMutation = useMutation({
        mutationFn: (data) => api.post('/auth/login', data),
        onSuccess: ({ data }) => { setAuth(data.user, data.accessToken); navigate('/dashboard'); },
    });

    const registerMutation = useMutation({
        mutationFn: (data) => api.post('/auth/register', data),
        onSuccess: ({ data }) => { setAuth(data.user, data.accessToken); navigate('/dashboard'); },
    });

    const onSubmit = (data) => {
        if (tab === 'signin') loginMutation.mutate({ email: data.email, password: data.password });
        else registerMutation.mutate(data);
    };

    const isLoading = loginMutation.isPending || registerMutation.isPending;
    const error = loginMutation.error?.response?.data?.message || registerMutation.error?.response?.data?.message;

    const handleTabChange = (newTab) => { setTab(newTab); reset(); loginMutation.reset(); registerMutation.reset(); };

    // ── Input class helper ──
    const inputCls = 'w-full px-4 py-3 rounded-lg text-sm bg-[hsl(240_10%_11%)] border border-[hsl(240_6%_18%)] text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-[hsl(43_96%_56%)] focus:ring-1 focus:ring-[hsl(43_96%_56%/0.4)] transition-all';

    return (
        <div className="flex min-h-screen" style={{ background: 'hsl(240 10% 6%)' }}>

            {/* ── Left Panel ── */}
            <div className="hidden lg:flex lg:w-5/12 relative flex-col justify-between p-10 overflow-hidden"
                style={{ background: 'hsl(240 10% 5%)' }}>
                <StarfieldCanvas />

                {/* Logo */}
                <div className="relative z-10 flex items-center gap-3">
                    <LogoMark size={42} />
                    <div>
                        <p className="text-lg font-bold text-white leading-tight">8Track</p>
                        <p className="text-xs text-muted-foreground">Study smarter. Never miss a class.</p>
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
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-foreground"
                            style={{ background: 'hsl(240 6% 12%)', border: '1px solid hsl(240 6% 18%)' }}
                        >
                            {icon} {label}
                        </span>
                    ))}
                </div>
            </div>

            {/* ── Right Panel ── */}
            <div className="flex-1 flex flex-col items-center justify-center px-6 py-10 relative">

                {/* Theme Toggle */}
                <button onClick={toggleTheme}
                    className="absolute top-6 right-6 p-2 rounded-lg text-muted-foreground hover:text-foreground transition-colors"
                    style={{ background: 'hsl(240 6% 12%)', border: '1px solid hsl(240 6% 18%)' }}
                    aria-label="Toggle theme"
                >
                    {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                </button>

                {/* Mobile Logo */}
                <div className="lg:hidden flex items-center gap-2 mb-8">
                    <LogoMark size={36} />
                    <span className="text-lg font-bold">8Track</span>
                </div>

                <div className="w-full max-w-sm">
                    {/* Heading */}
                    <h1 className="text-2xl font-bold text-center text-white mb-1">
                        {tab === 'signin' ? 'Welcome back' : 'Create your account'}
                    </h1>
                    <p className="text-sm text-center text-muted-foreground mb-7">
                        {tab === 'signin' ? 'Log in to manage your academic track.' : 'Start tracking your attendance today.'}
                    </p>

                    {/* Tab Toggle */}
                    <div className="flex rounded-full p-1 mb-7"
                        style={{ background: 'hsl(240 6% 12%)', border: '1px solid hsl(240 6% 18%)' }}>
                        {['signin', 'register'].map((t) => (
                            <button key={t}
                                onClick={() => handleTabChange(t)}
                                style={tab === t
                                    ? { background: 'hsl(43 96% 56%)', color: 'hsl(240 5.9% 10%)' }
                                    : { color: 'hsl(240 5% 55%)' }
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
                                    type="text" placeholder="Full name" className={inputCls} />
                                {errors.name && <p className="text-xs text-red-400 mt-1">{errors.name.message}</p>}
                            </div>
                        )}

                        <div>
                            <input {...register('email', { required: 'Email is required', pattern: { value: /\S+@\S+\.\S+/, message: 'Invalid email' } })}
                                type="email" placeholder="Email address" className={inputCls} />
                            {errors.email && <p className="text-xs text-red-400 mt-1">{errors.email.message}</p>}
                        </div>

                        <div className="relative">
                            <input {...register('password', { required: 'Password is required', minLength: { value: 6, message: 'Min 6 characters' } })}
                                type={showPassword ? 'text' : 'password'} placeholder="Password" className={inputCls + ' pr-12'} />
                            <button type="button" onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                            {errors.password && <p className="text-xs text-red-400 mt-1">{errors.password.message}</p>}
                        </div>

                        {tab === 'signin' && (
                            <div className="text-right">
                                <button type="button" className="text-xs text-muted-foreground hover:text-amber-400 transition-colors">
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
                        <button type="submit" disabled={isLoading}
                            className="w-full py-3 rounded-lg text-sm font-bold transition-all duration-150 active:scale-[0.98] disabled:opacity-60 mt-1"
                            style={{ background: 'hsl(43 96% 56%)', color: 'hsl(240 5.9% 10%)', boxShadow: '0 4px 24px hsl(43 96% 56% / 0.25)' }}
                        >
                            {isLoading ? 'Please wait…' : tab === 'signin' ? 'Sign In' : 'Create Account'}
                        </button>
                    </form>

                    {/* OR divider */}
                    <div className="flex items-center gap-3 my-5">
                        <div className="flex-1 h-px" style={{ background: 'hsl(240 6% 18%)' }} />
                        <span className="text-xs text-muted-foreground">or</span>
                        <div className="flex-1 h-px" style={{ background: 'hsl(240 6% 18%)' }} />
                    </div>

                    {/* Continue with Google */}
                    <button type="button"
                        className="w-full flex items-center justify-center gap-3 py-3 rounded-lg text-sm font-medium text-foreground transition-all hover:opacity-80"
                        style={{ background: 'hsl(240 6% 12%)', border: '1px solid hsl(240 6% 20%)' }}
                    >
                        <GoogleIcon />
                        Continue with Google
                    </button>

                    {/* Terms */}
                    <p className="text-xs text-muted-foreground text-center mt-6">
                        By continuing, you agree to our{' '}
                        <span className="text-amber-400 cursor-pointer hover:underline">Terms</span>
                        {' '}and{' '}
                        <span className="text-amber-400 cursor-pointer hover:underline">Privacy Policy</span>.
                    </p>
                </div>
            </div>
        </div>
    );
}

export default AuthPage;
