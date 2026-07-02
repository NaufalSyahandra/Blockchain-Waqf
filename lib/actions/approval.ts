import { supabase } from '@/lib/supabase'
import {
    writeContract,
    waitForTransactionReceipt,
} from '@wagmi/core'

import { config } from '@/lib/wagmi'
import { REGISTRY_ABI } from '@/lib/contracts'

export const approveAsset = async (asset: any) => {
    try {

        // 🔥 VALIDATION
        if (!asset.onchain_id) {
            throw new Error(
                'onchain_id not found'
            )
        }

        if (!asset.registry_address) {
            throw new Error(
                'registry_address missing'
            )
        }

        // 🔥 SEND TX
        const hash = await writeContract(config, {
            address: asset.registry_address,
            abi: REGISTRY_ABI,
            functionName: 'approveAsset',

            // 🔥 bigint conversion
            args: [BigInt(asset.onchain_id)],
        })

        console.log('TX HASH:', hash)

        // 🔥 WAIT
        await waitForTransactionReceipt(config, {
            hash,
        })

        // 🔥 UPDATE DB
        const { error } = await supabase
            .from('assets')
            .update({
                status: 'approved',
                tx_hash: hash,
            })
            .eq('id', asset.id)

        return { error }

    } catch (err) {
        console.error(err)

        return {
            error: err,
        }
    }
}

export const rejectAsset = async (
    id: string
) => {
    return await supabase
        .from('assets')
        .update({
            status: 'rejected',
        })
        .eq('id', id)
}