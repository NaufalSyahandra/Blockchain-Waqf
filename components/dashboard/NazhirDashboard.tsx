'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { publicClient, wsClient } from '@/lib/publicClient'
import { parseAbiItem } from 'viem'
import {
    ResponsiveContainer,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
} from 'recharts'

const assetManagedEvent = parseAbiItem(
    'event AssetManaged(uint256 indexed id, string activity)'
)
const benefitDistributedEvent = parseAbiItem(
    'event BenefitDistributed(uint256 indexed id, address indexed to, string description)'
)


// ── Tooltip ──────────────────────────────────────────────────
function ChartTooltip({ active, payload, label }: any) {
    if (!active || !payload?.length) return null
    return (
        <div className="bg-white border border-neutral-200 rounded-lg px-3 py-2 text-[12px] text-neutral-800 shadow-sm">
            <p className="text-neutral-400 mb-0.5">{label}</p>
            <p className="font-medium">{payload[0].value}</p>
        </div>
    )
}

function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
    return (
        <div className={`bg-white border border-neutral-200 rounded-xl p-5 ${className}`}>
            {children}
        </div>
    )
}

function LogItem({ label, sub, accent = false }: { label: string; sub: string; accent?: boolean }) {
    return (
        <div className="flex items-start gap-2.5 py-2 border-b border-neutral-100 last:border-none">
            <div className={`w-2 h-2 rounded-full mt-1 shrink-0 ${accent ? 'bg-blue-400' : 'bg-green-500'}`} />
            <div>
                <p className="text-[12px] text-neutral-700">{label}</p>
                <p className="text-[11px] text-neutral-400 font-mono mt-0.5">{sub}</p>
            </div>
        </div>
    )
}

function RegistryBar({ name, value, max }: { name: string; value: number; max: number }) {
    const pct = max > 0 ? Math.round((value / max) * 100) : 0
    return (
        <div className="flex items-center gap-2 py-1.5">
            <span className="text-[11px] text-neutral-500 font-mono w-16 shrink-0">{name}</span>
            <div className="flex-1 h-[6px] bg-neutral-100 rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: '#22c55e' }} />
            </div>
            <span className="text-[11px] font-medium text-neutral-600 w-4 text-right">{value}</span>
        </div>
    )
}

function StatusBar({ label, value, total, color, labelColor }: {
    label: string; value: number; total: number; color: string; labelColor: string
}) {
    const pct = total > 0 ? Math.round((value / total) * 100) : 0
    return (
        <div className="flex items-center gap-3 py-1.5">
            <span className="text-[12px] w-14 shrink-0 font-medium" style={{ color: labelColor }}>{label}</span>
            <div className="flex-1 h-[6px] bg-neutral-100 rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: color }} />
            </div>
            <span className="text-[12px] font-medium text-neutral-600 w-5 text-right">{value}</span>
        </div>
    )
}

