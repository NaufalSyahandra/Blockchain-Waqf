'use client'

import type { ReactNode } from 'react'
import Link from 'next/link'
import { ShieldCheck, Lock, BarChart2, Users, Globe } from 'lucide-react'
import { useEffect, useRef } from 'react'

const FEATURES = [
    { icon: Lock,      title: 'On-chain verification', desc: 'tx_hash · block_number · onchain_id' },
    { icon: BarChart2, title: 'Real-time compliance',  desc: 'Sharia audit trail otomatis'         },
    { icon: Users,     title: 'Multi-role access',     desc: 'Wakif · Nazhir · Dewan Syariah'     },
]

function LeftGridCanvas() {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext('2d')!
        let animFrame: number
        type Node = { x: number; y: number; alpha: number; speed: number; dir: number }
        let nodes: Node[] = [], W = 0, H = 0

        function resize() {
            if (!canvas) return
            W = canvas.width = canvas.offsetWidth
            H = canvas.height = canvas.offsetHeight
            nodes = []
            const cols = Math.floor(W / 44), rows = Math.floor(H / 44)
            for (let c = 0; c <= cols; c++)
                for (let r = 0; r <= rows; r++)
                    if (Math.random() > 0.6)
                        nodes.push({ x: c*44, y: r*44, alpha: Math.random(), speed: 0.003+Math.random()*0.007, dir: Math.random()>0.5?1:-1 })
        }
        function draw() {
            ctx.clearRect(0, 0, W, H)
            ctx.lineWidth = 0.5; ctx.strokeStyle = 'rgba(16,185,129,0.10)'
            for (let c = 0; c <= Math.floor(W/44); c++) { ctx.beginPath(); ctx.moveTo(c*44,0); ctx.lineTo(c*44,H); ctx.stroke() }
            for (let r = 0; r <= Math.floor(H/44); r++) { ctx.beginPath(); ctx.moveTo(0,r*44); ctx.lineTo(W,r*44); ctx.stroke() }
            nodes.forEach(n => {
                n.alpha += n.speed*n.dir
                if (n.alpha>=1||n.alpha<=0) n.dir*=-1
                ctx.beginPath(); ctx.arc(n.x,n.y,1.8,0,Math.PI*2)
                ctx.fillStyle=`rgba(110,231,183,${n.alpha*0.75})`; ctx.fill()
            })
            for (let i=0;i<nodes.length;i++) for (let j=i+1;j<nodes.length;j++) {
                const dx=nodes[i].x-nodes[j].x, dy=nodes[i].y-nodes[j].y
                if (Math.sqrt(dx*dx+dy*dy)<56) {
                    ctx.beginPath(); ctx.moveTo(nodes[i].x,nodes[i].y); ctx.lineTo(nodes[j].x,nodes[j].y)
                    ctx.strokeStyle=`rgba(110,231,183,${((nodes[i].alpha+nodes[j].alpha)/2)*0.25})`; ctx.lineWidth=0.7; ctx.stroke()
                }
            }
            animFrame = requestAnimationFrame(draw)
        }
        const ro = new ResizeObserver(resize); ro.observe(canvas); resize(); draw()
        return () => { cancelAnimationFrame(animFrame); ro.disconnect() }
    }, [])
    return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" style={{ opacity: 0.9 }} />
}

