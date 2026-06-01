import React, { useEffect, useState, useRef } from 'react';
import io from 'socket.io-client';

import Visualizer from './components/Visualizer';
import TopAudioBar from './components/TopAudioBar';
import EmailWindow from './components/EmailWindow';
import ChatModule from './components/ChatModule';
import ToolsModule from './components/ToolsModule';
import WidgetContainer from './components/WidgetContainer';
import { Mic, MicOff, Settings, X, Minus, Power, Clock, AlertTriangle } from 'lucide-react';
import SettingsWindow from './components/SettingsWindow';
import ComposeWindow from './components/ComposeWindow';

import ErrorBoundary from './ErrorBoundary';

const socket = io('http://localhost:8000');
let ipcRenderer = null;
try {
    ipcRenderer = window.require('electron').ipcRenderer;
} catch (e) {
    console.warn('Electron IPC unavailable:', e.message);
}

function App() {
    const [status, setStatus] = useState('Disconnected');
    const [socketConnected, setSocketConnected] = useState(socket.connected);

    const [isConnected, setIsConnected] = useState(true);
    const [isMuted, setIsMuted] = useState(false);
    const [messages, setMessages] = useState([]);
    const [inputValue, setInputValue] = useState('');
    const [showEmailWindow, setShowEmailWindow] = useState(false);
    const [showCompose, setShowCompose] = useState(false);
    const [escalationCount, setEscalationCount] = useState(0);

    const [aiAudioData, setAiAudioData] = useState(new Array(64).fill(0));
    const [micAudioData, setMicAudioData] = useState(new Array(32).fill(0));
    const [fps, setFps] = useState(0);
    const [micDevices, setMicDevices] = useState([]);
    const [speakerDevices, setSpeakerDevices] = useState([]);

    const [selectedMicId, setSelectedMicId] = useState(() => localStorage.getItem('selectedMicId') || '');
    const [selectedSpeakerId, setSelectedSpeakerId] = useState(() => localStorage.getItem('selectedSpeakerId') || '');
    const [showSettings, setShowSettings] = useState(false);
    const [isApaReady, setIsApaReady] = useState(false);
    const [widgets, setWidgets] = useState([]);
    const widgetIdRef = useRef(0);

    const [isModularMode, setIsModularMode] = useState(true);
    const [elementPositions, setElementPositions] = useState({
        visualizer: { x: window.innerWidth / 2, y: window.innerHeight / 2 - 60 },
        chat: { x: window.innerWidth / 2, y: window.innerHeight / 2 + 200 },
        email: { x: window.innerWidth / 2 - 200, y: window.innerHeight / 2 },
        tools: { x: window.innerWidth / 2, y: window.innerHeight - 160 }
    });

    const [elementSizes, setElementSizes] = useState({
        visualizer: { w: 550, h: 350 },
        chat: { w: 550, h: 220 },
        tools: { w: 500, h: 80 },
        email: { w: 550, h: 380 }
    });
    const [activeDragElement, setActiveDragElement] = useState(null);

    const [zIndexOrder, setZIndexOrder] = useState([
        'visualizer', 'chat', 'tools', 'email'
    ]);

    // Web Audio Context for Mic Visualization
    const audioContextRef = useRef(null);
    const analyserRef = useRef(null);
    const sourceRef = useRef(null);
    const animationFrameRef = useRef(null);
    const lastVideoTimeRef = useRef(-1);
    const lastActiveDragElementRef = useRef(null);
    const lastCursorPosRef = useRef({ x: 0, y: 0 });

    const isModularModeRef = useRef(isModularMode);
    const elementPositionsRef = useRef(elementPositions);
    const activeDragElementRef = useRef(null);

    // Mouse Drag Refs
    const dragOffsetRef = useRef({ x: 0, y: 0 });
    const isDraggingRef = useRef(false);

    // Update refs when state changes
    useEffect(() => {
        isModularModeRef.current = isModularMode;
        elementPositionsRef.current = elementPositions;
    }, [isModularMode, elementPositions]);

    // Centering Logic (Startup & Resize)
    useEffect(() => {
        const centerElements = () => {
            const width = window.innerWidth;
            const height = window.innerHeight;

            // Calculate available vertical space
            // Tools is fixed at bottom ~100px space
            const toolsY = height - 100;
            // ToolsModule uses translate(-50%, -50%). So its Center Y.
            // Let's reserve bottom 140px for tools to be safe and float it nicely.
            const toolsCenterY = height - 100;

            const gap = 20;

            // Chat: Anchor is Top-Center (translate(-50%, 0)).
            // We want Chat Bottom to be above Tools Top.
            // Tools Top = toolsCenterY - (ToolsHeight/2) approx 40 = height - 140;
            const chatBottomLimit = height - 140;

            // Dynamic Height Calculation to fit screen
            // Standard Heights
            let vizH = 400;
            let chatH = 250;
            const topBarHeight = 60;

            // Total needed: TopBar + Viz + Gap + Chat + Gap + Tools (140 reserved)
            const totalNeeded = topBarHeight + vizH + gap + chatH + gap + 140;

            if (height < totalNeeded) {
                // Scale down
                const available = height - topBarHeight - 140 - (gap * 2);
                // Allocate 60% to Viz, 40% to Chat
                vizH = available * 0.6;
                chatH = available * 0.4;
            }

            // Positions
            // Visualizer (Center Anchored)
            // Top of Viz = TopBarHeight. Center = TopBarHeight + VizH/2
            const vizY = topBarHeight + (vizH / 2); // Removed buffer

            // Chat (Top Anchored)
            // Top of Chat = TopBarHeight + VizH + Gap
            const chatY = topBarHeight + vizH + gap;

            setElementSizes(prev => ({
                ...prev,
                visualizer: { w: Math.min(600, width * 0.8), h: vizH },
                chat: { w: Math.min(600, width * 0.9), h: chatH }
            }));

            setElementPositions(prev => ({
                ...prev,
                visualizer: {
                    x: width / 2,
                    y: vizY
                },
                chat: {
                    x: width / 2,
                    y: chatY
                },
                tools: {
                    x: width / 2,
                    y: toolsCenterY
                }
            }));
        };

        // Center on mount
        centerElements();

        // Center on resize
        window.addEventListener('resize', centerElements);
        return () => window.removeEventListener('resize', centerElements);
    }, []);

    // Utility: Clamp position to viewport so component stays fully visible
    const clampToViewport = (pos, size) => {
        const margin = 10;
        const topBarHeight = 60;
        const width = window.innerWidth;
        const height = window.innerHeight;

        return {
            x: Math.max(size.w / 2 + margin, Math.min(width - size.w / 2 - margin, pos.x)),
            y: Math.max(size.h / 2 + margin + topBarHeight, Math.min(height - size.h / 2 - margin, pos.y))
        };
    };

    // Utility: Get z-index for an element based on stacking order
    const getZIndex = (id) => {
        const baseZ = 30; // Above background elements
        const index = zIndexOrder.indexOf(id);
        return baseZ + (index >= 0 ? index : 0);
    };

    // Utility: Bring element to front (highest z-index)
    const bringToFront = (id) => {
        setZIndexOrder(prev => {
            const filtered = prev.filter(el => el !== id);
            return [...filtered, id]; // Move to end = highest z-index
        });
    };

    const hasAutoConnectedRef = useRef(false);

    useEffect(() => {
        if (isConnected && socketConnected && micDevices.length > 0 && !hasAutoConnectedRef.current) {
            hasAutoConnectedRef.current = true;
            const timer = setTimeout(() => {
                const index = micDevices.findIndex(d => d.deviceId === selectedMicId);
                const queryDevice = micDevices.find(d => d.deviceId === selectedMicId);
                const deviceName = queryDevice ? queryDevice.label : null;
                setStatus('Connecting...');
                socket.emit('start_audio', {
                    device_index: index >= 0 ? index : null,
                    device_name: deviceName,
                    muted: isMuted
                });
            }, 500);
        }
    }, [isConnected, socketConnected, micDevices, selectedMicId]);

    useEffect(() => {
        // Socket IO Setup
        socket.on('connect', () => {
            setStatus('Connected');
            setSocketConnected(true);
            socket.emit('get_settings');
        });
        socket.on('disconnect', () => {
            setStatus('Disconnected');
            setSocketConnected(false);
        });
        socket.on('status', (data) => {
            addMessage('System', data.msg);
            if (data.msg === 'A.P.A Started') {
                setStatus('Model Connected');
                setIsApaReady(true);
            } else if (data.msg === 'A.P.A Stopped') {
                setStatus('Connected');
            }
        });
        socket.on('audio_data', (data) => {
            setAiAudioData(data.data);
        });
        socket.on('error', (data) => {
            console.error("Socket Error:", data);
            addMessage('System', `Error: ${data.msg}`);
        });
        socket.on('widget_move', (data) => {
            console.log(`[widget_move] ${data.widget_id} → (${data.x}, ${data.y})`);
            setElementPositions(prev => ({
                ...prev,
                [data.widget_id]: { x: data.x, y: data.y }
            }));
        });

        // Handle Today's Emails
        socket.on('today_emails', (data) => {
            console.log("Received Today's Emails:", data.count);

        });

        // Handle streaming transcription
        socket.on('transcription', (data) => {
            setMessages(prev => {
                const lastMsg = prev[prev.length - 1];

                // If the last message is from the same sender, append the chunk
                if (lastMsg && lastMsg.sender === data.sender) {
                    // Create a NEW object instead of mutating (prevents React StrictMode duplication)
                    return [
                        ...prev.slice(0, -1),
                        {
                            ...lastMsg,
                            text: lastMsg.text + data.text
                        }
                    ];
                } else {
                    // New message block
                    return [...prev, {
                        sender: data.sender,
                        text: data.text,
                        time: new Date().toLocaleTimeString()
                    }];
                }
            });
        });

        socket.on('tool_confirmation_request', (data) => {
            console.log("Received Confirmation Request:", data);
            if (data && data.id) {
                socket.emit('resolve_confirmation', { id: data.id, confirmed: true });
            }
        });

        // Widget updates from backend (email summary, errors)
        socket.on('widget_update', (data) => {
            widgetIdRef.current += 1;
            const newWidget = { id: `widget-${widgetIdRef.current}`, ...data };
            setWidgets(prev => {
                const filtered = prev.filter(w => w.type !== data.type);
                return [...filtered, newWidget];
            });
            if (data.type === 'error') {
                setTimeout(() => {
                    setWidgets(prev => prev.filter(w => w.id !== newWidget.id));
                }, 15000);
            }
            if (data.type === 'email_summary' && data.data) {
                setEscalationCount(data.data.escalation_count || 0);
            }
        });



        // Request mic permission first, then enumerate devices
        navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => {
            stream.getTracks().forEach(t => t.stop());
            return navigator.mediaDevices.enumerateDevices();
        }).catch(() => navigator.mediaDevices.enumerateDevices()).then(devs => {
            const audioInputs = devs.filter(d => d.kind === 'audioinput');
            const audioOutputs = devs.filter(d => d.kind === 'audiooutput');

            setMicDevices(audioInputs);
            setSpeakerDevices(audioOutputs);

            // Restore saved microphone or use first available
            const savedMicId = localStorage.getItem('selectedMicId');
            if (savedMicId && audioInputs.some(d => d.deviceId === savedMicId)) {
                setSelectedMicId(savedMicId);
            } else if (audioInputs.length > 0) {
                setSelectedMicId(audioInputs[0].deviceId);
            }

            // Restore saved speaker or use first available
            const savedSpeakerId = localStorage.getItem('selectedSpeakerId');
            if (savedSpeakerId && audioOutputs.some(d => d.deviceId === savedSpeakerId)) {
                setSelectedSpeakerId(savedSpeakerId);
            } else if (audioOutputs.length > 0) {
                setSelectedSpeakerId(audioOutputs[0].deviceId);
            }

        });

        return () => {
            socket.off('connect');
            socket.off('disconnect');
            socket.off('status');
            socket.off('audio_data');
            socket.off('widget_move');
            socket.off('transcription');
            socket.off('tool_confirmation_request');
            socket.off('widget_update');
            socket.off('error');

            stopMicVisualizer();
        };
    }, []);

    // Initial check in case we are already connected (fix race condition)
    useEffect(() => {
        if (socket.connected) {
            setStatus('Connected');
            socket.emit('get_settings');
        }
    }, []);

    // Persist device selections to localStorage when they change
    useEffect(() => {
        if (selectedMicId) {
            localStorage.setItem('selectedMicId', selectedMicId);
            console.log('[Settings] Saved microphone:', selectedMicId);
        }
    }, [selectedMicId]);

    useEffect(() => {
        if (selectedSpeakerId) {
            localStorage.setItem('selectedSpeakerId', selectedSpeakerId);
            console.log('[Settings] Saved speaker:', selectedSpeakerId);
        }
    }, [selectedSpeakerId]);

    // Start/Stop Mic Visualizer
    useEffect(() => {
        if (selectedMicId) {
            startMicVisualizer(selectedMicId);
        }
    }, [selectedMicId]);

    const startMicVisualizer = async (deviceId) => {
        stopMicVisualizer();
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: { deviceId: { exact: deviceId } }
            });

            audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
            analyserRef.current = audioContextRef.current.createAnalyser();
            analyserRef.current.fftSize = 64;

            sourceRef.current = audioContextRef.current.createMediaStreamSource(stream);
            sourceRef.current.connect(analyserRef.current);

            const updateMicData = () => {
                if (!analyserRef.current) return;
                const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
                analyserRef.current.getByteFrequencyData(dataArray);
                setMicAudioData(Array.from(dataArray));
                animationFrameRef.current = requestAnimationFrame(updateMicData);
            };

            updateMicData();
        } catch (err) {
            console.error("Error accessing microphone:", err);
        }
    };

    const stopMicVisualizer = () => {
        if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
        if (sourceRef.current) sourceRef.current.disconnect();
        if (audioContextRef.current) audioContextRef.current.close();
    };

    const addMessage = (sender, text) => {
        setMessages(prev => [...prev, { sender, text, time: new Date().toLocaleTimeString() }]);
    };

    const playStartupChime = () => {
        try {
            const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            const now = audioCtx.currentTime;
            // Rising C major arpeggio: C5, E5, G5, C6
            const notes = [523.25, 659.25, 783.99, 1046.50];
            notes.forEach((freq, i) => {
                const osc = audioCtx.createOscillator();
                const gain = audioCtx.createGain();
                osc.type = 'sine';
                osc.frequency.value = freq;
                const t = now + i * 0.15;
                gain.gain.setValueAtTime(0, t);
                gain.gain.linearRampToValueAtTime(0.12, t + 0.04);
                gain.gain.exponentialRampToValueAtTime(0.001, t + 1.0);
                osc.connect(gain);
                gain.connect(audioCtx.destination);
                osc.start(t);
                osc.stop(t + 1.1);
            });
            // Sub bass pulse underneath
            const bass = audioCtx.createOscillator();
            const bassGain = audioCtx.createGain();
            bass.type = 'sine';
            bass.frequency.value = 65.41; // C2
            bassGain.gain.setValueAtTime(0, now);
            bassGain.gain.linearRampToValueAtTime(0.15, now + 0.3);
            bassGain.gain.exponentialRampToValueAtTime(0.001, now + 1.5);
            bass.connect(bassGain);
            bassGain.connect(audioCtx.destination);
            bass.start(now);
            bass.stop(now + 1.6);
        } catch (e) {
            console.log("Chime playback skipped:", e);
        }
    };

    const dismissWidget = (id) => {
        setWidgets(prev => prev.filter(w => w.id !== id));
    };

    const handleWidgetSendEmail = () => {
        setShowEmailWindow(true);
        socket.emit('fetch_today_emails');
        const size = { w: 550, h: 380 };
        const clamped = clampToViewport({ x: window.innerWidth / 2, y: window.innerHeight / 2 }, size);
        setElementPositions(prev => ({ ...prev, email: clamped }));
    };

    const handleWidgetAsk = (text) => {
        socket.emit('user_input', { text });
    };

    const triggerEmailIntro = (count) => {
        if (count === 0) {
            socket.emit('user_input', { text: "You have no emails today. Say: 'No new messages in your inbox, sir.'" });
        } else {
            socket.emit('user_input', { text: `I just fetched your emails. You have ${count} new messages today. Please say: 'Sir, these are today's emails that were in your inbox. Shall I read them out loud or would you prefer to handle them yourself?' Then briefly summarize the top 3 subjects.` });
        }
    };

    const togglePower = () => {
        if (isConnected) {
            socket.emit('stop_audio');
            setIsConnected(false);
            setIsMuted(false); // Reset mute state
        } else {
            const index = micDevices.findIndex(d => d.deviceId === selectedMicId);
            socket.emit('start_audio', { device_index: index >= 0 ? index : null });
            setIsConnected(true);
            setIsMuted(false); // Start unmuted
        }
    };


    const toggleMute = () => {
        if (!isConnected) return; // Can't mute if not connected

        if (isMuted) {
            socket.emit('resume_audio');
            setIsMuted(false);
        } else {
            socket.emit('pause_audio');
            setIsMuted(true);
        }
    };

    const handleSend = (e) => {
        if (e.key === 'Enter' && inputValue.trim()) {
            socket.emit('user_input', { text: inputValue });
            addMessage('You', inputValue);
            setInputValue('');
        }
    };

    const handleMinimize = () => ipcRenderer.send('window-minimize');
    const handleMaximize = () => ipcRenderer.send('window-maximize');

    // Close Application - memory is now actively saved to project, no prompt needed
    const handleCloseRequest = () => {
        // Emit shutdown signal to backend for graceful shutdown
        // Use volatile emit with timeout fallback to ensure window closes even if server is unresponsive
        const closeWindow = () => ipcRenderer.send('window-close');

        if (socket.connected) {
            console.log('[APP] Sending shutdown signal to backend...');
            socket.emit('shutdown', {}, (ack) => {
                // This callback may not be called if server uses os._exit
                console.log('[APP] Shutdown acknowledged');
                closeWindow();
            });
            // Fallback: close after 500ms if ack doesn't come back
            setTimeout(closeWindow, 500);
        } else {
            // Socket not connected, just close
            closeWindow();
        }
    };

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const textContent = event.target.result;
                // Just send the text content directly
                if (typeof textContent === 'string' && textContent.length > 0) {
                    socket.emit('upload_memory', { memory: textContent });
                    addMessage('System', 'Uploading memory...');
                } else {
                    addMessage('System', 'Empty or invalid memory file');
                }
            } catch (err) {
                console.error("Error reading file:", err);
                addMessage('System', 'Error reading memory file');
            }
        };
        reader.readAsText(file);
    };

    // Updated Bounds Checking Logic
    const updateElementPosition = (id, dx, dy) => {
        setElementPositions(prev => {
            const currentPos = prev[id];
            const size = elementSizes[id] || { w: 100, h: 100 }; // Fallback
            let newX = currentPos.x + dx;
            let newY = currentPos.y + dy;

            // Bounds Logic
            // Depends on anchor point.
            // Visualizer, Tools, Cad, Browser, Kasa: translate(-50%, -50%) -> Center Anchor
            // Chat: translate(-50%, 0) -> Top-Center Anchor
            // Video: Top-Left Anchor (default div)

            const width = window.innerWidth;
            const height = window.innerHeight;
            const margin = 0; // Strict bounds

            if (id === 'chat') {
                // Anchor: Top-Center (x is center, y is top)
                // X Bounds: size.w/2 <= x <= width - size.w/2
                newX = Math.max(size.w / 2 + margin, Math.min(width - size.w / 2 - margin, newX));
                // Y Bounds: 0 <= y <= height - size.h
                newY = Math.max(margin, Math.min(height - size.h - margin, newY));

            } else if (id === 'video') {
                // Anchor: Top-Left
                newX = Math.max(margin, Math.min(width - size.w - margin, newX));
                newY = Math.max(margin, Math.min(height - size.h - margin, newY));

            } else {
                // Anchor: Center
                newX = Math.max(size.w / 2 + margin, Math.min(width - size.w / 2 - margin, newX));
                newY = Math.max(size.h / 2 + margin, Math.min(height - size.h / 2 - margin, newY));
            }

            return {
                ...prev,
                [id]: {
                    x: newX,
                    y: newY
                }
            };
        });
    };

    // --- MOUSE DRAG HANDLERS ---
    const handleMouseDown = (e, id) => {
        console.log(`[MouseDrag] MouseDown on ${id}`, { target: e.target.tagName });

        // Fixed elements that should never be draggable (even in modular mode)
        const fixedElements = ['visualizer', 'chat', 'tools'];
        if (fixedElements.includes(id)) {
            console.log(`[MouseDrag] ${id} is a fixed element, not draggable`);
            return;
        }

        // Bring clicked element to front (z-index)
        bringToFront(id);

        // Prevent dragging if interacting with inputs, buttons, or canvas (for 3D controls)
        const tagName = e.target.tagName.toLowerCase();
        if (tagName === 'input' || tagName === 'button' || tagName === 'textarea' || tagName === 'canvas' || e.target.closest('button')) {
            console.log("[MouseDrag] Interaction blocked by interactive element");
            return;
        }

        // Check if clicking on a drag handle section (data-drag-handle attribute)
        const isDragHandle = e.target.closest('[data-drag-handle]');
        if (!isDragHandle && !isModularModeRef.current) {
            // If not clicking a drag handle and modular mode is off, don't drag
            // This allows popup windows to have dedicated drag areas
            console.log("[MouseDrag] Not a drag handle and modular mode off");
            return;
        }

        const elPos = elementPositions[id];
        if (!elPos) return;

        // Calculate offset based on anchor point
        // Most are Center Anchored (x, y is center)
        // Chat is Top-Center Anchored (x is center, y is top)
        // Video is Top-Left Anchored (x is left, y is top)

        // We want: MousePos = ElementPos + Offset
        // So: Offset = MousePos - ElementPos
        dragOffsetRef.current = {
            x: e.clientX - elPos.x,
            y: e.clientY - elPos.y
        };

        setActiveDragElement(id);
        activeDragElementRef.current = id;
        isDraggingRef.current = true;

        window.addEventListener('mousemove', handleMouseDrag);
        window.addEventListener('mouseup', handleMouseUp);
    };

    const handleMouseDrag = (e) => {
        if (!isDraggingRef.current || !activeDragElementRef.current) return;

        const id = activeDragElementRef.current;
        const currentPos = elementPositionsRef.current[id];
        if (!currentPos) return;

        // Target Position = MousePos - Offset
        // But we want delta for updateElementPosition??
        // actually updateElementPosition takes dx, dy.
        // Let's just set the position directly or calculate delta.
        // Since updateElementPosition has bounds logic, let's use it, but we need delta from PREVIOUS position?
        // OR we can refactor updateElementPosition to take absolute.
        // Let's stick to calculating new position and manually updating state with bounds logic inside a setter.

        // Actually, updateElementPosition uses setElementPositions(prev => ...).
        // Let's duplicate bounds logic for mouse drag to be precise or reuse.
        // reusing updateElementPosition requires calculating dx/dy from *current state* which might be lagging in the closure?
        // No, functional update is fine.

        // But for smooth mouse drag, absolute position is better.
        const rawNewX = e.clientX - dragOffsetRef.current.x;
        const rawNewY = e.clientY - dragOffsetRef.current.y;

        setElementPositions(prev => {
            const size = elementSizes[id] || { w: 100, h: 100 }; // Fallback
            let newX = rawNewX;
            let newY = rawNewY;

            const width = window.innerWidth;
            const height = window.innerHeight;
            const margin = 0;

            if (id === 'chat') {
                newX = Math.max(size.w / 2 + margin, Math.min(width - size.w / 2 - margin, newX));
                newY = Math.max(margin, Math.min(height - size.h - margin, newY));
            } else if (id === 'video') {
                newX = Math.max(margin, Math.min(width - size.w - margin, newX));
                newY = Math.max(margin, Math.min(height - size.h - margin, newY));
            } else {
                newX = Math.max(size.w / 2 + margin, Math.min(width - size.w / 2 - margin, newX));
                newY = Math.max(size.h / 2 + margin, Math.min(height - size.h / 2 - margin, newY));
            }

            return {
                ...prev,
                [id]: { x: newX, y: newY }
            };
        });
    };

    const handleMouseUp = () => {
        isDraggingRef.current = false;
        setActiveDragElement(null);
        activeDragElementRef.current = null;
        window.removeEventListener('mousemove', handleMouseDrag);
        window.removeEventListener('mouseup', handleMouseUp);
    };

    // Calculate Average Audio Amplitude for Background Pulse
    const audioAmp = aiAudioData.reduce((a, b) => a + b, 0) / aiAudioData.length / 255;



    const toggleEmailWindow = () => {
        if (!showEmailWindow) {
            setShowEmailWindow(true);
            socket.emit('fetch_today_emails');
            const size = { w: 550, h: 380 };
            const clamped = clampToViewport({ x: window.innerWidth / 2, y: window.innerHeight / 2 }, size);
            setElementPositions(prev => ({
                ...prev,
                email: clamped
            }));
        } else {
            setShowEmailWindow(false);
        }
    };



    return (
        <ErrorBoundary>
        <div className="min-h-screen w-screen bg-black text-cyan-100 font-mono overflow-hidden flex flex-col relative selection:bg-cyan-900 selection:text-white">

            {/* Main UI */}

            {/* Background Grid/Effects - NEXT GEN GLASSMORPHISM */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-cyan-900/40 via-slate-950 to-purple-950/40 z-0 pointer-events-none"></div>
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 z-0 pointer-events-none mix-blend-overlay"></div>

            {/* Ambient Glows */}
            <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-cyan-500/20 rounded-full blur-[120px] pointer-events-none animate-pulse"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-purple-500/20 rounded-full blur-[120px] pointer-events-none animate-pulse"></div>

            {/* Top Bar (Draggable) - GLASSMORPHISM */}
            <div className="z-50 flex items-center justify-between p-3 border-b border-white/10 bg-white/5 backdrop-blur-xl select-none sticky top-0 shadow-[0_4px_30px_rgba(0,0,0,0.1)]" style={{ WebkitAppRegion: 'drag' }}>
                <div className="flex items-center gap-4 pl-2">
                    <h1 className="text-xl font-bold tracking-[0.2em] text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-purple-300 drop-shadow-[0_0_10px_rgba(34,211,238,0.5)]">
                        A.P.A
                    </h1>
                    <div className="text-[10px] text-cyan-300/70 border border-white/10 px-1.5 rounded-lg bg-white/5 backdrop-blur-sm">
                        V2.0.0
                    </div>
                    

                </div>

                {/* Top Visualizer (User Mic) */}
                <div className="flex-1 flex justify-center mx-4">
                    <TopAudioBar audioData={micAudioData} escalationCount={escalationCount} />
                </div>

                <div className="flex items-center gap-2 pr-2" style={{ WebkitAppRegion: 'no-drag' }}>
                    {/* Live Clock */}
                    <div className="flex items-center gap-1.5 text-[11px] text-cyan-200/70 font-mono px-2">
                        <Clock size={12} className="text-cyan-400/50" />
                        <span>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <button onClick={handleMinimize} className="p-1.5 hover:bg-white/10 rounded-lg text-cyan-300 transition-colors">
                        <Minus size={18} />
                    </button>
                    <button onClick={handleMaximize} className="p-1.5 hover:bg-white/10 rounded-lg text-cyan-300 transition-colors">
                        <div className="w-[14px] h-[14px] border-2 border-current rounded-[2px]" />
                    </button>
                    <button onClick={handleCloseRequest} className="p-1.5 hover:bg-rose-500/20 rounded-lg text-rose-300 transition-colors">
                        <X size={18} />
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 relative z-10 flex flex-col items-center">
                {/* Central Visualizer (AI Audio) - GLASSMORPHISM */}
                <div
                    id="visualizer"
                    className={`absolute flex items-center justify-center transition-[left,top,width,height] duration-500 ease-out
                        backdrop-blur-2xl bg-white/5 border border-white/20 shadow-[0_8px_32px_0_rgba(31,38,135,0.37)] overflow-visible
                        ${isModularMode ? (activeDragElement === 'visualizer' ? 'ring-2 ring-cyan-400 bg-cyan-500/10' : 'ring-1 ring-white/30 bg-white/10') + ' rounded-3xl pointer-events-auto' : 'rounded-3xl pointer-events-none'}
                    `}
                    style={{
                        left: elementPositions.visualizer.x,
                        top: elementPositions.visualizer.y,
                        transform: 'translate(-50%, -50%)',
                        width: elementSizes.visualizer.w,
                        height: elementSizes.visualizer.h
                    }}
                    onMouseDown={(e) => handleMouseDown(e, 'visualizer')}
                >
                    <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 pointer-events-none mix-blend-overlay z-10"></div>
                    <div className="relative z-20">
                        <Visualizer
                            audioData={aiAudioData}
                            isListening={isConnected && !isMuted}
                            intensity={audioAmp}
                            width={elementSizes.visualizer.w}
                            height={elementSizes.visualizer.h}
                        />
                    </div>
                    {isModularMode && <div className={`absolute top-2 right-2 text-xs font-bold tracking-widest z-20 ${activeDragElement === 'visualizer' ? 'text-green-500' : 'text-yellow-500/50'}`}>VISUALIZER</div>}
                </div>



                {/* Settings Modal - Moved outside Video so it shows independently */}
                {showSettings && (
                    <SettingsWindow
                        socket={socket}
                        micDevices={micDevices}
                        speakerDevices={speakerDevices}
                        selectedMicId={selectedMicId}
                        setSelectedMicId={setSelectedMicId}
                        selectedSpeakerId={selectedSpeakerId}
                        setSelectedSpeakerId={setSelectedSpeakerId}
                        handleFileUpload={handleFileUpload}
                        onClose={() => setShowSettings(false)}
                    />
                )}







                {/* Email Window Overlay */}
                {showEmailWindow && (
                    <div
                        id="email"
                        className={`absolute flex flex-col transition-[left,top,width,height] duration-500 ease-out
                        backdrop-blur-2xl bg-white/5 border border-white/20 shadow-[0_8px_32px_0_rgba(31,38,135,0.37)] overflow-hidden rounded-3xl
                        ${activeDragElement === 'email' ? 'ring-2 ring-cyan-400 bg-cyan-500/10' : ''}
                    `}
                        style={{
                            left: elementPositions.email?.x ?? window.innerWidth / 2,
                            top: elementPositions.email?.y ?? window.innerHeight / 2,
                            transform: 'translate(-50%, -50%)',
                            width: `${elementSizes.email?.w || 550}px`,
                            height: `${elementSizes.email?.h || 380}px`,
                            pointerEvents: 'auto',
                            zIndex: getZIndex('email')
                        }}
                        onMouseDown={(e) => handleMouseDown(e, 'email')}
                    >
                        <div className="relative z-20 w-full h-full">
                            <EmailWindow
                                socket={socket}
                                onClose={() => setShowEmailWindow(false)}
                                onCompose={() => setShowCompose(true)}
                            />
                        </div>
                    </div>
                )}
                {showCompose && (
                    <div
                        className="absolute"
                        style={{
                            left: window.innerWidth / 2,
                            top: window.innerHeight / 2,
                            transform: 'translate(-50%, -50%)',
                            width: '480px',
                            height: '520px',
                            pointerEvents: 'auto',
                            zIndex: 100
                        }}
                    >
                        <ComposeWindow
                            socket={socket}
                            onClose={() => setShowCompose(false)}
                        />
                    </div>
                )}

                {/* Chat Module */}
                <ChatModule
                    messages={messages}
                    inputValue={inputValue}
                    setInputValue={setInputValue}
                    handleSend={handleSend}
                    isModularMode={isModularMode}
                    activeDragElement={activeDragElement}
                    position={elementPositions.chat}
                    width={elementSizes.chat.w}
                    height={elementSizes.chat.h}
                    onMouseDown={(e) => handleMouseDown(e, 'chat')}
                />

                {/* Widget Cards */}
                <WidgetContainer
                    widgets={widgets}
                    onDismiss={dismissWidget}
                    onSendEmail={handleWidgetSendEmail}
                    onAsk={handleWidgetAsk}
                />

                {/* Footer Controls / Tools Module */}
                <div className="mt-auto z-50">
                    <ToolsModule
                        isConnected={isConnected}
                        isMuted={isMuted}
                        showSettings={showSettings}
                        onTogglePower={togglePower}
                        onToggleMute={toggleMute}
                        onToggleSettings={() => setShowSettings(!showSettings)}
                        onToggleEmail={toggleEmailWindow}
                        showEmailWindow={showEmailWindow}
                        activeDragElement={activeDragElement}
                        position={elementPositions.tools}
                        onMouseDown={(e) => handleMouseDown(e, 'tools')}
                    />
                </div>

            </div>
        </div>
        </ErrorBoundary>
    );
}

export default App;
