import React, { useCallback, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, CloudSun, Mail, MonitorSmartphone, ShieldAlert, AlertTriangle, XOctagon, Check, X, Reply, Inbox, Crosshair, Plane, Activity, Satellite, Eye, Play, MailOpen, Image as ImageIcon } from 'lucide-react';
import RadarMap from './RadarMap';
import { FlyRow, Beams, BeamProvider } from './Fly';
import GlobeStage from '../GlobeStage';
import CityMap from '../CityMap';
import { HoloPanel, Readout, TypeText, stagger, ACCENTS } from './Holo';

/* ------------------------------------------------------------- GEO ---- */
// Two acts: the globe hunts the target, then the street map dives in.
function GeoSummon({ widget, onClose }) {
    const d = widget.data || {};
    const isWeather = widget.type === 'weather';
    const [act, setAct] = useState('orbit');
    useEffect(() => {
        setAct('orbit');
        const t = setTimeout(() => setAct('street'), isWeather ? 4200 : 3200);
        return () => clearTimeout(t);
    }, [widget.id]);
    const lat = d.lat ?? 6.93;
    const lon = d.lon ?? 79.86;
    const markers = d.markers && d.markers.length ? d.markers : [{ label: (d.city || 'TARGET').toUpperCase(), lat, lon, hot: true }];
    return (
        <FlyRow>
            <HoloPanel code={isWeather ? 'ATM-07' : 'GEO-01'} accent="cyan" icon={MapPin}
                title={act === 'orbit' ? 'Acquiring target' : `Locked · ${d.city || 'target'}`}
                subtitle={`LAT ${lat.toFixed(4)}  LON ${lon.toFixed(4)}`} onClose={onClose} bodyClass="p-0">
                <div className="relative overflow-hidden" style={{ width: 640, height: 400 }}>
                    <AnimatePresence mode="wait">
                        {act === 'orbit' ? (
                            <motion.div key="orbit" className="absolute inset-0 flex items-center justify-center"
                                exit={{ opacity: 0, scale: 1.25, filter: 'blur(10px)', transition: { duration: 0.5 } }}>
                                <GlobeStage mode="weather" data={{ city: d.city, markers }} width={600} height={390} />
                            </motion.div>
                        ) : (
                            <motion.div key="street" className="absolute inset-0"
                                initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1, transition: { duration: 0.5 } }}>
                                <CityMap lat={lat} lon={lon} city={d.city} temp={d.temp} description={d.description} width={640} height={400} />
                            </motion.div>
                        )}
                    </AnimatePresence>
                    <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                        <motion.div className="w-24 h-24 rounded-full border border-cyan-300/60"
                            initial={{ scale: 3, opacity: 0 }} animate={{ scale: 1, opacity: [0, 1, 0.4] }}
                            transition={{ duration: 1.2, delay: 0.6 }} />
                        <Crosshair className="absolute text-cyan-300/50" size={26} />
                    </div>
                </div>
            </HoloPanel>
            {isWeather ? <WeatherCard d={d} /> : <PlaceCard d={d} lat={lat} lon={lon} />}
        </FlyRow>
    );
}

function PlaceCard({ d, lat, lon }) {
    return (
        <HoloPanel code="LOC" accent="violet" icon={MapPin} title="Target dossier" className="w-[260px] self-center">
            <div className="text-2xl font-semibold text-white mb-3"><TypeText text={d.city || 'Unknown'} delay={500} /></div>
            <div className="grid grid-cols-2 gap-2">
                <Readout label="Latitude" value={lat.toFixed(3)} accent="violet" />
                <Readout label="Longitude" value={lon.toFixed(3)} accent="violet" />
            </div>
            <div className="mt-3 text-[10px] font-mono text-slate-500">SOURCE · OPENSTREETMAP</div>
        </HoloPanel>
    );
}

