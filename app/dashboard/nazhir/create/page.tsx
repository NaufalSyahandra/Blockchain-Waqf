'use client'

import { useEffect, useState } from 'react'
import {
    useAccount,
    useWriteContract,
    useBalance,
    useChainId,
    useSwitchChain,
} from 'wagmi'
import { sepolia } from 'wagmi/chains'
import { decodeEventLog } from 'viem'
import { publicClient } from '@/lib/publicClient'
import { FACTORY_ABI, FACTORY_ADDRESS } from '@/lib/contracts'
import { supabase } from '@/lib/supabase'
import { useUser } from '@/hooks/useUser'

import { motion, AnimatePresence } from 'framer-motion'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { AlertTriangle, CheckCircle2, Clock, ExternalLink } from 'lucide-react'

const STEPS = ['Details', 'Review', 'Deploy'] as const

export default function CreateRegistryPage() {
    const { user, loading } = useUser()
    const { address, isConnected } = useAccount()
    const { writeContractAsync } = useWriteContract()
    const { data: balance } = useBalance({ address })
    const chainId = useChainId()
    const { switchChain } = useSwitchChain()

    const [step, setStep]                 = useState(0)
    const [name, setName]                 = useState('')
    const [desc, setDesc]                 = useState('')
    const [txHash, setTxHash]             = useState<string | null>(null)
    const [txStatus, setTxStatus]         = useState<'idle' | 'pending' | 'success' | 'failed'>('idle')
    const [costEth, setCostEth]           = useState<number | null>(null)
    const [registryAddress, setRegistryAddress] = useState<string | null>(null)

    const isWrongNetwork = isConnected && chainId !== sepolia.id

    // ── Estimate gas ──────────────────────────────────────────
    useEffect(() => {
        if (!address || isWrongNetwork) return
        const estimate = async () => {
            try {
                const gas   = await publicClient.estimateContractGas({
                    address: FACTORY_ADDRESS as `0x${string}`,
                    abi: FACTORY_ABI,
                    functionName: 'createRegistry',
                    account: address,
                })
                const price = await publicClient.getGasPrice()
                const total = Number(gas * price) / 1e18
                setCostEth(Number(total.toFixed(5)))
            } catch {
                setCostEth(null)
            }
        }
        estimate()
    }, [address, isWrongNetwork])

    // ── Poll tx receipt + save to Supabase ────────────────────
    useEffect(() => {
        if (!txHash) return

        const interval = setInterval(async () => {
            try {
                const receipt = await publicClient.getTransactionReceipt({
                    hash: txHash as `0x${string}`,
                })

                if (receipt.status === 'success') {
                    clearInterval(interval)

                    // Decode RegistryCreated event untuk dapat registryAddress
                    let deployedAddress: string | null = null
                    for (const log of receipt.logs) {
                        try {
                            const decoded = decodeEventLog({
                                abi: FACTORY_ABI,
                                data: log.data,
                                topics: log.topics,
                            })
                            if (decoded.eventName === 'RegistryCreated') {
                                deployedAddress = (decoded.args as any).registryAddress
                                break
                            }
                        } catch {
                            // log bukan dari factory, skip
                        }
                    }

                    setRegistryAddress(deployedAddress)

                    // ── Save ke Supabase ──────────────────────
                    const { error } = await supabase.from('registries').insert({
                        name,
                        description:      desc || null,
                        registry_address: deployedAddress,
                        nazhir_id:        user?.id ?? null,
                        nazhir_address:   address,
                        tx_hash:          txHash,
                        network:          'sepolia',
                    })

                    if (error) {
                        console.error('[Supabase insert error]', error)
                        toast.error('Deployed, but failed to save to database.')
                    } else {
                        toast.success('Registry deployed and saved!')
                    }

                    setTxStatus('success')
                }
            } catch {
                // receipt belum ada, tunggu polling berikutnya
            }
        }, 4000)

        return () => clearInterval(interval)
    }, [txHash, name, desc, address, user])

    const handleDeploy = async () => {
        try {
            setTxStatus('pending')
            const hash = await writeContractAsync({
                address: FACTORY_ADDRESS as `0x${string}`,
                abi: FACTORY_ABI,
                functionName: 'createRegistry',
            })
            setTxHash(hash)
        } catch {
            setTxStatus('failed')
            toast.error('Transaction failed. Please try again.')
        }
    }

    const progress = ((step + 1) / STEPS.length) * 100

    if (loading) return (
        <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
            <p className="text-sm text-neutral-400">Loading...</p>
        </div>
    )

    if (!user) return (
        <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
            <p className="text-sm text-neutral-400">Unauthorized</p>
        </div>
    )

    return (
        <div className="min-h-screen bg-neutral-50 p-6">
            <div className="max-w-5xl mx-auto">

                {/* Page header */}
                <div className="mb-6">
                    <p className="text-[11px] font-medium tracking-widest uppercase text-neutral-400 mb-1">
                        Nazhir
                    </p>
                    <h1 className="text-[22px] font-semibold text-neutral-900">Create Registry</h1>
                    <p className="text-[13px] text-neutral-400 mt-1">
                        Deploy a new waqf asset registry smart contract on Sepolia.
                    </p>
                </div>

                {/* Wrong network banner */}
                {isWrongNetwork && (
                    <div className="mb-4 flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                        <AlertTriangle size={15} className="text-red-500 shrink-0" />
                        <p className="text-[12px] text-red-600 flex-1">
                            You&#39;re on the wrong network. Switch to Sepolia to continue.
                        </p>
                        <button
                            onClick={() => switchChain({ chainId: sepolia.id })}
                            className="text-[11px] font-medium px-3 py-1 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors"
                        >
                            Switch Network
                        </button>
                    </div>
                )}

                <div className="grid lg:grid-cols-3 gap-4">

                    {/* ── LEFT: Wizard ── */}
                    <div className="lg:col-span-2 space-y-4">

                        {/* Progress */}
                        <div className="bg-white border border-neutral-200 rounded-xl p-4">
                            <div className="flex items-center justify-between mb-3">
                                {STEPS.map((s, i) => (
                                    <div key={s} className="flex items-center gap-2">
                                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-medium transition-colors ${
                                            i < step
                                                ? 'bg-green-600 text-white'
                                                : i === step
                                                    ? 'bg-neutral-900 text-white'
                                                    : 'bg-neutral-100 text-neutral-400'
                                        }`}>
                                            {i < step ? '✓' : i + 1}
                                        </div>
                                        <span className={`text-[12px] font-medium ${
                                            i === step ? 'text-neutral-800' : 'text-neutral-400'
                                        }`}>{s}</span>
                                        {i < STEPS.length - 1 && (
                                            <div className={`w-12 h-[1px] mx-1 ${i < step ? 'bg-green-600' : 'bg-neutral-200'}`} />
                                        )}
                                    </div>
                                ))}
                            </div>
                            <div className="h-1 bg-neutral-100 rounded-full overflow-hidden">
                                <motion.div
                                    className="h-1 bg-green-600 rounded-full"
                                    animate={{ width: `${progress}%` }}
                                    transition={{ duration: 0.3 }}
                                />
                            </div>
                        </div>

                        {/* Step content */}
                        <div className="bg-white border border-neutral-200 rounded-xl p-6 min-h-[280px]">
                            <AnimatePresence mode="wait">

                                {/* Step 0 — Details */}
                                {step === 0 && (
                                    <motion.div
                                        key="step0"
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -20 }}
                                        className="space-y-4"
                                    >
                                        <div>
                                            <p className="text-[15px] font-semibold text-neutral-800 mb-1">Registry Details</p>
                                            <p className="text-[12px] text-neutral-400">Fill in the details for your waqf registry.</p>
                                        </div>
                                        <div className="space-y-3">
                                            <div>
                                                <label className="text-[11px] font-medium text-neutral-500 uppercase tracking-widest block mb-1.5">
                                                    Institution Name
                                                </label>
                                                <Input
                                                    placeholder="e.g. Yayasan Wakaf Nusantara"
                                                    value={name}
                                                    onChange={(e) => setName(e.target.value)}
                                                    className="rounded-lg border-neutral-200 text-[13px]"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-[11px] font-medium text-neutral-500 uppercase tracking-widest block mb-1.5">
                                                    Description
                                                </label>
                                                <Input
                                                    placeholder="Brief description of the registry"
                                                    value={desc}
                                                    onChange={(e) => setDesc(e.target.value)}
                                                    className="rounded-lg border-neutral-200 text-[13px]"
                                                />
                                            </div>
                                        </div>
                                        <Button
                                            onClick={() => setStep(1)}
                                            disabled={!name.trim()}
                                            className="w-full bg-neutral-900 hover:bg-neutral-700 text-white rounded-lg"
                                        >
                                            Continue →
                                        </Button>
                                    </motion.div>
                                )}

                                {/* Step 1 — Review */}
                                {step === 1 && (
                                    <motion.div
                                        key="step1"
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -20 }}
                                        className="space-y-4"
                                    >
                                        <div>
                                            <p className="text-[15px] font-semibold text-neutral-800 mb-1">Review</p>
                                            <p className="text-[12px] text-neutral-400">Confirm the details before deploying.</p>
                                        </div>
                                        <div className="border border-neutral-100 rounded-xl divide-y divide-neutral-100">
                                            {[
                                                { label: 'Institution Name', value: name },
                                                { label: 'Description',      value: desc || '—' },
                                                { label: 'Network',          value: 'Sepolia Testnet' },
                                                { label: 'Estimated Cost',   value: costEth != null ? `~${costEth} ETH` : 'Estimating...' },
                                            ].map(row => (
                                                <div key={row.label} className="flex items-center justify-between px-4 py-3">
                                                    <span className="text-[11px] font-medium text-neutral-400 uppercase tracking-widest">{row.label}</span>
                                                    <span className="text-[13px] text-neutral-700 font-medium">{row.value}</span>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="flex gap-2">
                                            <Button variant="outline" onClick={() => setStep(0)} className="flex-1 rounded-lg border-neutral-200 text-neutral-600">
                                                ← Back
                                            </Button>
                                            <Button onClick={() => setStep(2)} disabled={isWrongNetwork} className="flex-1 bg-neutral-900 hover:bg-neutral-700 text-white rounded-lg">
                                                Confirm
                                            </Button>
                                        </div>
                                    </motion.div>
                                )}

                                {/* Step 2 — Deploy */}
                                {step === 2 && (
                                    <motion.div
                                        key="step2"
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -20 }}
                                        className="space-y-4"
                                    >
                                        <div>
                                            <p className="text-[15px] font-semibold text-neutral-800 mb-1">Deploy</p>
                                            <p className="text-[12px] text-neutral-400">This will deploy a smart contract to Sepolia.</p>
                                        </div>

                                        {txStatus === 'idle' && (
                                            <div className="flex gap-2">
                                                <Button variant="outline" onClick={() => setStep(1)} className="flex-1 rounded-lg border-neutral-200 text-neutral-600">
                                                    ← Back
                                                </Button>
                                                <Button onClick={handleDeploy} disabled={isWrongNetwork} className="flex-1 bg-green-600 hover:bg-green-700 text-white rounded-lg">
                                                    Deploy Now
                                                </Button>
                                            </div>
                                        )}

                                        {(txStatus === 'pending') && txHash && (
                                            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-2">
                                                <div className="flex items-center gap-2">
                                                    <Clock size={14} className="text-amber-600 animate-pulse" />
                                                    <span className="text-[12px] font-medium text-amber-700">Transaction pending...</span>
                                                </div>
                                                <p className="text-[11px] font-mono text-neutral-500 break-all">{txHash}</p>
                                                <a href={`https://sepolia.etherscan.io/tx/${txHash}`} target="_blank" rel="noreferrer"
                                                   className="inline-flex items-center gap-1 text-[11px] text-blue-600 hover:underline">
                                                    View on Etherscan <ExternalLink size={11} />
                                                </a>
                                            </div>
                                        )}

                                        {txStatus === 'success' && txHash && (
                                            <div className="bg-green-50 border border-green-200 rounded-xl p-4 space-y-2">
                                                <div className="flex items-center gap-2">
                                                    <CheckCircle2 size={14} className="text-green-600" />
                                                    <span className="text-[12px] font-medium text-green-700">Registry deployed and saved!</span>
                                                </div>
                                                <p className="text-[11px] font-mono text-neutral-500 break-all">{txHash}</p>
                                                {registryAddress && (
                                                    <p className="text-[11px] text-neutral-400">
                                                        Contract: <span className="font-mono text-neutral-600">{registryAddress}</span>
                                                    </p>
                                                )}
                                                <a href={`https://sepolia.etherscan.io/tx/${txHash}`} target="_blank" rel="noreferrer"
                                                   className="inline-flex items-center gap-1 text-[11px] text-blue-600 hover:underline">
                                                    View on Etherscan <ExternalLink size={11} />
                                                </a>
                                            </div>
                                        )}

                                        {txStatus === 'failed' && (
                                            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <AlertTriangle size={14} className="text-red-500" />
                                                    <span className="text-[12px] font-medium text-red-600">Transaction failed</span>
                                                </div>
                                                <Button
                                                    onClick={() => { setTxStatus('idle'); setTxHash(null) }}
                                                    variant="outline"
                                                    className="text-[12px] rounded-lg border-red-200 text-red-600 hover:bg-red-50"
                                                >
                                                    Try Again
                                                </Button>
                                            </div>
                                        )}
                                    </motion.div>
                                )}

                            </AnimatePresence>
                        </div>
                    </div>

                    {/* ── RIGHT: Info panel ── */}
                    <div className="space-y-3">

                        <div className="bg-white border border-neutral-200 rounded-xl p-4">
                            <p className="text-[10px] font-medium tracking-widest uppercase text-neutral-400 mb-3">Wallet</p>
                            <p className="text-[12px] font-mono text-neutral-700">
                                {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : 'Not connected'}
                            </p>
                            {balance && (
                                <p className="text-[12px] text-neutral-400 mt-1.5">
                                    Balance: <span className="text-neutral-700 font-medium">{balance.formatted.slice(0, 7)} ETH</span>
                                </p>
                            )}
                        </div>

                        <div className="bg-green-600 rounded-xl p-4">
                            <p className="text-[10px] font-medium tracking-widest uppercase text-green-200 mb-2">Estimated Cost</p>
                            <p className="text-[28px] font-bold text-white leading-none">
                                {costEth != null ? `~${costEth}` : '—'}
                            </p>
                            <p className="text-[12px] text-green-200 mt-1">ETH (gas only)</p>
                        </div>

                        <div className="bg-white border border-neutral-200 rounded-xl p-4">
                            <p className="text-[10px] font-medium tracking-widest uppercase text-neutral-400 mb-3">Network</p>
                            {isWrongNetwork ? (
                                <div className="space-y-2">
                                    <div className="flex items-center gap-1.5 text-[12px] text-red-600">
                                        <AlertTriangle size={12} /> Wrong network
                                    </div>
                                    <button
                                        onClick={() => switchChain({ chainId: sepolia.id })}
                                        className="text-[11px] font-medium px-3 py-1.5 rounded-lg bg-neutral-900 text-white hover:bg-neutral-700 transition-colors w-full"
                                    >
                                        Switch to Sepolia
                                    </button>
                                </div>
                            ) : (
                                <div className="flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-green-500" />
                                    <span className="text-[12px] font-medium text-green-700">Sepolia testnet</span>
                                </div>
                            )}
                        </div>

                        <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-4">
                            <p className="text-[10px] font-medium tracking-widest uppercase text-neutral-400 mb-2">What happens?</p>
                            <ul className="space-y-1.5">
                                {[
                                    'A WaqfAssetRegistry contract is deployed',
                                    'You become the Nazhir of this registry',
                                    'Registry address is saved to database',
                                    'Assets can be registered under this registry',
                                ].map((item, i) => (
                                    <li key={i} className="flex items-start gap-2 text-[11.5px] text-neutral-500">
                                        <span className="text-green-500 mt-0.5">•</span>
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    )
}