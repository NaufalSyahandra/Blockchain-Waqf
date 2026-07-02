'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { recordActivity, distributeBenefit } from '@/lib/registry'
import { useUser } from '@/hooks/useUser'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { MapPin, Tag, ArrowUpRight, X, Zap, Gift } from 'lucide-react'
import { toast } from 'sonner'

export default function NazhirAssetsPage() {
    const { user, loading } = useUser()

    const [assets, setAssets]               = useState<any[]>([])
    const [selectedAsset, setSelectedAsset] = useState<any>(null)
    const [mode, setMode]                   = useState<'activity' | 'benefit' | null>(null)
    const [submitting, setSubmitting]       = useState(false)

    const [activityInput, setActivityInput] = useState('')
    const [benefitAddress, setBenefitAddress] = useState('')
    const [benefitDesc, setBenefitDesc]     = useState('')

    useEffect(() => {
        if (user) fetchAssets()
    }, [user])

    const fetchAssets = async () => {
        const { data } = await supabase
            .from('assets')
            .select('*')
            .eq('status', 'approved')
            .order('created_at', { ascending: false })
        setAssets(data || [])
    }

    const openModal = (asset: any, m: 'activity' | 'benefit') => {
        setSelectedAsset(asset)
        setMode(m)
    }

    const closeModal = () => {
        setSelectedAsset(null)
        setMode(null)
        setActivityInput('')
        setBenefitAddress('')
        setBenefitDesc('')
    }

    const handleSubmit = async () => {
        if (!selectedAsset) return
        setSubmitting(true)
        try {
            if (mode === 'activity') {
                if (!activityInput) return
                await recordActivity(
                    selectedAsset.registry_address,
                    selectedAsset.id,           // uuid supabase
                    selectedAsset.onchain_id,   // integer untuk contract
                    user.id,                    // actor_id
                    activityInput
                )
            }
            if (mode === 'benefit') {
                if (!benefitAddress || !benefitDesc) return
                await distributeBenefit(
                    selectedAsset.registry_address,
                    selectedAsset.id,           // uuid supabase
                    selectedAsset.onchain_id,   // integer untuk contract
                    benefitAddress as `0x${string}`,
                    benefitDesc
                )
            }
            toast.success('Transaction submitted!')
            closeModal()
        } catch (err) {
            console.error(err)
            toast.error('Transaction failed.')
        } finally {
            setSubmitting(false)
        }
    }

    if (loading) return (
        <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
            <p className="text-sm text-neutral-400">Loading...</p>
        </div>
    )

    if (!user || user.role !== 'nazhir') return (
        <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
            <p className="text-sm text-neutral-400">Access Denied</p>
        </div>
    )

    return (
        <div className="min-h-screen bg-neutral-50 p-6">
            <div className="max-w-4xl mx-auto">

                {/* Header */}
                <div className="mb-6">
                    <p className="text-[11px] font-medium tracking-widest uppercase text-neutral-400 mb-1">
                        Nazhir
                    </p>
                    <h1 className="text-[22px] font-semibold text-neutral-900">Manage Assets</h1>
                    <p className="text-[13px] text-neutral-400 mt-1">
                        Approved waqf assets under your registry.
                    </p>
                </div>

                {/* Empty state */}
                {assets.length === 0 && (
                    <div className="bg-white border border-neutral-200 rounded-xl p-10 text-center">
                        <p className="text-[13px] text-neutral-400">No approved assets yet.</p>
                    </div>
                )}

                {/* Asset list */}
                <div className="space-y-3">
                    {assets.map((a) => (
                        <div
                            key={a.id}
                            className="bg-white border border-neutral-200 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center gap-4"
                        >
                            {/* Info */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1.5">
                                    <span className="text-[13px] font-semibold text-neutral-800 truncate">
                                        {a.name}
                                    </span>
                                    <span className="shrink-0 text-[10px] font-medium px-2 py-0.5 rounded-full bg-green-50 text-green-700 border border-green-200">
                                        Approved
                                    </span>
                                </div>
                                <div className="flex items-center gap-3 text-[11.5px] text-neutral-400">
                                    {a.asset_type && (
                                        <span className="flex items-center gap-1">
                                            <Tag size={11} /> {a.asset_type}
                                        </span>
                                    )}
                                    {a.location && (
                                        <span className="flex items-center gap-1">
                                            <MapPin size={11} /> {a.location}
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-2 shrink-0">
                                <button
                                    onClick={() => openModal(a, 'activity')}
                                    className="flex items-center gap-1.5 text-[12px] font-medium px-3 py-1.5 rounded-lg bg-neutral-900 text-white hover:bg-neutral-700 transition-colors"
                                >
                                    <Zap size={12} /> Activity
                                </button>
                                <button
                                    onClick={() => openModal(a, 'benefit')}
                                    className="flex items-center gap-1.5 text-[12px] font-medium px-3 py-1.5 rounded-lg bg-green-600 text-white hover:bg-green-700 transition-colors"
                                >
                                    <Gift size={12} /> Benefit
                                </button>
                                <Link href={`/dashboard/assets/${a.id}`}>
                                    <button className="flex items-center gap-1 text-[12px] font-medium px-3 py-1.5 rounded-lg border border-neutral-200 text-neutral-600 hover:bg-neutral-50 transition-colors">
                                        View <ArrowUpRight size={12} />
                                    </button>
                                </Link>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Modal */}
            {selectedAsset && mode && (
                <div
                    className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                    onClick={(e) => { if (e.target === e.currentTarget) closeModal() }}
                >
                    <div className="bg-white rounded-2xl border border-neutral-200 shadow-xl w-full max-w-md p-6">

                        {/* Modal header */}
                        <div className="flex items-center justify-between mb-5">
                            <div>
                                <p className="text-[11px] font-medium tracking-widest uppercase text-neutral-400 mb-0.5">
                                    {selectedAsset.name}
                                </p>
                                <p className="text-[16px] font-semibold text-neutral-900">
                                    {mode === 'activity' ? 'Record Activity' : 'Distribute Benefit'}
                                </p>
                            </div>
                            <button
                                onClick={closeModal}
                                className="w-7 h-7 rounded-lg flex items-center justify-center text-neutral-400 hover:bg-neutral-100 transition-colors"
                            >
                                <X size={14} />
                            </button>
                        </div>

                        {/* Modal fields */}
                        <div className="space-y-3 mb-5">
                            {mode === 'activity' && (
                                <div>
                                    <label className="text-[11px] font-medium text-neutral-500 uppercase tracking-widest block mb-1.5">
                                        Activity Description
                                    </label>
                                    <Input
                                        placeholder="e.g. Renovasi atap masjid"
                                        value={activityInput}
                                        onChange={(e) => setActivityInput(e.target.value)}
                                        className="rounded-lg border-neutral-200 text-[13px]"
                                    />
                                </div>
                            )}

                            {mode === 'benefit' && (
                                <>
                                    <div>
                                        <label className="text-[11px] font-medium text-neutral-500 uppercase tracking-widest block mb-1.5">
                                            Recipient Address
                                        </label>
                                        <Input
                                            placeholder="0x..."
                                            value={benefitAddress}
                                            onChange={(e) => setBenefitAddress(e.target.value)}
                                            className="rounded-lg border-neutral-200 text-[13px] font-mono"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[11px] font-medium text-neutral-500 uppercase tracking-widest block mb-1.5">
                                            Description
                                        </label>
                                        <Input
                                            placeholder="e.g. Bantuan biaya pendidikan"
                                            value={benefitDesc}
                                            onChange={(e) => setBenefitDesc(e.target.value)}
                                            className="rounded-lg border-neutral-200 text-[13px]"
                                        />
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Modal actions */}
                        <div className="flex gap-2">
                            <button
                                onClick={closeModal}
                                className="flex-1 text-[12px] font-medium px-4 py-2 rounded-lg border border-neutral-200 text-neutral-600 hover:bg-neutral-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSubmit}
                                disabled={submitting}
                                className={`flex-1 text-[12px] font-medium px-4 py-2 rounded-lg text-white transition-colors ${
                                    mode === 'activity'
                                        ? 'bg-neutral-900 hover:bg-neutral-700'
                                        : 'bg-green-600 hover:bg-green-700'
                                } disabled:opacity-50`}
                            >
                                {submitting ? 'Submitting...' : 'Submit'}
                            </button>
                        </div>

                    </div>
                </div>
            )}
        </div>
    )
}