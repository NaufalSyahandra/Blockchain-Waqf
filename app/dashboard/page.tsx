'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@/hooks/useUser'

export default function DashboardPage() {
    const { user, loading } = useUser()
    const router = useRouter()

    useEffect(() => {
        if (!loading && user) {
            router.replace(`/dashboard/${user.role}`)
        }
    }, [user, loading])

    return <p>Redirecting...</p>
}