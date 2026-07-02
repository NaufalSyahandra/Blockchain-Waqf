'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useUser } from '@/hooks/useUser'
import { toast } from 'sonner'
import { useWriteContract, useAccount } from 'wagmi'
import { approveAsset, rejectAsset } from '@/lib/actions/approval'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip'
import { Alert, AlertDescription } from '@/components/ui/alert'

import {
    Building2,
    FileText,
    PieChart,
    Box,
    MapPin,
    Check,
    X,
    CircleAlert,
    Loader2,
    ShieldCheck,
} from 'lucide-react'
import { cn } from '@/lib/utils'

// ─── helpers ────────────────────────────────────────────────────────────────

const ASSET_ICONS: Record<string, React.ElementType> = {
    property: Building2,
    sukuk:    FileText,
    equity:   PieChart,
}

function getIcon(type?: string) {
    return ASSET_ICONS[type?.toLowerCase() ?? ''] ?? Box
}

function truncateAddress(addr?: string) {
    if (!addr) return 'Not connected'
    return `${addr.slice(0, 6)}…${addr.slice(-4)}`
}

// ─── stat card ──────────────────────────────────────────────────────────────

function StatCard({ label, value }: { label: string; value: number }) {
    return (
        <Card className="bg-muted/30 border-border/50 shadow-none">
            <CardContent className="px-5 py-4">
                <p className="text-xs text-muted-foreground mb-1 font-medium tracking-wide uppercase">
                    {label}
                </p>
                <p className="text-3xl font-semibold text-foreground tabular-nums">
                    {value}
                </p>
            </CardContent>
        </Card>
    )
}

// ─── skeleton loader ─────────────────────────────────────────────────────────

function AssetSkeleton() {
    return (
        <Card className="border-border/50 shadow-none">
            <CardContent className="flex items-center gap-4 px-5 py-4">
                <Skeleton className="w-10 h-10 rounded-lg shrink-0" />
                <div className="flex-1 space-y-2">
                    <Skeleton className="h-3.5 w-40 rounded" />
                    <Skeleton className="h-3 w-24 rounded" />
                </div>
                <Skeleton className="h-6 w-16 rounded-full" />
                <Skeleton className="h-8 w-20 rounded-md" />
                <Skeleton className="h-8 w-16 rounded-md" />
            </CardContent>
        </Card>
    )
}

// ─── main page ───────────────────────────────────────────────────────────────

