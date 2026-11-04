import React, { useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

// Colour + motion profile per ADA state. Everything eases between profiles,
// so state changes morph instead of snapping.
const PROFILES = {
    offline:   { a: '#475569', b: '#7f1d1d', speed: 0.15, amp: 0.04, glow: 0.35, ring: 0.15 },
    idle:      { a: '#0891b2', b: '#6d28d9', speed: 0.35, amp: 0.05, glow: 0.8,  ring: 0.35 },
    listening: { a: '#22d3ee', b: '#10b981', speed: 0.55, amp: 0.07, glow: 1.0,  ring: 0.55 },
    thinking:  { a: '#a78bfa', b: '#22d3ee', speed: 1.4,  amp: 0.11, glow: 1.15, ring: 1.4  },
    speaking:  { a: '#67e8f9', b: '#f0abfc', speed: 0.9,  amp: 0.08, glow: 1.35, ring: 0.8  },
    summoning: { a: '#f0abfc', b: '#22d3ee', speed: 1.8,  amp: 0.12, glow: 1.5,  ring: 2.0  },
    focus:     { a: '#34d399', b: '#0ea5e9', speed: 0.25, amp: 0.04, glow: 0.7,  ring: 0.25 },
    alert:     { a: '#fb7185', b: '#f59e0b', speed: 1.1,  amp: 0.11, glow: 1.4,  ring: 1.2  },
};

// 3D simplex noise (Ashima / Stefan Gustavson, MIT).
const NOISE = /* glsl */ `
vec3 mod289(vec3 x){return x-floor(x*(1.0/289.0))*289.0;}
vec4 mod289(vec4 x){return x-floor(x*(1.0/289.0))*289.0;}
vec4 permute(vec4 x){return mod289(((x*34.0)+1.0)*x);}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159-0.85373472095314*r;}
float snoise(vec3 v){
  const vec2 C=vec2(1.0/6.0,1.0/3.0); const vec4 D=vec4(0.0,0.5,1.0,2.0);
  vec3 i=floor(v+dot(v,C.yyy)); vec3 x0=v-i+dot(i,C.xxx);
  vec3 g=step(x0.yzx,x0.xyz); vec3 l=1.0-g; vec3 i1=min(g.xyz,l.zxy); vec3 i2=max(g.xyz,l.zxy);
  vec3 x1=x0-i1+C.xxx; vec3 x2=x0-i2+C.yyy; vec3 x3=x0-D.yyy;
  i=mod289(i);
  vec4 p=permute(permute(permute(i.z+vec4(0.0,i1.z,i2.z,1.0))+i.y+vec4(0.0,i1.y,i2.y,1.0))+i.x+vec4(0.0,i1.x,i2.x,1.0));
  float n_=0.142857142857; vec3 ns=n_*D.wyz-D.xzx;
  vec4 j=p-49.0*floor(p*ns.z*ns.z); vec4 x_=floor(j*ns.z); vec4 y_=floor(j-7.0*x_);
  vec4 x=x_*ns.x+ns.yyyy; vec4 y=y_*ns.x+ns.yyyy; vec4 h=1.0-abs(x)-abs(y);
  vec4 b0=vec4(x.xy,y.xy); vec4 b1=vec4(x.zw,y.zw);
  vec4 s0=floor(b0)*2.0+1.0; vec4 s1=floor(b1)*2.0+1.0; vec4 sh=-step(h,vec4(0.0));
  vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy; vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;
  vec3 p0=vec3(a0.xy,h.x); vec3 p1=vec3(a0.zw,h.y); vec3 p2=vec3(a1.xy,h.z); vec3 p3=vec3(a1.zw,h.w);
  vec4 norm=taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));
  p0*=norm.x; p1*=norm.y; p2*=norm.z; p3*=norm.w;
  vec4 m=max(0.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.0); m=m*m;
  return 42.0*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));
}`;

const shellVertex = /* glsl */ `
uniform float uTime; uniform float uAmp; uniform float uLevel;
varying vec3 vNormal; varying vec3 vView; varying float vNoise;
${NOISE}
void main(){
  float n = snoise(normal * 1.6 + vec3(uTime * 0.6));
  float n2 = snoise(normal * 3.0 - vec3(uTime * 0.8)) * 0.18;
  float d = (n + n2) * (uAmp + uLevel * 0.22);
  vNoise = n;
  vec3 pos = position + normal * d;
  vec4 mv = modelViewMatrix * vec4(pos, 1.0);
  vView = normalize(-mv.xyz);
  vNormal = normalize(normalMatrix * normal);
  gl_Position = projectionMatrix * mv;
}`;

const shellFragment = /* glsl */ `
uniform vec3 uColorA; uniform vec3 uColorB; uniform float uGlow; uniform float uTime;
varying vec3 vNormal; varying vec3 vView; varying float vNoise;
void main(){
  float fres = pow(1.0 - max(dot(vNormal, vView), 0.0), 2.2);
  vec3 col = mix(uColorA, uColorB, smoothstep(-0.6, 0.8, vNoise));
  float bands = 0.5 + 0.5 * sin(vNoise * 18.0 + uTime * 2.0);
  vec3 c = col * (0.18 + 0.35 * bands) + col * fres * 1.6 * uGlow;
  gl_FragColor = vec4(c, 0.55 + fres * 0.45);
}`;

function lerpColor(target, hex, k) {
    const c = new THREE.Color(hex);
    target.lerp(c, k);
}

function Shell({ profileRef, levelRef }) {
    const mat = useRef();
    const mesh = useRef();
    const uniforms = useMemo(() => ({
        uTime: { value: 0 }, uAmp: { value: 0.1 }, uLevel: { value: 0 }, uGlow: { value: 1 },
        uColorA: { value: new THREE.Color(PROFILES.idle.a) },
        uColorB: { value: new THREE.Color(PROFILES.idle.b) },
    }), []);
    const t = useRef(0);
    useFrame((_, dt) => {
        const p = profileRef.current;
        const u = mat.current.uniforms;
        t.current += dt * p.speed;
        u.uTime.value = t.current;
        u.uAmp.value += (p.amp - u.uAmp.value) * 0.05;
        u.uLevel.value += (levelRef.current - u.uLevel.value) * 0.25;
        u.uGlow.value += (p.glow - u.uGlow.value) * 0.05;
        lerpColor(u.uColorA.value, p.a, 0.04);
        lerpColor(u.uColorB.value, p.b, 0.04);
        mesh.current.rotation.y += dt * 0.15 * p.speed;
        const s = 1 + u.uLevel.value * 0.12;
        mesh.current.scale.setScalar(s);
    });
    return (
        <mesh ref={mesh}>
            <icosahedronGeometry args={[1, 64]} />
            <shaderMaterial ref={mat} uniforms={uniforms} vertexShader={shellVertex}
                fragmentShader={shellFragment} transparent depthWrite={false} />
        </mesh>
    );
}

const coreVertex = /* glsl */ `
varying vec3 vN; varying vec3 vV;
void main(){ vec4 mv = modelViewMatrix * vec4(position,1.0); vV = normalize(-mv.xyz); vN = normalize(normalMatrix*normal); gl_Position = projectionMatrix*mv; }`;
const coreFragment = /* glsl */ `
uniform vec3 uColor; uniform float uPower;
varying vec3 vN; varying vec3 vV;
void main(){ float f = pow(max(dot(vN, vV), 0.0), 2.5); vec3 c = mix(uColor, vec3(1.0), f*0.6) * f * uPower; gl_FragColor = vec4(c, f); }`;

function Core({ profileRef, levelRef }) {
    const ref = useRef();
    const mat = useRef();
    const uniforms = useMemo(() => ({ uColor: { value: new THREE.Color(PROFILES.idle.a) }, uPower: { value: 1 } }), []);
    useFrame(({ clock }) => {
        const p = profileRef.current;
        const pulse = 0.55 + Math.sin(clock.elapsedTime * (1 + p.speed * 2)) * 0.03 + levelRef.current * 0.2;
        ref.current.scale.setScalar(pulse);
        lerpColor(mat.current.uniforms.uColor.value, p.a, 0.05);
        const u = mat.current.uniforms.uPower;
        u.value += ((0.6 + p.glow * 0.9 + levelRef.current) - u.value) * 0.08;
    });
    return (
        <mesh ref={ref}>
            <sphereGeometry args={[1, 48, 48]} />
            <shaderMaterial ref={mat} uniforms={uniforms} vertexShader={coreVertex} fragmentShader={coreFragment}
                transparent blending={THREE.AdditiveBlending} depthWrite={false} />
        </mesh>
    );
}

function Rings({ profileRef }) {
    const group = useRef();
    const rings = useMemo(() => [
        { r: 1.45, tilt: [1.2, 0.2, 0], w: 0.004 },
        { r: 1.62, tilt: [0.4, 1.0, 0.3], w: 0.003 },
        { r: 1.85, tilt: [1.6, -0.6, 0.8], w: 0.006 },
    ], []);
    const mats = useRef([]);
    useFrame((_, dt) => {
        const p = profileRef.current;
        group.current.children.forEach((m, i) => {
            m.rotation.z += dt * p.ring * (i % 2 ? -0.6 : 0.8);
            m.rotation.x += dt * p.ring * 0.15 * (i + 1);
        });
        mats.current.forEach((m) => { if (m) lerpColor(m.color, p.a, 0.04); });
    });
    return (
        <group ref={group}>
            {rings.map((g, i) => (
                <mesh key={i} rotation={g.tilt}>
                    <torusGeometry args={[g.r, g.w, 8, 160]} />
                    <meshBasicMaterial ref={(m) => (mats.current[i] = m)} color={PROFILES.idle.a}
                        transparent opacity={0.55} blending={THREE.AdditiveBlending} depthWrite={false} />
                </mesh>
            ))}
        </group>
    );
}

function Particles({ profileRef, levelRef, count = 900 }) {
    const pts = useRef();
    const mat = useRef();
    const positions = useMemo(() => {
        const arr = new Float32Array(count * 3);
        for (let i = 0; i < count; i++) {
            const r = 1.9 + Math.random() * 1.2;
            const th = Math.random() * Math.PI * 2;
            const ph = Math.acos(2 * Math.random() - 1);
            arr[i * 3] = r * Math.sin(ph) * Math.cos(th);
            arr[i * 3 + 1] = r * Math.sin(ph) * Math.sin(th) * 0.55;
            arr[i * 3 + 2] = r * Math.cos(ph);
        }
        return arr;
    }, [count]);
    useFrame((_, dt) => {
        const p = profileRef.current;
        pts.current.rotation.y += dt * 0.08 * (0.5 + p.ring);
        pts.current.rotation.x = Math.sin(performance.now() / 8000) * 0.15;
        const s = 1 + levelRef.current * 0.25;
        pts.current.scale.setScalar(s);
        lerpColor(mat.current.color, p.b, 0.03);
    });
    return (
        <points ref={pts}>
            <bufferGeometry>
                <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
            </bufferGeometry>
            <pointsMaterial ref={mat} size={0.022} color={PROFILES.idle.b} transparent opacity={0.8}
                blending={THREE.AdditiveBlending} depthWrite={false} sizeAttenuation />
        </points>
    );
}

function CameraRig({ distRef }) {
    const { camera } = useThree();
    useFrame(() => { camera.position.z += (distRef.current - camera.position.z) * 0.06; });
    return null;
}

/**
 * Orb3D: the living core of A.P.A.
 *  state  – offline | idle | listening | thinking | speaking | summoning | focus | alert
 *  level  – 0..1 voice energy (AI speech or mic), drives the surface ripple
 */
export default function Orb3D({ state = 'idle', level = 0, compact = false, className = '', style }) {
    const profileRef = useRef(PROFILES.idle);
    const levelRef = useRef(0);
    profileRef.current = PROFILES[state] || PROFILES.idle;
    levelRef.current = Math.max(0, Math.min(1, level));
    const distRef = useRef(5.2);
    distRef.current = compact ? 6.8 : 5.2;
    return (
        <div className={className} style={style}>
            <Canvas camera={{ position: [0, 0, 5.2], fov: 45 }} dpr={[1, 2]} gl={{ antialias: true, alpha: true }}>
                <CameraRig distRef={distRef} />
                <Particles profileRef={profileRef} levelRef={levelRef} />
                <Rings profileRef={profileRef} />
                <Core profileRef={profileRef} levelRef={levelRef} />
                <Shell profileRef={profileRef} levelRef={levelRef} />
            </Canvas>
        </div>
    );
}
