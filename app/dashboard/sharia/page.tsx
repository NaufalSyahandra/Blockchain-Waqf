'use client'

import ShariaDashboard from '@/components/dashboard/ShariaDashboard'
import { useUser } from '@/hooks/useUser'

export default function Page() {
    const { user, loading } = useUser()

    if (loading) return <p>Loading...</p>

    if (!user || user.role !== 'sharia') {
        return <p>Access Denied</p>
    }

    return <ShariaDashboard />
}