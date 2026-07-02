'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useWriteContract } from 'wagmi'
import { REGISTRY_ABI } from '@/lib/contracts'
import { supabase } from '@/lib/supabase'
import { useUser } from '@/hooks/useUser'
import { uploadToIPFS } from '@/lib/ipfs'
import { waitForTransactionReceipt } from '@wagmi/core'
import { config } from '@/lib/wagmi'
import { decodeEventLog } from 'viem'
import { toast } from 'sonner'
import { useTxTracker } from '@/hooks/useTxTracker'
import { Badge } from '@/components/ui/badge'

// ─── Constants (defined outside component to avoid recreation) ────────────────
const ASSET_TYPES = [
    { value: 'tanah',     label: 'Tanah',     icon: '🏔️', desc: 'Lahan / Kavling' },
    { value: 'bangunan',  label: 'Bangunan',  icon: '🏛️', desc: 'Gedung / Properti' },
    { value: 'uang',      label: 'Uang',      icon: '💰', desc: 'Dana / Modal' },
    { value: 'kendaraan', label: 'Kendaraan', icon: '🚗', desc: 'Transportasi' },
    { value: 'lainnya',   label: 'Lainnya',   icon: '📦', desc: 'Aset lain' },
] as const

const STEPS = ['Lembaga', 'Detail Aset', 'Lokasi & Dokumen'] as const

// ─── Address Search Component ─────────────────────────────────────────────────
interface AddressInputProps {
    value: string
    onChange: (v: string) => void
    onCoordinatesFound: (lat: number, lng: number, display: string) => void
}

function AddressInput({ value, onChange, onCoordinatesFound }: AddressInputProps) {
    const [suggestions, setSuggestions] = useState<any[]>([])
    const [loading, setLoading] = useState(false)
    const [open, setOpen] = useState(false)
    const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined)
    const abortRef = useRef<AbortController>(undefined)

    const search = useCallback(async (q: string) => {
        if (q.length < 4) { setSuggestions([]); setOpen(false); return }

        // Cancel previous request
        abortRef.current?.abort()
        abortRef.current = new AbortController()

        setLoading(true)
        try {
            const res = await fetch(
                `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&addressdetails=1&limit=5&accept-language=id`,
                { headers: { 'Accept-Language': 'id' }, signal: abortRef.current.signal }
            )
            const data = await res.json()
            setSuggestions(data)
            setOpen(data.length > 0)
        } catch (e: any) {
            if (e.name !== 'AbortError') setSuggestions([])
        } finally {
            setLoading(false)
        }
    }, [])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const v = e.target.value
        onChange(v)
        clearTimeout(debounceRef.current)
        debounceRef.current = setTimeout(() => search(v), 400)
    }

    const handleSelect = useCallback((item: any) => {
        const display = item.display_name
        onChange(display)
        onCoordinatesFound(parseFloat(item.lat), parseFloat(item.lon), display)
        setSuggestions([])
        setOpen(false)
    }, [onChange, onCoordinatesFound])

    return (
        <div className="relative">
            <div className="relative">
                <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                     width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <input
                    type="text"
                    value={value}
                    onChange={handleChange}
                    onFocus={() => suggestions.length > 0 && setOpen(true)}
                    onBlur={() => setTimeout(() => setOpen(false), 150)}
                    placeholder="Cari alamat, kelurahan, atau kota..."
                    className="w-full pl-10 pr-10 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1B4332]/25 focus:border-[#1B4332] transition-all"
                />
                {loading && (
                    <div className="absolute right-3.5 top-1/2 -translate-y-1/2">
                        <div className="w-4 h-4 border-2 border-[#1B4332] border-t-transparent rounded-full animate-spin" />
                    </div>
                )}
            </div>

            {open && suggestions.length > 0 && (
                <div className="absolute z-50 w-full mt-1.5 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
                    {suggestions.map((item, i) => {
                        const parts = item.display_name.split(', ')
                        const main = parts.slice(0, 2).join(', ')
                        const sub  = parts.slice(2).join(', ')
                        return (
                            <button key={i} type="button" onMouseDown={() => handleSelect(item)}
                                    className="w-full text-left px-4 py-3.5 hover:bg-green-50 border-b border-gray-100 last:border-0 transition-colors">
                                <div className="flex items-start gap-3">
                                    <div className="mt-0.5 w-6 h-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                                        <svg width="12" height="12" fill="none" stroke="#16A34A" strokeWidth="2" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                        </svg>
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-sm font-medium text-gray-900 truncate">{main}</p>
                                        <p className="text-xs text-gray-500 truncate mt-0.5">{sub}</p>
                                    </div>
                                </div>
                            </button>
                        )
                    })}
                </div>
            )}
        </div>
    )
}

