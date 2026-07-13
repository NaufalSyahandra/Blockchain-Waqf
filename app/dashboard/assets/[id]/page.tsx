'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import {
    MapPin, Tag, FileText, ExternalLink,
    Activity, Gift, ArrowLeft, Clock
} from 'lucide-react'

type HistoryItem = {
    type: 'activity' | 'benefit'
    description: string
    recipient?: string
    txHash: string
    created_at?: string
}

export default function AssetDetailPage() {
    const { id } = useParams()

    const [asset, setAsset]     = useState<any>(null)
    const [history, setHistory] = useState<HistoryItem[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchData()
    }, [id])

    const fetchData = async () => {
        setLoading(true)
        try {
            // 1. Ambil data Asset Utama
            const { data: assetData } = await supabase
                .from('assets')
                .select('*')
                .eq('id', id)
                .single()

            setAsset(assetData)

            if (assetData) {
                // 2. Ambil data Riwayat Distribusi/Benefit langsung dari Supabase
                // Sesuaikan nama tabel 'distributions' atau nama tabel riwayat Anda jika berbeda
                const { data: benefitLogs } = await supabase
                    .from('distributions')
                    .select('*')
                    .eq('asset_id', id) // Berdasarkan ID Asset relasi di Supabase

                // Format data dari database agar sesuai dengan struktur tampilan timeline
                const formattedBenefits: HistoryItem[] = (benefitLogs || []).map((item: any) => ({
                    type: 'benefit',
                    description: item.description || item.notes || 'Distribusi manfaat wakaf',
                    recipient: item.recipient_name || item.recipient,
                    txHash: item.tx_hash || item.txHash || '',
                    created_at: item.created_at
                }))

                // Gabungkan riwayat (jika ada tabel khusus aktivitas lain, bisa di-fetch & digabungkan di sini)
                const combinedHistory = [...formattedBenefits].sort(
                    (a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
                )

                setHistory(combinedHistory)
            }
        } catch (error) {
            console.error("Gagal memuat riwayat aset:", error)
        } finally {
            setLoading(false)
        }
    }

    if (loading) return (
        <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
            <p className="text-sm text-neutral-400">Loading...</p>
        </div>
    )

    if (!asset) return (
        <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
            <p className="text-sm text-neutral-400">Asset not found.</p>
        </div>
    )

    const statusColor: Record<string, string> = {
        approved: 'bg-green-50 text-green-700 border-green-200',
        pending:  'bg-amber-50 text-amber-700 border-amber-200',
        rejected: 'bg-red-50 text-red-600 border-red-200',
    }

    const activities  = history.filter(h => h.type?.toLowerCase() === 'activity')
    const benefits    = history.filter(h => h.type?.toLowerCase() === 'benefit')

    return (
        <div className="min-h-screen bg-neutral-50 p-6">
            <div className="max-w-3xl mx-auto space-y-4">

                {/* Back */}
                <Link
                    href="/dashboard/nazhir/assets"
                    className="inline-flex items-center gap-1.5 text-[12px] text-neutral-400 hover:text-neutral-700 transition-colors mb-1"
                >
                    <ArrowLeft size={13} /> Back to Assets
                </Link>

                {/* Header card */}
                <div className="bg-white border border-neutral-200 rounded-xl p-5">
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <p className="text-[11px] font-medium tracking-widest uppercase text-neutral-400 mb-1">
                                Asset Detail
                            </p>
                            <h1 className="text-[20px] font-semibold text-neutral-900 mb-2">
                                {asset.name}
                            </h1>
                            <div className="flex flex-wrap items-center gap-3 text-[12px] text-neutral-400">
                                {asset.asset_type && (
                                    <span className="flex items-center gap-1">
                                        <Tag size={11} /> {asset.asset_type}
                                    </span>
                                )}
                                {asset.location && (
                                    <span className="flex items-center gap-1">
                                        <MapPin size={11} /> {asset.location}
                                    </span>
                                )}
                            </div>
                        </div>
                        <span className={`shrink-0 text-[11px] font-medium px-2.5 py-1 rounded-full border ${statusColor[asset.status] ?? 'bg-neutral-100 text-neutral-500 border-neutral-200'}`}>
                            {asset.status}
                        </span>
                    </div>

                    {asset.ipfs_url && (
                        <a
                            href={asset.ipfs_url}
                            target="_blank"
                            rel="noreferrer"
                            className="mt-4 inline-flex items-center gap-1.5 text-[12px] text-blue-600 hover:underline"
                        >
                            <FileText size={12} /> View IPFS Document <ExternalLink size={11} />
                        </a>
                    )}
                </div>

                {/* Stats row */}
                <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white border border-neutral-200 rounded-xl p-4">
                        <p className="text-[10px] font-medium tracking-widest uppercase text-neutral-400 mb-2">Activities</p>
                        <div className="flex items-end gap-2">
                            <p className="text-[32px] font-semibold text-neutral-900 leading-none">{activities.length}</p>
                            <Activity size={16} className="text-neutral-300 mb-1" />
                        </div>
                    </div>
                    <div className="bg-white border border-neutral-200 rounded-xl p-4">
                        <p className="text-[10px] font-medium tracking-widest uppercase text-neutral-400 mb-2">Distributions</p>
                        <div className="flex items-end gap-2">
                            <p className="text-[32px] font-semibold text-green-700 leading-none">{benefits.length}</p>
                            <Gift size={16} className="text-green-200 mb-1" />
                        </div>
                    </div>
                </div>

                {/* Timeline */}
                <div className="bg-white border border-neutral-200 rounded-xl p-5">
                    <p className="text-[13px] font-semibold text-neutral-800 mb-4">Activity Timeline</p>

                    {history.length === 0 && (
                        <div className="py-8 text-center">
                            <Clock size={20} className="text-neutral-200 mx-auto mb-2" />
                            <p className="text-[12px] text-neutral-400">No activity recorded yet.</p>
                        </div>
                    )}

                    <div className="relative">
                        {/* vertical line */}
                        {history.length > 0 && (
                            <div className="absolute left-[7px] top-2 bottom-2 w-[1.5px] bg-neutral-100" />
                        )}

                        <div className="space-y-4">
                            {history.map((item, i) => {
                                const isActivity = item.type?.toLowerCase() === 'activity';
                                return (
                                    <div key={i} className="flex gap-4 relative">
                                        {/* dot */}
                                        <div className={`w-4 h-4 rounded-full border-2 border-white shadow-sm shrink-0 mt-0.5 z-10 ${
                                            isActivity ? 'bg-neutral-700' : 'bg-green-500'
                                        }`} />

                                        <div className="flex-1 pb-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${
                                                    isActivity
                                                        ? 'bg-neutral-50 text-neutral-600 border-neutral-200'
                                                        : 'bg-green-50 text-green-700 border-green-200'
                                                }`}>
                                                    {isActivity ? 'Activity' : 'Benefit'}
                                                </span>
                                            </div>

                                            <p className="text-[13px] text-neutral-700 mb-1.5">
                                                {item.description}
                                            </p>

                                            {item.recipient && (
                                                <p className="text-[11px] text-neutral-400 font-mono mb-1">
                                                    → {item.recipient}
                                                </p>
                                            )}

                                            {item.txHash && (
                                                <a
                                                    href={`https://sepolia.etherscan.io/tx/${item.txHash}`}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="inline-flex items-center gap-1 text-[11px] text-blue-500 hover:underline font-mono"
                                                >
                                                    {item.txHash.slice(0, 14)}… <ExternalLink size={10} />
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                </div>

            </div>
        </div>
    )
}