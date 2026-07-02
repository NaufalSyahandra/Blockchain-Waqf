import { publicClient } from '@/lib/publicClient'
import { parseAbiItem } from 'viem'

const assetManagedEvent = parseAbiItem(
    'event AssetManaged(uint256 indexed id, string activity)'
)
const benefitDistributedEvent = parseAbiItem(
    'event BenefitDistributed(uint256 indexed id, address indexed to, string description)'
)

export const getAssetHistory = async (
    registryAddress: `0x${string}`,
    assetId: number
) => {
    try {
        const latest = await publicClient.getBlockNumber()

        const STEP   = BigInt(10)   // Alchemy free tier max 10 blocks
        const from   = latest - BigInt(100) > BigInt(0) ? latest - BigInt(100) : BigInt(0)

        let allLogs: any[] = []

        for (let start = from; start <= latest; start += STEP) {
            const end = start + STEP - BigInt(1) > latest ? latest : start + STEP - BigInt(1)
            try {
                const [managed, benefits] = await Promise.all([
                    publicClient.getLogs({
                        address: registryAddress,
                        event: assetManagedEvent,
                        args: { id: BigInt(assetId) },  // filter by assetId on-chain
                        fromBlock: start,
                        toBlock: end,
                    }),
                    publicClient.getLogs({
                        address: registryAddress,
                        event: benefitDistributedEvent,
                        args: { id: BigInt(assetId) },
                        fromBlock: start,
                        toBlock: end,
                    }),
                ])
                allLogs = [...allLogs, ...managed, ...benefits]
            } catch {
                // skip chunk error
            }
        }

        return allLogs
            .sort((a, b) => {
                const bBlock = b.blockNumber ?? BigInt(0)
                const aBlock = a.blockNumber ?? BigInt(0)
                if (bBlock > aBlock) return 1
                if (bBlock < aBlock) return -1
                return 0
            })
            .map((log: any) => {
                if (log.eventName === 'AssetManaged') {
                    return {
                        type:        'activity' as const,
                        description: log.args.activity,   // field 'activity' sesuai ABI
                        txHash:      log.transactionHash,
                        blockNumber: log.blockNumber,
                    }
                }
                if (log.eventName === 'BenefitDistributed') {
                    return {
                        type:        'benefit' as const,
                        description: log.args.description,
                        recipient:   log.args.to,         // field 'to' sesuai ABI
                        txHash:      log.transactionHash,
                        blockNumber: log.blockNumber,
                    }
                }
            })
            .filter(Boolean)

    } catch (err) {
        console.error('[getAssetHistory]', err)
        return []
    }
}