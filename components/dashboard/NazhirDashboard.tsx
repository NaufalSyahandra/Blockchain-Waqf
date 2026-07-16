'use client'

import { useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useUser } from '@/hooks/useUser'
import {
    ResponsiveContainer,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
} from 'recharts'
import { Building2, CheckCircle2, Clock, XCircle, TrendingUp, Layers, ExternalLink } from 'lucide-react'

// ── Tooltip ──────────────────────────────────────────────────
function ChartTooltip({ active, payload, label }: any) {
    if (!active || !payload?.length) return null
    return (
        <div className="bg-white border border-neutral-200 rounded-lg px-3 py-2 text-[12px] text-neutral-800 shadow-md">
            <p className="text-neutral-400 mb-0.5">{label}</p>
            <p className="font-medium">{payload[0].value} aset</p>
        </div>
    )
}

function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
    return (
        <div className={`bg-white border border-neutral-200 rounded-2xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)] ${className}`}>
            {children}
        </div>
    )
}

function StatPill({ icon: Icon, label, value, color, bg }: any) {
    return (
        <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${bg}`}>
                <Icon size={16} className={color} />
            </div>
            <div className="min-w-0">
                <p className="text-[10px] text-neutral-400 mb-0.5 truncate">{label}</p>
                <p className="text-[20px] font-bold text-neutral-900 leading-none">{value}</p>
            </div>
        </div>
    )
}

function truncateAddress(addr: string) {
    if (!addr) return '—'
    return `${addr.slice(0, 8)}…${addr.slice(-6)}`
}

// ── Block explorer base URL per network ──
const EXPLORER_BASE: Record<string, string> = {
    sepolia: 'https://sepolia.etherscan.io/address',
    mainnet: 'https://etherscan.io/address',
    ethereum: 'https://etherscan.io/address',
    polygon: 'https://polygonscan.com/address',
    'polygon-amoy': 'https://amoy.polygonscan.com/address',
    base: 'https://basescan.org/address',
    'base-sepolia': 'https://sepolia.basescan.org/address',
}

function getExplorerUrl(network: string, address: string) {
    const key = (network || 'sepolia').toLowerCase()
    const base = EXPLORER_BASE[key] || EXPLORER_BASE.sepolia
    return `${base}/${address}`
}

// ── Main ─────────────────────────────────────────────────────
export default function NazhirDashboard() {
    const { user } = useUser()
    const [assets, setAssets] = useState<any[]>([])
    const [registries, setRegistries] = useState<any[]>([])

    // ── Fetch assets & registries dari Supabase (sekali + realtime) ─────
    useEffect(() => {
        const fetchAssets = async () => {
            const { data } = await supabase.from('assets').select('*')
            setAssets(data || [])
        }

        const fetchRegistries = async () => {
            if (!user) return
            const { data } = await supabase
                .from('registries')
                .select('*')
                .eq('nazhir_id', user.id)
                .order('created_at', { ascending: false })
            setRegistries(data || [])
        }

        fetchAssets()
        fetchRegistries()

        const channel = supabase
            .channel('assets-live')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'assets' }, fetchAssets)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'registries' }, fetchRegistries)
            .subscribe()

        return () => { supabase.removeChannel(channel) }
    }, [user])

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

    // ── Semua registry milik nazhir (termasuk yang belum punya aset),
    //    digabung dengan jumlah & breakdown status asetnya ──
    const registryData = useMemo(() => {
        type Counts = { total: number; approved: number; pending: number; rejected: number }
        const countMap: Record<string, Counts> = {}

        assets.forEach(a => {
            if (!a.registry_address) return
            if (!countMap[a.registry_address]) {
                countMap[a.registry_address] = { total: 0, approved: 0, pending: 0, rejected: 0 }
            }
            countMap[a.registry_address].total += 1
            if (a.status === 'approved') countMap[a.registry_address].approved += 1
            if (a.status === 'pending') countMap[a.registry_address].pending += 1
            if (a.status === 'rejected') countMap[a.registry_address].rejected += 1
        })

        // Sumber utama tetap tabel `registries`, supaya registry yang belum
        // punya aset (0) tetap tampil di tabel, bukan cuma yang ada di `assets`.
        const registryAddresses = new Set(registries.map(r => r.registry_address))

        const fromRegistries = registries.map(r => ({
            address: r.registry_address,
            name: r.name as string | null,
            network: r.network || 'sepolia',
            ...(countMap[r.registry_address] || { total: 0, approved: 0, pending: 0, rejected: 0 }),
        }))

        // Aset yang registry_address-nya TIDAK cocok dengan registry manapun
        // milik user ini (data yatim / kemungkinan bug) tetap ditampilkan,
        // supaya kelihatan kalau ada ketidaksesuaian data.
        const orphaned = Object.entries(countMap)
            .filter(([addr]) => !registryAddresses.has(addr))
            .map(([addr, c]) => ({
                address: addr,
                name: null,
                network: 'unknown',
                ...c,
            }))

        return [...fromRegistries, ...orphaned].sort((a, b) => b.total - a.total)
    }, [assets, registries])

    const orphanedCount = registryData.filter(r => r.name === null).length

    return (
        <div className="space-y-4">

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* ── Total Assets + breakdown ── */}
                <Card className="lg:col-span-1">
                    <p className="text-[11px] text-neutral-400 mb-1">Total Assets</p>
                    <p className="text-[48px] font-bold text-neutral-900 leading-none mb-1">{assets.length}</p>
                    <p className="text-[12px] text-neutral-400 mb-4">Registered waqf assets across all registries</p>
                    <div className="grid grid-cols-3 border-t border-neutral-100 pt-4 gap-2">
                        <StatPill icon={CheckCircle2} label="Approved" value={approved} color="text-emerald-600" bg="bg-emerald-50" />
                        <StatPill icon={Clock} label="Pending" value={pending} color="text-amber-600" bg="bg-amber-50" />
                        <StatPill icon={XCircle} label="Rejected" value={rejected} color="text-red-600" bg="bg-red-50" />
                    </div>
                </Card>

                {/* ── Asset Growth ── */}
                <Card className="lg:col-span-2">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <TrendingUp size={14} className="text-emerald-600" />
                            <p className="text-[13px] font-semibold text-neutral-800">Asset Growth</p>
                        </div>
                        <span className="text-[11px] text-neutral-400">last {growthData.length} days</span>
                    </div>
                    <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={growthData} barSize={12}>
                            <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#a3a3a3' }} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fontSize: 11, fill: '#a3a3a3' }} axisLine={false} tickLine={false} width={20} allowDecimals={false} />
                            <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(0,0,0,0.03)' }} />
                            <Bar dataKey="total" fill="#22c55e" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </Card>
            </div>

            {/* ── Tabel Registry ── */}
            <Card>
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <Building2 size={14} className="text-neutral-700" />
                        <p className="text-[13px] font-semibold text-neutral-800">Registry yang Telah Dibuat</p>
                    </div>
                    <div className="flex items-center gap-3">
                        {orphanedCount > 0 && (
                            <span className="text-[10.5px] font-medium text-amber-600 bg-amber-50 border border-amber-200 rounded-full px-2 py-0.5">
                                {orphanedCount} aset tidak cocok registry
                            </span>
                        )}
                        <span className="text-[11px] text-neutral-400">{registryData.length} registry</span>
                    </div>
                </div>

                {registryData.length === 0 ? (
                    <div className="text-center py-8">
                        <p className="text-[13px] text-neutral-400">Belum ada registry yang terdaftar</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto -mx-5 -mb-5">
                        <table className="w-full text-left border-collapse min-w-[800px]">
                            <thead>
                            <tr className="border-b border-neutral-100 bg-neutral-50/50">
                                <th className="py-3 px-5 text-[11px] font-semibold uppercase tracking-wider text-neutral-400 w-12 text-center">No</th>
                                <th className="py-3 px-4 text-[11px] font-semibold uppercase tracking-wider text-neutral-400 min-w-[180px]">Nama Lembaga</th>
                                <th className="py-3 px-4 text-[11px] font-semibold uppercase tracking-wider text-neutral-400 min-w-[160px]">Registry Address</th>
                                <th className="py-3 px-4 text-[11px] font-semibold uppercase tracking-wider text-neutral-500 text-center w-24">Approved</th>
                                <th className="py-3 px-4 text-[11px] font-semibold uppercase tracking-wider text-neutral-500 text-center w-24">Pending</th>
                                <th className="py-3 px-4 text-[11px] font-semibold uppercase tracking-wider text-neutral-500 text-center w-24">Rejected</th>
                                <th className="py-3 px-5 text-[11px] font-bold uppercase tracking-wider text-neutral-900 text-center w-28 bg-neutral-50/30">Total Aset</th>
                            </tr>
                            </thead>
                            <tbody>
                            {registryData.map((r, i) => (
                                <tr key={r.address} className="border-b border-neutral-100 last:border-none hover:bg-neutral-50/60 transition-colors group">
                                    <td className="py-3.5 px-5 text-[12px] text-neutral-400 text-center font-medium">{i + 1}</td>
                                    <td className="py-3.5 px-4 text-[12px] font-medium text-neutral-800 whitespace-nowrap capitalize">
                                        {r.name ?? (
                                            <span className="text-amber-600 italic font-normal bg-amber-50 px-2 py-0.5 rounded-md">tidak dikenal</span>
                                        )}
                                    </td>
                                    <td className="py-3.5 px-4 text-[12px] font-mono text-neutral-600 whitespace-nowrap">
                                        {r.address ? (
                                            <a
                                                href={getExplorerUrl(r.network, r.address)}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                onClick={(e) => e.stopPropagation()}
                                                className="inline-flex items-center gap-1.5 hover:text-emerald-600 hover:underline underline-offset-2 transition-colors text-neutral-500 font-medium"
                                                title="Lihat di block explorer"
                                            >
                                                {truncateAddress(r.address)}
                                                <ExternalLink size={12} className="text-neutral-300 group-hover:text-emerald-500 shrink-0 transition-colors" />
                                            </a>
                                        ) : (
                                            '—'
                                        )}
                                    </td>
                                    <td className="py-3.5 px-4 text-[13px] font-semibold text-emerald-600 text-center">{r.approved}</td>
                                    <td className="py-3.5 px-4 text-[13px] font-semibold text-amber-600 text-center">{r.pending}</td>
                                    <td className="py-3.5 px-4 text-[13px] font-semibold text-red-600 text-center">{r.rejected}</td>
                                    <td className="py-3.5 px-5 text-[13px] font-bold text-neutral-900 text-center bg-neutral-50/20">{r.total}</td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </Card>

        </div>
    )
}