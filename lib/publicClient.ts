import { createPublicClient, http, webSocket } from 'viem'
import { sepolia } from 'wagmi/chains'

export const publicClient = createPublicClient({
    chain: sepolia,
    transport: http(process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL),
})

export const wsClient = createPublicClient({
    chain: sepolia,
    transport: webSocket(process.env.NEXT_PUBLIC_SEPOLIA_WS_URL),
})
