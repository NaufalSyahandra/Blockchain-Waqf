'use client'

import { useEffect, useMemo, useState, Fragment } from 'react'
import { supabase } from '@/lib/supabase'
import { useUser } from '@/hooks/useUser'

import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
    CheckCircle2, Clock, XCircle, ExternalLink,
    ArrowDownRight, Inbox, FileCheck2, Building2, ChevronDown, ChevronRight, Zap,
} from 'lucide-react'

// ── Types ─────────────────────────────────────────────────
type Distribution = {
    id: string
    amount: number
    description: string
    created_at: string
}

type Activity = {
    id: string
    action: string
    description: string
    actor_id: string
    actor_name?: string
    created_at: string
}

type Asset = {
    id: string
    name: string
    asset_type: string
    value: number
    status: 'pending' | 'approved' | 'rejected'
    tx_hash: string | null
    block_number?: number | null
    created_at: string
    nazhir_name?: string
    registry_address: string
    registry_name?: string
    distributions: Distribution[]
    activities: Activity[]
}

// ── Config ────────────────────────────────────────────────
const STATUS_CONFIG = {
    approved: {
        label: 'Disetujui',
        Icon: CheckCircle2,
        badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-50',
    },
    pending: {
        label: 'Menunggu',
        Icon: Clock,
        badgeClass: 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-50',
    },
    rejected: {
        label: 'Ditolak',
        Icon: XCircle,
        badgeClass: 'bg-red-50 text-red-600 border-red-200 hover:bg-red-50',
    },
}

// ── Helpers ───────────────────────────────────────────────
const truncateHash = (h: string) => `${h.slice(0, 6)}…${h.slice(-6)}`
const formatRupiah = (v: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(v)
const formatDateShort = (d: string) =>
    new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })

// ── Skeleton ──────────────────────────────────────────────
function TableSkeleton() {
    return (
        <div className="bg-white rounded-xl border border-neutral-200/80 shadow-sm p-4 space-y-3">
            {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-5 w-20 rounded-full" />
                    <Skeleton className="h-4 w-28 ml-auto" />
                </div>
            ))}
        </div>
    )
}

