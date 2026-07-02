'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { publicClient } from '@/lib/publicClient'
import { parseAbiItem } from 'viem'
import { useParams } from 'next/navigation'
import ReactFlow, { Background, Controls } from 'reactflow'
import 'reactflow/dist/style.css'

const activityEvent = parseAbiItem(
    'event ActivityRecorded(uint256 indexed assetId, string description)'
)

const benefitEvent = parseAbiItem(
    'event BenefitDistributed(uint256 indexed assetId, address recipient)'
)

export default function ExplorerDetail() {
    const { id } = useParams()

    const [asset, setAsset] = useState<any>(null)
    const [activities, setActivities] = useState<any[]>([])
    const [benefits, setBenefits] = useState<any[]>([])
    const [nodes, setNodes] = useState<any[]>([])
    const [edges, setEdges] = useState<any[]>([])

    const fetchAsset = async () => {
        const { data } = await supabase
            .from('assets')
            .select('*')
            .eq('id', id)
            .single()
        setAsset(data)
    }

    const fetchLogs = async (registry: string) => {
        const latest = await publicClient.getBlockNumber()

        const STEP = BigInt(800)
        let actAll: any[] = []
        let benAll: any[] = []

        for (let start = latest - BigInt(2000); start < latest; start += STEP) {
            const end = start + STEP > latest ? latest : start + STEP
            try {
                const [act, ben] = await Promise.all([
                    publicClient.getLogs({ address: registry as `0x${string}`, event: activityEvent, fromBlock: start, toBlock: end }),
                    publicClient.getLogs({ address: registry as `0x${string}`, event: benefitEvent, fromBlock: start, toBlock: end })
                ])
                actAll = [...actAll, ...act]
                benAll = [...benAll, ...ben]
            } catch (e) { console.error(e) }
        }
        setActivities(actAll)
        setBenefits(benAll)
    }

    const buildGraph = () => {
        if (!asset) return
        const newNodes: any[] = []
        const newEdges: any[] = []

        newNodes.push({
            id: 'asset',
            data: { label: `🏠 ${asset.name}` },
            position: { x: 350, y: 50 },
            style: { background: '#16a34a', color: 'white', borderRadius: '8px', padding: '10px', width: 150 },
        })

        activities.forEach((log, i) => {
            const id = `act-${i}`
            newNodes.push({
                id,
                data: { label: '📜 Activity' },
                position: { x: 100 + i * 200, y: 180 },
            })
            newEdges.push({ id: `e-asset-${id}`, source: 'asset', target: id, animated: true })
        })

        benefits.forEach((log, i) => {
            const id = `ben-${i}`
            newNodes.push({
                id,
                data: { label: `💸 ${log.args.recipient?.slice(0, 6)}...` },
                position: { x: 100 + i * 200, y: 300 },
                style: { background: '#22c55e', color: 'white', borderRadius: '8px' },
            })
            newEdges.push({ id: `e-asset-${id}`, source: 'asset', target: id })
        })

        setNodes(newNodes)
        setEdges(newEdges)
    }

    useEffect(() => { fetchAsset() }, [])
    useEffect(() => { if (asset?.registry_address) fetchLogs(asset.registry_address) }, [asset])
    useEffect(() => { buildGraph() }, [asset, activities, benefits])

    if (!asset) return <div className="p-10 text-center animate-pulse">Loading Asset Data...</div>

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6 md:p-10">

            <div className="max-w-6xl mx-auto">

                {/* HEADER */}
                <div className="mb-10">
                    <p className="text-sm text-slate-500">
                        Explorer / {asset.asset_type}
                    </p>

                    <h1 className="text-3xl font-bold text-slate-900 mt-1">
                        {asset.name}
                    </h1>
                </div>

                <div className="grid lg:grid-cols-3 gap-6">

                    {/* LEFT */}
                    <div className="space-y-6">

                        <div className="bg-white/80 backdrop-blur p-6 rounded-2xl border shadow-sm">
                            <h2 className="font-semibold mb-4">Asset Information</h2>

                            <div className="space-y-3 text-sm">
                                <div>
                                    <p className="text-gray-400">Type</p>
                                    <p className="font-medium">{asset.asset_type}</p>
                                </div>

                                <div>
                                    <p className="text-gray-400">Location</p>
                                    <p className="font-medium">{asset.location}</p>
                                </div>

                                <div>
                                    <p className="text-gray-400">Status</p>
                                    <span className={`text-xs px-2 py-1 rounded-full ${
                                        asset.status === 'approved'
                                            ? 'bg-green-100 text-green-700'
                                            : asset.status === 'pending'
                                                ? 'bg-yellow-100 text-yellow-700'
                                                : 'bg-red-100 text-red-600'
                                    }`}>
                  {asset.status}
                </span>
                                </div>

                                <a
                                    href={asset.ipfs_url}
                                    target="_blank"
                                    className="text-blue-600 text-sm hover:underline"
                                >
                                    📄 View Document (IPFS)
                                </a>
                            </div>
                        </div>

                        <div className="bg-gradient-to-br from-green-600 to-green-800 text-white p-6 rounded-2xl shadow-md">
                            <p className="text-sm opacity-80">Total Distribution</p>
                            <p className="text-2xl font-bold mt-2">
                                {benefits.length} Recipients
                            </p>
                        </div>
                    </div>

                    {/* RIGHT */}
                    <div className="lg:col-span-2 space-y-6">

                        {/* GRAPH */}
                        <div className="bg-white/80 backdrop-blur p-6 rounded-2xl border shadow-sm">
                            <h2 className="font-semibold mb-4">
                                🧠 Waqf Flow Visualization
                            </h2>

                            <div className="rounded-xl overflow-hidden border bg-slate-50 h-[420px]">
                                <ReactFlow nodes={nodes} edges={edges} fitView>
                                    <Background />
                                    <Controls />
                                </ReactFlow>
                            </div>
                        </div>

                        {/* LOGS */}
                        <div className="grid md:grid-cols-2 gap-6">

                            {/* ACTIVITY */}
                            <div className="bg-white/80 backdrop-blur p-6 rounded-2xl border shadow-sm">
                                <h2 className="font-semibold mb-4">📜 Activity</h2>

                                <div className="space-y-3 max-h-[300px] overflow-y-auto">
                                    {activities.length > 0 ? activities.map((log, i) => (
                                        <div key={i} className="p-3 border rounded-lg text-xs hover:bg-gray-50 transition">
                                            <p className="text-blue-600 font-mono">
                                                {log.transactionHash.slice(0, 16)}...
                                            </p>
                                            <p className="text-gray-500">
                                                Asset ID: {log.args.assetId?.toString()}
                                            </p>
                                        </div>
                                    )) : (
                                        <p className="text-sm text-gray-400">
                                            Belum ada aktivitas
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* BENEFIT */}
                            <div className="bg-white/80 backdrop-blur p-6 rounded-2xl border shadow-sm">
                                <h2 className="font-semibold mb-4">💸 Distribution</h2>

                                <div className="space-y-3 max-h-[300px] overflow-y-auto">
                                    {benefits.length > 0 ? benefits.map((log, i) => (
                                        <div key={i} className="p-3 border rounded-lg text-xs hover:bg-gray-50 transition">
                                            <p className="text-green-600 font-medium">
                                                {log.args.recipient}
                                            </p>
                                            <p className="text-gray-400 font-mono">
                                                {log.transactionHash.slice(0, 16)}...
                                            </p>
                                        </div>
                                    )) : (
                                        <p className="text-sm text-gray-400">
                                            Belum ada distribusi
                                        </p>
                                    )}
                                </div>
                            </div>

                        </div>

                    </div>
                </div>
            </div>
        </div>
    )
}