'use client'

import WakifDashboard from '@/components/dashboard/WakifDashboard'
import { useUser } from '@/hooks/useUser'

export default function Page() {
    const { user, loading } = useUser()

    if (loading) return <p>Loading...</p>

    if (!user || user.role !== 'wakif') {
        return <p>Access Denied</p>
    }

    return <WakifDashboard />
}