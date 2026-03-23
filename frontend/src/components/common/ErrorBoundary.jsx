import { Component } from 'react';

/**
 * React Error Boundary
 * Catches any JS errors in the render tree and shows a styled fallback.
 * Wrap your app root: <ErrorBoundary><App /></ErrorBoundary>
 */
class ErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, info) {
        console.error('[ErrorBoundary] Uncaught error:', error, info);
    }

    handleReset = () => {
        this.setState({ hasError: false, error: null });
        window.location.href = '/';
    };

    render() {
        if (!this.state.hasError) return this.props.children;

        return (
            <div
                style={{
                    minHeight: '100vh',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'var(--sidebar-bg, #0C0C0E)',
                    color: '#F0EEE8',
                    fontFamily: 'Inter, sans-serif',
                    padding: '2rem',
                    textAlign: 'center',
                    gap: '1.5rem',
                }}
            >
                <div style={{ fontSize: '3rem' }}>⚠️</div>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 900, margin: 0 }}>
                    Something went wrong
                </h1>
                <p style={{ color: '#6B6B72', fontSize: '0.875rem', maxWidth: 400, margin: 0 }}>
                    {this.state.error?.message || 'An unexpected error occurred.'}
                </p>
                <button
                    onClick={this.handleReset}
                    style={{
                        padding: '0.75rem 2rem',
                        borderRadius: '0.75rem',
                        border: 'none',
                        background: '#E8A838',
                        color: '#0C0C0E',
                        fontWeight: 900,
                        fontSize: '0.875rem',
                        cursor: 'pointer',
                        letterSpacing: '0.1em',
                        textTransform: 'uppercase',
                    }}
                >
                    Go Home
                </button>
                {import.meta.env.DEV && (
                    <pre
                        style={{
                            fontSize: '0.7rem',
                            color: '#E85C5C',
                            background: '#1A1A1E',
                            padding: '1rem',
                            borderRadius: '0.5rem',
                            maxWidth: '600px',
                            overflowX: 'auto',
                            textAlign: 'left',
                            margin: 0,
                        }}
                    >
                        {this.state.error?.stack}
                    </pre>
                )}
            </div>
        );
    }
}

export default ErrorBoundary;