// ── Main ─────────────────────────────────────────────────────
export default function NazhirDashboard() {
    const [assets, setAssets]         = useState<any[]>([])
    const [activities, setActivities] = useState<any[]>([])
    const [benefits, setBenefits]     = useState<any[]>([])

    // Simpan registry address supaya useEffect blockchain
    // tidak re-run setiap assets array berubah
    const registryRef = useRef<`0x${string}` | null>(null)
    const blockchainInitialized = useRef(false)

    // ── 1. Fetch assets dari Supabase (sekali + realtime) ─────
    useEffect(() => {
        const fetchAssets = async () => {
            const { data } = await supabase.from('assets').select('*')
            setAssets(data || [])
        }

        fetchAssets()

        const channel = supabase
            .channel('assets-live')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'assets' }, fetchAssets)
            .subscribe()

        return () => { supabase.removeChannel(channel) }
    }, []) // ← hanya sekali mount

    // ── 2. Init blockchain — hanya sekali setelah registry address tersedia ──
    useEffect(() => {
        if (!assets.length || blockchainInitialized.current) return

        const registry = assets[0]?.registry_address as `0x${string}`
        if (!registry) return

        registryRef.current = registry
        blockchainInitialized.current = true

        // Fetch historical logs dengan chunking 10 block (limit Alchemy free tier)
        const fetchLogs = async () => {
            try {
                const latest = await publicClient.getBlockNumber()

                const from   = latest - BigInt(100) > BigInt(0) ? latest - BigInt(100) : BigInt(0)
                const STEP   = BigInt(10)  // Alchemy free tier max 10 blocks per request

                let allActs: any[] = []
                let allBens: any[] = []

                for (let start = from; start <= latest; start += STEP) {
                    const end = start + STEP - BigInt(1) > latest ? latest : start + STEP - BigInt(1)
                    try {
                        const [acts, bens] = await Promise.all([
                            publicClient.getLogs({
                                address: registry,
                                event: assetManagedEvent,
                                fromBlock: start,
                                toBlock: end,
                            }),
                            publicClient.getLogs({
                                address: registry,
                                event: benefitDistributedEvent,
                                fromBlock: start,
                                toBlock: end,
                            }),
                        ])
                        allActs = [...allActs, ...acts]
                        allBens = [...allBens, ...bens]
                    } catch {
                        // skip chunk error
                    }
                }

                setActivities(allActs)
                setBenefits(allBens)
            } catch (err) {
                console.error('[fetchLogs]', err)
            }
        }

        fetchLogs()

        // ── Live events via WebSocket (tidak spam HTTP) ───────
        const unwatchAct = wsClient.watchEvent({
            address: registry,
            event: assetManagedEvent,
            onLogs: (logs) => setActivities(prev => [...logs, ...prev]),
        })
        const unwatchBen = wsClient.watchEvent({
            address: registry,
            event: benefitDistributedEvent,
            onLogs: (logs) => setBenefits(prev => [...logs, ...prev]),
        })

        return () => { unwatchAct?.(); unwatchBen?.() }
    }, [assets]) // assets sebagai trigger tapi blockchainInitialized.current mencegah re-run

    const approved = assets.filter(a => a.status === 'approved').length
    const pending  = assets.filter(a => a.status === 'pending').length
    const rejected = assets.filter(a => a.status === 'rejected').length

    const growthData = useMemo(() => {
        const map: Record<string, number> = {}
        assets.forEach(a => {
            const d = new Date(a.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })
            map[d] = (map[d] || 0) + 1
        })
        return Object.entries(map).map(([date, total]) => ({ date, total }))
    }, [assets])

    const registryData = useMemo(() => {
        const map: Record<string, number> = {}
        assets.forEach(a => {
            if (!a.registry_address) return
            map[a.registry_address] = (map[a.registry_address] || 0) + 1
        })
        return Object.entries(map)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([addr, total]) => ({ name: addr.slice(0, 6) + '…', total }))
    }, [assets])

    const maxRegistry = Math.max(...registryData.map(r => r.total), 1)

    const mergedFeed = useMemo(() => {
        const acts = activities.map(log => ({
            type: 'activity' as const,
            label: `Activity · Asset #${log.args.id?.toString()}`,
            sub: log.transactionHash?.slice(0, 14) + '…',
            blockNumber: log.blockNumber,
        }))
        const bens = benefits.map(log => ({
            type: 'benefit' as const,
            label: `Benefit → ${log.args.to?.slice(0, 10)}…`,
            sub: log.transactionHash?.slice(0, 14) + '…',
            blockNumber: log.blockNumber,
        }))
        return [...acts, ...bens]
            .sort((a, b) => Number((b.blockNumber ?? 0n) - (a.blockNumber ?? 0n)))
            .slice(0, 20)
    }, [activities, benefits])

    useEffect(() => {
        if (!assets.length) return
        const registry = assets[0]?.registry_address
        console.log('registry_address:', registry)
        console.log('semua:', assets.map(a => a.registry_address))
    }, [assets])

    return (
        <div className="grid grid-cols-2 gap-4">

            <Card>
                <p className="text-[11px] text-neutral-400 mb-1">Total Assets</p>
                <p className="text-[52px] font-bold text-neutral-900 leading-none mb-1">{assets.length}</p>
                <p className="text-[12px] text-neutral-400 mb-4">Registered waqf assets across all registries</p>
                <div className="grid grid-cols-3 border-t border-neutral-100 pt-3 gap-0">
                    {[
                        { label: 'Approved', value: approved, color: '#16a34a' },
                        { label: 'Pending',  value: pending,  color: '#d97706' },
                        { label: 'Rejected', value: rejected, color: '#dc2626' },
                    ].map((s, i) => (
                        <div key={s.label} className={i > 0 ? 'pl-4 border-l border-neutral-100' : ''}>
                            <p className="text-[10px] text-neutral-400 mb-1">{s.label}</p>
                            <p className="text-[22px] font-bold leading-none" style={{ color: s.color }}>{s.value}</p>
                        </div>
                    ))}
                </div>
            </Card>

            <Card>
                <p className="text-[13px] font-semibold text-neutral-800 mb-3">On-chain Activity</p>
                <div className="grid grid-cols-2 gap-3 mb-4">
                    {[
                        { label: 'Activities',    value: activities.length },
                        { label: 'Distributions', value: benefits.length },
                    ].map(m => (
                        <div key={m.label} className="bg-neutral-50 rounded-lg px-3 py-2.5">
                            <p className="text-[10px] text-neutral-400 mb-1">{m.label}</p>
                            <p className="text-[28px] font-bold leading-none text-neutral-900">{m.value}</p>
                        </div>
                    ))}
                </div>
                <div className="flex items-center gap-2 pt-3 border-t border-neutral-100">
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-[12px] font-medium text-green-600">Live</span>
                    <span className="text-[12px] text-neutral-400">Sepolia testnet</span>
                </div>
            </Card>

            <Card>
                <p className="text-[13px] font-semibold text-neutral-800 mb-4">Asset Growth</p>
                <ResponsiveContainer width="100%" height={180}>
                    <BarChart data={growthData} barSize={12}>
                        <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#a3a3a3' }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 11, fill: '#a3a3a3' }} axisLine={false} tickLine={false} width={20} />
                        <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(0,0,0,0.03)' }} />
                        <Bar dataKey="total" fill="#22c55e" radius={[2, 2, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </Card>

            <Card>
                <p className="text-[13px] font-semibold text-neutral-800 mb-4">Status Breakdown</p>
                <StatusBar label="Approved" value={approved} total={assets.length} color="#22c55e" labelColor="#16a34a" />
                <StatusBar label="Pending"  value={pending}  total={assets.length} color="#f59e0b" labelColor="#d97706" />
                <StatusBar label="Rejected" value={rejected} total={assets.length} color="#ef4444" labelColor="#dc2626" />
            </Card>

            <div className="col-span-2 grid grid-cols-3 gap-4">

                <Card>
                    <p className="text-[13px] font-semibold text-neutral-800 mb-3">Blockchain Activity</p>
                    <div className="max-h-56 overflow-y-auto">
                        {mergedFeed.length === 0 && <p className="text-[12px] text-neutral-400">No activity yet</p>}
                        {mergedFeed.map((item, i) => (
                            <LogItem key={i} accent={item.type === 'benefit'} label={item.label} sub={item.sub} />
                        ))}
                    </div>
                </Card>

                <Card>
                    <p className="text-[13px] font-semibold text-neutral-800 mb-3">Top Registries</p>
                    {registryData.length === 0 && <p className="text-[12px] text-neutral-400">No data yet</p>}
                    {registryData.map((r, i) => (
                        <RegistryBar key={i} name={r.name} value={r.total} max={maxRegistry} />
                    ))}
                </Card>

                <Card>
                    <p className="text-[13px] font-semibold text-neutral-800 mb-3">Benefit Distribution</p>
                    <div className="max-h-56 overflow-y-auto">
                        {benefits.length === 0 && <p className="text-[12px] text-neutral-400">No distributions yet</p>}
                        {benefits.slice(0, 20).map((log, i) => (
                            <LogItem
                                key={i} accent
                                label={`Asset #${log.args.id?.toString()} → ${log.args.to?.slice(0, 10)}…`}
                                sub={`Tx: ${log.transactionHash?.slice(0, 14)}…`}
                            />
                        ))}
                    </div>
                </Card>

            </div>
        </div>
    )
}