'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { recordActivity, distributeBenefit } from '@/lib/registry'
import { useUser } from '@/hooks/useUser'
import Link from 'next/link'
import { Input } from '@/components/ui/input'
import { MapPin, Tag, ArrowUpRight, X, Zap, Gift, ChevronLeft, Building2 } from 'lucide-react'
import { toast } from 'sonner'

export default function NazhirAssetsPage() {
    const { user, loading } = useUser()

    const [registries, setRegistries]       = useState<any[]>([])
    const [selectedRegistry, setSelectedRegistry] = useState<any>(null)

    const [assets, setAssets]               = useState<any[]>([])
    const [assetsLoading, setAssetsLoading] = useState(false)

    const [selectedAsset, setSelectedAsset] = useState<any>(null)
    const [mode, setMode]                   = useState<'activity' | 'benefit' | null>(null)
    const [submitting, setSubmitting]       = useState(false)

    const [activityInput, setActivityInput] = useState('')
    const [benefitAddress, setBenefitAddress] = useState('')
    const [benefitDesc, setBenefitDesc]     = useState('')

    // Step 1: ambil semua registry milik nazhir ini
    useEffect(() => {
        if (user) fetchRegistries()
    }, [user])

    const fetchRegistries = async () => {
        const { data } = await supabase
            .from('registries')
            .select('*')
            .eq('nazhir_id', user.id)
            .order('created_at', { ascending: false })
        setRegistries(data || [])
    }

    // Step 2: setelah registry dipilih, baru ambil assets-nya
    const selectRegistry = async (registry: any) => {
        setSelectedRegistry(registry)
        setAssetsLoading(true)
        const { data } = await supabase
            .from('assets')
            .select('*')
            .eq('status', 'approved')
            .eq('registry_address', registry.registry_address)
            .order('created_at', { ascending: false })
        setAssets(data || [])
        setAssetsLoading(false)
    }

    const backToRegistries = () => {
        setSelectedRegistry(null)
        setAssets([])
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
                    selectedAsset.id,
                    selectedAsset.onchain_id,
                    user.id,
                    activityInput
                )
            }
            if (mode === 'benefit') {
                if (!benefitAddress || !benefitDesc) return
                await distributeBenefit(
                    selectedAsset.registry_address,
                    selectedAsset.id,
                    selectedAsset.onchain_id,
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
        <div className="bg-neutral-50 p-6">
            <div className="mx-auto">

                {/* ===== STEP 1: PILIH REGISTRY ===== */}
                {!selectedRegistry && (
                    <>
                        <div className="mb-8">
                            <p className="text-[11px] font-medium tracking-widest uppercase text-neutral-400 mb-1">
                                Nazhir
                            </p>
                            <h1 className="text-[22px] font-semibold text-neutral-900">Select Registry</h1>
                            <p className="text-[13px] text-neutral-400 mt-1">
                                Choose which registry you want to manage assets for.
                            </p>
                        </div>

                        {registries.length === 0 && (
                            <div className="bg-white border border-neutral-200 rounded-xl p-10 text-center">
                                <p className="text-[13px] text-neutral-400">You haven't created any registry yet.</p>
                            </div>
                        )}

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {registries.map((r) => (
                                <button
                                    key={r.id}
                                    onClick={() => selectRegistry(r)}
                                    className="group relative text-left bg-white border border-neutral-200 rounded-2xl p-5 overflow-hidden
                               hover:border-emerald-300 hover:shadow-[0_4px_20px_-4px_rgba(16,185,129,0.15)]
                               hover:-translate-y-0.5 transition-all duration-200"
                                >
                                    {/* subtle corner glow, muncul on hover */}
                                    <div className="absolute -top-8 -right-8 w-24 h-24 rounded-full bg-emerald-50 opacity-0
                                    group-hover:opacity-100 transition-opacity duration-300 blur-2xl" />

                                    <div className="relative flex items-start justify-between mb-4">
                                        <div className="w-11 h-11 rounded-xl bg-emerald-50 flex items-center justify-center
                                        group-hover:bg-emerald-100 transition-colors">
                                            <Building2 size={19} className="text-emerald-600" />
                                        </div>
                                        <ArrowUpRight
                                            size={16}
                                            className="text-neutral-300 group-hover:text-emerald-500 group-hover:translate-x-0.5
                                       group-hover:-translate-y-0.5 transition-all"
                                        />
                                    </div>

                                    <p className="relative text-[14px] font-semibold text-neutral-900 mb-1 truncate">
                                        {r.name}
                                    </p>
                                    <p className="relative text-[11px] text-neutral-400 font-mono truncate mb-4">
                                        {r.registry_address}
                                    </p>

                                    <div className="relative flex items-center gap-1.5 pt-3 border-t border-neutral-100">
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                        <span className="text-[10.5px] font-medium text-neutral-500 uppercase tracking-wide">
                            {r.network || 'sepolia'}
                        </span>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </>
                )}

                {/* ===== STEP 2: ASSETS DI DALAM REGISTRY TERPILIH ===== */}
                {selectedRegistry && (
                    <>
                        <button
                            onClick={backToRegistries}
                            className="flex items-center gap-1 text-[12px] font-medium text-neutral-500 hover:text-neutral-800 mb-4 transition-colors"
                        >
                            <ChevronLeft size={14} /> Back to registries
                        </button>

                        <div className="mb-6">
                            <p className="text-[11px] font-medium tracking-widest uppercase text-neutral-400 mb-1">
                                {selectedRegistry.name}
                            </p>
                            <h1 className="text-[22px] font-semibold text-neutral-900">Manage Assets</h1>
                            <p className="text-[13px] text-neutral-400 mt-1">
                                Approved waqf assets under this registry.
                            </p>
                        </div>

                        {assetsLoading && (
                            <div className="bg-white border border-neutral-200 rounded-xl p-10 text-center">
                                <p className="text-[13px] text-neutral-400">Loading assets...</p>
                            </div>
                        )}

                        {!assetsLoading && assets.length === 0 && (
                            <div className="bg-white border border-neutral-200 rounded-xl p-10 text-center">
                                <p className="text-[13px] text-neutral-400">No approved assets yet.</p>
                            </div>
                        )}

                        <div className="space-y-3">
                            {assets.map((a) => (
                                <div
                                    key={a.id}
                                    className="bg-white border border-neutral-200 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center gap-4"
                                >
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
                    </>
                )}
            </div>

            {/* Modal (tetap sama) */}
            {selectedAsset && mode && (
                <div
                    className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                    onClick={(e) => { if (e.target === e.currentTarget) closeModal() }}
                >
                    <div className="bg-white rounded-2xl border border-neutral-200 shadow-xl w-full max-w-md p-6">
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