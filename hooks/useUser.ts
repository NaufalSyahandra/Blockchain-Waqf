'use client'

import { supabase } from '@/lib/supabase'
import { useEffect, useState } from 'react'

export function useUser() {
    const [user, setUser] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const getUser = async () => {
            const {
                data: { user: authUser },
            } = await supabase.auth.getUser()

            if (!authUser) {
                setLoading(false)
                return
            }

            const { data, error } = await supabase
                .from('users')
                .select('*')
                .eq('id', authUser.id)
                .maybeSingle()
            console.log('AUTH ID:', authUser.id)
            if (error) {
                console.error('Error fetch user:', error)
            }

            if (!data) {
                console.warn('User not found in DB')
                setUser(null) // ❗ jangan fallback role
                setLoading(false)
                return
            }

            setUser(data)
            setLoading(false)
        }

        getUser()
    }, [])

    return { user, loading }
}