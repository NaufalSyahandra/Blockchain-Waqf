'use client'

import { useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useUser } from '@/hooks/useUser'
import Link from 'next/link'

import {
    ColumnDef,
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    SortingState,
    useReactTable,
} from '@tanstack/react-table'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge }  from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input }  from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import {
    ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip,
} from 'recharts'
import { ArrowUpDown, ChevronLeft, ChevronRight, Plus, ExternalLink } from 'lucide-react'

// ── Types ─────────────────────────────────────────────────
type Asset = {
    id: string
    name: string
    asset_type: string
    status: 'pending' | 'approved' | 'rejected'
    tx_hash: string | null
    created_at: string
}

// ── Helpers ───────────────────────────────────────────────
function truncateHash(hash: string) {
    return `${hash.slice(0, 6)}…${hash.slice(-4)}`
}

// ── Chart tooltip ─────────────────────────────────────────
function ChartTooltip({ active, payload, label }: any) {
    if (!active || !payload?.length) return null
    return (
        <div className="bg-white border border-gray-200 px-3 py-2 text-[12px] shadow-sm rounded-lg">
            <p className="text-gray-400 mb-0.5">{label}</p>
            <p className="font-semibold text-gray-800">{payload[0].value} aset</p>
        </div>
    )
}

// ── Status badge ──────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
    const map: Record<string, string> = {
        approved: 'bg-green-50 text-green-700 border-green-200 hover:bg-green-50',
        pending:  'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-50',
        rejected: 'bg-red-50 text-red-600 border-red-200 hover:bg-red-50',
    }
    const label: Record<string, string> = {
        approved: 'Disetujui',
        pending:  'Menunggu',
        rejected: 'Ditolak',
    }
    return (
        <Badge
            variant="outline"
            className={`text-[11px] font-medium rounded-full px-2.5 ${map[status] ?? ''}`}
        >
            {label[status] ?? status}
        </Badge>
    )
}