function WeatherCard({ d }) {
    return (
        <HoloPanel code="WX" accent="violet" icon={CloudSun} title="Atmospherics" className="w-[280px] self-center">
            <div className="flex items-end gap-2">
                <motion.span className="text-5xl font-light text-white" {...stagger(0, 0.5)}>{d.temp ?? '--'}°</motion.span>
                <span className="text-sm text-violet-200 mb-2 capitalize">{d.description}</span>
            </div>
            <div className="grid grid-cols-3 gap-2 mt-3">
                <Readout label="Feels" value={`${d.feels ?? '--'}°`} accent="violet" />
                <Readout label="Humid" value={`${d.humidity ?? '--'}%`} accent="violet" />
                <Readout label="Wind" value={d.wind ?? '--'} accent="violet" />
            </div>
            <div className="mt-3 space-y-1.5">
                {(d.forecast || []).map((f, i) => (
                    <motion.div key={i} {...stagger(i, 0.7)} className="flex justify-between text-xs font-mono text-slate-300 border-b border-white/5 pb-1">
                        <span className="text-slate-500">{f.date}</span><span className="capitalize">{f.desc}</span><span>{f.lo}° / {f.hi}°</span>
                    </motion.div>
                ))}
            </div>
        </HoloPanel>
    );
}

/* -------------------------------------------------------- GOD'S EYE ---- */
const LAYER = {
    flights: { title: 'Airspace surveillance', code: 'GE-AIR', icon: Plane, accent: 'amber' },
    earthquakes: { title: 'Seismic watch', code: 'GE-SEIS', icon: Activity, accent: 'rose' },
    iss: { title: 'Orbital track', code: 'GE-ORB', icon: Satellite, accent: 'violet' },
};

