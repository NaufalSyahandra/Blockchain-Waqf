'use client'

import NazhirDashboard from '@/components/dashboard/NazhirDashboard'
import { useUser } from '@/hooks/useUser'

export default function Page() {
    const { user, loading } = useUser()

    if (loading) return <p>Loading...</p>

    if (!user || user.role !== 'nazhir') {
        return <p>Access Denied</p>
    }

    return <NazhirDashboard />
}