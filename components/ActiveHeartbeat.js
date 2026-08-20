'use client';
import { useEffect } from 'react';

export default function ActiveHeartbeat() {
    useEffect(() => {
        const pingServer = async () => {
            try {
                await fetch('/api/heartbeat', { method: 'HEAD' });
            } catch (err) {
                // Silently ignore network blips
            }
        };

        // Ping immediately on tab load
        pingServer();

        // Ping every 60 seconds unconditionally for as long as Workspace Kit is open
        const interval = setInterval(pingServer, 60000);

        return () => clearInterval(interval);
    }, []);

    return null;
}