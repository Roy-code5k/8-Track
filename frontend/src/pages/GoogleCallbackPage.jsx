import { useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

// Simple animated spinner that matches the 8Track amber theme
function AmberSpinner() {
    return (
        <svg
            width="48"
            height="48"
            viewBox="0 0 48 48"
            fill="none"
            style={{ animation: 'spin 0.9s linear infinite' }}
        >
            <circle cx="24" cy="24" r="20" stroke="#2A2A30" strokeWidth="4" />
            <path
                d="M24 4 A20 20 0 0 1 44 24"
                stroke="#F0A830"
                strokeWidth="4"
                strokeLinecap="round"
            />
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </svg>
    );
}

export default function GoogleCallbackPage() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const setAuth = useAuthStore((s) => s.setAuth);
    const processed = useRef(false);

    useEffect(() => {
        // Guard against double-invocation in React Strict Mode
        if (processed.current) return;
        processed.current = true;

        const token = searchParams.get('token');
        const userRaw = searchParams.get('user');
        const error = searchParams.get('error');

        if (error || !token || !userRaw) {
            const msg =
                error === 'google_cancelled'
                    ? 'google_auth_cancelled'
                    : error === 'google_no_email'
                    ? 'google_no_email'
                    : 'google_failed';
            navigate(`/auth?error=${msg}`, { replace: true });
            return;
        }

        try {
            const user = JSON.parse(decodeURIComponent(userRaw));
            setAuth(user, token);
            navigate('/dashboard', { replace: true });
        } catch {
            navigate('/auth?error=google_failed', { replace: true });
        }
    }, [searchParams, navigate, setAuth]);

    return (
        <div
            style={{
                minHeight: '100vh',
                background: '#141416',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '20px',
            }}
        >
            <AmberSpinner />
            <p style={{ color: '#6B6B72', fontSize: '14px', letterSpacing: '0.02em' }}>
                Signing you in with Google…
            </p>
        </div>
    );
}
