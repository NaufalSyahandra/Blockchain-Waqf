'use client'

import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useUser } from '@/hooks/useUser'
import { toast } from 'sonner'
import { useWriteContract, useAccount } from 'wagmi'
import { approveAsset, rejectAsset } from '@/lib/actions/approval'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
    MapPin,
    Check,
    X,
    CircleAlert,
    Loader2,
    ShieldCheck,
    Clock3,
    ExternalLink
} from 'lucide-react'
import { cn } from '@/lib/utils'

// ─── Helpers ────────────────────────────────────────────────────────────────

const ASSET_ICONS: Record<string, React.ElementType> = {
    property: Building2,
    sukuk:    FileText,
    equity:   PieChart,
}

function getIcon(type?: string) {
    if (!type) return Building2
    return ASSET_ICONS[type.toLowerCase()] || Building2
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function ShariaApprovalPage() {
    // Mengambil user login dari hook agar approved_by tidak NULL
    const { user } = useUser()
    const { isConnected } = useAccount()

    const [assets, setAssets] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [submittingId, setSubmittingId] = useState<string | null>(null)

    // Fetch data aset yang berstatus pending
    const fetchPendingAssets = useCallback(async () => {
        setLoading(true)
        try {
            // Menggunakan !wakif_id agar Supabase melakukan join secara tepat
            const { data, error } = await supabase
                .from('assets')
                .select(`
                    *,
                    users!wakif_id (
                        email
                    )
                `)
                .eq('status', 'pending')
                .order('created_at', { ascending: false })

            if (error) throw error
            setAssets(data || [])
        } catch (error: any) {
            toast.error('Gagal mengambil pengajuan aset: ' + error.message)
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        fetchPendingAssets()
    }, [fetchPendingAssets])

    // Fungsi Handle Approve (Mengirimkan User ID agar database mencatat approved_by)
    // Fungsi Handle Approve di dalam page.tsx
    const handleApprove = async (asset: any) => { // <-- Menerima objek asset utuh
        if (!user?.id) {
            toast.error('Aksi ditolak. ID Pengguna (Aktor) tidak ditemukan.')
            return
        }

        setSubmittingId(asset.id)
        try {
            // Oper seluruh objek asset beserta user.id
            const result = await approveAsset(asset, user.id)
            if (result.success) {
                toast.success('Aset berhasil disetujui untuk on-chain!')
                fetchPendingAssets()
            } else {
                throw new Error(result.error)
            }
        } catch (error: any) {
            toast.error('Gagal menyetujui aset: ' + error.message)
        } finally {
            setSubmittingId(null)
        }
    }

    // Fungsi Handle Reject (Mengirimkan User ID agar database mencatat penolak)
    const handleReject = async (assetId: string) => {
        if (!user?.id) {
            toast.error('Aksi ditolak. ID Pengguna (Aktor) tidak ditemukan.')
            return
        }

        setSubmittingId(assetId)
        try {
            // Oper assetId beserta user.id sebagai aktor penolak
            const result = await rejectAsset(assetId, user.id)
            if (result.success) {
                toast.success('Pengajuan aset berhasil ditolak.')
                fetchPendingAssets() // Refresh data
            } else {
                throw new Error(result.error)
            }
        } catch (error: any) {
            toast.error('Gagal menolak aset: ' + error.message)
        } finally {
            setSubmittingId(null)
        }
    }

    return (
        <TooltipProvider>
            <div className="space-y-6 max-w-5xl mx-auto p-6">

                {/* Header Page */}
                <div className="flex flex-col gap-1">
                    <p className="text-[11px] font-semibold tracking-widest uppercase text-emerald-600 dark:text-emerald-400">
                        Dewan Syariah · Pelataran Review
                    </p>
                    <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-50">
                        Persetujuan Aset Wakaf
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        Tinjau kelayakan syariah dan legalitas dokumen sebelum di-deploy ke on-chain Smart Contract.
                    </p>
                </div>

                <Separator className="my-4" />

                {/* Wallet Alert */}
                {!isConnected && (
                    <Alert variant="destructive" className="bg-amber-50 border-amber-200 text-amber-800 dark:bg-amber-950/20 dark:border-amber-900/50 dark:text-amber-400">
                        <CircleAlert className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                        <AlertDescription className="text-xs font-medium">
                            Dompet Web3 Anda belum terhubung. Silakan hubungkan wallet Anda terlebih dahulu di pojok kanan atas untuk melakukan eksekusi persetujuan on-chain.
                        </AlertDescription>
                    </Alert>
                )}

                {/* Content Area */}
                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {[...Array(4)].map((_, i) => (
                            <Card key={i} className="border-gray-200/60 shadow-sm">
                                <CardContent className="p-5 space-y-3">
                                    <Skeleton className="h-5 w-1/3" />
                                    <Skeleton className="h-4 w-full" />
                                    <Skeleton className="h-4 w-2/3" />
                                    <div className="flex gap-2 pt-2">
                                        <Skeleton className="h-8 w-20 rounded-lg" />
                                        <Skeleton className="h-8 w-20 rounded-lg" />
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                ) : assets.length === 0 ? (
                    <Card className="border-dashed border-gray-200 dark:border-gray-800 bg-transparent py-12 flex flex-col items-center justify-center text-center">
                        <ShieldCheck className="w-10 h-10 text-gray-300 dark:text-gray-700 mb-2" />
                        <CardTitle className="text-sm font-semibold text-gray-600 dark:text-gray-400">
                            Semua Aman &amp; Bersih
                        </CardTitle>
                        <p className="text-xs text-muted-foreground mt-1 max-w-xs">
                            Tidak ada pengajuan aset wakaf baru berstatus pending yang perlu ditinjau hari ini.
                        </p>
                    </Card>
                ) : (
                    /* Memindahkan UI Card Dashboard ke halaman approval */
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {assets.map((asset) => {
                            const IconComponent = getIcon(asset.asset_type)
                            const isAssetSubmitting = submittingId === asset.id
                            const isButtonDisabled = isAssetSubmitting || !isConnected

                            return (
                                <Card key={asset.id} className="bg-white dark:bg-gray-900 border-gray-200/70 shadow-sm hover:shadow-md transition-all flex flex-col justify-between overflow-hidden">

                                    {/* Card Header */}
                                    <CardHeader className="p-4 flex flex-row items-start justify-between space-y-0 gap-4 bg-gray-50/50 dark:bg-gray-800/30 border-b border-gray-100 dark:border-gray-800">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-lg border border-emerald-100 dark:border-emerald-900/30">
                                                <IconComponent size={18} />
                                            </div>
                                            <div>
                                                <CardTitle className="text-sm font-bold text-gray-900 dark:text-gray-50 truncate max-w-[200px]">
                                                    {asset.name}
                                                </CardTitle>
                                                <div className="flex items-center gap-1 text-[11px] text-muted-foreground mt-0.5">
                                                    <MapPin size={10} />
                                                    <span className="truncate max-w-[150px]">{asset.location || 'Lokasi tidak spesifik'}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <Badge variant="outline" className="text-[10px] font-medium rounded-full bg-amber-50 text-amber-700 border-amber-200 px-2 py-0 flex items-center gap-1 h-5 whitespace-nowrap">
                                            <Clock3 size={9} />
                                            Review Syariah
                                        </Badge>
                                    </CardHeader>

                                    {/* Card Content Details */}
                                    <CardContent className="p-4 space-y-3.5 flex-1 text-xs">
                                        <div className="grid grid-cols-2 gap-y-2.5 gap-x-4 text-gray-600 dark:text-gray-400">
                                            <div>
                                                <p className="text-[10px] uppercase font-semibold text-gray-400 tracking-wider">Tipe Aset</p>
                                                <p className="font-medium mt-0.5 text-gray-900 dark:text-gray-100 capitalize">{asset.asset_type || '-'}</p>
                                            </div>
                                            <div>
                                                <p className="text-[10px] uppercase font-semibold text-gray-400 tracking-wider">Email Wakif</p>
                                                <p className="font-medium mt-0.5 text-gray-900 dark:text-gray-100 truncate max-w-[180px]" title={asset.users?.email}>
                                                    {asset.users?.email || 'Tidak dicantumkan'}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-[10px] uppercase font-semibold text-gray-400 tracking-wider">Tanggal Diajukan</p>
                                                <p className="font-medium mt-0.5 text-gray-900 dark:text-gray-100 font-mono">
                                                    {asset.created_at ? new Date(asset.created_at).toLocaleDateString('id-ID', {
                                                        day: '2-digit',
                                                        month: 'short',
                                                        year: 'numeric'
                                                    }) : '-'}
                                                </p>
                                            </div>
                                        </div>

                                        {/* IPFS IPFS / Metadata Hash Link */}
                                        {asset.ipfs_url && (
                                            <div className="pt-1">
                                                <p className="text-[10px] uppercase font-semibold text-gray-400 tracking-wider mb-1">Dokumen Legalitas</p>
                                                <a
                                                    href={asset.ipfs_url}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="inline-flex items-center gap-1 text-emerald-600 hover:text-emerald-700 font-medium bg-emerald-50 dark:bg-emerald-950/20 px-2 py-1 rounded border border-emerald-100 dark:border-emerald-900/50 hover:underline transition-all"
                                                >
                                                    <span>Buka Dokumen Syariah IPFS</span>
                                                    <ExternalLink size={11} />
                                                </a>
                                            </div>
                                        )}

                                        <Separator className="my-2 border-gray-100 dark:border-gray-800" />

                                        {/* Action Buttons Panel */}
                                        <div className="flex items-center justify-end gap-2 pt-1">
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <div>
                                                        <Button
                                                            size="sm"
                                                            disabled={isButtonDisabled}
                                                            onClick={() => handleApprove(asset)}
                                                            className="gap-1 bg-emerald-600 hover:bg-emerald-700 text-white font-medium shadow-sm h-7 px-2.5 text-[11px]"
                                                        >
                                                            {isAssetSubmitting ? (
                                                                <Loader2 size={11} className="animate-spin" />
                                                            ) : (
                                                                <Check size={11} />
                                                            )}
                                                            Approve
                                                        </Button>
                                                    </div>
                                                </TooltipTrigger>
                                                <TooltipContent side="top" className="text-xs">
                                                    {isConnected ? 'Setujui & rekam jejak secara on-chain' : 'Hubungkan wallet Anda terlebih dahulu'}
                                                </TooltipContent>
                                            </Tooltip>

                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                disabled={isAssetSubmitting}
                                                onClick={() => handleReject(asset.id)}
                                                className="gap-1 text-gray-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/20 dark:hover:text-red-400 h-7 px-2.5 text-[11px]"
                                            >
                                                <X size={11} />
                                                Reject
                                            </Button>
                                        </div>

                                    </CardContent>
                                </Card>
                            )
                        })}
                    </div>
                )}
            </div>
        </TooltipProvider>
    )
}