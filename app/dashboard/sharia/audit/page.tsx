'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function AuditPage() {
    const [activities, setActivities] = useState<any[]>([])

    useEffect(() => {
        fetchActivities()
    }, [])

    const fetchActivities = async () => {
        const { data } = await supabase
            .from('activities')
            .select('*')
            .order('created_at', { ascending: false })

        setActivities(data || [])
    }

    return (
        <div className="p-6">
            <h2 className="text-xl font-bold mb-4">Audit Trail</h2>

            {activities.map((a) => (
                <div key={a.id} className="border p-3 mb-2 rounded">
                    <p className="text-sm">{a.action}</p>
                    <p className="text-xs text-gray-500">{a.description}</p>
                    <p className="text-xs">{a.created_at}</p>
                </div>
            ))}
        </div>
    )
}