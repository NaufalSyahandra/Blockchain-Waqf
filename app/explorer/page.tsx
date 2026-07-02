'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Search, ShieldCheck, ExternalLink, ChevronLeft, ChevronRight, ArrowUpDown, Clock, Hash, MapPin, Tag } from 'lucide-react'

type Asset = {
    id: string
    name: string
    asset_type: string
    location: string
    tx_hash?: string
    onchain_id?: string
    created_at: string
    status: string
}

const PAGE_SIZE = 20

const SKELETON_WIDTHS = [
    [52, 64, 70, 71, 83, 97, 62, 72],
    [75, 82, 80, 50, 87, 84, 83, 93],
    [83, 62, 84, 80, 90, 98, 59, 64],
    [64, 95, 67, 52, 68, 92, 88, 98],
    [87, 81, 98, 91, 99, 61, 51, 61],
    [84, 64, 58, 72, 85, 98, 62, 65],
    [86, 92, 60, 66, 80, 85, 68, 79],
    [85, 78, 96, 55, 74, 66, 58, 77],
]

function StatusDot() {
    return (
        <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
        </span>
    )
}

function StatCard({ label, value, icon: Icon }: { label: string; value: string | number; icon: any }) {
    return (
        <div className="bg-white border border-gray-200 rounded-xl px-5 py-4 flex items-center gap-4">
            <div className="w-9 h-9 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0">
                <Icon size={16} className="text-emerald-600" />
            </div>
            <div>
                <p className="text-[11px] text-gray-400 uppercase tracking-wider font-medium">{label}</p>
                <p className="text-[18px] font-bold text-gray-900 leading-tight">{value}</p>
            </div>
        </div>
    )
}

