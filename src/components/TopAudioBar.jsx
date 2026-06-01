import React, { useEffect, useRef } from 'react';
import { AlertTriangle } from 'lucide-react';

const TopAudioBar = ({ audioData, escalationCount = 0 }) => {
    const canvasRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');

        const draw = () => {
            const width = canvas.width;
            const height = canvas.height;
            ctx.clearRect(0, 0, width, height);

            const barWidth = 4;
            const gap = 2;
            const totalBars = Math.floor(width / (barWidth + gap));
            const center = width / 2;

            for (let i = 0; i < totalBars / 2; i++) {
                const value = audioData[i % audioData.length] || 0;
                const percent = value / 255;
                const barHeight = Math.max(2, percent * height);

                const gradient = ctx.createLinearGradient(center, 0, center, height);
                gradient.addColorStop(0, 'rgba(34, 211, 238, 0.2)');
                gradient.addColorStop(0.5, 'rgba(167, 139, 250, 0.9)');
                gradient.addColorStop(1, 'rgba(34, 211, 238, 0.2)');
                ctx.fillStyle = gradient;

                ctx.fillRect(center + i * (barWidth + gap), (height - barHeight) / 2, barWidth, barHeight);
                ctx.fillRect(center - (i + 1) * (barWidth + gap), (height - barHeight) / 2, barWidth, barHeight);
            }
        };

        requestAnimationFrame(draw);
    }, [audioData]);

    return (
        <div className="relative flex items-center">
            <canvas ref={canvasRef} width={300} height={40} className="opacity-80" />
            {escalationCount > 0 && (
                <div className="absolute -top-2 -right-2 flex items-center gap-1 bg-rose-500/20 border border-rose-500/40 rounded-full px-2 py-0.5 animate-pulse">
                    <AlertTriangle size={10} className="text-rose-300" />
                    <span className="text-[10px] font-bold text-rose-200">{escalationCount}</span>
                </div>
            )}
        </div>
    );
};

export default TopAudioBar;