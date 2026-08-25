'use client';
import { useEffect } from 'react';

export default function ActiveHeartbeat() {
    useEffect(() => {
        const pingServer = async () => {
            try {
                await fetch('/api/heartbeat', {
                    method: 'GET',
                    headers: { 'Cache-Control': 'no-cache' }
                });
            } catch (err) {
                // Silently ignore temporary network blips
            }
        };

        // Ping immediately on tab load
        pingServer();

        // Send a heartbeat every 15 seconds to stay active within server timeouts
        const interval = setInterval(pingServer, 15000);

        // Instantly ping whenever the user returns or refocuses the tab
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                pingServer();
            }
        };

        window.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('focus', pingServer);

        return () => {
            clearInterval(interval);
            window.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('focus', pingServer);
        };
    }, []);

    return null;
}