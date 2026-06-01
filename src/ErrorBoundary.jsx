import React from 'react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { error: null };
    }
    static getDerivedStateFromError(error) {
        return { error };
    }
    componentDidCatch(error, info) {
        console.error('ErrorBoundary caught:', error, info);
    }
    render() {
        if (this.state.error) {
            return (
                <div style={{ padding: 40, color: '#f00', background: '#000', height: '100vh', fontFamily: 'monospace' }}>
                    <h1>React Error</h1>
                    <pre style={{ whiteSpace: 'pre-wrap' }}>{this.state.error.toString()}</pre>
                    <pre style={{ whiteSpace: 'pre-wrap', color: '#888', fontSize: 12 }}>{this.state.error.stack}</pre>
                </div>
            );
        }
        return this.props.children;
    }
}

export default ErrorBoundary;
