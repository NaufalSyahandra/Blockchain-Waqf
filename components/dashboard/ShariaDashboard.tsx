'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useUser } from '@/hooks/useUser'
import { cn } from '@/lib/utils'

import {
    Card, CardContent, CardHeader, CardTitle, CardDescription,
} from '@/components/ui/card'
import { Badge }     from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Loader2, ExternalLink, Building2, FileText, PieChart, Box, Clock3, CheckCircle2, XCircle } from 'lucide-react'

import {
    Table, TableBody, TableCell, TableHead,
    TableHeader, TableRow,
} from '@/components/ui/table'

import { ResponsiveContainer, PieChart as ReChartsPie, Pie, Cell, Tooltip as ChartTooltip } from 'recharts'

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

function truncateHash(hash: string) {
    return `${hash.slice(0, 6)}…${hash.slice(-4)}`
}

function formatDate(d: string) {
    return new Date(d).toLocaleDateString('id-ID', {
        day: 'numeric', month: 'short', year: 'numeric',
    })
}

// ── Main ───────────────────────────────────────────────────
export default function ShariaDashboard() {
    const { loading } = useUser()
    const [assets, setAssets] = useState<Asset[]>([])
    const [fetching, setFetching] = useState(true)

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

    // ── Derived Metrics ────────────────────────────────────
    const pending  = assets.filter(a => a.status === 'pending')
    const approved = assets.filter(a => a.status === 'approved')
    const rejected = assets.filter(a => a.status === 'rejected')

    const chartData = [
        { name: 'Disetujui', value: approved.length, color: '#10b981' },
        { name: 'Menunggu', value: pending.length, color: '#f59e0b' },
        { name: 'Ditolak', value: rejected.length, color: '#ef4444' },
    ].filter(item => item.value > 0)

    if (loading || fetching) return (
        <div className="flex flex-col items-center justify-center h-64 gap-2">
            <Loader2 className="w-5 h-5 animate-spin text-emerald-600" />
            <p className="text-xs text-muted-foreground">Memuat data panel...</p>
        </div>
    )

    return (
        <div className="space-y-5 max-w-5xl mx-auto p-2">

            {/* ── Header ── */}
            <div>
                <p className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 tracking-wider uppercase">Sharia · Monitoring Panel</p>
                <h1 className="text-xl font-bold text-gray-900 dark:text-gray-50 tracking-tight">Ikhtisar Dewan Syariah</h1>
                <p className="text-xs text-muted-foreground mt-0.5">
                    Ringkasan kepatuhan aset syariah dan pencatatan riwayat audit blockchain.
                </p>
            </div>

            <Separator className="bg-gray-100 dark:bg-gray-800" />

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                    { label: 'Menunggu',   value: pending.length,  color: 'text-amber-500', bg: 'bg-amber-50/50', Icon: Clock3 },
                    { label: 'Disetujui', value: approved.length, color: 'text-green-600', bg: 'bg-green-50/50', Icon: CheckCircle2 },
                    { label: 'Ditolak',   value: rejected.length, color: 'text-red-500',   bg: 'bg-red-50/50', Icon: XCircle },
                ].map(m => (
                    <Card key={m.label} className="border-gray-200/70 shadow-sm rounded-xl bg-white dark:bg-gray-900">
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between mb-1">
                                <p className="text-xs font-medium text-muted-foreground">{m.label}</p>
                                <div className={cn("p-1 rounded-md", m.bg)}>
                                    <m.Icon size={13} className={m.color} />
                                </div>
                            </div>
                            <p className={cn("text-2xl font-bold tracking-tight", m.color)}>
                                {m.value}
                            </p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* ── Grafik Distribusi (Sekarang Berada di Atas dan Lebar Penuh) ── */}
            {/* ── Grafik Distribusi (Perbaikan Kontainer Recharts) ── */}
            <Card className="border-gray-200/70 shadow-sm rounded-xl bg-white dark:bg-gray-900">
                <CardHeader className="p-4 pb-0">
                    <CardTitle className="text-sm font-bold text-gray-800 dark:text-gray-100">
                        Distribusi Status Validasi
                    </CardTitle>
                    <CardDescription className="text-xs">
                        Proporsi persentase kondisi riwayat peninjauan berkas wakaf.
                    </CardDescription>
                </CardHeader>
                <CardContent className="p-4 pt-2 flex flex-col sm:flex-row items-center justify-center gap-6 min-h-[140px]">
                    {assets.length === 0 ? (
                        <p className="text-xs text-muted-foreground">Tidak ada data grafik</p>
                    ) : (
                        <>
                            {/* Area Grafik Donut - Ditambahkan ukuran kontainer pasti w-[130px] h-[130px] */}
                            <div className="w-[130px] h-[130px] relative flex items-center justify-center shrink-0">
                                <ReChartsPie width={130} height={130}>
                                    <ChartTooltip
                                        contentStyle={{ background: '#fff', borderRadius: '8px', fontSize: '11px' }}
                                    />
                                    <Pie
                                        data={chartData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={36}
                                        outerRadius={50}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {chartData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                </ReChartsPie>

                                {/* Teks di Tengah Donut */}
                                <div className="absolute flex flex-col items-center justify-center pointer-events-none">
                                    <span className="text-lg font-bold text-gray-800 dark:text-gray-100">{assets.length}</span>
                                    <span className="text-[9px] text-muted-foreground uppercase tracking-wider">Total</span>
                                </div>
                            </div>

                            {/* Legend Indikator di Sebelah Grafik */}
                            <div className="flex flex-row sm:flex-col justify-center gap-x-4 gap-y-2 text-xs font-medium text-gray-600 dark:text-gray-400">
                                <div className="flex items-center gap-2">
                                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 block shrink-0" />
                                    <span>Disetujui: <b className="text-gray-900 dark:text-gray-100">{approved.length} aset</b></span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500 block shrink-0" />
                                    <span>Menunggu: <b className="text-gray-900 dark:text-gray-100">{pending.length} aset</b></span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="w-2.5 h-2.5 rounded-full bg-red-500 block shrink-0" />
                                    <span>Ditolak: <b className="text-gray-900 dark:text-gray-100">{rejected.length} aset</b></span>
                                </div>
                            </div>
                        </>
                    )}
                </CardContent>
            </Card>

            {/* ── Tabel Utama Aset (Lebar Penuh) ── */}
            <Card className="border-gray-200/70 shadow-sm rounded-xl bg-white dark:bg-gray-900">
                <CardHeader className="p-4 pb-2">
                    <CardTitle className="text-sm font-bold text-gray-800 dark:text-gray-100">
                        Semua Aset Wakaf
                    </CardTitle>
                    <CardDescription className="text-xs">
                        Daftar keseluruhan berkas aset terdaftar dalam sistem.
                    </CardDescription>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow className="border-gray-100 dark:border-gray-800 hover:bg-transparent">
                                    {['Nama', 'Jenis', 'Tx Hash', 'Status', 'Tanggal'].map(h => (
                                        <TableHead key={h} className="text-[11px] text-muted-foreground font-medium pl-0 h-8">
                                            {h}
                                        </TableHead>
                                    ))}
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {assets.map(a => (
                                    <TableRow key={a.id} className="border-gray-100 dark:border-gray-800 hover:bg-gray-50/50">
                                        <TableCell className="pl-0 py-2.5 text-xs font-semibold text-gray-800 dark:text-gray-200">
                                            {a.name}
                                        </TableCell>
                                        <TableCell className="pl-0 py-2.5 text-xs text-muted-foreground capitalize">
                                            {a.asset_type ?? '—'}
                                        </TableCell>
                                        <TableCell className="pl-0 py-2.5">
                                            {a.tx_hash ? (
                                                <a
                                                    href={`https://sepolia.etherscan.io/tx/${a.tx_hash}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="font-mono text-[11px] text-gray-400 hover:text-emerald-600 transition-colors inline-flex items-center gap-0.5"
                                                >
                                                    {truncateHash(a.tx_hash)}
                                                    <ExternalLink size={9} />
                                                </a>
                                            ) : (
                                                <span className="font-mono text-[11px] text-gray-300 dark:text-gray-700">—</span>
                                            )}
                                        </TableCell>
                                        <TableCell className="pl-0 py-2.5">
                                            <Badge
                                                variant="outline"
                                                className={cn(
                                                    'text-[10px] px-2 py-0 font-medium rounded-full',
                                                    a.status === 'approved' && 'bg-green-50 text-green-700 border-green-200 dark:bg-green-950/20 dark:text-green-400 dark:border-green-900/30',
                                                    a.status === 'pending'  && 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/30',
                                                    a.status === 'rejected' && 'bg-red-50 text-red-600 border-red-200 dark:bg-red-950/20 dark:text-red-400 dark:border-red-900/30',
                                                )}
                                            >
                                                {a.status === 'approved' ? 'Disetujui' :
                                                    a.status === 'pending'  ? 'Menunggu'  : 'Ditolak'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="pl-0 py-2.5 text-xs text-muted-foreground">
                                            {formatDate(a.created_at)}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

        </div>
    )
}