function RightBgCanvas() {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext('2d')!
        let animFrame: number
        let W = 0, H = 0
        type Particle = { x: number; y: number; vx: number; vy: number; r: number; alpha: number }
        let particles: Particle[] = []

        function resize() {
            if (!canvas) return
            W = canvas.width = canvas.offsetWidth
            H = canvas.height = canvas.offsetHeight
            particles = Array.from({ length: 28 }, () => ({
                x: Math.random() * W, y: Math.random() * H,
                vx: (Math.random() - 0.5) * 0.3, vy: (Math.random() - 0.5) * 0.3,
                r: 1 + Math.random() * 2.5,
                alpha: 0.1 + Math.random() * 0.3
            }))
        }
        function draw() {
            ctx.clearRect(0, 0, W, H)
            particles.forEach(p => {
                p.x += p.vx; p.y += p.vy
                if (p.x < 0) p.x = W; if (p.x > W) p.x = 0
                if (p.y < 0) p.y = H; if (p.y > H) p.y = 0
                ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI*2)
                ctx.fillStyle = `rgba(16,185,129,${p.alpha})`; ctx.fill()
            })
            for (let i = 0; i < particles.length; i++)
                for (let j = i+1; j < particles.length; j++) {
                    const dx = particles[i].x-particles[j].x, dy = particles[i].y-particles[j].y
                    const d = Math.sqrt(dx*dx+dy*dy)
                    if (d < 120) {
                        ctx.beginPath(); ctx.moveTo(particles[i].x, particles[i].y); ctx.lineTo(particles[j].x, particles[j].y)
                        ctx.strokeStyle = `rgba(16,185,129,${0.06*(1-d/120)})`; ctx.lineWidth=0.8; ctx.stroke()
                    }
                }
            animFrame = requestAnimationFrame(draw)
        }
        const ro = new ResizeObserver(resize); ro.observe(canvas); resize(); draw()
        return () => { cancelAnimationFrame(animFrame); ro.disconnect() }
    }, [])
    return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />
}

