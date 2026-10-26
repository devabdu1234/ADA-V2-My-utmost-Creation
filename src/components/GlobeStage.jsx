import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import * as THREE from 'three';

// Real-Earth globe for weather / maps. Textured three.js sphere, zero API keys.
// mode: 'weather' | 'system'. Email has its own separate stage — never here.
// data: { city?, markers?: [{label, x (0..1 lon), y (0..1 lat), hot?}] }
const TEX = {
    day: './textures/earth-day.jpg',
    night: './textures/earth-night.jpg',
    topo: './textures/earth-topo.png',
    clouds: './textures/earth-clouds.png',
};

function lonLat(x, y) {
    return { lon: x * 360 - 180, lat: (0.5 - y) * 180 };
}
function toVec3(lon, lat, r) {
    const phi = (90 - lat) * (Math.PI / 180);
    const theta = (lon + 180) * (Math.PI / 180);
    return new THREE.Vector3(
        -r * Math.sin(phi) * Math.cos(theta),
        r * Math.cos(phi),
        r * Math.sin(phi) * Math.sin(theta)
    );
}
function glowTexture(inner = 'rgba(255,255,255,1)', outer = 'rgba(255,255,255,0)') {
    const c = document.createElement('canvas');
    c.width = c.height = 64;
    const g = c.getContext('2d');
    const grad = g.createRadialGradient(32, 32, 2, 32, 32, 30);
    grad.addColorStop(0, inner);
    grad.addColorStop(0.35, inner);
    grad.addColorStop(1, outer);
    g.fillStyle = grad;
    g.fillRect(0, 0, 64, 64);
    const t = new THREE.CanvasTexture(c);
    return t;
}
function ringTexture() {
    const c = document.createElement('canvas');
    c.width = c.height = 128;
    const g = c.getContext('2d');
    g.strokeStyle = 'rgba(255,255,255,0.9)';
    g.lineWidth = 5;
    g.beginPath();
    g.arc(64, 64, 52, 0, Math.PI * 2);
    g.stroke();
    return new THREE.CanvasTexture(c);
}

