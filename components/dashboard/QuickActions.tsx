'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'

export default function QuickActions() {
    const router = useRouter()

    return (
        <div className="bg-white rounded-xl p-4 border shadow-sm space-y-3">
            <h3 className="font-semibold">Quick Actions</h3>

            <Button
                className="w-full"
                onClick={() => router.push('/dashboard/wakif')}
            >
                Register Asset
            </Button>

            <Button
                variant="outline"
                className="w-full"
                onClick={() => router.push('/dashboard/nazhir')}
            >
                Manage Registry
            </Button>
        </div>
    )
}