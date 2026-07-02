import { publicClient } from '@/lib/publicClient'
import { parseAbiItem } from 'viem'

// ✅ EVENT: Activity (AssetManaged)
const activityEvent = parseAbiItem(
    'event AssetManaged(uint256 indexed id, string activity)'
)

// ✅ EVENT: Benefit
const benefitEvent = parseAbiItem(
    'event BenefitDistributed(uint256 indexed id, address indexed to, string description)'
)

// 🔥 GET ACTIVITY LOGS
export const getActivityLogs = async (address: `0x${string}`) => {
    return await publicClient.getLogs({
        address,
        event: activityEvent,
        fromBlock: 'earliest',
    })
}

// 🔥 GET BENEFIT LOGS
export const getBenefitLogs = async (address: `0x${string}`) => {
    return await publicClient.getLogs({
        address,
        event: benefitEvent,
        fromBlock: 'earliest',
    })
}