const GlobeStage = ({ mode = 'system', data = {}, width = 520, height = 340 }) => {
    const mountRef = useRef(null);
    const stateRef = useRef({ mode, data });
    useEffect(() => { stateRef.current = { mode, data }; }, [mode, data]);

    useEffect(() => {
        const mount = mountRef.current;
        if (!mount) return;
        let raf = 0;
        const disposables = [];

        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
        renderer.setSize(width, height);
        renderer.outputColorSpace = THREE.SRGBColorSpace;
        mount.appendChild(renderer.domElement);
        disposables.push(() => { mount.removeChild(renderer.domElement); renderer.dispose(); });

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 100);
        const CAM_FAR = 4.6, CAM_NEAR = 2.75;
        camera.position.set(0, 0.35, CAM_FAR);

        // lights — cinematic sun from the side
        const sun = new THREE.DirectionalLight(0xffffff, 2.4);
        sun.position.set(-4, 1.2, 2.5);
        scene.add(sun);
        scene.add(new THREE.AmbientLight(0x335577, 1.1));
        const rim = new THREE.DirectionalLight(0x66ccff, 1.2);
        rim.position.set(3, -1, -2);
        scene.add(rim);

        const loader = new THREE.TextureLoader();
        const dayTex = loader.load(TEX.day, (t) => { t.colorSpace = THREE.SRGBColorSpace; });
        const topoTex = loader.load(TEX.topo);
        const cloudTex = loader.load(TEX.clouds, (t) => { t.colorSpace = THREE.SRGBColorSpace; });
        disposables.push(() => { dayTex.dispose(); topoTex.dispose(); cloudTex.dispose(); });

        const world = new THREE.Group();
        scene.add(world);

        // earth
        const earthGeo = new THREE.SphereGeometry(1, 72, 72);
        const earthMat = new THREE.MeshPhongMaterial({
            map: dayTex, bumpMap: topoTex, bumpScale: 0.03,
            specular: new THREE.Color(0x224488), shininess: 14,
        });
        const earth = new THREE.Mesh(earthGeo, earthMat);
        earth.rotation.z = THREE.MathUtils.degToRad(-12);
        world.add(earth);
        disposables.push(() => { earthGeo.dispose(); earthMat.dispose(); });

        // clouds
        const cloudGeo = new THREE.SphereGeometry(1.012, 48, 48);
        const cloudMat = new THREE.MeshLambertMaterial({ map: cloudTex, transparent: true, opacity: 0.55, depthWrite: false });
        const clouds = new THREE.Mesh(cloudGeo, cloudMat);
        world.add(clouds);
        disposables.push(() => { cloudGeo.dispose(); cloudMat.dispose(); });

        // atmosphere — fresnel shell
        const atmGeo = new THREE.SphereGeometry(1.14, 48, 48);
        const atmMat = new THREE.ShaderMaterial({
            uniforms: { glowColor: { value: new THREE.Color(0x3aa0ff) } },
            vertexShader: `
                varying vec3 vNormal;
                void main() {
                    vNormal = normalize(normalMatrix * normal);
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }`,
            fragmentShader: `
                uniform vec3 glowColor;
                varying vec3 vNormal;
                void main() {
                    float intensity = pow(0.72 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 3.0);
                    gl_FragColor = vec4(glowColor, 1.0) * intensity;
                }`,
            side: THREE.BackSide, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false,
        });
        const atm = new THREE.Mesh(atmGeo, atmMat);
        scene.add(atm);
        disposables.push(() => { atmGeo.dispose(); atmMat.dispose(); });

        // stars
        const starGeo = new THREE.BufferGeometry();
        {
            const N = 700, pos = new Float32Array(N * 3);
            for (let i = 0; i < N; i++) {
                const r = 18 + Math.random() * 30;
                const th = Math.random() * Math.PI * 2;
                const ph = Math.acos(2 * Math.random() - 1);
                pos[i * 3] = r * Math.sin(ph) * Math.cos(th);
                pos[i * 3 + 1] = r * Math.cos(ph);
                pos[i * 3 + 2] = r * Math.sin(ph) * Math.sin(th);
            }
            starGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
        }
        const starMat = new THREE.PointsMaterial({ color: 0x9db8dd, size: 0.07, transparent: true, opacity: 0.8 });
        scene.add(new THREE.Points(starGeo, starMat));
        disposables.push(() => { starGeo.dispose(); starMat.dispose(); });

        // shared sprites
        const dotTex = glowTexture();
        const ringTex = ringTexture();
        disposables.push(() => { dotTex.dispose(); ringTex.dispose(); });

        const dynGroup = new THREE.Group(); // markers / arcs / packets live here
        world.add(dynGroup);
        let packets = [];
        let pings = [];
        let lockVec = null;
        let lockLat = 0;

        function buildOverlays() {
            // clear old
            dynGroup.traverse((o) => { if (o.geometry) o.geometry.dispose(); if (o.material && o.material.dispose) o.material.dispose(); });
            dynGroup.clear();
            packets = []; pings = [];
            const { markers = [], city } = stateRef.current.data || {};
            const list = markers.length ? markers : [{ label: (city || 'GLOBAL').toUpperCase(), x: 0.62, y: 0.38, hot: true }];
            const pts = list.map((m) => {
                // real lat/lon wins; x/y is the legacy fallback
                const lon = (m.lon !== undefined) ? m.lon : (m.x * 360 - 180);
                const lat = (m.lat !== undefined) ? m.lat : ((0.5 - m.y) * 180);
                return { ...m, lon, lat, v: toVec3(lon, lat, 1.005) };
            });
            const hot = pts.find((p) => p.hot) || pts[0];
            lockVec = hot.v.clone();
            lockLat = hot.lat;

            pts.forEach((p) => {
                const color = p.hot ? 0xfb7185 : 0x7dd3fc;
                const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: dotTex, color, transparent: true, depthWrite: false }));
                s.position.copy(p.v);
                s.scale.setScalar(p.hot ? 0.11 : 0.075);
                dynGroup.add(s);
                const ring = new THREE.Sprite(new THREE.SpriteMaterial({ map: ringTex, color, transparent: true, opacity: 0.8, depthWrite: false }));
                ring.position.copy(p.v);
                ring.scale.setScalar(0.05);
                dynGroup.add(ring);
                pings.push({ sprite: ring, t: Math.random() });
            });

            // arcs between markers
            for (let i = 0; i < pts.length; i++) {
                for (let j = i + 1; j < pts.length; j++) {
                    const A = pts[i].v, B = pts[j].v;
                    const mid = A.clone().add(B).multiplyScalar(0.5).normalize().multiplyScalar(1.28);
                    const curve = new THREE.QuadraticBezierCurve3(A.clone(), mid, B.clone());
                    const tubeGeo = new THREE.TubeGeometry(curve, 40, 0.0045, 6, false);
                    const tubeMat = new THREE.MeshBasicMaterial({ color: 0x67e8f9, transparent: true, opacity: 0.45, blending: THREE.AdditiveBlending, depthWrite: false });
                    dynGroup.add(new THREE.Mesh(tubeGeo, tubeMat));
                    const pkt = new THREE.Sprite(new THREE.SpriteMaterial({ map: dotTex, color: 0xffffff, transparent: true, depthWrite: false }));
                    pkt.scale.setScalar(0.05);
                    dynGroup.add(pkt);
                    packets.push({ sprite: pkt, curve, phase: Math.random() });
                }
            }
        }
        buildOverlays();

        const clock = new THREE.Clock();
        const start = performance.now();
        const easeOut = (x) => 1 - Math.pow(1 - x, 3);
        const easeInOut = (x) => x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2;
        const smooth = (x) => { x = THREE.MathUtils.clamp(x, 0, 1); return x * x * (3 - 2 * x); };

        // gold dive reticle rides the locked pin
        let reticle = null;
        if (lockVec) {
            reticle = new THREE.Sprite(new THREE.SpriteMaterial({ map: ringTex, color: 0xfde68a, transparent: true, opacity: 0, depthWrite: false, depthTest: false }));
            reticle.position.copy(lockVec).multiplyScalar(1.004);
            reticle.scale.setScalar(0.3);
            reticle.renderOrder = 10;
            dynGroup.add(reticle);
        }
        const lookTarget = new THREE.Vector3(0, 0, 0);
        const pinFocus = lockVec ? lockVec.clone().multiplyScalar(0.82) : new THREE.Vector3();

        const draw = () => {
            raf = requestAnimationFrame(draw);
            const dt = Math.min(clock.getDelta(), 0.05);
            const t = (performance.now() - start) / 1000;

            // Phase 1 (0-1.5s): summon zoom far -> orbit + spin lock.
            // Phase 2 (1.5-4s): DIVE — camera plunges at the pinned city.
            const zk = easeOut(Math.min(1, t / 1.5));
            let z = CAM_FAR + (CAM_NEAR - CAM_FAR) * zk;
            let lookK = 0;
            if (lockVec) {
                const dive = easeInOut(Math.min(1, Math.max(0, (t - 1.4) / 2.6)));
                if (zk >= 1) z = CAM_NEAR + (1.52 - CAM_NEAR) * dive;
                lookK = smooth((t - 1.4) / 2.6);
                if (reticle) {
                    reticle.material.opacity = smooth((t - 2.0) / 1.2) * 0.95;
                    reticle.scale.setScalar(Math.max(0.1, 0.3 - 0.14 * smooth((t - 2.0) / 1.2) + Math.sin(t * 3) * 0.008));
                }
            }
            z += Math.sin(t * 1.1) * 0.02; // hover breathing
            camera.position.z = z;
            camera.position.y = 0.35 - 0.12 * zk - (lockVec ? 0.1 * lookK : 0);
            lookTarget.copy(pinFocus).multiplyScalar(lookK);
            camera.lookAt(lookTarget);

            // rotation: drift, or ease-lock onto the hunted city
            if (lockVec && t < 8) {
                // rotate Y so the locked point faces the camera (+z)
                const target = Math.atan2(-lockVec.x, lockVec.z);
                let d = target - world.rotation.y;
                d = Math.atan2(Math.sin(d), Math.cos(d));
                world.rotation.y += d * Math.min(1, dt * 1.8);
                // tilt the view toward its latitude
                const wantX = THREE.MathUtils.clamp(-lockLat / 90, -0.5, 0.5) * 0.35;
                world.rotation.x += (wantX - world.rotation.x) * Math.min(1, dt * 1.8);
            } else {
                world.rotation.y += dt * 0.045;
            }
            clouds.rotation.y += dt * 0.012;

            // packets ride the arcs
            packets.forEach((p) => {
                const u = (t * 0.35 + p.phase) % 1;
                p.sprite.position.copy(p.curve.getPoint(u));
            });
            // ping rings breathe
            pings.forEach((p) => {
                p.t = (p.t + dt * 0.9) % 1;
                p.sprite.scale.setScalar(0.05 + p.t * 0.16);
                p.sprite.material.opacity = 0.8 * (1 - p.t);
            });

            renderer.render(scene, camera);
        };
        draw();

        return () => {
            cancelAnimationFrame(raf);
            disposables.forEach((d) => { try { d(); } catch { /* noop */ } });
        };
    }, [width, height]);

    const lockLabel = (data.markers && data.markers.find((m) => m.hot)?.label)
        || (data.markers && data.markers[0]?.label)
        || (data.city || 'GLOBAL').toUpperCase();

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.6, filter: 'blur(10px)' }}
            animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
            exit={{ opacity: 0, scale: 1.15, filter: 'blur(8px)' }}
            transition={{ type: 'spring', stiffness: 160, damping: 20 }}
            className="relative overflow-hidden rounded-3xl border border-cyan-300/20 bg-black backdrop-blur-2xl shadow-[0_0_60px_rgba(34,211,238,0.25)]"
            style={{ width, height }}
        >
            <div ref={mountRef} style={{ width: '100%', height: '100%' }} />
            <div className="absolute top-3 left-4 flex items-center gap-2 pointer-events-none">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[10px] font-mono tracking-[0.3em] text-cyan-200/80">
                    {mode === 'weather' ? 'ATMOS · LIVE' : 'GODSEYE · STANDBY'}
                </span>
            </div>
            <div className="absolute bottom-3 left-4 text-[10px] font-mono tracking-[0.25em] text-amber-200/80 pointer-events-none">
                LOCK: {lockLabel}
            </div>
            <div className="absolute bottom-3 right-4 text-[9px] font-mono text-cyan-300/50 tracking-widest pointer-events-none">
                SAT-LINK ▮▮▮▮▯ 98MS
            </div>
        </motion.div>
    );
};

export default GlobeStage;