function MosqueScene() {
    return (
        <div className="w-full h-full flex items-center justify-center">
            <svg viewBox="0 0 480 260" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
                <style>{`
                    @keyframes floatUp { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
                    @keyframes twinkle { 0%,100%{opacity:0.15} 50%{opacity:0.9} }
                    @keyframes chainMove { to{stroke-dashoffset:-32} }
                    @keyframes pulse { 0%{r:5;opacity:0.7} 100%{r:20;opacity:0} }
                    @keyframes coinFloat { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-7px)} }
                    @keyframes moonGlow { 0%,100%{opacity:0.9} 50%{opacity:0.55} }
                    @keyframes cloudDrift { 0%{transform:translateX(0)} 100%{transform:translateX(10px)} }
                    .mosque-group { animation: floatUp 5s ease-in-out infinite; transform-origin: 240px 180px; }
                    .star1 { animation: twinkle 2.2s ease-in-out infinite; }
                    .star2 { animation: twinkle 1.8s ease-in-out infinite 0.4s; }
                    .star3 { animation: twinkle 2.7s ease-in-out infinite 1s; }
                    .star4 { animation: twinkle 2.0s ease-in-out infinite 0.7s; }
                    .chain1 { animation: chainMove 1.6s linear infinite; }
                    .chain2 { animation: chainMove 1.6s linear infinite 0.53s; }
                    .pulse1 { animation: pulse 2s ease-out infinite; }
                    .pulse2 { animation: pulse 2s ease-out infinite 0.67s; }
                    .pulse3 { animation: pulse 2s ease-out infinite 1.33s; }
                    .coin1 { animation: coinFloat 3s ease-in-out infinite; }
                    .coin2 { animation: coinFloat 3s ease-in-out infinite 1s; }
                    .coin3 { animation: coinFloat 3s ease-in-out infinite 2s; }
                    .moon { animation: moonGlow 4s ease-in-out infinite; }
                    .cloud1 { animation: cloudDrift 7s ease-in-out infinite alternate; }
                    .cloud2 { animation: cloudDrift 9s ease-in-out infinite alternate 2s; }
                `}</style>

                <g className="moon">
                    <circle cx="400" cy="38" r="28" fill="#d1fae5"/>
                    <circle cx="414" cy="30" r="20" fill="#f0fdf8"/>
                </g>

                <circle cx="52"  cy="30" r="2"   fill="#6ee7b7" className="star1"/>
                <circle cx="120" cy="18" r="1.5" fill="#34d399" className="star2"/>
                <circle cx="195" cy="28" r="2"   fill="#6ee7b7" className="star3"/>
                <circle cx="270" cy="14" r="1.5" fill="#a7f3d0" className="star4"/>

                <g className="cloud1" opacity="0.4">
                    <ellipse cx="70" cy="62" rx="26" ry="10" fill="#d1fae5"/>
                    <ellipse cx="88" cy="58" rx="19" ry="9" fill="#d1fae5"/>
                    <ellipse cx="55" cy="60" rx="15" ry="8" fill="#d1fae5"/>
                </g>
                <g className="cloud2" opacity="0.28">
                    <ellipse cx="320" cy="55" rx="22" ry="9" fill="#d1fae5"/>
                    <ellipse cx="336" cy="51" rx="16" ry="8" fill="#d1fae5"/>
                </g>

                <g className="mosque-group">
                    <rect x="50"  y="185" width="380" height="10" rx="3" fill="#065f46"/>
                    <rect x="36"  y="192" width="408" height="8"  rx="2" fill="#047857"/>

                    <rect x="105" y="148" width="270" height="46" rx="3" fill="#047857"/>
                    <rect x="90"  y="158" width="300" height="36" rx="3" fill="#059669" opacity="0.6"/>

                    <rect x="110" y="161" width="28" height="32" rx="1" fill="#065f46"/>
                    <path d="M110 170 Q124 158 138 170" fill="#10b981"/>
                    <rect x="113" y="172" width="11" height="14" fill="#6ee7b7" rx="1" opacity="0.65"/>
                    <rect x="126" y="172" width="11" height="14" fill="#6ee7b7" rx="1" opacity="0.65"/>

                    <rect x="150" y="161" width="28" height="32" rx="1" fill="#065f46"/>
                    <path d="M150 170 Q164 158 178 170" fill="#10b981"/>
                    <rect x="153" y="172" width="11" height="14" fill="#6ee7b7" rx="1" opacity="0.65"/>
                    <rect x="166" y="172" width="11" height="14" fill="#6ee7b7" rx="1" opacity="0.65"/>

                    <rect x="196" y="156" width="88" height="38" rx="2" fill="#065f46"/>
                    <path d="M196 172 Q240 150 284 172" fill="#10b981"/>
                    <rect x="200" y="174" width="34" height="20" fill="#6ee7b7" rx="1" opacity="0.55"/>
                    <rect x="246" y="174" width="34" height="20" fill="#6ee7b7" rx="1" opacity="0.55"/>
                    <circle cx="240" cy="184" r="2.5" fill="#d1fae5" opacity="0.8"/>

                    <rect x="294" y="161" width="28" height="32" rx="1" fill="#065f46"/>
                    <path d="M294 170 Q308 158 322 170" fill="#10b981"/>
                    <rect x="297" y="172" width="11" height="14" fill="#6ee7b7" rx="1" opacity="0.65"/>
                    <rect x="310" y="172" width="11" height="14" fill="#6ee7b7" rx="1" opacity="0.65"/>

                    <rect x="342" y="161" width="28" height="32" rx="1" fill="#065f46"/>
                    <path d="M342 170 Q356 158 370 170" fill="#10b981"/>
                    <rect x="345" y="172" width="11" height="14" fill="#6ee7b7" rx="1" opacity="0.65"/>
                    <rect x="358" y="172" width="11" height="14" fill="#6ee7b7" rx="1" opacity="0.65"/>

                    <path d="M138 148 Q240 88 342 148" fill="#10b981"/>
                    <path d="M154 148 Q240 100 326 148" fill="#059669"/>
                    <path d="M170 148 Q240 112 310 148" fill="#047857"/>

                    <rect x="228" y="72" width="24" height="18" rx="2" fill="#059669"/>
                    <path d="M224 72 L240 46 L256 72" fill="#047857"/>
                    <rect x="236" y="40" width="8" height="20" rx="1" fill="#059669"/>
                    <path d="M232 41 Q240 32 248 41" fill="none" stroke="#6ee7b7" strokeWidth="2" strokeLinecap="round"/>
                    <circle cx="240" cy="35" r="3.5" fill="none" stroke="#6ee7b7" strokeWidth="1.3"/>

                    <rect x="68"  y="118" width="22" height="68" rx="2" fill="#059669"/>
                    <path d="M68 118 Q79 100 90 118" fill="#10b981"/>
                    <rect x="71"  y="126" width="16" height="18" fill="#6ee7b7" rx="1" opacity="0.5"/>
                    <rect x="71"  y="152" width="16" height="18" fill="#6ee7b7" rx="1" opacity="0.5"/>
                    <rect x="76"  y="110" width="5"  height="20" rx="1" fill="#047857"/>
                    <path d="M74 111 Q79 104 84 111" fill="none" stroke="#6ee7b7" strokeWidth="1.5" strokeLinecap="round"/>

                    <rect x="390" y="118" width="22" height="68" rx="2" fill="#059669"/>
                    <path d="M390 118 Q401 100 412 118" fill="#10b981"/>
                    <rect x="393" y="126" width="16" height="18" fill="#6ee7b7" rx="1" opacity="0.5"/>
                    <rect x="393" y="152" width="16" height="18" fill="#6ee7b7" rx="1" opacity="0.5"/>
                    <rect x="398" y="110" width="5"  height="20" rx="1" fill="#047857"/>
                    <path d="M396 111 Q401 104 406 111" fill="none" stroke="#6ee7b7" strokeWidth="1.5" strokeLinecap="round"/>

                    <path d="M90 158 Q106 142 122 158" fill="#10b981"/>
                    <path d="M358 158 Q374 142 390 158" fill="#10b981"/>
                </g>

                <rect x="22"  y="196" width="436" height="32" rx="4" fill="#a7f3d0" opacity="0.45"/>
                <rect x="22"  y="216" width="436" height="18" rx="3" fill="#6ee7b7" opacity="0.28"/>

                <rect x="52"  y="184" width="5"  height="16" fill="#065f46"/>
                <ellipse cx="55" cy="181" rx="11" ry="13" fill="#059669" opacity="0.75"/>
                <rect x="424" y="184" width="5"  height="16" fill="#065f46"/>
                <ellipse cx="427" cy="181" rx="11" ry="13" fill="#059669" opacity="0.75"/>

                <rect x="48"  y="234" width="58" height="38" rx="6" fill="#059669"/>
                <rect x="50"  y="236" width="54" height="34" rx="5" fill="#047857"/>
                <rect x="54"  y="240" width="46" height="7"  rx="1.5" fill="#065f46"/>
                <rect x="54"  y="250" width="32" height="3"  rx="1" fill="#065f46" opacity="0.55"/>
                <rect x="54"  y="256" width="38" height="3"  rx="1" fill="#065f46" opacity="0.38"/>

                <rect x="201" y="234" width="58" height="38" rx="6" fill="#059669"/>
                <rect x="203" y="236" width="54" height="34" rx="5" fill="#047857"/>
                <rect x="207" y="240" width="46" height="7"  rx="1.5" fill="#065f46"/>
                <rect x="207" y="250" width="32" height="3"  rx="1" fill="#065f46" opacity="0.55"/>
                <rect x="207" y="256" width="38" height="3"  rx="1" fill="#065f46" opacity="0.38"/>

                <rect x="374" y="234" width="58" height="38" rx="6" fill="#059669"/>
                <rect x="376" y="236" width="54" height="34" rx="5" fill="#047857"/>
                <rect x="380" y="240" width="46" height="7"  rx="1.5" fill="#065f46"/>
                <rect x="380" y="250" width="32" height="3"  rx="1" fill="#065f46" opacity="0.55"/>
                <rect x="380" y="256" width="38" height="3"  rx="1" fill="#065f46" opacity="0.38"/>

                <path d="M106 253 L201 253" fill="none" stroke="#6ee7b7" strokeWidth="1.8" strokeDasharray="5 3" className="chain1" markerEnd="url(#ar)"/>
                <path d="M259 253 L374 253" fill="none" stroke="#6ee7b7" strokeWidth="1.8" strokeDasharray="5 3" className="chain2" markerEnd="url(#ar)"/>

                <circle cx="77"  cy="253" r="5" fill="none" stroke="#6ee7b7" strokeWidth="1.5" className="pulse1"/>
                <circle cx="230" cy="253" r="5" fill="none" stroke="#6ee7b7" strokeWidth="1.5" className="pulse2"/>
                <circle cx="403" cy="253" r="5" fill="none" stroke="#6ee7b7" strokeWidth="1.5" className="pulse3"/>

                <g className="coin1">
                    <circle cx="77"  cy="218" r="15" fill="#fbbf24" stroke="#f59e0b" strokeWidth="1.5"/>
                    <circle cx="77"  cy="218" r="10" fill="#fde68a"/>
                    <text x="77" y="222" textAnchor="middle" fontFamily="Georgia,serif" fontSize="11" fill="#92400e" fontWeight="bold">W</text>
                </g>
                <g className="coin2">
                    <circle cx="230" cy="216" r="12" fill="#fbbf24" stroke="#f59e0b" strokeWidth="1.5"/>
                    <circle cx="230" cy="216" r="8"  fill="#fde68a"/>
                    <text x="230" y="220" textAnchor="middle" fontFamily="Georgia,serif" fontSize="9" fill="#92400e" fontWeight="bold">W</text>
                </g>
                <g className="coin3">
                    <circle cx="403" cy="218" r="15" fill="#fbbf24" stroke="#f59e0b" strokeWidth="1.5"/>
                    <circle cx="403" cy="218" r="10" fill="#fde68a"/>
                    <text x="403" y="222" textAnchor="middle" fontFamily="Georgia,serif" fontSize="11" fill="#92400e" fontWeight="bold">W</text>
                </g>

                <defs>
                    <marker id="ar" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
                        <path d="M2 1L8 5L2 9" fill="none" stroke="#6ee7b7" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </marker>
                </defs>
            </svg>
        </div>
    )
}

