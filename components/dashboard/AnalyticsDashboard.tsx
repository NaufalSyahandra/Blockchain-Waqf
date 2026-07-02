'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from '@/components/ui/card'

import {
    PieChart,
    Pie,
    Cell,
    LineChart,
    Line,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
} from 'recharts'

const COLORS = ['#22c55e', '#facc15', '#ef4444']

export default function AnalyticsDashboard() {
    const [assets, setAssets] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        const { data } = await supabase.from('assets').select('*')
        setAssets(data || [])
        setLoading(false)
    }

    if (loading) return <p>Loading analytics...</p>

    // 🔥 SUMMARY
    const total = assets.length
    const approved = assets.filter(a => a.status === 'approved').length
    const pending = assets.filter(a => a.status === 'pending').length
    const rejected = assets.filter(a => a.status === 'rejected').length

    // 🔥 PIE DATA
    const pieData = [
        { name: 'Approved', value: approved },
        { name: 'Pending', value: pending },
        { name: 'Rejected', value: rejected },
    ]

    // 🔥 LINE DATA (group by date)
    const grouped: any = {}

    assets.forEach(a => {
        const date = new Date(a.created_at).toLocaleDateString()
        if (!grouped[date]) grouped[date] = 0
        grouped[date]++
    })

    const lineData = Object.keys(grouped).map(date => ({
        date,
        total: grouped[date],
    }))

    return (
        <div className="p-6 space-y-6">

            <h1 className="text-2xl font-bold">
                Analytics Dashboard
            </h1>

            {/* 🔥 METRICS */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">

                <Card>
                    <CardContent className="p-4">
                        <p className="text-sm text-gray-500">Total Assets</p>
                        <p className="text-2xl font-bold">{total}</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-4">
                        <p className="text-sm text-green-600">Approved</p>
                        <p className="text-2xl font-bold">{approved}</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-4">
                        <p className="text-sm text-yellow-600">Pending</p>
                        <p className="text-2xl font-bold">{pending}</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-4">
                        <p className="text-sm text-red-600">Rejected</p>
                        <p className="text-2xl font-bold">{rejected}</p>
                    </CardContent>
                </Card>

            </div>

            {/* 🔥 CHARTS */}
            <div className="grid md:grid-cols-2 gap-6">

                {/* PIE */}
                <Card>
                    <CardHeader>
                        <CardTitle>Asset Status Distribution</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie
                                    data={pieData}
                                    dataKey="value"
                                    nameKey="name"
                                    outerRadius={100}
                                >
                                    {pieData.map((_, i) => (
                                        <Cell key={i} fill={COLORS[i]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* LINE */}
                <Card>
                    <CardHeader>
                        <CardTitle>Assets Growth</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={lineData}>
                                <XAxis dataKey="date" />
                                <YAxis />
                                <Tooltip />
                                <Line type="monotone" dataKey="total" stroke="#22c55e" />
                            </LineChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

            </div>

        </div>
    )
}