'use client'

import '@rainbow-me/rainbowkit/styles.css'
import {
    RainbowKitProvider,
    ConnectButton,
} from '@rainbow-me/rainbowkit'
import { WagmiProvider } from 'wagmi'
import { config } from '@/lib/wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const queryClient = new QueryClient()

export default function Providers({ children }: any) {
    return (
        <WagmiProvider config={config}>
            <QueryClientProvider client={queryClient}>
                <RainbowKitProvider>

                    {/* 🔥 hidden trigger */}
                    <ConnectButton.Custom>
                        {({ openConnectModal }) => {
                            if (typeof window !== 'undefined') {
                                window.addEventListener('connect-wallet', openConnectModal)
                            }
                            return null
                        }}
                    </ConnectButton.Custom>

                    {children}

                </RainbowKitProvider>
            </QueryClientProvider>
        </WagmiProvider>
    )
}