'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useUser } from '@/hooks/useUser'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
    CheckCircle2, Clock, XCircle, ExternalLink,
    Wallet, ArrowDownRight, Inbox,
} from 'lucide-react'

// ── Types ─────────────────────────────────────────────────
type Distribution = {
    id: string
    amount: number
    description: string
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
    distributions: Distribution[]
}

// ── Config ────────────────────────────────────────────────
const STATUS_CONFIG = {
    approved: {
        label: 'Disetujui',
        Icon: CheckCircle2,
        dotClass:   'bg-green-50 border-green-500',
        badgeClass: 'bg-green-50 text-green-700 border-green-200 hover:bg-green-50',
        lineClass:  'bg-green-500',
    },
    pending: {
        label: 'Menunggu',
        Icon: Clock,
        dotClass:   'bg-amber-50 border-amber-400',
        badgeClass: 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-50',
        lineClass:  'bg-amber-400',
    },
    rejected: {
        label: 'Ditolak',
        Icon: XCircle,
        dotClass:   'bg-red-50 border-red-500',
        badgeClass: 'bg-red-50 text-red-600 border-red-200 hover:bg-red-50',
        lineClass:  'bg-red-400',
    },
}

// ── Helpers ───────────────────────────────────────────────
const truncateHash = (h: string) => `${h.slice(0, 6)}…${h.slice(-6)}`
const formatRupiah = (v: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(v)
const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
const formatDateShort = (d: string) =>
    new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })

// ── Skeleton ──────────────────────────────────────────────
function TimelineSkeleton() {
    return (
        <div className="relative pl-6 space-y-4 max-w-5xl">
            <div className="absolute left-[11px] top-2 bottom-0 w-px bg-gray-100" />
            {[...Array(3)].map((_, i) => (
                <div key={i} className="relative">
                    <Skeleton className="absolute -left-[19px] top-1 w-3 h-3 rounded-full" />
                    <Skeleton className="h-3 w-32 mb-2" />
                    <Card className="border-gray-200 shadow-none rounded-xl">
                        <CardContent className="p-3 space-y-2">
                            <div className="flex justify-between">
                                <Skeleton className="h-4 w-40" />
                                <Skeleton className="h-5 w-20 rounded-full" />
                            </div>
                            <Skeleton className="h-3 w-48" />
                        </CardContent>
                    </Card>
                </div>
            ))}
        </div>
    )
}

