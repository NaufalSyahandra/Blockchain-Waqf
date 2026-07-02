'use client'

import { useEffect, useState } from 'react'
import { publicClient } from '@/lib/publicClient'

export type TxItem = {
    hash: string
    status: 'pending' | 'success' | 'failed'
}

export function useTxTracker() {
    const [txs, setTxs] = useState<TxItem[]>([])

    // 🔥 tambah tx baru
    const addTx = (hash: string) => {
        setTxs(prev => [
            { hash, status: 'pending' },
            ...prev,
        ])
    }

    // 🔥 cek status tx
    useEffect(() => {
        if (txs.length === 0) return

        const interval = setInterval(async () => {
            const updated = await Promise.all(
                txs.map(async (tx) => {
                    if (tx.status !== 'pending') return tx

                    try {
                        const receipt = await publicClient.getTransactionReceipt({
                            hash: tx.hash as `0x${string}`,
                        })

                        if (receipt.status === 'success') {
                            return { ...tx, status: 'success' }
                        } else {
                            return { ...tx, status: 'failed' }
                        }
                    } catch {
                        return tx
                    }
                })
            )

            setTxs(updated)
        }, 4000)

        return () => clearInterval(interval)
    }, [txs])

    return {
        txs,
        addTx,
    }
}