export default function AuthLayout({ children }: { children: ReactNode }) {
    return (
        <div className="h-screen overflow-hidden flex">

            <div className="hidden lg:flex lg:w-[30%] relative bg-[#022c22] flex-col justify-between px-8 py-10 overflow-hidden">
                <LeftGridCanvas />

                <div className="relative z-10 flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
                        <ShieldCheck size={15} className="text-emerald-300" />
                    </div>
                    <span className="text-[13px] font-semibold text-white">WaqfChain</span>
                </div>

                <div className="relative z-10">
                    <p className="text-[10px] text-emerald-400 uppercase tracking-[0.15em] mb-3">Blockchain · Waqf</p>
                    <h2 className="text-[22px] font-semibold text-white leading-[1.2] mb-3">
                        Transparent.<br />Immutable.<br />On-chain.
                    </h2>
                    <p className="text-[11px] text-emerald-300/50 leading-relaxed mb-7">
                        Aset waqf diverifikasi dan dicatat permanen<br />di Ethereum Sepolia testnet.
                    </p>
                    <div className="space-y-3.5">
                        {FEATURES.map(f => (
                            <div key={f.title} className="flex items-start gap-3">
                                <div className="w-6 h-6 rounded-md bg-emerald-500/15 border border-emerald-500/20 flex items-center justify-center shrink-0 mt-0.5">
                                    <f.icon size={11} className="text-emerald-300" />
                                </div>
                                <div>
                                    <p className="text-[11px] font-medium text-emerald-100 leading-tight">{f.title}</p>
                                    <p className="text-[10px] text-emerald-400/50 mt-0.5 font-mono">{f.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="relative z-10">
                    <Link href="/explorer" className="inline-flex items-center gap-2 bg-emerald-500/15 border border-emerald-500/30 hover:bg-emerald-500/25 transition-colors rounded-lg px-3.5 py-2 text-[11px] font-medium text-emerald-300">
                        <Globe size={12} />
                        Buka Explorer publik
                    </Link>
                    <p className="text-[9px] text-emerald-900 mt-3">© 2025 WaqfChain · Sepolia Testnet</p>
                </div>
            </div>

            <div className="flex-1 lg:w-[70%] relative bg-[#f0fdf8] overflow-hidden">
                <RightBgCanvas />

                <div className="absolute inset-0 flex flex-col">

                    <div className="flex-1 min-h-0 flex items-end justify-center px-8 pb-4">
                        <div className="w-full max-w-[460px] h-full max-h-[260px]">
                            <MosqueScene />
                        </div>
                    </div>

                    <div className="shrink-0 flex justify-center px-8 pb-8">
                        <div className="w-full max-w-[420px] bg-white/95 backdrop-blur-sm rounded-2xl border border-emerald-500/10 shadow-[0_4px_32px_rgba(16,185,129,0.10),0_1px_4px_rgba(0,0,0,0.04)] px-10 py-8">
                            {children}
                        </div>
                    </div>

                </div>
            </div>

        </div>
    )
}