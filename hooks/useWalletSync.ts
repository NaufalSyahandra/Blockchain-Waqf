'use client'

import { useAccount } from 'wagmi'
import { useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

export function useWalletSync() {
    const { address, isConnected } = useAccount()

    useEffect(() => {
        if (!isConnected || !address) return

        const syncWallet = async () => {
            const {
                data: { user },
            } = await supabase.auth.getUser()

            if (!user) return

            const { error } = await supabase
                .from('users')
                .update({ wallet_address: address })
                .eq('id', user.id)

            if (error) {
                toast.error('Failed to sync wallet')
            } else {
                toast.success('Wallet connected 🔗')
            }
        }

        syncWallet()
    }, [address, isConnected])
}