function GodsEyeSummon({ widget, onClose }) {
    const d = widget.data || {};
    const meta = LAYER[d.layer] || LAYER.flights;
    const c = d.center || { lat: 0, lon: 0, name: 'Earth' };
    const items = d.items || [];
    const [act, setAct] = useState('orbit');
    const [sel, setSel] = useState(null);
    useEffect(() => {
        setAct('orbit'); setSel(null);
        const t = setTimeout(() => setAct('radar'), 2800);
        return () => clearTimeout(t);
    }, [widget.id]);
    return (
        <FlyRow>
            <HoloPanel code={meta.code} accent={meta.accent} icon={Eye} onClose={onClose} bodyClass="p-0"
                title={`God's eye · ${act === 'orbit' ? 'acquiring' : meta.title}`}
                subtitle={`${c.name} · ${c.lat.toFixed(3)}, ${c.lon.toFixed(3)}`}>
                <div className="relative" style={{ width: 660, height: 420 }}>
                    <AnimatePresence mode="wait">
                        {act === 'orbit' ? (
                            <motion.div key="o" className="absolute inset-0 flex items-center justify-center"
                                exit={{ opacity: 0, scale: 1.3, filter: 'blur(10px)', transition: { duration: 0.5 } }}>
                                <GlobeStage mode="weather" data={{ city: c.name, markers: d.markers || [] }} width={620} height={410} />
                            </motion.div>
                        ) : (
                            <motion.div key="r" className="absolute inset-0" initial={{ opacity: 0 }} animate={{ opacity: 1, transition: { duration: 0.5 } }}>
                                <RadarMap layer={d.layer} center={c} items={items} radiusKm={d.radius_km || 200}
                                    selected={sel} onSelect={setSel} width={660} height={420} />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </HoloPanel>
            <HoloPanel code="FEED" accent={meta.accent} icon={meta.icon} title={`${items.length} contacts`}
                subtitle={d.summary} className="w-[300px]">
                <div className="space-y-1.5 max-h-[340px] overflow-y-auto custom-scrollbar pr-1">
                    {items.length === 0 && <div className="text-xs text-slate-400">Nothing detected right now.</div>}
                    {items.map((it, i) => (
                        <motion.button key={i} {...stagger(i, 0.5)} onClick={() => setSel(i)}
                            className={`w-full text-left px-2.5 py-1.5 rounded border text-[11px] font-mono transition-colors ${sel === i ? 'border-rose-300/60 bg-rose-400/10' : 'border-white/5 hover:bg-white/5'}`}>
                            {d.layer === 'flights' && (<>
                                <div className="flex justify-between"><span className="text-amber-200">{it.callsign}</span><span className="text-slate-500">{it.dist_km} km</span></div>
                                <div className="text-slate-400">{it.on_ground ? 'ON GROUND' : `${it.alt_m} m · ${it.speed_kmh} km/h · ${it.heading}°`} · {it.country}</div>
                            </>)}
                            {d.layer === 'earthquakes' && (<>
                                <div className="flex justify-between"><span className="text-rose-200">M{it.mag}</span><span className="text-slate-500">{it.depth_km} km deep</span></div>
                                <div className="text-slate-400 truncate">{it.place}{it.tsunami ? ' · TSUNAMI FLAG' : ''}</div>
                            </>)}
                            {d.layer === 'iss' && (<>
                                <div className="text-violet-200">ISS · {it.alt_km} km altitude</div>
                                <div className="text-slate-400">{it.speed_kmh} km/h · {it.visibility}</div>
                            </>)}
                        </motion.button>
                    ))}
                </div>
                <div className="mt-3 text-[9px] font-mono text-slate-500">
                    SOURCE · {d.layer === 'flights' ? 'OPENSKY NETWORK' : d.layer === 'earthquakes' ? 'USGS' : 'WHERETHEISS.AT'} · LIVE
                </div>
            </HoloPanel>
        </FlyRow>
    );
}

/* ----------------------------------------------------------- EMAIL ---- */
const PRIORITY = { High: 'rose', Medium: 'amber', Low: 'emerald' };

function EmailSummon({ widget, onClose, onOpenInbox, onAsk }) {
    const d = widget.data || {};
    const emails = [...(d.emails || [])].sort((a, b) => (b.is_escalated ? 1 : 0) - (a.is_escalated ? 1 : 0));
    const [open, setOpen] = useState(null);
    const high = emails.filter((e) => e.priority === 'High').length;
    return (
        <FlyRow>
        <HoloPanel code="COMMS-03" accent="fuchsia" icon={Mail} title="Inbox intercept" onClose={onClose}
            subtitle={`${d.count || 0} messages analysed · ${d.escalation_count || 0} escalated`} className="w-[620px]">
            <div className="grid grid-cols-4 gap-2 mb-3">
                <Readout label="Messages" value={d.count || 0} accent="fuchsia" />
                <Readout label="Escalated" value={d.escalation_count || 0} accent="rose" />
                <Readout label="High" value={high} accent="amber" />
                <Readout label="Low conf." value={d.low_confidence_count || 0} accent="violet" />
            </div>
            <div className="max-h-[340px] overflow-y-auto custom-scrollbar space-y-2 pr-1">
                {emails.length === 0 && <div className="text-sm text-slate-400 py-6 text-center">Inbox clear, Sir.</div>}
                {emails.map((e, i) => {
                    const acc = ACCENTS[e.is_escalated ? 'rose' : PRIORITY[e.priority] || 'cyan'];
                    return (
                        <motion.button key={i} {...stagger(i)} onClick={() => setOpen(open === i ? null : i)}
                            className="w-full text-left rounded-md border bg-white/[0.02] hover:bg-white/[0.05] transition-colors flex"
                            style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
                            <span className="w-1 rounded-l-md" style={{ background: acc.line }} />
                            <div className="flex-1 px-3 py-2 min-w-0">
                                <div className="flex items-center gap-2">
                                    <span className="text-sm text-white truncate flex-1">{e.subject}</span>
                                    {e.image_count > 0 && <span className="text-[9px] text-fuchsia-200/80 inline-flex items-center gap-0.5"><ImageIcon size={10} />{e.image_count}</span>}
                                    {e.is_escalated && <span className="text-[9px] font-bold tracking-widest text-rose-300 border border-rose-400/40 px-1.5 rounded">ESCALATE</span>}
                                    <span className={`text-[9px] tracking-widest ${acc.text}`}>{(e.priority || '').toUpperCase()}</span>
                                </div>
                                <div className="text-[11px] text-slate-400 truncate">{e.from} · {e.category} · {e.sentiment}</div>
                                {open === i && (
                                    <div className="mt-2 text-xs text-slate-300 space-y-2">
                                        <p>{e.summary}</p>
                                        {e.image_thumbs?.length > 0 && (
                                            <div className="flex gap-2">
                                                {e.image_thumbs.map((src, k) => <img key={k} src={src} alt="Email image" className="h-16 rounded border border-white/10 object-cover" />)}
                                            </div>
                                        )}
                                        {e.draft_reply && <p className="text-slate-400 italic border-l-2 border-fuchsia-400/40 pl-2">{e.draft_reply}</p>}
                                        <div className="flex items-center gap-2 text-[10px] text-slate-500 font-mono">
                                            CONFIDENCE
                                            <span className="flex-1 h-1 bg-white/10 rounded"><span className="block h-1 rounded bg-fuchsia-300" style={{ width: `${Math.round((e.confidence || 0) * 100)}%` }} /></span>
                                            {Math.round((e.confidence || 0) * 100)}%
                                        </div>
                                    </div>
                                )}
                            </div>
                        </motion.button>
                    );
                })}
            </div>
            <div className="flex gap-2 mt-3">
                <button onClick={onOpenInbox} className="holo-btn"><Inbox size={14} /> Open full inbox</button>
                <button onClick={() => onAsk('Read me the escalated and high priority emails, and suggest replies.')} className="holo-btn"><Reply size={14} /> Brief me</button>
            </div>
        </HoloPanel>
        </FlyRow>
    );
}

/* ------------------------------------------------------- EMAIL VIEW ---- */
// One email opened by voice ("show me the invoice email"): full text plus its images.
function EmailViewSummon({ widget, onClose, onAsk }) {
    const d = widget.data || {};
    const imgs = d.images_view || [];
    const sender = String(d.from || 'Unknown sender');
    return (
        <FlyRow>
            <HoloPanel code="MAIL-OPEN" accent="fuchsia" icon={MailOpen} title={d.subject || '(no subject)'}
                subtitle={`${sender}${d.date ? ` · ${d.date}` : ''}`} onClose={onClose} className="w-[min(560px,34vw)]" bodyClass="p-0">
                <div className="max-h-[52vh] overflow-y-auto custom-scrollbar px-5 py-4 text-[13px] leading-relaxed text-slate-200 whitespace-pre-wrap break-words font-sans">
                    {d.body?.trim() || 'This email has no text.'}
                </div>
                <div className="flex gap-2 px-5 py-3 border-t border-white/5">
                    <button onClick={() => onAsk(`Draft a reply to the email from ${sender} about "${d.subject || ''}".`)} className="holo-btn"><Reply size={14} /> Draft a reply</button>
                    {imgs.length > 0 && <span className="text-[10px] text-slate-500 self-center font-mono">{imgs.length} IMAGE{imgs.length > 1 ? 'S' : ''} · SEEN BY A.P.A.</span>}
                </div>
            </HoloPanel>
            {imgs.length > 0 && (
                <HoloPanel code={`IMG-0${imgs.length}`} accent="violet" icon={ImageIcon} title={imgs.length > 1 ? `${imgs.length} attached images` : 'Attached image'}
                    className="w-[min(380px,22vw)] self-center" bodyClass="p-3">
                    <div className="max-h-[52vh] overflow-y-auto custom-scrollbar space-y-3">
                        {imgs.map((src, k) => (
                            <figure key={k}>
                                <img src={src} alt={d.image_names?.[k] || 'Email image'} className="w-full rounded-md border border-white/10" />
                                <figcaption className="text-[10px] text-slate-500 font-mono mt-1 truncate">{d.image_names?.[k] || 'inline image'}</figcaption>
                            </figure>
                        ))}
                    </div>
                </HoloPanel>
            )}
        </FlyRow>
    );
}

/* -------------------------------------------------------- COMPUTER ---- */
function ComputerSummon({ steps, shot, onClose, onStop, onResume }) {
    return (
        <FlyRow>
            <HoloPanel code="OPS-09" accent="amber" icon={MonitorSmartphone} title="Remote operation"
                subtitle="A.P.A has the controls" onClose={onClose} bodyClass="p-0">
                <div className="relative bg-black/50" style={{ width: 560, height: 330 }}>
                    {shot ? (
                        <img src={`data:image/jpeg;base64,${shot}`} alt="Live screen" className="w-full h-full object-contain" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs font-mono text-amber-200/60">AWAITING VISUAL FEED…</div>
                    )}
                    <div className="absolute inset-0 holo-sweep pointer-events-none" />
                </div>
            </HoloPanel>
            <HoloPanel code="LOG" accent="amber" title="Action log" className="w-[260px]">
                <div className="space-y-1.5 max-h-[260px] overflow-y-auto custom-scrollbar">
                    {steps.map((s, i) => (
                        <motion.div key={i} {...stagger(i, 0.1)} className="flex items-center gap-2 text-xs font-mono">
                            <span className={s.state === 'failed' ? 'text-rose-400' : s.state === 'done' ? 'text-emerald-400' : 'text-amber-300 animate-pulse'}>
                                {s.state === 'failed' ? '✕' : s.state === 'done' ? '✓' : '▸'}
                            </span>
                            <span className="text-slate-300 truncate">{s.tool.replace('computer_', '').replace(/_/g, ' ')}</span>
                        </motion.div>
                    ))}
                </div>
                <button onClick={onStop} className="mt-4 w-full holo-btn holo-btn-danger justify-center">
                    <XOctagon size={14} /> Emergency stop
                </button>
                {steps.some((s) => s.tool === 'computer_emergency_stop') && (
                    <button onClick={onResume} className="mt-2 w-full holo-btn justify-center"><Play size={14} /> Resume control</button>
                )}
            </HoloPanel>
        </FlyRow>
    );
}

/* ---------------------------------------------------- CONFIRMATION ---- */
export function ConfirmCard({ request, onResolve }) {
    useEffect(() => {
        const k = (e) => {
            if (e.key === 'Enter') onResolve(true);
            if (e.key === 'Escape') onResolve(false);
        };
        window.addEventListener('keydown', k);
        return () => window.removeEventListener('keydown', k);
    }, [request?.id]);
    if (!request) return null;
    const args = request.args || {};
    return (
        <motion.div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/50 backdrop-blur-[2px]"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <HoloPanel code="AUTH" accent="rose" icon={ShieldAlert} title="Authorisation required"
                subtitle={`A.P.A wants to run ${request.tool}`} className="w-[440px]">
                <div className="rounded-md border border-white/10 bg-black/30 p-3 font-mono text-xs text-slate-300 max-h-40 overflow-auto">
                    {Object.keys(args).length === 0 ? <span className="text-slate-500">no arguments</span> :
                        Object.entries(args).map(([k, v]) => <div key={k}><span className="text-rose-300">{k}</span>: {String(v)}</div>)}
                </div>
                <div className="flex gap-2 mt-4">
                    <button onClick={() => onResolve(true)} className="holo-btn flex-1 justify-center"><Check size={14} /> Allow (Enter)</button>
                    <button onClick={() => onResolve(false)} className="holo-btn holo-btn-danger flex-1 justify-center"><X size={14} /> Deny (Esc)</button>
                </div>
            </HoloPanel>
        </motion.div>
    );
}

/* ----------------------------------------------------------- STAGE ---- */
const MAIN_TYPES = ['weather', 'map', 'email_summary', 'email_view', 'computer', 'gods_eye'];

const BEAM_COLOR = { weather: '#22d3ee', map: '#22d3ee', gods_eye: '#fbbf24', email_summary: '#f0abfc', email_view: '#f0abfc', computer: '#fbbf24' };

export default function Stage({ widgets, computer, onDismiss, onOpenInbox, onAsk, onStop, onResume }) {
    const mains = widgets.filter((w) => MAIN_TYPES.includes(w.type));
    const main = mains[mains.length - 1];
    const toasts = widgets.filter((w) => w.type === 'error');
    const [rects, setRects] = useState({});
    const report = useCallback((i, r) => setRects((p) => ({ ...p, [i]: r })), []);
    useEffect(() => { setRects({}); }, [main?.id]);
    useEffect(() => {
        if (!main) return;
        const k = (e) => { if (e.key === 'Escape') onDismiss(main.id); };
        window.addEventListener('keydown', k);
        return () => window.removeEventListener('keydown', k);
    }, [main?.id]);

    return (
        <>
            <AnimatePresence>
                {main && (
                    <motion.div key={main.id} className="absolute inset-0 z-[40]"
                        initial={{ opacity: 1 }} animate={{ opacity: 1 }} exit={{ opacity: 1, transition: { duration: 0.6 } }}>
                        {/* soft vignette, click empty space to send everything back into the orb */}
                        <motion.div className="absolute inset-0 summon-vignette" onClick={() => onDismiss(main.id)}
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />
                        <Beams rects={rects} accent={BEAM_COLOR[main.type] || '#22d3ee'} />
                        <motion.div className="absolute bottom-6 left-[22%] -translate-x-1/2 text-[10px] font-mono tracking-[0.4em] text-cyan-200/40 pointer-events-none"
                            initial={{ opacity: 0 }} animate={{ opacity: 1, transition: { delay: 1.2 } }} exit={{ opacity: 0 }}>
                            ESC · RECALL TO CORE
                        </motion.div>
                        <div className="absolute top-0 bottom-0 left-[36%] right-[2%] flex items-center justify-center pointer-events-none">
                          <div className="pointer-events-auto">
                          <BeamProvider value={report}>
                            {(main.type === 'weather' || main.type === 'map') && <GeoSummon widget={main} onClose={() => onDismiss(main.id)} />}
                            {main.type === 'email_view' && <EmailViewSummon widget={main} onClose={() => onDismiss(main.id)} onAsk={onAsk} />}
                            {main.type === 'email_summary' && <EmailSummon widget={main} onClose={() => onDismiss(main.id)} onOpenInbox={onOpenInbox} onAsk={onAsk} />}
                            {main.type === 'computer' && <ComputerSummon steps={computer.steps} shot={computer.shot} onClose={() => onDismiss(main.id)} onStop={onStop} onResume={onResume} />}
                            {main.type === 'gods_eye' && <GodsEyeSummon widget={main} onClose={() => onDismiss(main.id)} />}
                          </BeamProvider>
                          </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="absolute bottom-28 left-1/2 -translate-x-1/2 z-[60] flex flex-col gap-2 items-center pointer-events-none">
                <AnimatePresence>
                    {toasts.map((w) => (
                        <motion.div key={w.id} className="pointer-events-auto" layout
                            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                            <HoloPanel accent="rose" icon={AlertTriangle} title={w.data?.title || 'System fault'} onClose={() => onDismiss(w.id)} className="w-[420px]" bodyClass="px-4 py-3">
                                <div className="text-sm text-rose-100">{w.data?.message}</div>
                                {w.data?.detail && <div className="text-xs text-slate-400 mt-1">{w.data.detail}</div>}
                            </HoloPanel>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        </>
    );
}