// ─── Step Indicator ───────────────────────────────────────────────────────────
function StepIndicator({ current }: { current: number }) {
    return (
        <div className="flex items-center mb-10">
            {STEPS.map((label, i) => {
                const idx  = i + 1
                const done = current > idx
                const active = current === idx
                return (
                    <div key={i} className="flex items-center flex-1 last:flex-none">
                        <div className="flex flex-col items-center gap-1.5">
                            <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300 ${
                                done   ? 'bg-[#1B4332] text-white' :
                                    active ? 'bg-[#1B4332] text-white ring-4 ring-[#1B4332]/15' :
                                        'bg-gray-100 text-gray-400'
                            }`}>
                                {done ? (
                                    <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                        <polyline points="20,6 9,17 4,12" />
                                    </svg>
                                ) : idx}
                            </div>
                            <span className={`text-xs font-medium whitespace-nowrap ${active ? 'text-[#1B4332]' : 'text-gray-400'}`}>
                                {label}
                            </span>
                        </div>
                        {i < STEPS.length - 1 && (
                            <div className={`flex-1 h-0.5 mb-6 mx-3 transition-all duration-500 ${done ? 'bg-[#1B4332]' : 'bg-gray-200'}`} />
                        )}
                    </div>
                )
            })}
        </div>
    )
}

// ─── Summary Row ──────────────────────────────────────────────────────────────
function SummaryRow({ label, value }: { label: string; value?: string }) {
    return (
        <div className="flex justify-between items-center py-2.5 border-b border-gray-100 last:border-0">
            <span className="text-sm text-gray-500">{label}</span>
            <span className="text-sm font-medium text-gray-900">{value || '—'}</span>
        </div>
    )
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function WakifCreatePage() {
    const router = useRouter()
    const { user, loading } = useUser()
    const { writeContractAsync } = useWriteContract()
    const { addTx } = useTxTracker()

    const [step,             setStep]             = useState(1)
    const [registries,       setRegistries]       = useState<any[]>([])
    const [selectedRegistry, setSelectedRegistry] = useState('')
    const [name,             setName]             = useState('')
    const [type,             setType]             = useState('')
    const [address,          setAddress]          = useState('')
    const [lat,              setLat]              = useState<number | null>(null)
    const [lng,              setLng]              = useState<number | null>(null)
    const [file,             setFile]             = useState<File | null>(null)
    const [submitting,       setSubmitting]       = useState(false)

    useEffect(() => {
        supabase
            .from('registries')
            .select('id, name, description, registry_address')   // only needed cols
            .order('created_at', { ascending: false })
            .then(({ data, error }) => {
                if (error) { toast.error('Gagal ambil registry'); return }
                setRegistries(data || [])
            })
    }, [])

    const handleCoordinates = useCallback((la: number, ln: number, disp: string) => {
        setLat(la); setLng(ln); setAddress(disp)
    }, [])

    const handleNext = useCallback(() => {
        if (step === 1 && !selectedRegistry) return toast.error('Pilih lembaga wakaf terlebih dahulu')
        if (step === 2 && (!name.trim() || !type)) return toast.error('Isi nama dan pilih jenis aset')
        setStep(s => s + 1)
    }, [step, selectedRegistry, name, type])

    const handleSubmit = async () => {
        if (!file)             return toast.error('Upload dokumen terlebih dahulu')
        if (!selectedRegistry) return toast.error('Pilih lembaga wakaf')
        if (!name.trim())      return toast.error('Nama aset wajib diisi')
        if (!type)             return toast.error('Pilih jenis aset')
        if (!address)          return toast.error('Alamat wajib diisi')

        setSubmitting(true)
        let ipfsUrl = ''

        try {
            const tid = toast.loading('Mengunggah dokumen ke IPFS...')
            ipfsUrl = await uploadToIPFS(file)
            toast.success('Dokumen berhasil diunggah', { id: tid })
        } catch {
            toast.error('Gagal mengunggah dokumen')
            setSubmitting(false)
            return
        }

        try {
            const locationStr = lat && lng ? `${lat},${lng}` : address
            const hash = await writeContractAsync({
                address: selectedRegistry as `0x${string}`,
                abi: REGISTRY_ABI,
                functionName: 'registerAsset',
                args: [name, type, locationStr, ipfsUrl],
            })
            addTx(hash)

            const receipt = await waitForTransactionReceipt(config, { hash })
            let assetId: number | null = null

            for (const log of receipt.logs) {
                try {
                    const decoded = decodeEventLog({ abi: REGISTRY_ABI, data: log.data, topics: log.topics })
                    if (decoded.eventName === 'AssetRegistered')
                        assetId = Number((decoded.args as any).id)
                } catch {}
            }

            if (assetId === null) {
                toast.error('Gagal membaca ID aset dari blockchain')
                setSubmitting(false)
                return
            }

            const { error } = await supabase.from('assets').insert({
                registry_address: selectedRegistry,
                wakif_id:   user!.id,
                name,
                asset_type: type,
                location:   locationStr,
                ipfs_url:   ipfsUrl,
                tx_hash:    hash,
                status:     'pending',
                onchain_id: assetId,
            })

            if (error) { toast.error('Gagal menyimpan ke database'); setSubmitting(false); return }

            toast.success('Aset wakaf berhasil didaftarkan! 🎉')
            router.push('/dashboard/wakif')
        } catch (err) {
            console.error(err)
            toast.error('Transaksi gagal')
        } finally {
            setSubmitting(false)
        }
    }

    // ── Guards ─────────────────────────────────────────────────────────────────
    if (loading) return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-[#1B4332] border-t-transparent rounded-full animate-spin" />
        </div>
    )

    if (!user || user.role !== 'wakif') return (
        <div className="min-h-screen flex items-center justify-center">
            <p className="text-gray-500">Akses ditolak</p>
        </div>
    )

    const selectedReg = registries.find(r => r.registry_address === selectedRegistry)

    return (
        <div className="min-h-screen bg-gray-50 py-5 px-6">
            <div className="space-y-5 mx-auto">

                {/* Header */}
                <div className="mb-10">
                    <p className="text-xs font-semibold tracking-widest text-gray-400 uppercase mb-1.5">Wakif</p>
                    <h1 className="text-3xl font-bold text-gray-900">Daftarkan Aset Wakaf</h1>
                    <p className="text-sm text-gray-500 mt-1.5">Isi informasi aset untuk didaftarkan ke blockchain.</p>
                </div>

                {/* Step Indicator */}
                <StepIndicator current={step} />

                {/* Card */}
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">

                    {/* ── STEP 1: Pilih Lembaga ── */}
                    {step === 1 && (
                        <div className="p-10">
                            <h2 className="text-lg font-semibold text-gray-900 mb-1">Pilih Lembaga Wakaf</h2>
                            <p className="text-sm text-gray-500 mb-8">
                                Aset akan didaftarkan ke dalam smart contract lembaga yang dipilih.
                            </p>

                            <div className="space-y-3">
                                {registries.length === 0 && (
                                    <p className="text-sm text-gray-400 text-center py-12">Belum ada registry tersedia</p>
                                )}
                                {registries.map((r) => {
                                    const selected = selectedRegistry === r.registry_address
                                    return (
                                        <button key={r.id} type="button"
                                                onClick={() => setSelectedRegistry(r.registry_address)}
                                                className={`w-full text-left p-5 rounded-xl border-2 transition-all duration-200 ${
                                                    selected
                                                        ? 'border-[#1B4332] bg-green-50'
                                                        : 'border-gray-200 hover:border-green-200 hover:bg-gray-50'
                                                }`}>
                                            <div className="flex items-center justify-between gap-4">
                                                <div className="min-w-0">
                                                    <p className="text-sm font-semibold text-gray-900">{r.name}</p>
                                                    {r.description && (
                                                        <p className="text-xs text-gray-500 mt-0.5">{r.description}</p>
                                                    )}
                                                    <p className="text-xs text-gray-400 mt-1.5 font-mono">
                                                        {r.registry_address.slice(0, 10)}…{r.registry_address.slice(-8)}
                                                    </p>
                                                </div>
                                                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                                                    selected ? 'border-[#1B4332] bg-[#1B4332]' : 'border-gray-300'
                                                }`}>
                                                    {selected && (
                                                        <svg width="10" height="10" fill="none" stroke="white" strokeWidth="3" viewBox="0 0 24 24">
                                                            <polyline points="20,6 9,17 4,12" />
                                                        </svg>
                                                    )}
                                                </div>
                                            </div>
                                        </button>
                                    )
                                })}
                            </div>
                        </div>
                    )}

                    {/* ── STEP 2: Detail Aset ── */}
                    {step === 2 && (
                        <div className="p-10">
                            <h2 className="text-lg font-semibold text-gray-900 mb-1">Detail Aset</h2>
                            <p className="text-sm text-gray-500 mb-8">Informasi dasar tentang aset wakaf yang akan didaftarkan.</p>

                            <div className="space-y-7">
                                {/* Nama */}
                                <div>
                                    <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2.5">
                                        Nama Aset
                                    </label>
                                    <input
                                        type="text"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder="Contoh: Masjid Al-Ikhlas, Tanah Kavling Blok B"
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1B4332]/25 focus:border-[#1B4332] transition-all"
                                    />
                                </div>

                                {/* Jenis */}
                                <div>
                                    <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2.5">
                                        Jenis Aset
                                    </label>
                                    <div className="grid grid-cols-5 gap-3">
                                        {ASSET_TYPES.map((t) => (
                                            <button key={t.value} type="button" onClick={() => setType(t.value)}
                                                    className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all duration-200 ${
                                                        type === t.value
                                                            ? 'border-[#1B4332] bg-green-50'
                                                            : 'border-gray-200 hover:border-green-200 hover:bg-gray-50'
                                                    }`}>
                                                <span className="text-2xl">{t.icon}</span>
                                                <span className={`text-xs font-semibold ${type === t.value ? 'text-[#1B4332]' : 'text-gray-700'}`}>
                                                    {t.label}
                                                </span>
                                                <span className="text-[10px] text-gray-400 text-center leading-tight">
                                                    {t.desc}
                                                </span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ── STEP 3: Lokasi & Dokumen ── */}
                    {step === 3 && (
                        <div className="p-10">
                            <h2 className="text-lg font-semibold text-gray-900 mb-1">Lokasi & Dokumen</h2>
                            <p className="text-sm text-gray-500 mb-8">Masukkan alamat lengkap dan unggah dokumen pendukung aset.</p>

                            <div className="space-y-7">
                                {/* Address */}
                                <div>
                                    <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2.5">
                                        Alamat Aset
                                    </label>
                                    <AddressInput
                                        value={address}
                                        onChange={setAddress}
                                        onCoordinatesFound={handleCoordinates}
                                    />
                                    {lat && lng && (
                                        <div className="mt-2 flex items-center gap-1.5 text-xs text-green-600">
                                            <svg width="12" height="12" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                            </svg>
                                            <span>Koordinat: {lat.toFixed(6)}, {lng.toFixed(6)}</span>
                                        </div>
                                    )}
                                </div>

                                {/* File upload */}
                                <div>
                                    <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2.5">
                                        Dokumen Pendukung
                                    </label>
                                    <label className={`flex flex-col items-center justify-center w-full h-40 border-2 border-dashed rounded-xl cursor-pointer transition-all duration-200 ${
                                        file
                                            ? 'border-[#1B4332] bg-green-50'
                                            : 'border-gray-300 bg-gray-50 hover:border-[#1B4332]/50 hover:bg-green-50/40'
                                    }`}>
                                        {file ? (
                                            <div className="flex flex-col items-center gap-2 text-[#1B4332]">
                                                <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                                <p className="text-sm font-semibold">{file.name}</p>
                                                <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(1)} KB</p>
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-center gap-2 text-gray-400">
                                                <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                                                </svg>
                                                <p className="text-sm font-medium text-gray-600">Klik untuk unggah dokumen</p>
                                                <p className="text-xs">PDF, JPG, PNG — maks. 10MB</p>
                                            </div>
                                        )}
                                        <input type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png"
                                               onChange={(e) => setFile(e.target.files?.[0] || null)} />
                                    </label>
                                </div>

                                {/* Summary */}
                                <div className="bg-gray-50 rounded-xl border border-gray-200 p-5">
                                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Ringkasan</p>
                                    <SummaryRow label="Lembaga"   value={selectedReg?.name} />
                                    <SummaryRow label="Nama Aset" value={name} />
                                    <SummaryRow label="Jenis"     value={ASSET_TYPES.find(t => t.value === type)?.label} />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Footer / Navigation */}
                    <div className="px-10 py-5 bg-gray-50 border-t border-gray-200 flex justify-between items-center">
                        {step > 1 ? (
                            <button type="button" onClick={() => setStep(s => s - 1)}
                                    className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors">
                                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                                </svg>
                                Kembali
                            </button>
                        ) : <div />}

                        {step < 3 ? (
                            <button type="button" onClick={handleNext}
                                    className="flex items-center gap-2 px-7 py-2.5 bg-[#1B4332] text-white text-sm font-semibold rounded-xl hover:bg-[#14532D] transition-colors">
                                Lanjut
                                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                                </svg>
                            </button>
                        ) : (
                            <button type="button" onClick={handleSubmit} disabled={submitting}
                                    className="flex items-center gap-2 px-7 py-2.5 bg-[#1B4332] text-white text-sm font-semibold rounded-xl hover:bg-[#14532D] disabled:opacity-50 disabled:cursor-not-allowed transition-all">
                                {submitting ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                        Memproses...
                                    </>
                                ) : (
                                    <>
                                        <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                        </svg>
                                        Submit ke Blockchain
                                    </>
                                )}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}