// ── Main ──────────────────────────────────────────────────
export default function WakifHistory() {
    const { user } = useUser()
    const [assets, setAssets]   = useState<Asset[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (user) fetchData()
    }, [user])

    const fetchData = async () => {
        setLoading(true)
        const { data } = await supabase
            .from('assets')
            .select(`*, distributions (*)`)
            .eq('wakif_id', user!.id)
            .order('created_at', { ascending: false })
        setAssets((data as Asset[]) || [])
        setLoading(false)
    }

    const totalDistributions = assets.reduce((sum, a) => sum + (a.distributions?.length ?? 0), 0)
    const totalDistributed   = assets.reduce(
        (sum, a) => sum + (a.distributions?.reduce((s, d) => s + d.amount, 0) ?? 0), 0
    )

    return (
        <TooltipProvider>
            {/* Membatasi max-w-5xl agar konten tidak melebar ekstrem di monitor ultra-wide */}
            <div className="space-y-4 max-w-5xl mx-auto">

                {/* ── Header ── */}
                <div className="flex items-start justify-between">
                    <div>
                        <p className="text-[11px] text-gray-400 mb-0.5">Wakif · Audit Trail</p>
                        <h1 className="text-lg font-semibold text-gray-900 tracking-tight">Riwayat Waqf</h1>
                        <p className="text-xs text-gray-400 mt-0.5">
                            Kronologi lengkap aset &amp; distribusi on-chain
                        </p>
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] text-gray-500 bg-gray-50 border border-gray-200 rounded-full px-2.5 py-1">
                        <Wallet size={10} />
                        <span className="font-mono">{user?.id ? truncateHash(user.id) : '—'}</span>
                        <span className="text-gray-300">·</span>
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
                        <span>Sepolia</span>
                    </div>
                </div>

                {/* ── Summary strip (Lebih Padat) ── */}
                {!loading && assets.length > 0 && (
                    <div className="grid grid-cols-3 gap-3 max-w-3xl">
                        {[
                            {
                                label: 'Aset terdaftar',
                                value: `${assets.length} aset`,
                                sub: `${assets.filter(a => a.status === 'approved').length} on-chain`,
                            },
                            {
                                label: 'Total distribusi',
                                value: `${totalDistributions}x`,
                                sub: 'transaksi keluar',
                            },
                            {
                                label: 'Total didistribusi',
                                value: formatRupiah(totalDistributed),
                                sub: 'dari seluruh aset',
                                mono: true,
                            },
                        ].map(s => (
                            <div key={s.label} className="bg-gray-50 rounded-xl p-3 border border-gray-100 flex flex-col justify-between">
                                <div>
                                    <p className="text-[9px] text-gray-400 uppercase tracking-wider mb-0.5">{s.label}</p>
                                    <p className={`text-[14px] font-semibold text-gray-900 ${s.mono ? 'font-mono text-[12px]' : ''}`}>
                                        {s.value}
                                    </p>
                                </div>
                                <p className="text-[10px] text-gray-400 mt-1">{s.sub}</p>
                            </div>
                        ))}
                    </div>
                )}

                <Separator className="bg-gray-100 my-2" />

                {/* ── Timeline ── */}
                {loading ? (
                    <TimelineSkeleton />
                ) : assets.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                        <Inbox size={28} className="text-gray-200 mb-2" />
                        <p className="text-xs text-gray-400">Belum ada aset waqf terdaftar.</p>
                    </div>
                ) : (
                    <div className="relative pl-6">
                        {/* vertical line */}
                        <div className="absolute left-[9px] top-2 bottom-2 w-px bg-gray-200" />

                        {/* Mengurangi space antar card dari space-y-8 ke space-y-4 */}
                        <div className="space-y-4">
                            {assets.map((asset, idx) => {
                                const cfg = STATUS_CONFIG[asset.status] ?? STATUS_CONFIG.pending
                                const { Icon } = cfg
                                const isLast = idx === assets.length - 1

                                return (
                                    <div key={asset.id} className="relative">

                                        {/* timeline dot (diperkecil sedikit) */}
                                        <div
                                            className={`absolute -left-[20px] top-1 w-[15px] h-[15px] rounded-full border-2 flex items-center justify-center ${cfg.dotClass}`}
                                        >
                                            <Icon size={8} className={
                                                asset.status === 'approved' ? 'text-green-600' :
                                                    asset.status === 'pending'  ? 'text-amber-500' : 'text-red-500'
                                            } />
                                        </div>

                                        {/* date + block */}
                                        <div className="flex items-center gap-2 mb-1.5">
                                            <span className="text-[10px] text-gray-400 font-mono">
                                                {formatDate(asset.created_at)}
                                            </span>
                                            {asset.block_number && (
                                                <>
                                                    <span className="text-gray-200 text-[10px]">·</span>
                                                    <span className="text-[10px] text-gray-400 font-mono">
                                                        block #{asset.block_number.toLocaleString()}
                                                    </span>
                                                </>
                                            )}
                                            {!isLast && (
                                                <span className="text-[9px] text-gray-300 ml-auto">
                                                    #{assets.length - idx}
                                                </span>
                                            )}
                                        </div>

                                        {/* main card (Padding dirapatkan) */}
                                        <Card className="border-gray-200 shadow-none rounded-xl bg-white overflow-hidden max-w-4xl">
                                            {/* top accent */}
                                            <div className={`h-[2px] ${cfg.lineClass}`} />

                                            <CardContent className="p-3.5 space-y-2.5">
                                                {/* title row */}
                                                <div className="flex items-start justify-between gap-3">
                                                    <div>
                                                        <p className="font-semibold text-[13px] text-gray-900 leading-tight">
                                                            {asset.name}
                                                        </p>
                                                        <p className="text-[10px] text-gray-400 mt-0.5 capitalize">
                                                            {asset.asset_type}
                                                        </p>
                                                    </div>
                                                    <Badge
                                                        variant="outline"
                                                        className={`text-[10px] font-medium rounded-full shrink-0 flex items-center gap-1 px-2 py-0.5 ${cfg.badgeClass}`}
                                                    >
                                                        <Icon size={9} />
                                                        {cfg.label}
                                                    </Badge>
                                                </div>

                                                {/* on-chain meta row */}
                                                <div className="flex items-center gap-3 flex-wrap text-[11px]">
                                                    {asset.value > 0 && (
                                                        <span className="text-gray-600 font-medium">
                                                            {formatRupiah(asset.value)}
                                                        </span>
                                                    )}
                                                    {asset.nazhir_name && (
                                                        <>
                                                            <span className="text-gray-200">·</span>
                                                            <span className="text-gray-500">
                                                                {asset.nazhir_name}
                                                            </span>
                                                        </>
                                                    )}
                                                    {asset.tx_hash ? (
                                                        <>
                                                            <span className="text-gray-200">·</span>
                                                            <Tooltip>
                                                                <TooltipTrigger asChild>
                                                                    <a
                                                                        href={`https://sepolia.etherscan.io/tx/${asset.tx_hash}`}
                                                                        target="_blank"
                                                                        rel="noopener noreferrer"
                                                                        className="font-mono text-[10px] text-gray-400 hover:text-green-700 transition-colors inline-flex items-center gap-0.5"
                                                                    >
                                                                        {truncateHash(asset.tx_hash)}
                                                                        <ExternalLink size={9} />
                                                                    </a>
                                                                </TooltipTrigger>
                                                                <TooltipContent className="font-mono text-xs">
                                                                    {asset.tx_hash}
                                                                </TooltipContent>
                                                            </Tooltip>
                                                        </>
                                                    ) : (
                                                        <span className="font-mono text-[10px] text-gray-300 italic">
                                                            awaiting confirmation...
                                                        </span>
                                                    )}
                                                </div>

                                                {/* distributions */}
                                                {asset.distributions?.length > 0 && (
                                                    <>
                                                        <Separator className="bg-gray-100 my-1" />
                                                        <div>
                                                            <p className="text-[9px] text-gray-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                                                                <ArrowDownRight size={10} className="text-blue-400" />
                                                                {asset.distributions.length} distribusi
                                                            </p>
                                                            <ScrollArea className="max-h-32">
                                                                <div className="space-y-1">
                                                                    {asset.distributions.map(d => (
                                                                        <div
                                                                            key={d.id}
                                                                            className="flex items-center justify-between text-[11px] px-2.5 py-1.5 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                                                                        >
                                                                            <div className="flex items-center gap-1.5 min-w-0">
                                                                                <span className="w-1 h-1 rounded-full bg-blue-300 shrink-0" />
                                                                                <span className="text-gray-600 truncate">{d.description}</span>
                                                                            </div>
                                                                            <div className="flex items-center gap-2 shrink-0 ml-3">
                                                                                <span className="font-mono text-green-600 font-medium text-[10px]">
                                                                                    +{formatRupiah(d.amount)}
                                                                                </span>
                                                                                <span className="text-gray-300 text-[9px]">
                                                                                    {formatDateShort(d.created_at)}
                                                                                </span>
                                                                            </div>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </ScrollArea>
                                                        </div>
                                                    </>
                                                )}
                                            </CardContent>
                                        </Card>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                )}
            </div>
        </TooltipProvider>
    )
}