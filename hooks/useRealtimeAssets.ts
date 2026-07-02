'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export function useRealtimeAssets() {
    const [assets, setAssets] = useState<any[]>([])

    useEffect(() => {
        fetchInitial()

        const channel = supabase
            .channel('assets-realtime')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'assets',
                },
                () => {
                    fetchInitial()
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [])

    const fetchInitial = async () => {
        const { data } = await supabase.from('assets').select('*')
        setAssets(data || [])
    }

    return assets
}