// ── Main ──────────────────────────────────────────────────
export default function WakifHistory() {
    const { user } = useUser()
    const [assets, setAssets]     = useState<Asset[]>([])
    const [loading, setLoading]   = useState(true)
    const [expandedId, setExpandedId] = useState<string | null>(null)

    const [registryFilter, setRegistryFilter] = useState<string>('all')
    const [statusFilter, setStatusFilter]     = useState<string>('all')

    useEffect(() => {
        if (user) fetchData()
    }, [user])

    const fetchData = async () => {
        setLoading(true)

        const { data: assetsData } = await supabase
            .from('assets')
            .select(`*, distributions (*)`)
            .eq('wakif_id', user!.id)
            .order('created_at', { ascending: false })

        const assetIds  = (assetsData || []).map(a => a.id)
        const addresses = [...new Set((assetsData || []).map(a => a.registry_address).filter(Boolean))]

        // ── ambil nama registry (bukan FK resmi, jadi query terpisah) ──
        let registryMap: Record<string, string> = {}
        if (addresses.length > 0) {
            const { data: registriesData } = await supabase
                .from('registries')
                .select('registry_address, name')
                .in('registry_address', addresses)

            registryMap = Object.fromEntries(
                (registriesData || []).map(r => [r.registry_address, r.name])
            )
        }

        // ── ambil activities untuk semua asset sekaligus ──
        const activitiesByAsset: Record<string, Activity[]> = {}
        if (assetIds.length > 0) {
            const { data: activitiesData } = await supabase
                .from('activities')
                .select('id, asset_id, action, description, actor_id, created_at, users:actor_id (email, role)')
                .in('asset_id', assetIds)
                .order('created_at', { ascending: false })

            const activityList: Activity[] = (activitiesData || []).map((act: any) => ({
                id: act.id,
                action: act.action,
                description: act.description,
                actor_id: act.actor_id,
                actor_name: act.users?.email ?? 'Nazhir',
                created_at: act.created_at,
                asset_id: act.asset_id, // dipakai buat grouping di bawah
            }))

            activityList.forEach((entry: any) => {
                if (!activitiesByAsset[entry.asset_id]) activitiesByAsset[entry.asset_id] = []
                activitiesByAsset[entry.asset_id].push(entry)
            })
        }

        const merged = (assetsData || []).map(a => ({
            ...a,
            registry_name: registryMap[a.registry_address] || 'Registry tidak dikenal',
            activities: activitiesByAsset[a.id] || [],
        }))

        setAssets(merged as Asset[])
        setLoading(false)
    }

    const registryOptions = useMemo(() => {
        const map = new Map<string, string>()
        assets.forEach(a => map.set(a.registry_address, a.registry_name || 'Registry tidak dikenal'))
        return Array.from(map, ([address, name]) => ({ address, name }))
    }, [assets])

    const filteredAssets = useMemo(() => {
        return assets.filter(a => {
            const matchRegistry = registryFilter === 'all' || a.registry_address === registryFilter
            const matchStatus   = statusFilter === 'all' || a.status === statusFilter
            return matchRegistry && matchStatus
        })
    }, [assets, registryFilter, statusFilter])

    const approvedCount   = assets.filter(a => a.status === 'approved').length
    const registriesUsed  = registryOptions.length
    const totalActivities = assets.reduce((sum, a) => sum + (a.activities?.length ?? 0), 0)

    return (
        <TooltipProvider>
            <div className="min-h-screen bg-neutral-50/50 p-6 sm:p-8">
                <div className="space-y-6 max-w-6xl mx-auto">

                    {/* ── Header ── */}
                    <div>
                        <p className="text-[11px] font-semibold tracking-widest uppercase text-neutral-400 mb-1">
                            Wakif · Audit Trail
                        </p>
                        <h1 className="text-2xl font-bold text-neutral-900 tracking-tight">Riwayat Waqf</h1>
                        <p className="text-sm text-neutral-500 mt-0.5">
                            Kronologi lengkap aset, aktivitas &amp; distribusi on-chain
                        </p>
                    </div>

                    {/* ── Summary strip ── */}
                    {!loading && assets.length > 0 && (
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                            {[
                                {
                                    label: 'Aset terdaftar',
                                    value: `${assets.length} aset`,
                                    sub: `${approvedCount} on-chain`,
                                    Icon: FileCheck2,
                                },
                                {
                                    label: 'Registry digunakan',
                                    value: `${registriesUsed} registry`,
                                    sub: 'nazhir berbeda',
                                    Icon: Building2,
                                },
                                {
                                    label: 'Total aktivitas',
                                    value: `${totalActivities}x`,
                                    sub: 'dicatat nazhir',
                                    Icon: Zap,
                                },
                                {
                                    label: 'Total distribusi',
                                    value: `${assets.reduce((sum, a) => sum + (a.distributions?.length ?? 0), 0)}x`,
                                    sub: 'transaksi penyaluran',
                                    Icon: ArrowDownRight,
                                },
                            ].map(s => (
                                <div
                                    key={s.label}
                                    className="bg-white rounded-xl p-4 border border-neutral-200/80 shadow-sm flex flex-col justify-between"
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <p className="text-[10px] font-medium text-neutral-400 uppercase tracking-wider">
                                            {s.label}
                                        </p>
                                        <s.Icon size={16} className="text-neutral-400 shrink-0" />
                                    </div>
                                    <div>
                                        <p className="text-lg font-bold text-neutral-900">{s.value}</p>
                                        <p className="text-xs text-neutral-400 mt-0.5">{s.sub}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* ── Filter bar ── */}
                    {!loading && assets.length > 0 && (
                        <div className="flex flex-wrap items-center gap-3 bg-white p-3 rounded-xl border border-neutral-200/80 shadow-sm">
                            <span className="text-xs font-medium text-neutral-400 uppercase tracking-wider pl-1">
                                Filter
                            </span>

                            <Select value={registryFilter} onValueChange={setRegistryFilter}>
                                <SelectTrigger className="w-[220px] h-8 text-xs">
                                    <div className="flex items-center gap-1.5">
                                        <Building2 size={12} className="text-neutral-400" />
                                        <SelectValue placeholder="Semua registry" />
                                    </div>
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Semua registry</SelectItem>
                                    {registryOptions.map(r => (
                                        <SelectItem key={r.address} value={r.address}>
                                            {r.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger className="w-[160px] h-8 text-xs">
                                    <SelectValue placeholder="Semua status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Semua status</SelectItem>
                                    <SelectItem value="approved">Disetujui</SelectItem>
                                    <SelectItem value="pending">Menunggu</SelectItem>
                                    <SelectItem value="rejected">Ditolak</SelectItem>
                                </SelectContent>
                            </Select>

                            {(registryFilter !== 'all' || statusFilter !== 'all') && (
                                <button
                                    onClick={() => { setRegistryFilter('all'); setStatusFilter('all') }}
                                    className="text-xs font-medium text-neutral-400 hover:text-emerald-600 transition-colors"
                                >
                                    Reset filter
                                </button>
                            )}

                            <span className="text-xs text-neutral-400 ml-auto">
                                Menampilkan {filteredAssets.length} dari {assets.length} aset
                            </span>
                        </div>
                    )}

                    <Separator className="bg-neutral-200/60" />

                    {/* ── Table ── */}
                    {loading ? (
                        <TableSkeleton />
                    ) : assets.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 text-center bg-white rounded-xl border border-neutral-200/80 shadow-sm">
                            <Inbox size={32} className="text-neutral-300 mb-2" />
                            <p className="text-sm text-neutral-500 font-medium">Belum ada aset waqf terdaftar.</p>
                        </div>
                    ) : filteredAssets.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 text-center bg-white rounded-xl border border-neutral-200/80 shadow-sm">
                            <Inbox size={32} className="text-neutral-300 mb-2" />
                            <p className="text-sm text-neutral-500 font-medium">Tidak ada aset yang cocok dengan filter ini.</p>
                        </div>
                    ) : (
                        <div className="bg-white rounded-xl border border-neutral-200/80 shadow-sm overflow-hidden">
                            <Table>
                                <TableHeader>
                                    <TableRow className="hover:bg-transparent border-neutral-200">
                                        <TableHead className="w-8" />
                                        <TableHead className="text-xs font-medium text-neutral-400 uppercase tracking-wide">Nama Aset</TableHead>
                                        <TableHead className="text-xs font-medium text-neutral-400 uppercase tracking-wide">Registry</TableHead>
                                        <TableHead className="text-xs font-medium text-neutral-400 uppercase tracking-wide">Status</TableHead>
                                        <TableHead className="text-xs font-medium text-neutral-400 uppercase tracking-wide">Tx Hash</TableHead>
                                        <TableHead className="text-xs font-medium text-neutral-400 uppercase tracking-wide">Tanggal</TableHead>
                                        <TableHead className="text-xs font-medium text-neutral-400 uppercase tracking-wide text-right">Aktivitas</TableHead>
                                        <TableHead className="text-xs font-medium text-neutral-400 uppercase tracking-wide text-right">Distribusi</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredAssets.map(asset => {
                                        const cfg = STATUS_CONFIG[asset.status] ?? STATUS_CONFIG.pending
                                        const { Icon } = cfg
                                        const hasDistributions = asset.distributions?.length > 0
                                        const hasActivities    = asset.activities?.length > 0
                                        const hasDetails       = hasDistributions || hasActivities
                                        const isExpanded        = expandedId === asset.id

                                        return (
                                            <Fragment key={asset.id}>
                                                <TableRow
                                                    className={`border-neutral-100 ${hasDetails ? 'cursor-pointer hover:bg-neutral-50/80' : ''}`}
                                                    onClick={() => hasDetails && setExpandedId(isExpanded ? null : asset.id)}
                                                >
                                                    <TableCell className="py-3">
                                                        {hasDetails && (
                                                            isExpanded
                                                                ? <ChevronDown size={14} className="text-neutral-400" />
                                                                : <ChevronRight size={14} className="text-neutral-400" />
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="py-3">
                                                        <p className="font-medium text-sm text-neutral-900">{asset.name}</p>
                                                        <div className="flex items-center gap-1.5 mt-0.5">
                                                            <span className="text-[11px] text-neutral-400 capitalize">{asset.asset_type}</span>
                                                            {asset.value > 0 && (
                                                                <>
                                                                    <span className="text-neutral-300 text-[10px]">·</span>
                                                                    <span className="text-[11px] font-semibold text-neutral-600">{formatRupiah(asset.value)}</span>
                                                                </>
                                                            )}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="py-3">
                                                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">
                                                            <Building2 size={10} />
                                                            {asset.registry_name}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell className="py-3">
                                                        <Badge
                                                            variant="outline"
                                                            className={`text-[11px] font-medium rounded-full flex items-center gap-1 px-2 py-0.5 border w-fit ${cfg.badgeClass}`}
                                                        >
                                                            <Icon size={10} />
                                                            {cfg.label}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="py-3" onClick={(e) => e.stopPropagation()}>
                                                        {asset.tx_hash ? (
                                                            <Tooltip>
                                                                <TooltipTrigger asChild>
                                                                    <a
                                                                        href={`https://sepolia.etherscan.io/tx/${asset.tx_hash}`}
                                                                        target="_blank"
                                                                        rel="noopener noreferrer"
                                                                        className="font-mono text-xs text-neutral-400 hover:text-emerald-600 transition-colors inline-flex items-center gap-1"
                                                                    >
                                                                        {truncateHash(asset.tx_hash)}
                                                                        <ExternalLink size={10} />
                                                                    </a>
                                                                </TooltipTrigger>
                                                                <TooltipContent className="font-mono text-xs">
                                                                    {asset.tx_hash}
                                                                </TooltipContent>
                                                            </Tooltip>
                                                        ) : (
                                                            <span className="font-mono text-xs text-neutral-300 italic">pending...</span>
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="py-3 text-xs text-neutral-500">
                                                        {formatDateShort(asset.created_at)}
                                                    </TableCell>
                                                    <TableCell className="py-3 text-right">
                                                        {hasActivities ? (
                                                            <span className="text-xs font-semibold text-neutral-700">
                                                                {asset.activities.length}x
                                                            </span>
                                                        ) : (
                                                            <span className="text-xs text-neutral-300">—</span>
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="py-3 text-right">
                                                        {hasDistributions ? (
                                                            <span className="text-xs font-semibold text-emerald-600">
                                                                {asset.distributions.length}x
                                                            </span>
                                                        ) : (
                                                            <span className="text-xs text-neutral-300">—</span>
                                                        )}
                                                    </TableCell>
                                                </TableRow>

                                                {isExpanded && hasDetails && (
                                                    <TableRow className="border-neutral-100 bg-neutral-50/40 hover:bg-neutral-50/40">
                                                        <TableCell />
                                                        <TableCell colSpan={7} className="py-4 pl-4">
                                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-4xl">

                                                                {/* ── Riwayat Aktivitas ── */}
                                                                {hasActivities && (
                                                                    <div className="space-y-1.5">
                                                                        <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                                                                            <Zap size={11} className="text-neutral-500" />
                                                                            Riwayat Aktivitas
                                                                        </p>
                                                                        {asset.activities.map(act => (
                                                                            <div
                                                                                key={act.id}
                                                                                className="flex items-center justify-between text-xs px-3 py-2 rounded-lg bg-white border border-neutral-200/80 shadow-sm"
                                                                            >
                                                                                <div className="flex items-center gap-2 min-w-0">
                                                                                    <span className="w-1.5 h-1.5 rounded-full bg-neutral-400 shrink-0" />
                                                                                    <span className="text-neutral-700 truncate">{act.description}</span>
                                                                                </div>
                                                                                <span className="text-neutral-400 shrink-0 ml-4">
                                                                                    {formatDateShort(act.created_at)}
                                                                                </span>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                )}

                                                                {/* ── Riwayat Distribusi ── */}
                                                                {hasDistributions && (
                                                                    <div className="space-y-1.5">
                                                                        <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                                                                            <ArrowDownRight size={11} className="text-emerald-500" />
                                                                            Riwayat Distribusi
                                                                        </p>
                                                                        {asset.distributions.map(d => (
                                                                            <div
                                                                                key={d.id}
                                                                                className="flex items-center justify-between text-xs px-3 py-2 rounded-lg bg-white border border-neutral-200/80 shadow-sm"
                                                                            >
                                                                                <div className="flex items-center gap-2 min-w-0">
                                                                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                                                                                    <span className="text-neutral-700 truncate">{d.description}</span>
                                                                                </div>
                                                                                <span className="text-neutral-400 shrink-0 ml-4">
                                                                                    {formatDateShort(d.created_at)}
                                                                                </span>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </TableCell>
                                                    </TableRow>
                                                )}
                                            </Fragment>
                                        )
                                    })}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </div>
            </div>
        </TooltipProvider>
    )
}