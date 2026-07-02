import { REGISTRY_ABI } from '@/lib/contracts'
import { config } from '@/lib/wagmi'
import { writeContract, waitForTransactionReceipt } from 'wagmi/actions'
import { supabase } from '@/lib/supabase'

export const recordActivity = async (
    registryAddress: `0x${string}`,
    assetId: string,        // uuid dari supabase
    onchainId: number,      // onchain_id integer untuk contract
    actorId: string,        // user.id dari supabase
    description: string
) => {
    // 1. Kirim ke blockchain
    const hash = await writeContract(config, {
        address: registryAddress,
        abi: REGISTRY_ABI,
        functionName: 'recordActivity',
        args: [BigInt(onchainId), description],
    })

    // 2. Tunggu confirmed
    await waitForTransactionReceipt(config, { hash })

    // 3. Simpan ke Supabase
    const { error } = await supabase.from('activities').insert({
        asset_id:    assetId,
        actor_id:    actorId,
        action:      'record_activity',
        description,
        created_at:  new Date().toISOString(),
    })

    if (error) throw new Error(`Supabase error: ${error.message}`)

    return hash
}

export const distributeBenefit = async (
    registryAddress: `0x${string}`,
    assetId: string,        // uuid dari supabase
    onchainId: number,      // onchain_id integer untuk contract
    to: `0x${string}`,
    description: string
) => {
    // 1. Kirim ke blockchain
    const hash = await writeContract(config, {
        address: registryAddress,
        abi: REGISTRY_ABI,
        functionName: 'distributeBenefit',
        args: [BigInt(onchainId), to, description],
    })

    // 2. Tunggu confirmed
    await waitForTransactionReceipt(config, { hash })

    // 3. Simpan ke Supabase
    const { error } = await supabase.from('distributions').insert({
        asset_id:         assetId,
        registry_address: registryAddress,
        description,
        tx_hash:          hash,
        created_at:       new Date().toISOString(),
        // amount tidak diisi karena contract tidak kirim ETH,
        // isi manual kalau ada logika amount di app kamu
    })

    if (error) throw new Error(`Supabase error: ${error.message}`)

    return hash
}