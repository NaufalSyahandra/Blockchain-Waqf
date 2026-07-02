'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useUser } from '@/hooks/useUser'
import { useWalletSync } from '@/hooks/useWalletSync'
import { useTxTracker } from '@/hooks/useTxTracker'

import {
    useAccount,
    useDisconnect,
    useChainId,
    useSwitchChain,
} from 'wagmi'

import {
    Copy,
    LogOut,
    ExternalLink,
    AlertTriangle,
    ChevronDown,
} from 'lucide-react'

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
    DropdownMenuLabel,
} from '@/components/ui/dropdown-menu'

import { SidebarTrigger } from '@/components/ui/sidebar'

import { SEPOLIA_ID } from '@/lib/contracts'

function shortenAddress(addr: string) {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`
}

export default function Navbar() {
    const { user } = useUser()
    const { address, isConnected } = useAccount()
    const { disconnect } = useDisconnect()
    const chainId = useChainId()
    const { switchChain } = useSwitchChain()
    const { txs } = useTxTracker()

    const [mounted, setMounted] = useState(false)

    useWalletSync()

    useEffect(() => { setMounted(true) }, [])

    const isWrongNetwork = isConnected && chainId !== SEPOLIA_ID

    const copyAddress = () => {
        if (address) navigator.clipboard.writeText(address)
    }

    const openEtherscan = () => {
        if (address) window.open(`https://sepolia.etherscan.io/address/${address}`)
    }

    const roleLabel: Record<string, string> = {
        wakif: 'Wakif',
        nazhir: 'Nazhir',
        sharia: 'Sharia Council',
    }

    return (
        <nav className="h-14 bg-white border-b border-neutral-200 px-5 flex items-center justify-between gap-4">

            {/* LEFT — trigger + title */}
            <div className="flex items-center gap-3">
                <SidebarTrigger className="text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 rounded-md" />
                <div>
                    <p className="text-[15px] font-semibold leading-none text-neutral-800">
                        Dashboard
                    </p>
                    {user?.role && (
                        <p className="text-[10px] font-medium tracking-widest uppercase text-neutral-400 mt-0.5">
                            {roleLabel[user.role] ?? user.role}
                        </p>
                    )}
                </div>
            </div>

            {/* CENTER — nav links */}
            <div className="hidden md:flex items-center gap-6">
                <Link
                    href="/explorer"
                    className="text-[12px] font-medium text-neutral-500 hover:text-neutral-800 transition-colors pb-0.5 border-b border-transparent hover:border-neutral-800"
                >
                    Explorer
                </Link>
                <Link
                    href="/docs"
                    className="text-[12px] font-medium text-neutral-500 hover:text-neutral-800 transition-colors pb-0.5 border-b border-transparent hover:border-neutral-800"
                >
                    Docs
                </Link>
            </div>

            {/* RIGHT — network + wallet */}
            <div className="flex items-center gap-2">

                {/* Network badge */}
                {mounted && (
                    isWrongNetwork ? (
                        <button
                            onClick={() => switchChain({ chainId: SEPOLIA_ID })}
                            className="flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-lg bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 transition-colors"
                        >
                            <AlertTriangle size={11} strokeWidth={2} />
                            Wrong Network
                        </button>
                    ) : (
                        <span className="text-[11px] font-medium px-2.5 py-1 rounded-lg bg-green-50 text-green-700 border border-green-200">
                            Sepolia
                        </span>
                    )
                )}

                {/* Connect wallet */}
                {mounted && !isConnected && (
                    <button
                        onClick={() => window.dispatchEvent(new Event('connect-wallet'))}
                        className="text-[12px] font-medium px-4 py-1.5 rounded-lg bg-neutral-900 text-white hover:bg-neutral-700 transition-colors"
                    >
                        Connect Wallet
                    </button>
                )}

                {/* Wallet dropdown */}
                {mounted && isConnected && address && (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button className="flex items-center gap-1.5 text-[12px] font-medium px-3 py-1.5 rounded-lg bg-neutral-100 text-neutral-700 border border-neutral-200 hover:bg-neutral-200 transition-colors">
                                <span className="font-mono text-[11px]">{shortenAddress(address)}</span>
                                <ChevronDown size={12} strokeWidth={2} className="text-neutral-400" />
                            </button>
                        </DropdownMenuTrigger>

                        <DropdownMenuContent
                            align="end"
                            className="w-60 rounded-xl border-neutral-200 bg-white shadow-lg p-1"
                        >
                            {/* Address display */}
                            <div className="px-3 py-2.5 mb-1">
                                <p className="text-[10px] font-medium tracking-widest uppercase text-neutral-400 mb-1">
                                    Connected Wallet
                                </p>
                                <p className="text-[11px] font-mono text-neutral-600 break-all leading-relaxed">
                                    {address}
                                </p>
                            </div>

                            <DropdownMenuSeparator className="bg-neutral-100" />

                            <DropdownMenuItem
                                onClick={copyAddress}
                                className="flex items-center gap-2 text-[12px] text-neutral-700 rounded-lg cursor-pointer hover:bg-neutral-100 focus:bg-neutral-100"
                            >
                                <Copy size={13} strokeWidth={1.5} />
                                Copy Address
                            </DropdownMenuItem>

                            <DropdownMenuItem
                                onClick={openEtherscan}
                                className="flex items-center gap-2 text-[12px] text-neutral-700 rounded-lg cursor-pointer hover:bg-neutral-100 focus:bg-neutral-100"
                            >
                                <ExternalLink size={13} strokeWidth={1.5} />
                                View on Etherscan
                            </DropdownMenuItem>

                            {isWrongNetwork && (
                                <DropdownMenuItem
                                    onClick={() => switchChain({ chainId: SEPOLIA_ID })}
                                    className="flex items-center gap-2 text-[12px] text-red-600 rounded-lg cursor-pointer hover:bg-red-50 focus:bg-red-50"
                                >
                                    <AlertTriangle size={13} strokeWidth={1.5} />
                                    Switch to Sepolia
                                </DropdownMenuItem>
                            )}

                            <DropdownMenuItem
                                onClick={() => disconnect()}
                                className="flex items-center gap-2 text-[12px] text-red-600 rounded-lg cursor-pointer hover:bg-red-50 focus:bg-red-50"
                            >
                                <LogOut size={13} strokeWidth={1.5} />
                                Disconnect
                            </DropdownMenuItem>

                            {/* Recent transactions */}
                            {txs.length > 0 && (
                                <>
                                    <DropdownMenuSeparator className="bg-neutral-100" />
                                    <DropdownMenuLabel className="text-[10px] font-medium tracking-widest uppercase text-neutral-400 px-3 py-1.5">
                                        Recent Activity
                                    </DropdownMenuLabel>
                                    {txs.slice(0, 4).map((tx) => (
                                        <div
                                            key={tx.hash}
                                            className="flex justify-between items-center px-3 py-1.5"
                                        >
                                            <span className="font-mono text-[10.5px] text-neutral-500">
                                                {tx.hash.slice(0, 8)}…
                                            </span>
                                            <span className={`text-[10px] font-medium px-2 py-0.5 rounded-md ${
                                                tx.status === 'pending'
                                                    ? 'bg-amber-50 text-amber-700'
                                                    : tx.status === 'success'
                                                        ? 'bg-green-50 text-green-700'
                                                        : 'bg-red-50 text-red-600'
                                            }`}>
                                                {tx.status}
                                            </span>
                                        </div>
                                    ))}
                                </>
                            )}
                        </DropdownMenuContent>
                    </DropdownMenu>
                )}
            </div>
        </nav>
    )
}