// ── Columns ───────────────────────────────────────────────
const columns: ColumnDef<Asset>[] = [
    {
        accessorKey: 'name',
        header: ({ column }) => (
            <Button
                variant="ghost" size="sm"
                className="text-[11px] font-medium text-gray-500 hover:text-gray-800 hover:bg-transparent p-0 h-auto"
                onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            >
                Nama Aset <ArrowUpDown size={11} className="ml-1" />
            </Button>
        ),
        cell: ({ row }) => (
            <span className="text-[13px] font-medium text-gray-800">{row.getValue('name')}</span>
        ),
    },
    {
        accessorKey: 'asset_type',
        header: () => <span className="text-[11px] font-medium text-gray-500">Jenis</span>,
        cell: ({ row }) => (
            <span className="text-[13px] text-gray-500">{row.getValue('asset_type') ?? '-'}</span>
        ),
    },
    {
        accessorKey: 'tx_hash',
        header: () => <span className="text-[11px] font-medium text-gray-500">Tx Hash</span>,
        cell: ({ row }) => {
            const hash = row.getValue('tx_hash') as string | null
            if (!hash) return (
                <span className="font-mono text-[11px] text-gray-300">—</span>
            )
            return (
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <a
                                href={`https://sepolia.etherscan.io/tx/${hash}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="font-mono text-[11px] text-gray-500 hover:text-green-700 transition-colors inline-flex items-center gap-1"
                            >
                                {truncateHash(hash)}
                                <ExternalLink size={10} />
                            </a>
                        </TooltipTrigger>
                        <TooltipContent className="font-mono text-xs">{hash}</TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            )
        },
    },
    {
        accessorKey: 'status',
        header: ({ column }) => (
            <Button
                variant="ghost" size="sm"
                className="text-[11px] font-medium text-gray-500 hover:text-gray-800 hover:bg-transparent p-0 h-auto"
                onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            >
                Status <ArrowUpDown size={11} className="ml-1" />
            </Button>
        ),
        cell: ({ row }) => <StatusBadge status={row.getValue('status')} />,
    },
    {
        accessorKey: 'created_at',
        header: ({ column }) => (
            <Button
                variant="ghost" size="sm"
                className="text-[11px] font-medium text-gray-500 hover:text-gray-800 hover:bg-transparent p-0 h-auto"
                onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            >
                Tanggal <ArrowUpDown size={11} className="ml-1" />
            </Button>
        ),
        cell: ({ row }) => (
            <span className="text-[13px] text-gray-500">
                {new Date(row.getValue('created_at')).toLocaleDateString('id-ID', {
                    day: '2-digit', month: 'short', year: 'numeric',
                })}
            </span>
        ),
    },
    {
        id: 'actions',
        cell: ({ row }) => (
            <div className="text-right">
                <Button
                    asChild variant="ghost" size="sm"
                    className="text-[12px] font-medium text-green-700 hover:text-green-800 hover:bg-green-50 h-8 px-3 rounded-lg"
                >
                    <Link href={`/dashboard/assets/${row.original.id}`}>Detail →</Link>
                </Button>
            </div>
        ),
    },
]

// ── Main ──────────────────────────────────────────────────
export default function WakifDashboard() {
    const { user } = useUser()
    const [assets, setAssets]   = useState<Asset[]>([])
    const [loading, setLoading] = useState(true)
    const [sorting, setSorting] = useState<SortingState>([])
    const [globalFilter, setGlobalFilter] = useState('')

    const fetchData = async () => {
        if (!user?.id) return
        const { data } = await supabase
            .from('assets')
            .select('id, name, asset_type, status, tx_hash, created_at')
            .eq('wakif_id', user.id)
            .order('created_at', { ascending: false })
        setAssets(data || [])
        setLoading(false)
    }

    useEffect(() => {
        if (!user) return
        fetchData()
        const channel = supabase
            .channel('wakif-assets')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'assets' }, fetchData)
            .subscribe()
        return () => { supabase.removeChannel(channel) }
    }, [user])

    const table = useReactTable({
        data: assets,
        columns,
        state: { sorting, globalFilter },
        onSortingChange: setSorting,
        onGlobalFilterChange: setGlobalFilter,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        initialState: { pagination: { pageSize: 8 } },
    })

    const approved = assets.filter(a => a.status === 'approved').length
    const pending  = assets.filter(a => a.status === 'pending').length
    const rejected = assets.filter(a => a.status === 'rejected').length

    const chartData = useMemo(() => {
        const map: Record<string, number> = {}
        assets.forEach(a => {
            const d = new Date(a.created_at).toLocaleDateString('id-ID', {
                day: '2-digit', month: 'short',
            })
            map[d] = (map[d] || 0) + 1
        })
        return Object.entries(map).map(([date, total]) => ({ date, total }))
    }, [assets])

    if (loading) return (
        <div className="space-y-5">
            <div className="flex items-center justify-between">
                <div className="space-y-1">
                    <Skeleton className="h-3 w-16" />
                    <Skeleton className="h-6 w-40" />
                </div>
                <Skeleton className="h-9 w-36" />
            </div>
            <div className="grid grid-cols-4 gap-4">
                {[...Array(4)].map((_, i) => (
                    <Card key={i} className="border-gray-200 shadow-none rounded-xl">
                        <CardContent className="p-5 space-y-2">
                            <Skeleton className="h-3 w-16" />
                            <Skeleton className="h-8 w-10" />
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    )

    return (
        <div className="space-y-5">

            {/* ── Header ── */}
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-xs text-gray-400 mb-0.5">Wakif · Overview</p>
                    <h1 className="text-xl font-semibold text-gray-900">Aset Wakaf Saya</h1>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        asChild size="sm"
                        className="bg-green-700 hover:bg-green-800 text-white rounded-lg text-[13px] font-medium h-9 px-4"
                    >
                        <Link href="/dashboard/wakif/create">
                            <Plus size={14} className="mr-1.5" />
                            Daftarkan Aset
                        </Link>
                    </Button>
                </div>
            </div>

            {/* ── Metric cards ── */}
            <div className="grid grid-cols-4 gap-4">
                {[
                    { label: 'Total Aset', value: assets.length, valueClass: 'text-gray-900',
                        sub: user?.id ? truncateHash(user.id) : undefined, mono: true },
                    { label: 'Disetujui',  value: approved, valueClass: 'text-green-600', sub: 'on-chain ✓' },
                    { label: 'Menunggu',   value: pending,  valueClass: 'text-amber-500', sub: 'pending review' },
                    { label: 'Ditolak',    value: rejected, valueClass: 'text-red-500',   sub: 'needs revision' },
                ].map(m => (
                    <Card key={m.label} className="border-gray-200 shadow-none rounded-xl bg-white">
                        <CardContent className="p-5">
                            <p className="text-xs text-gray-400 mb-2">{m.label}</p>
                            <p className={`text-3xl font-bold tracking-tight ${m.valueClass}`}>{m.value}</p>
                            {m.sub && (
                                <p className={`mt-1 text-[10px] text-gray-400 ${m.mono ? 'font-mono' : ''}`}>
                                    {m.sub}
                                </p>
                            )}
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* ── Chart ── */}
            <Card className="border-gray-200 shadow-none rounded-xl bg-white">
                <CardHeader className="pb-0 px-5 pt-5">
                    <CardTitle className="text-[15px] font-semibold text-gray-800">Pertumbuhan Aset</CardTitle>
                    <p className="text-xs text-gray-400">Jumlah aset yang didaftarkan per tanggal</p>
                </CardHeader>
                <CardContent className="px-5 pb-5 pt-4">
                    {chartData.length === 0 ? (
                        <div className="flex items-center justify-center h-36 text-sm text-gray-400">
                            Belum ada data
                        </div>
                    ) : (
                        <ResponsiveContainer width="100%" height={180}>
                            <BarChart data={chartData} barSize={16}>
                                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} width={24} allowDecimals={false} />
                                <RechartsTooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(22,163,74,0.06)' }} />
                                <Bar dataKey="total" fill="#16a34a" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    )}
                </CardContent>
            </Card>

            {/* ── DataTable ── */}
            <Card className="border-gray-200 shadow-none rounded-xl bg-white">
                <CardHeader className="px-5 pt-5 pb-4">
                    <div className="flex items-center justify-between gap-4">
                        <div>
                            <CardTitle className="text-[15px] font-semibold text-gray-800">Daftar Aset</CardTitle>
                            <p className="text-xs text-gray-400 mt-0.5">{assets.length} aset terdaftar</p>
                        </div>
                        <Input
                            placeholder="Cari aset..."
                            value={globalFilter}
                            onChange={e => setGlobalFilter(e.target.value)}
                            className="h-9 w-48 text-[13px] rounded-lg border-gray-200 focus-visible:ring-green-500 placeholder:text-gray-400"
                        />
                    </div>
                </CardHeader>
                <CardContent className="px-5 pb-5">
                    {assets.length === 0 ? (
                        <div className="text-center py-12">
                            <p className="text-sm text-gray-400 mb-3">Belum ada aset yang didaftarkan.</p>
                            <Button asChild variant="link" className="text-green-700 text-[13px] p-0 h-auto">
                                <Link href="/dashboard/wakif/create">Daftarkan sekarang →</Link>
                            </Button>
                        </div>
                    ) : (
                        <>
                            <Table>
                                <TableHeader>
                                    {table.getHeaderGroups().map(hg => (
                                        <TableRow key={hg.id} className="border-gray-100 hover:bg-transparent">
                                            {hg.headers.map(header => (
                                                <TableHead key={header.id} className="pl-0">
                                                    {header.isPlaceholder ? null : flexRender(
                                                        header.column.columnDef.header, header.getContext()
                                                    )}
                                                </TableHead>
                                            ))}
                                        </TableRow>
                                    ))}
                                </TableHeader>
                                <TableBody>
                                    {table.getRowModel().rows.length ? (
                                        table.getRowModel().rows.map(row => (
                                            <TableRow key={row.id} className="border-gray-100 hover:bg-gray-50/70">
                                                {row.getVisibleCells().map(cell => (
                                                    <TableCell key={cell.id} className="pl-0 py-3">
                                                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                                    </TableCell>
                                                ))}
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={columns.length} className="text-center py-8 text-sm text-gray-400">
                                                Tidak ada hasil yang cocok.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                            {/* Pagination */}
                            <div className="flex items-center justify-between pt-4 border-t border-gray-100 mt-2">
                                <p className="text-[12px] text-gray-400">
                                    Halaman {table.getState().pagination.pageIndex + 1} dari {table.getPageCount()}
                                </p>
                                <div className="flex items-center gap-1">
                                    <Button
                                        variant="outline" size="icon"
                                        className="h-8 w-8 rounded-lg border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40"
                                        onClick={() => table.previousPage()}
                                        disabled={!table.getCanPreviousPage()}
                                    >
                                        <ChevronLeft size={14} />
                                    </Button>
                                    <Button
                                        variant="outline" size="icon"
                                        className="h-8 w-8 rounded-lg border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40"
                                        onClick={() => table.nextPage()}
                                        disabled={!table.getCanNextPage()}
                                    >
                                        <ChevronRight size={14} />
                                    </Button>
                                </div>
                            </div>
                        </>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}