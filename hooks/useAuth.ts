'use client'

import { supabase } from '@/lib/supabase'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

export function useAuth() {
    const [loading, setLoading] = useState(false)
    const router = useRouter()

    const signUp = async (email: string, password: string) => {
        setLoading(true)

        const { data, error } = await supabase.auth.signUp({
            email,
            password,
        })

        if (error) {
            toast.error(error.message)
            setLoading(false)
            return
        }

        if (data.user) {
            await supabase.from('users').insert({
                id: data.user.id,
                email,
                role: 'wakif'
            })
        }

        toast.success('Account created successfully 🎉')
        setLoading(false)
        router.push('/dashboard')
    }

    const signIn = async (email: string, password: string) => {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        })

        console.log('LOGIN RESULT:', data)

        if (error) throw error

        // 🔥 delay sedikit biar cookie tersimpan
        setTimeout(() => {
            window.location.href = '/dashboard'
        }, 1000)
    }

    return {
        signUp,
        signIn,
        loading,
    }
}