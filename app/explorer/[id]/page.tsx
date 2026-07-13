'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { publicClient } from '@/lib/publicClient'
import { parseAbiItem } from 'viem'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import {
    MapPin, Tag, FileText, ExternalLink,
    Activity, Gift, ArrowLeft, ShieldCheck
} from 'lucide-react'

const activityEvent = parseAbiItem(
    'event ActivityRecorded(uint256 indexed assetId, string description)'
)

const benefitEvent = parseAbiItem(
    'event BenefitDistributed(uint256 indexed assetId, address recipient)'
)

export default function ExplorerDetailPage() {
    const { id } = useParams()

    const [asset, setAsset] = useState<any>(null)
    const [activities, setActivities] = useState<any[]>([])
    const [benefits, setBenefits] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    const fetchAsset = async () => {
        setLoading(true)
        try {
            const { data } = await supabase
                .from('assets')
                .select('*')
                .eq('id', id)
                .single()
            setAsset(data)
        } catch (error) {
            console.error("Error fetching asset:", error)
        } finally {
            setLoading(false)
        }
    }

    const fetchLogsData = async (registry: string | null, onchainId: any) => {
        let actAll: any[] = []
        let benAll: any[] = []

        const validId = onchainId !== undefined && onchainId !== null ? BigInt(onchainId) : null

        // 1. STRATEGI UTAMA: Coba ambil log on-chain SEKALI SAJA tanpa loop (10 block terakhir) jika contract tersedia
        if (registry && validId !== null) {
            try {
                const latest = await publicClient.getBlockNumber()
                const startBlock = latest - BigInt(9) < 0n ? 0n : latest - BigInt(9)

                const [act, ben] = await Promise.all([
                    publicClient.getLogs({
                        address: registry as `0x${string}`,
                        event: activityEvent,
                        args: { assetId: validId },
                        fromBlock: startBlock,
                        toBlock: latest
                    }),
                    publicClient.getLogs({
                        address: registry as `0x${string}`,
                        event: benefitEvent,
                        args: { assetId: validId },
                        fromBlock: startBlock,
                        toBlock: latest
                    })
                ])
                actAll = [...act]
                benAll = [...ben]
            } catch (e) {
                console.warn("Gagal mengambil realtime blockchain logs (Alchemy limit), beralih ke database...", e)
            }
        }

        // 2. STRATEGI FALLBACK MUTLAK: Jika on-chain kosong atau gagal/terkena rate-limit, ambil data lengkap dari Supabase
        if (actAll.length === 0 && benAll.length === 0) {
            console.log("Mengambil riwayat dari database Supabase...")
            try {
                const [resAct, resDist] = await Promise.all([
                    supabase.from('activities').select('*').eq('asset_id', id).order('created_at', { ascending: false }),
                    supabase.from('distributions').select('*').eq('asset_id', id).order('created_at', { ascending: false })
                ])

                if (resAct.data) {
                    actAll = resAct.data.map((item: any) => ({
                        args: { assetId: onchainId || 0, description: item.description || item.notes || 'Aktivitas tercatat' },
                        transactionHash: item.tx_hash || item.transaction_hash || '0x00000000...database'
                    }))
                }

                if (resDist.data) {
                    benAll = resDist.data.map((item: any) => ({
                        args: { assetId: onchainId || 0, recipient: item.recipient_name || item.recipient || 'Penerima Manfaat' },
                        transactionHash: item.tx_hash || item.transaction_hash || '0x00000000...database'
                    }))
                }
            } catch (supErr) {
                console.error("Gagal memuat data dari Supabase:", supErr)
            }
        }

        setActivities(actAll)
        setBenefits(benAll)
    }

    useEffect(() => {
        fetchAsset()
    }, [id])

    useEffect(() => {
        if (asset) {
            const actualOnchainId = asset.onchain_id ?? asset.on_chain_id ?? asset.onchainId ?? null;
            const actualRegistry = asset.registry_address ?? asset.registryAddress ?? null;

            fetchLogsData(actualRegistry, actualOnchainId)
        }
    }, [asset])

    if (loading) return (
        <div className="min-h-screen bg-[#f7f9fb] flex items-center justify-center">
            <p className="text-sm text-gray-400 animate-pulse">Loading Asset Data...</p>
        </div>
    )

    if (!asset) return (
        <div className="min-h-screen bg-[#f7f9fb] flex items-center justify-center">
            <p className="text-sm text-gray-400">Asset not found.</p>
        </div>
    )

    return (
        <div className="min-h-screen bg-[#f7f9fb]">

            {/* TOP NAVIGATION BAR */}
            <div className="bg-white border-b border-gray-200">
                <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-lg bg-emerald-600 flex items-center justify-center">
                            <ShieldCheck size={14} className="text-white" />
                        </div>
                        <span className="font-bold text-gray-900 text-[15px]">WaqfChain</span>
                        <span className="text-gray-300 text-sm">/</span>
                        <Link href="/explorer" className="text-[13px] text-gray-500 hover:text-emerald-600 transition-colors">
                            Explorer
                        </Link>
                        <span className="text-gray-300 text-sm">/</span>
                        <span className="text-[13px] text-gray-400 truncate max-w-[120px] font-mono">{asset.id}</span>
                    </div>
                    <div className="flex items-center gap-2 text-[12px] text-gray-400">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                        </span>
                        <span>Sepolia Testnet</span>
                    </div>
                </div>
            </div>

            {/* MAIN CONTENT AREA */}
            <div className="max-w-5xl mx-auto px-6 py-8 space-y-4">

                {/* BACK BUTTON */}
                <Link
                    href="/explorer"
                    className="inline-flex items-center gap-1.5 text-[12px] text-gray-400 hover:text-gray-700 transition-colors"
                >
                    <ArrowLeft size={13} /> Back to Explorer
                </Link>

                {/* HEADER ASSET CARD */}
                <div className="bg-white border border-gray-200 rounded-xl p-5">
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <p className="text-[11px] font-medium tracking-widest uppercase text-gray-400 mb-1">
                                Asset Detail
                            </p>
                            <h1 className="text-[20px] font-semibold text-gray-900 mb-2">
                                {asset.name}
                            </h1>
                            <div className="flex flex-wrap items-center gap-3 text-[12px] text-gray-400">
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
                        <span className="shrink-0 text-[10px] px-2.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full font-medium">
                            Verified Asset
                        </span>
                    </div>

                    {asset.ipfs_url && (
                        <a
                            href={asset.ipfs_url}
                            target="_blank"
                            rel="noreferrer"
                            className="mt-4 inline-flex items-center gap-1.5 text-[12px] text-emerald-600 hover:underline font-medium"
                        >
                            <FileText size={12} /> View Document (IPFS) <ExternalLink size={11} />
                        </a>
                    )}
                </div>

                {/* COUNTER STATS ROW */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white border border-gray-200 rounded-xl p-4">
                        <p className="text-[10px] font-medium tracking-widest uppercase text-gray-400 mb-2">Activities</p>
                        <div className="flex items-end gap-2">
                            <p className="text-[28px] font-bold text-gray-900 leading-none">{activities.length}</p>
                            <Activity size={16} className="text-gray-300 mb-1" />
                        </div>
                    </div>
                    <div className="bg-white border border-gray-200 rounded-xl p-4">
                        <p className="text-[10px] font-medium tracking-widest uppercase text-gray-400 mb-2">Total Distributions</p>
                        <div className="flex items-end gap-2">
                            <p className="text-[28px] font-bold text-emerald-700 leading-none">{benefits.length}</p>
                            <Gift size={16} className="text-emerald-200 mb-1" />
                        </div>
                    </div>
                </div>

                {/* LOGS GRID COMPONENT */}
                <div className="grid md:grid-cols-2 gap-4">

                    {/* ACTIVITY LIST */}
                    <div className="bg-white border border-gray-200 rounded-xl p-5">
                        <div className="flex items-center gap-2 mb-4">
                            <Activity size={14} className="text-gray-400" />
                            <h2 className="text-[13px] font-semibold text-gray-800">📜 Activity Logs</h2>
                        </div>

                        <div className="space-y-2.5 max-h-[350px] overflow-y-auto pr-1">
                            {activities.length > 0 ? activities.map((log, i) => (
                                <div key={i} className="p-3 bg-gray-50/60 border border-gray-100 rounded-lg text-[12px] hover:bg-gray-50 transition">
                                    <div className="flex items-center justify-between text-gray-400 font-mono text-[11px] mb-1">
                                        <span>Asset ID: {log.args.assetId?.toString()}</span>
                                        {log.transactionHash && log.transactionHash !== '0x00000000...database' ? (
                                            <a
                                                href={`https://sepolia.etherscan.io/tx/${log.transactionHash}`}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="text-blue-500 hover:underline flex items-center gap-0.5"
                                            >
                                                {log.transactionHash.slice(0, 8)}... <ExternalLink size={10} />
                                            </a>
                                        ) : (
                                            <span className="text-gray-400 text-[10px]">Database Record</span>
                                        )}
                                    </div>
                                    <p className="text-gray-700 font-medium">{log.args.description}</p>
                                </div>
                            )) : (
                                <div className="py-12 text-center text-gray-400 text-[12px]">
                                    Belum ada aktivitas terdeteksi
                                </div>
                            )}
                        </div>
                    </div>

                    {/* BENEFIT/DISTRIBUTION LIST */}
                    <div className="bg-white border border-gray-200 rounded-xl p-5">
                        <div className="flex items-center gap-2 mb-4">
                            <Gift size={14} className="text-emerald-500" />
                            <h2 className="text-[13px] font-semibold text-gray-800">💸 Distributions</h2>
                        </div>

                        <div className="space-y-2.5 max-h-[350px] overflow-y-auto pr-1">
                            {benefits.length > 0 ? benefits.map((log, i) => (
                                <div key={i} className="p-3 bg-gray-50/60 border border-gray-100 rounded-lg text-[12px] hover:bg-emerald-50/20 transition">
                                    <p className="text-emerald-700 font-mono text-[11px] font-medium truncate mb-1">
                                        Recipient: {log.args.recipient}
                                    </p>
                                    <div className="flex items-center justify-between text-gray-400 text-[11px]">
                                        <span className="font-mono">
                                            {log.transactionHash !== '0x00000000...database'
                                                ? `Tx: ${log.transactionHash.slice(0, 10)}...`
                                                : 'Database Record'}
                                        </span>
                                        {log.transactionHash && log.transactionHash !== '0x00000000...database' && (
                                            <a
                                                href={`https://sepolia.etherscan.io/tx/${log.transactionHash}`}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="text-blue-500 hover:underline"
                                            >
                                                View Tx <ExternalLink size={9} className="inline" />
                                            </a>
                                        )}
                                    </div>
                                </div>
                            )) : (
                                <div className="py-12 text-center text-gray-400 text-[12px]">
                                    Belum ada distribusi terdeteksi
                                </div>
                            )}
                        </div>
                    </div>

                </div>

            </div>
        </div>
    )
}