export default function ExplorerPage() {
    const [assets, setAssets] = useState<Asset[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [typeFilter, setTypeFilter] = useState('Semua Jenis')
    const [sortBy, setSortBy] = useState<'created_at' | 'name'>('created_at')
    const [sortDir, setSortDir] = useState<'desc' | 'asc'>('desc')
    const [page, setPage] = useState(1)

    useEffect(() => {
        supabase
            .from('assets')
            .select('*')
            .eq('status', 'approved')
            .then(({ data }) => { setAssets(data || []); setLoading(false) })
    }, [])

    useEffect(() => { setPage(1) }, [search, typeFilter])

    const uniqueTypes = ['Semua Jenis', ...Array.from(new Set(assets.map(a => a.asset_type).filter(Boolean))).sort()]

    const filtered = assets
        .filter(a => {
            const q = search.toLowerCase()
            const matchSearch = !q ||
                a.name?.toLowerCase().includes(q) ||
                a.asset_type?.toLowerCase().includes(q) ||
                a.location?.toLowerCase().includes(q) ||
                a.tx_hash?.toLowerCase().includes(q) ||
                a.onchain_id?.toLowerCase().includes(q)
            const matchType = typeFilter === 'Semua Jenis' || a.asset_type === typeFilter
            return matchSearch && matchType
        })
        .sort((a, b) => {
            const av = sortBy === 'created_at' ? new Date(a.created_at).getTime() : a.name
            const bv = sortBy === 'created_at' ? new Date(b.created_at).getTime() : b.name
            if (av < bv) return sortDir === 'asc' ? -1 : 1
            if (av > bv) return sortDir === 'asc' ? 1 : -1
            return 0
        })

    const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
    const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

    function toggleSort(col: 'created_at' | 'name') {
        if (sortBy === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
        else { setSortBy(col); setSortDir('desc') }
    }

    return (
        <div className="min-h-screen bg-[#f7f9fb]">

            <div className="bg-white border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-lg bg-emerald-600 flex items-center justify-center">
                            <ShieldCheck size={14} className="text-white" />
                        </div>
                        <span className="font-bold text-gray-900 text-[15px]">WaqfChain</span>
                        <span className="text-gray-300 text-sm">/</span>
                        <span className="text-[13px] text-gray-500">Explorer</span>
                    </div>
                    <div className="flex items-center gap-2 text-[12px] text-gray-400">
                        <StatusDot />
                        <span>Sepolia Testnet</span>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 md:px-10 py-8">

                <div className="mb-8">
                    <h1 className="text-[26px] font-bold text-gray-900 mb-1">Waqf Asset Explorer</h1>
                    <p className="text-[13px] text-gray-400">
                        Semua aset wakaf yang telah diverifikasi dan dicatat on-chain
                    </p>
                    <div className="mt-4 flex items-center gap-6">
                        <div className="flex items-center gap-2">
                            <ShieldCheck size={13} className="text-emerald-500" />
                            <span className="text-[12px] text-gray-400">{assets.length} aset terverifikasi</span>
                        </div>
                        <div className="w-px h-3 bg-gray-200" />
                        <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                            <span className="text-[12px] text-gray-400">On-chain immutable</span>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    <StatCard label="Total Aset" value={assets.length} icon={ShieldCheck} />
                    <StatCard label="Jenis Aset" value={uniqueTypes.length - 1} icon={Tag} />
                    <StatCard label="Hasil Filter" value={filtered.length} icon={Search} />
                    <StatCard label="Halaman" value={`${page} / ${totalPages}`} icon={Hash} />
                </div>

                <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">

                    <div className="px-5 py-4 border-b border-gray-100 flex flex-col sm:flex-row gap-3">
                        <div className="relative flex-1">
                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                            <Input
                                placeholder="Cari nama, TX hash, lokasi, jenis..."
                                className="pl-9 h-9 text-[13px] border-gray-200 focus-visible:ring-emerald-500 focus-visible:ring-1 focus-visible:ring-offset-0 bg-gray-50"
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                            />
                        </div>
                        <Select value={typeFilter} onValueChange={setTypeFilter}>
                            <SelectTrigger className="w-full sm:w-[180px] h-9 text-[13px] border-gray-200 bg-gray-50 focus:ring-emerald-500 focus:ring-1">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {uniqueTypes.map(t => (
                                    <SelectItem key={t} value={t} className="text-[13px]">{t}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-[13px]">
                            <thead>
                            <tr className="bg-gray-50/80 border-b border-gray-100">
                                <th className="text-left px-5 py-3 text-[11px] uppercase tracking-wider text-gray-400 font-semibold w-10">#</th>
                                <th
                                    className="text-left px-3 py-3 text-[11px] uppercase tracking-wider text-gray-400 font-semibold cursor-pointer hover:text-gray-600 select-none"
                                    onClick={() => toggleSort('name')}
                                >
                                    <div className="flex items-center gap-1">
                                        Nama Aset
                                        <ArrowUpDown size={11} className={sortBy === 'name' ? 'text-emerald-500' : 'text-gray-300'} />
                                    </div>
                                </th>
                                <th className="text-left px-3 py-3 text-[11px] uppercase tracking-wider text-gray-400 font-semibold hidden md:table-cell">
                                    <div className="flex items-center gap-1"><Tag size={11} />Jenis</div>
                                </th>
                                <th className="text-left px-3 py-3 text-[11px] uppercase tracking-wider text-gray-400 font-semibold hidden lg:table-cell">
                                    <div className="flex items-center gap-1"><MapPin size={11} />Lokasi</div>
                                </th>
                                <th className="text-left px-3 py-3 text-[11px] uppercase tracking-wider text-gray-400 font-semibold hidden xl:table-cell">
                                    <div className="flex items-center gap-1"><Hash size={11} />TX Hash</div>
                                </th>
                                <th
                                    className="text-left px-3 py-3 text-[11px] uppercase tracking-wider text-gray-400 font-semibold cursor-pointer hover:text-gray-600 select-none hidden sm:table-cell"
                                    onClick={() => toggleSort('created_at')}
                                >
                                    <div className="flex items-center gap-1">
                                        <Clock size={11} />Tanggal
                                        <ArrowUpDown size={11} className={sortBy === 'created_at' ? 'text-emerald-500' : 'text-gray-300'} />
                                    </div>
                                </th>
                                <th className="text-left px-3 py-3 text-[11px] uppercase tracking-wider text-gray-400 font-semibold">Status</th>
                                <th className="px-5 py-3 w-8" />
                            </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                            {loading ? (
                                SKELETON_WIDTHS.map((row, i) => (
                                    <tr key={i}>
                                        {row.map((w, j) => (
                                            <td key={j} className="px-3 py-3.5">
                                                <div className="h-4 bg-gray-100 rounded animate-pulse" style={{ width: `${w}%` }} />
                                            </td>
                                        ))}
                                    </tr>
                                ))
                            ) : paged.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="text-center py-16 text-gray-400 text-[13px]">
                                        <Search size={28} className="mx-auto mb-3 text-gray-200" />
                                        Tidak ada aset ditemukan
                                    </td>
                                </tr>
                            ) : (
                                paged.map((asset, i) => (
                                    <tr key={asset.id} className="hover:bg-emerald-50/40 transition-colors group">
                                        <td className="px-5 py-3.5 text-gray-300 text-[12px] font-mono">
                                            {(page - 1) * PAGE_SIZE + i + 1}
                                        </td>
                                        <td className="px-3 py-3.5">
                                            <Link href={`/explorer/${asset.id}`} className="font-medium text-emerald-700 hover:text-emerald-900 hover:underline">
                                                {asset.name}
                                            </Link>
                                        </td>
                                        <td className="px-3 py-3.5 hidden md:table-cell">
                                                <span className="px-2 py-0.5 rounded-md bg-gray-100 text-gray-600 text-[11px] font-medium">
                                                    {asset.asset_type || '—'}
                                                </span>
                                        </td>
                                        <td className="px-3 py-3.5 text-gray-500 hidden lg:table-cell max-w-[160px]">
                                            <span className="truncate block">{asset.location || '—'}</span>
                                        </td>
                                        <td className="px-3 py-3.5 hidden xl:table-cell">
                                            {asset.tx_hash ? (
                                                <span className="font-mono text-[11px] text-blue-600 hover:underline cursor-pointer">
                                                        {asset.tx_hash.slice(0, 10)}…{asset.tx_hash.slice(-6)}
                                                    </span>
                                            ) : (
                                                <span className="text-gray-300">—</span>
                                            )}
                                        </td>
                                        <td className="px-3 py-3.5 text-gray-400 text-[12px] hidden sm:table-cell whitespace-nowrap">
                                            {new Date(asset.created_at).toLocaleDateString('id-ID', {
                                                day: '2-digit', month: 'short', year: 'numeric'
                                            })}
                                        </td>
                                        <td className="px-3 py-3.5">
                                            <Badge className="text-[10px] px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full font-medium">
                                                Verified
                                            </Badge>
                                        </td>
                                        <td className="px-5 py-3.5">
                                            <Link href={`/explorer/${asset.id}`} className="opacity-0 group-hover:opacity-100 transition-opacity">
                                                <ExternalLink size={14} className="text-gray-400 hover:text-emerald-600" />
                                            </Link>
                                        </td>
                                    </tr>
                                ))
                            )}
                            </tbody>
                        </table>
                    </div>

                    <div className="px-5 py-3.5 border-t border-gray-100 flex items-center justify-between bg-gray-50/50">
                        <p className="text-[12px] text-gray-400">
                            Menampilkan{' '}
                            <span className="font-medium text-gray-600">
                                {filtered.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)}
                            </span>{' '}
                            dari <span className="font-medium text-gray-600">{filtered.length}</span> aset
                        </p>
                        <div className="flex items-center gap-1">
                            <button
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1}
                                className="w-7 h-7 rounded flex items-center justify-center border border-gray-200 text-gray-500 hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                            >
                                <ChevronLeft size={14} />
                            </button>
                            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                const p = totalPages <= 5
                                    ? i + 1
                                    : Math.max(1, Math.min(page - 2, totalPages - 4)) + i
                                return (
                                    <button
                                        key={p}
                                        onClick={() => setPage(p)}
                                        className={`w-7 h-7 rounded text-[12px] font-medium border transition-colors ${p === page
                                            ? 'bg-emerald-600 text-white border-emerald-600'
                                            : 'border-gray-200 text-gray-500 hover:bg-white'}`}
                                    >
                                        {p}
                                    </button>
                                )
                            })}
                            <button
                                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                disabled={page === totalPages}
                                className="w-7 h-7 rounded flex items-center justify-center border border-gray-200 text-gray-500 hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                            >
                                <ChevronRight size={14} />
                            </button>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    )
}