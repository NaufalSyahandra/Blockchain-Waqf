'use client'

import { ConnectButton } from '@rainbow-me/rainbowkit'

export default function Navbar() {
    return (
        <div className="flex items-center justify-between px-6 py-4 border-b bg-white">

            <div className="font-semibold text-lg">
                Ethical Architect
            </div>

            <div className="flex items-center gap-4">
                <ConnectButton />
            </div>
        </div>
    )
}