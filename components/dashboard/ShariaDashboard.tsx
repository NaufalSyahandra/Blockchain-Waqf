'use client'

import { useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useUser } from '@/hooks/useUser'
import { useWriteContract, useAccount } from 'wagmi'
import { approveAsset, rejectAsset } from '@/lib/actions/approval'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

import {
    Card, CardContent, CardHeader, CardTitle,
} from '@/components/ui/card'
import { Badge }     from '@/components/ui/badge'
import { Button }    from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Skeleton }  from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import {
    Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from '@/components/ui/tooltip'
import {
    Table, TableBody, TableCell, TableHead,
    TableHeader, TableRow,
} from '@/components/ui/table'
import { ScrollArea } from '@/components/ui/scroll-area'

import {
    ShieldCheck, AlertTriangle, CheckCircle2, XCircle,
    Clock3, Check, X, Loader2, CircleAlert, MapPin,
    ExternalLink, Building2, FileText, PieChart, Box,
} from 'lucide-react'

// ── Types ──────────────────────────────────────────────────
type Asset = {
    id: string
    name: string
    asset_type: string
    status: 'pending' | 'approved' | 'rejected'
    tx_hash: string | null
    onchain_id: string | null
    ipfs_url: string | null
    location: string | null
    value: number | null
    created_at: string
}

// ── Helpers ────────────────────────────────────────────────
const ASSET_ICONS: Record<string, React.ElementType> = {
    property: Building2,
    sukuk:    FileText,
    equity:   PieChart,
}

function getIcon(type?: string): React.ElementType {
    return ASSET_ICONS[type?.toLowerCase() ?? ''] ?? Box
}

function truncateHash(hash: string) {
    return `${hash.slice(0, 6)}…${hash.slice(-4)}`
}

function truncateAddress(addr?: string) {
    if (!addr) return 'Not connected'
    return `${addr.slice(0, 6)}…${addr.slice(-4)}`
}

function formatDate(d: string) {
    return new Date(d).toLocaleDateString('id-ID', {
        day: 'numeric', month: 'short', year: 'numeric',
    })
}

// ── Sub-components ─────────────────────────────────────────
function MetaChip({
                      label, value, ok, link,
                  }: { label: string; value: string; ok: boolean; link?: string }) {
    return (
        <div className="bg-gray-50 rounded-lg px-2.5 py-1.5 border border-gray-100">
            <p className="text-[9px] text-gray-400 uppercase tracking-wider mb-0.5">{label}</p>
            <div className="flex items-center gap-1">
                <span className={cn(
                    'w-1.5 h-1.5 rounded-full shrink-0',
                    ok ? 'bg-green-500' : 'bg-red-400'
                )} />
                {link ? (
                    <a
                        href={link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-mono text-[11px] text-gray-500 hover:text-green-700 transition-colors inline-flex items-center gap-0.5"
                    >
                        {value}
                        <ExternalLink size={9} />
                    </a>
                ) : (
                    <span className={cn(
                        'font-mono text-[11px]',
                        ok ? 'text-gray-600' : 'text-red-400 italic'
                    )}>
                        {value}
                    </span>
                )}
            </div>
        </div>
    )
}

function AssetSkeleton() {
    return (
        <Card className="border-gray-200 shadow-none rounded-xl">
            <CardContent className="p-3.5 space-y-2">
                <div className="flex justify-between items-start">
                    <div className="space-y-1">
                        <Skeleton className="h-4 w-44" />
                        <Skeleton className="h-3 w-28" />
                    </div>
                    <Skeleton className="h-5 w-16 rounded-full" />
                </div>
                <div className="grid grid-cols-4 gap-2">
                    {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-10 rounded-lg" />)}
                </div>
                <div className="flex gap-2">
                    <Skeleton className="h-7 w-20 rounded-lg" />
                    <Skeleton className="h-7 w-14 rounded-lg" />
                </div>
            </CardContent>
        </Card>
    )
}

// ── Main ───────────────────────────────────────────────────
export default function ShariaDashboard() {
    const { user, loading }           = useUser()
    const { isConnected, address }    = useAccount()
    const { writeContractAsync }      = useWriteContract()

    const [assets, setAssets]         = useState<Asset[]>([])
    const [fetching, setFetching]     = useState(true)
    const [processingId, setProcessingId] = useState<string | null>(null)
    const [sessionStats, setSessionStats] = useState({ approved: 0, rejected: 0 })

    useEffect(() => {
        fetchData()
        const channel = supabase
            .channel('sharia-assets')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'assets' }, fetchData)
            .subscribe()
        return () => { supabase.removeChannel(channel) }
    }, [])

    const fetchData = async () => {
        setFetching(true)
        const { data } = await supabase
            .from('assets')
            .select('*')
            .order('created_at', { ascending: false })
        setAssets((data as Asset[]) || [])
        setFetching(false)
    }

    // ── Derived ────────────────────────────────────────────
    const pending  = assets.filter(a => a.status === 'pending')
    const approved = assets.filter(a => a.status === 'approved')
    const rejected = assets.filter(a => a.status === 'rejected')
    const verified = assets.filter(a => a.tx_hash && a.onchain_id && a.ipfs_url)
    const risky    = assets.filter(a => !a.tx_hash || !a.onchain_id || !a.ipfs_url)

    const complianceScore = useMemo(() => {
        if (assets.length === 0) return 100
        return Math.round((verified.length / assets.length) * 100)
    }, [assets, verified])

    // ── Guards ─────────────────────────────────────────────
    if (loading) return (
        <div className="flex items-center justify-center h-48">
            <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
        </div>
    )

    // ── Handlers ───────────────────────────────────────────
    const handleApprove = async (asset: Asset) => {
        if (!isConnected) { toast.error('Wallet belum terkoneksi.'); return }
        try {
            setProcessingId(asset.id)

            const { error } = await approveAsset({ asset, writeContractAsync })

            if (error) throw error
            setSessionStats(s => ({ ...s, approved: s.approved + 1 }))
            toast.success('Approved & recorded on-chain')
            fetchData()
        } catch (err: any) {
            toast.error(err?.shortMessage || 'Gagal approve')
        } finally {
            setProcessingId(null)
        }
    }

    const handleReject = async (id: string) => {
        try {
            setProcessingId(id)
            const { error } = await rejectAsset(id)
            if (error) throw error
            setSessionStats(s => ({ ...s, rejected: s.rejected + 1 }))
            toast.success('Asset rejected')
            fetchData()
        } catch (err: any) {
            toast.error(err?.shortMessage || 'Gagal reject')
        } finally {
            setProcessingId(null)
        }
    }

    // ── Render ─────────────────────────────────────────────
    return (
        <TooltipProvider>
            {/* Membatasi max-w-5xl mx-auto agar layout terpusat rapat */}
            <div className="space-y-4 max-w-5xl mx-auto">

                {/* ── Header ── */}
                <div className="flex items-start justify-between">
                    <div>
                        <p className="text-[11px] text-gray-400 mb-0.5">Sharia · Compliance</p>
                        <h1 className="text-lg font-semibold text-gray-900 tracking-tight">Dewan Syariah</h1>
                        <p className="text-xs text-gray-400 mt-0.5">
                            Audit real-time &amp; verifikasi blockchain
                        </p>
                    </div>
                </div>

                {/* ── Tabs ── */}
                <Tabs defaultValue="overview">
                    <TabsList className="bg-gray-100 rounded-lg h-8 p-0.5">
                        <TabsTrigger
                            value="overview"
                            className="text-[11px] h-7 rounded-md data-[state=active]:bg-white data-[state=active]:shadow-none"
                        >
                            Overview
                        </TabsTrigger>
                        <TabsTrigger
                            value="queue"
                            className="text-[11px] h-7 rounded-md data-[state=active]:bg-white data-[state=active]:shadow-none"
                        >
                            Approval Queue
                            {pending.length > 0 && (
                                <span className="ml-1 bg-amber-100 text-amber-700 text-[9px] font-semibold px-1.5 py-0.2 rounded-full">
                                    {pending.length}
                                </span>
                            )}
                        </TabsTrigger>
                    </TabsList>

                    {/* ══════════════════════════════════════
                        TAB 1 — OVERVIEW
                    ══════════════════════════════════════ */}
                    <TabsContent value="overview" className="mt-3 space-y-3">

                        {/* Stat cards (Padding dirapatkan) */}
                        <div className="grid grid-cols-4 gap-3">
                            {[
                                { label: 'Pending',   value: pending.length,  color: 'text-amber-500', Icon: Clock3 },
                                { label: 'Disetujui', value: approved.length, color: 'text-green-600', Icon: CheckCircle2 },
                                { label: 'Ditolak',   value: rejected.length, color: 'text-red-500',   Icon: XCircle },
                                { label: 'Verified',  value: verified.length, color: 'text-blue-500',  Icon: ShieldCheck },
                            ].map(m => (
                                <Card key={m.label} className="border-gray-200 shadow-none rounded-xl bg-white">
                                    <CardContent className="p-3.5">
                                        <div className="flex items-center justify-between mb-1">
                                            <p className="text-[11px] text-gray-400">{m.label}</p>
                                            <m.Icon size={12} className={m.color} />
                                        </div>
                                        <p className={`text-xl font-bold tracking-tight ${m.color}`}>
                                            {m.value}
                                        </p>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>

                        {/* Compliance score + Risk side by side */}
                        <div className="grid grid-cols-3 gap-3">

                            {/* Compliance */}
                            <Card className="col-span-2 border-gray-200 shadow-none rounded-xl bg-white">
                                <CardHeader className="p-3.5 pb-1">
                                    <CardTitle className="text-[13px] font-semibold text-gray-800">
                                        Compliance Score
                                    </CardTitle>
                                    <p className="text-[11px] text-gray-400">
                                        Persentase aset yang terverifikasi lengkap on-chain
                                    </p>
                                </CardHeader>
                                <CardContent className="p-3.5 pt-1 space-y-3">
                                    <div className="flex items-end gap-2">
                                        <span className={cn(
                                            'text-3xl font-bold tracking-tight',
                                            complianceScore >= 80 ? 'text-green-600' :
                                                complianceScore >= 50 ? 'text-amber-500' : 'text-red-500'
                                        )}>
                                            {complianceScore}%
                                        </span>
                                        <span className="text-[11px] text-gray-400 mb-1">
                                            {verified.length} dari {assets.length} aset
                                        </span>
                                    </div>
                                    <Progress
                                        value={complianceScore}
                                        className="h-1.5 bg-gray-100"
                                    />
                                    <div className="grid grid-cols-3 gap-2 pt-0.5">
                                        {[
                                            { label: 'Tx Hash',    count: assets.filter(a => a.tx_hash).length },
                                            { label: 'Onchain ID', count: assets.filter(a => a.onchain_id).length },
                                            { label: 'IPFS',       count: assets.filter(a => a.ipfs_url).length },
                                        ].map(c => (
                                            <div key={c.label} className="bg-gray-50 rounded-lg px-2.5 py-1.5 border border-gray-100">
                                                <p className="text-[9px] text-gray-400 uppercase tracking-wider">{c.label}</p>
                                                <p className="text-[12px] font-medium text-gray-700 mt-0.5">
                                                    {c.count} / {assets.length}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Risk monitor */}
                            <Card className="border-gray-200 shadow-none rounded-xl bg-white">
                                <CardHeader className="p-3.5 pb-1">
                                    <CardTitle className="text-[13px] font-semibold text-gray-800">
                                        Risk Monitor
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-3.5 pt-1">
                                    {risky.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center h-24 gap-1.5">
                                            <ShieldCheck size={16} className="text-green-500" />
                                            <p className="text-[11px] text-green-600 font-medium">No risk detected</p>
                                        </div>
                                    ) : (
                                        <ScrollArea className="h-[115px]">
                                            <div className="space-y-1.5">
                                                {risky.map(a => (
                                                    <div key={a.id} className="flex items-start gap-1.5 p-1.5 rounded-lg bg-amber-50 border border-amber-100">
                                                        <AlertTriangle size={12} className="text-amber-500 mt-0.5 shrink-0" />
                                                        <div className="min-w-0">
                                                            <p className="text-[11px] font-medium text-gray-800 leading-tight truncate">{a.name}</p>
                                                            <p className="text-[9px] text-gray-500 mt-0.5 truncate">
                                                                {[
                                                                    !a.tx_hash    && 'tx_hash',
                                                                    !a.onchain_id && 'onchain_id',
                                                                    !a.ipfs_url   && 'ipfs',
                                                                ].filter(Boolean).join(', ')} missing
                                                            </p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </ScrollArea>
                                    )}
                                </CardContent>
                            </Card>
                        </div>

                        {/* All assets table */}
                        <Card className="border-gray-200 shadow-none rounded-xl bg-white">
                            <CardHeader className="p-3.5 pb-1">
                                <CardTitle className="text-[13px] font-semibold text-gray-800">
                                    Semua Aset
                                </CardTitle>
                                <p className="text-[11px] text-gray-400">{assets.length} aset terdaftar</p>
                            </CardHeader>
                            <CardContent className="p-3.5 pt-0">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="border-gray-100 hover:bg-transparent">
                                            {['Nama', 'Jenis', 'Tx Hash', 'Status', 'Tanggal'].map(h => (
                                                <TableHead key={h} className="text-[10px] text-gray-400 font-normal pl-0 h-8">
                                                    {h}
                                                </TableHead>
                                            ))}
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {assets.map(a => (
                                            <TableRow key={a.id} className="border-gray-100 hover:bg-gray-50/70">
                                                <TableCell className="pl-0 py-2 text-[12px] font-medium text-gray-800">
                                                    {a.name}
                                                </TableCell>
                                                <TableCell className="pl-0 py-2 text-[12px] text-gray-500">
                                                    {a.asset_type ?? '—'}
                                                </TableCell>
                                                <TableCell className="pl-0 py-2">
                                                    {a.tx_hash ? (
                                                        <a
                                                            href={`https://sepolia.etherscan.io/tx/${a.tx_hash}`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="font-mono text-[11px] text-gray-400 hover:text-green-700 transition-colors inline-flex items-center gap-0.5"
                                                        >
                                                            {truncateHash(a.tx_hash)}
                                                            <ExternalLink size={9} />
                                                        </a>
                                                    ) : (
                                                        <span className="font-mono text-[11px] text-gray-300">—</span>
                                                    )}
                                                </TableCell>
                                                <TableCell className="pl-0 py-2">
                                                    <Badge
                                                        variant="outline"
                                                        className={cn(
                                                            'text-[10px] px-2 py-0 font-medium rounded-full',
                                                            a.status === 'approved' && 'bg-green-50 text-green-700 border-green-200',
                                                            a.status === 'pending'  && 'bg-amber-50 text-amber-700 border-amber-200',
                                                            a.status === 'rejected' && 'bg-red-50 text-red-600 border-red-200',
                                                        )}
                                                    >
                                                        {a.status === 'approved' ? 'Disetujui' :
                                                            a.status === 'pending'  ? 'Menunggu'  : 'Ditolak'}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="pl-0 py-2 text-[12px] text-gray-400">
                                                    {formatDate(a.created_at)}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>

                    </TabsContent>

                    {/* ══════════════════════════════════════
                        TAB 2 — APPROVAL QUEUE
                    ══════════════════════════════════════ */}
                    <TabsContent value="queue" className="mt-3 space-y-3">

                        {/* Session stats strip */}
                        <div className="grid grid-cols-3 gap-3">
                            {[
                                { label: 'Menunggu review', value: pending.length,          color: 'text-amber-500' },
                                { label: 'Disetujui sesi ini', value: sessionStats.approved, color: 'text-green-600' },
                                { label: 'Ditolak sesi ini',   value: sessionStats.rejected, color: 'text-red-500' },
                            ].map(s => (
                                <div key={s.label} className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                                    <p className="text-[9px] text-gray-400 uppercase tracking-wider mb-0.5">{s.label}</p>
                                    <p className={`text-xl font-bold tracking-tight ${s.color}`}>{s.value}</p>
                                </div>
                            ))}
                        </div>

                        {/* Wallet warning */}
                        {!isConnected && (
                            <Alert className="bg-amber-50 border-amber-200 text-amber-800 py-2 px-3 [&>svg]:text-amber-600">
                                <CircleAlert className="w-3.5 h-3.5" />
                                <AlertDescription className="text-[12px]">
                                    Wallet belum terkoneksi — tombol Approve dinonaktifkan.
                                </AlertDescription>
                            </Alert>
                        )}

                        <Separator className="bg-gray-100" />

                        {/* Queue list */}
                        <div className="space-y-3">
                            {fetching ? (
                                <>
                                    <AssetSkeleton />
                                    <AssetSkeleton />
                                </>
                            ) : pending.length === 0 ? (
                                <Card className="border-dashed border-gray-200 shadow-none rounded-xl bg-white">
                                    <CardContent className="flex flex-col items-center justify-center py-12 gap-2">
                                        <div className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center">
                                            <CheckCircle2 size={16} className="text-green-500" />
                                        </div>
                                        <p className="text-xs text-gray-400">Semua aset sudah direview</p>
                                    </CardContent>
                                </Card>
                            ) : (
                                pending.map(asset => {
                                    const Icon      = getIcon(asset.asset_type)
                                    const isLoading = processingId === asset.id

                                    return (
                                        <Card
                                            key={asset.id}
                                            className={cn(
                                                'border-gray-200 shadow-none rounded-xl bg-white overflow-hidden transition-opacity',
                                                isLoading && 'opacity-50 pointer-events-none'
                                            )}
                                        >
                                            {/* amber top bar */}
                                            <div className="h-[2px] bg-amber-400" />

                                            <CardContent className="p-3.5 space-y-3">
                                                {/* title row */}
                                                <div className="flex items-start justify-between gap-3">
                                                    <div className="flex items-start gap-2.5">
                                                        <div className="w-8 h-8 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center shrink-0 mt-0.5">
                                                            <Icon size={14} className="text-gray-400" />
                                                        </div>
                                                        <div>
                                                            <p className="font-semibold text-[13px] text-gray-900 leading-tight">
                                                                {asset.name}
                                                            </p>
                                                            <div className="flex items-center gap-1.5 mt-0.5">
                                                                <span className="text-[10px] text-gray-400 capitalize">{asset.asset_type}</span>
                                                                {asset.location && (
                                                                    <>
                                                                        <span className="text-gray-200">·</span>
                                                                        <MapPin size={9} className="text-gray-300" />
                                                                        <span className="text-[10px] text-gray-400">{asset.location}</span>
                                                                    </>
                                                                )}
                                                                <span className="text-gray-200">·</span>
                                                                <span className="text-[10px] text-gray-400">{formatDate(asset.created_at)}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <Badge
                                                        variant="outline"
                                                        className="bg-amber-50 text-amber-700 border-amber-200 text-[10px] px-2 py-0 rounded-full shrink-0"
                                                    >
                                                        Menunggu
                                                    </Badge>
                                                </div>

                                                {/* blockchain meta */}
                                                <div className="grid grid-cols-4 gap-2">
                                                    <MetaChip
                                                        label="Tx Hash"
                                                        value={asset.tx_hash ? truncateHash(asset.tx_hash) : 'Missing'}
                                                        ok={!!asset.tx_hash}
                                                        link={asset.tx_hash
                                                            ? `https://sepolia.etherscan.io/tx/${asset.tx_hash}`
                                                            : undefined}
                                                    />
                                                    <MetaChip
                                                        label="Onchain ID"
                                                        value={asset.onchain_id ?? 'Missing'}
                                                        ok={!!asset.onchain_id}
                                                    />
                                                    <MetaChip
                                                        label="IPFS"
                                                        value={asset.ipfs_url ? 'Uploaded' : 'Missing'}
                                                        ok={!!asset.ipfs_url}
                                                        link={asset.ipfs_url ?? undefined}
                                                    />
                                                    <MetaChip
                                                        label="Lokasi"
                                                        value={asset.location ?? '—'}
                                                        ok={!!asset.location}
                                                    />
                                                </div>

                                                {/* actions */}
                                                <div className="flex items-center gap-2 pt-0.5">
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                disabled={isLoading || !isConnected}
                                                                onClick={() => handleApprove(asset)}
                                                                className="gap-1 text-green-700 border-green-200 hover:bg-green-50 hover:text-green-800 hover:border-green-300 h-7 px-2.5 text-[11px]"
                                                            >
                                                                {isLoading
                                                                    ? <Loader2 size={11} className="animate-spin" />
                                                                    : <Check size={11} />
                                                                }
                                                                Approve
                                                            </Button>
                                                        </TooltipTrigger>
                                                        <TooltipContent side="top" className="text-xs">
                                                            {isConnected ? 'Approve & record on-chain' : 'Connect wallet first'}
                                                        </TooltipContent>
                                                    </Tooltip>

                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        disabled={isLoading}
                                                        onClick={() => handleReject(asset.id)}
                                                        className="gap-1 text-gray-400 hover:bg-red-50 hover:text-red-600 h-7 px-2.5 text-[11px]"
                                                    >
                                                        <X size={11} />
                                                        Reject
                                                    </Button>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    )
                                })
                            )}
                        </div>
                    </TabsContent>
                </Tabs>
            </div>
        </TooltipProvider>
    )
}