export default function ShariaApprovalPage() {
    const { user, loading }              = useUser()
    const { isConnected, address }       = useAccount()
    const { writeContractAsync }         = useWriteContract()

    const [assets, setAssets]            = useState<any[]>([])
    const [fetching, setFetching]        = useState(true)
    const [processingId, setProcessingId] = useState<string | null>(null)
    const [stats, setStats]              = useState({ approved: 0, rejected: 0 })

    useEffect(() => { fetchPending() }, [])

    const fetchPending = async () => {
        setFetching(true)
        const { data } = await supabase
            .from('assets')
            .select('*')
            .eq('status', 'pending')
        setAssets(data || [])
        setFetching(false)
    }

    // ── guards ──────────────────────────────────────────────────────────────
    if (loading) return (
        <div className="min-h-screen flex items-center justify-center">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
    )

    if (!user || user.role !== 'sharia') return (
        <div className="min-h-screen flex items-center justify-center">
            <p className="text-sm text-destructive font-medium">Access Denied</p>
        </div>
    )

    // ── handlers ────────────────────────────────────────────────────────────
    const handleApprove = async (asset: any) => {
        if (!isConnected) {
            toast.error('Wallet belum terkoneksi.')
            return
        }
        try {
            setProcessingId(asset.id)

            const { error } = await approveAsset(asset)

            if (error) throw error
            setStats(s => ({ ...s, approved: s.approved + 1 }))
            toast.success('Approved & recorded on-chain ✓')
            fetchPending()
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
            setStats(s => ({ ...s, rejected: s.rejected + 1 }))
            toast.success('Asset rejected')
            fetchPending()
        } catch (err: any) {
            toast.error(err?.shortMessage || 'Gagal reject')
        } finally {
            setProcessingId(null)
        }
    }

    // ── render ───────────────────────────────────────────────────────────────
    return (
        <TooltipProvider>
            {/*<div className="min-h-screen bg-background">*/}
                <div className="max-w-3xl mx-auto px-6 py-10 space-y-8">

                    {/* ── Header ── */}
                    <div className="flex items-start justify-between">
                        <div className="space-y-1">
                            <div className="flex items-center gap-2">
                                <ShieldCheck className="w-5 h-5 text-muted-foreground" />
                                <h1 className="text-lg font-semibold tracking-tight">
                                    Approval Panel
                                </h1>
                            </div>
                            <p className="text-sm text-muted-foreground">
                                Review pending assets before they are recorded on-chain
                            </p>
                        </div>

                        {/* Wallet badge */}
                        <Badge
                            variant="outline"
                            className="gap-1.5 px-3 py-1.5 text-xs font-mono rounded-full"
                        >
                            <span className={cn(
                                'w-1.5 h-1.5 rounded-full shrink-0',
                                isConnected ? 'bg-emerald-500' : 'bg-muted-foreground/40'
                            )} />
                            {truncateAddress(address)}
                        </Badge>
                    </div>

                    {/* ── Stats ── */}
                    <div className="grid grid-cols-3 gap-3">
                        <StatCard label="Pending"        value={assets.length} />
                        <StatCard label="Approved today" value={stats.approved} />
                        <StatCard label="Rejected"       value={stats.rejected} />
                    </div>

                    {/* ── Wallet warning ── */}
                    {!isConnected && (
                        <Alert variant="destructive" className="bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-400 [&>svg]:text-amber-600">
                            <CircleAlert className="w-4 h-4" />
                            <AlertDescription>
                                Wallet belum terkoneksi — tombol Approve dinonaktifkan.
                            </AlertDescription>
                        </Alert>
                    )}

                    <Separator className="opacity-50" />

                    {/* ── Asset list ── */}
                    <div className="space-y-2">
                        <p className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground/50 mb-3">
                            Pending review
                        </p>

                        {fetching ? (
                            <div className="space-y-2">
                                <AssetSkeleton />
                                <AssetSkeleton />
                                <AssetSkeleton />
                            </div>
                        ) : assets.length === 0 ? (
                            <Card className="border-dashed border-border/50 shadow-none">
                                <CardContent className="flex flex-col items-center justify-center py-14 gap-3">
                                    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                                        <Check className="w-4 h-4 text-muted-foreground" />
                                    </div>
                                    <p className="text-sm text-muted-foreground">
                                        All assets reviewed
                                    </p>
                                </CardContent>
                            </Card>
                        ) : (
                            assets.map((asset) => {
                                const Icon      = getIcon(asset.asset_type)
                                const isLoading = processingId === asset.id

                                return (
                                    <Card
                                        key={asset.id}
                                        className={cn(
                                            'border-border/50 shadow-none transition-opacity duration-200',
                                            isLoading && 'opacity-50 pointer-events-none'
                                        )}
                                    >
                                        <CardContent className="flex items-center gap-4 px-5 py-4">

                                            {/* Icon */}
                                            <div className="w-10 h-10 rounded-lg bg-muted/60 flex items-center justify-center shrink-0">
                                                <Icon className="w-4.5 h-4.5 text-muted-foreground" />
                                            </div>

                                            {/* Info */}
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-foreground truncate">
                                                    {asset.name}
                                                </p>
                                                <div className="flex items-center gap-1.5 mt-0.5">
                                                    <span className="text-xs text-muted-foreground">
                                                        {asset.asset_type}
                                                    </span>
                                                    <span className="text-muted-foreground/30 text-xs">·</span>
                                                    <MapPin className="w-3 h-3 text-muted-foreground/50 shrink-0" />
                                                    <span className="text-xs text-muted-foreground/70 truncate">
                                                        {asset.location}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Status */}
                                            <Badge
                                                variant="outline"
                                                className="text-[11px] rounded-full bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800 shrink-0"
                                            >
                                                Pending
                                            </Badge>

                                            {/* Actions */}
                                            <div className="flex items-center gap-2 shrink-0">
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => handleApprove(asset)}
                                                            disabled={isLoading || !isConnected}
                                                            className="gap-1.5 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:text-emerald-800 hover:border-emerald-300"
                                                        >
                                                            {isLoading
                                                                ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                                                : <Check className="w-3.5 h-3.5" />
                                                            }
                                                            Approve
                                                        </Button>
                                                    </TooltipTrigger>
                                                    <TooltipContent side="top">
                                                        {isConnected
                                                            ? 'Approve & record on-chain'
                                                            : 'Connect wallet first'
                                                        }
                                                    </TooltipContent>
                                                </Tooltip>

                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => handleReject(asset.id)}
                                                    disabled={isLoading}
                                                    className="gap-1.5 text-muted-foreground hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30 dark:hover:text-red-400"
                                                >
                                                    <X className="w-3.5 h-3.5" />
                                                    Reject
                                                </Button>
                                            </div>

                                        </CardContent>
                                    </Card>
                                )
                            })
                        )}
                    </div>

                </div>
            {/*</div>*/}
        </TooltipProvider>
    )
}