import { supabase } from '@/lib/supabase'
import {
    writeContract,
    waitForTransactionReceipt,
} from '@wagmi/core'

import { config } from '@/lib/wagmi'
import { REGISTRY_ABI } from '@/lib/contracts'

/**
 * Menyetujui Aset Wakaf (On-Chain & Database)
 * @param asset Objek aset lengkap dari database
 * @param userId ID User (Aktor Dewan Syariah) yang sedang login
 */
export const approveAsset = async (asset: any, userId: string) => {
    try {
        // 🔥 VALIDATION
        if (!asset) {
            throw new Error('Data aset tidak valid atau kosong.')
        }

        if (!asset.onchain_id) {
            throw new Error('Gagal: onchain_id tidak ditemukan pada aset ini.')
        }

        if (!asset.registry_address) {
            throw new Error('Gagal: registry_address missing atau tidak valid.')
        }

        if (!userId) {
            throw new Error('Gagal: ID Aktor (User ID) wajib disertakan untuk keperluan audit trail.')
        }

        // 🔥 SEND TRANSACTION ON-CHAIN (BLOCKCHAIN)
        const hash = await writeContract(config, {
            address: asset.registry_address as `0x${string}`,
            abi: REGISTRY_ABI,
            functionName: 'approveAsset',
            // 🔥 bigint conversion
            args: [BigInt(asset.onchain_id)],
        })

        console.log('TX HASH SUCCESS:', hash)

        // 🔥 WAIT FOR MINING / TRANSACTION RECEIPT
        await waitForTransactionReceipt(config, {
            hash,
        })

        // 🔥 UPDATE DATABASE SUPABASE (Menyimpan Status, Hash, dan Aktor Penanggung Jawab)
        const { error } = await supabase
            .from('assets')
            .update({
                status: 'approved',
                tx_hash: hash,
                approved_by: userId,                 // Memasukkan User ID ke kolom approved_by agar tidak NULL
                approved_at: new Date().toISOString() // Mencatat waktu persetujuan
            })
            .eq('id', asset.id)

        if (error) throw error

        return { success: true }

    } catch (err: any) {
        console.error('Error in approveAsset action:', err)
        return {
            success: false,
            error: err.message || err,
        }
    }
}

/**
 * Menolak Pengajuan Aset Wakaf
 * @param id ID Aset yang ditolak
 * @param userId ID User (Aktor Dewan Syariah) yang menolak
 */
export const rejectAsset = async (id: string, userId: string) => {
    try {
        if (!userId) {
            throw new Error('Gagal: ID Aktor (User ID) wajib disertakan.')
        }

        const { error } = await supabase
            .from('assets')
            .update({
                status: 'rejected',
                approved_by: userId,                 // Mencatat siapa yang menolak permohonan
                approved_at: new Date().toISOString() // Mencatat waktu penolakan
            })
            .eq('id', id)

        if (error) throw error

        return { success: true }
    } catch (err: any) {
        console.error('Error in rejectAsset action:', err)
        return {
            success: false,
            error: err.message || err,
        }
    }
}