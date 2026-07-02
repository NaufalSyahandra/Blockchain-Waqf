'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useUser } from '@/hooks/useUser'
import { toast } from 'sonner'

export default function DistributePage() {
    const { user } = useUser()

    const [assets, setAssets] = useState<any[]>([])
    const [selectedAsset, setSelectedAsset] = useState('')
    const [amount, setAmount] = useState('')
    const [desc, setDesc] = useState('')

    useEffect(() => {
        fetchAssets()
    }, [])

    const fetchAssets = async () => {
        const { data } = await supabase
            .from('assets')
            .select('*')
            .eq('status', 'approved')

        setAssets(data || [])
    }

    const handleSubmit = async () => {
        if (!selectedAsset || !amount) {
            toast.error('Lengkapi data')
            return
        }

        const asset = assets.find(a => a.id === selectedAsset)

        // 🔥 1. simpan distribusi
        const { error } = await supabase.from('distributions').insert({
            asset_id: selectedAsset,
            registry_address: asset.registry_address,
            amount: Number(amount),
            description: desc,
        })

        if (error) {
            toast.error('Gagal distribusi')
            return
        }

        // 🔥 2. simpan activity
        await supabase.from('activities').insert({
            asset_id: selectedAsset,
            action: 'DISTRIBUTED',
            actor_id: user.id,
            description: `Distribusi ${amount}`,
        })

        toast.success('Distribusi berhasil 💰')

        setAmount('')
        setDesc('')
    }

    return (
        <div className="max-w-xl mx-auto mt-10 space-y-4">
            <h2 className="text-xl font-bold">Distribute Benefit</h2>

            <select
                className="w-full border p-2"
                onChange={(e) => setSelectedAsset(e.target.value)}
            >
                <option>Pilih Asset</option>
                {assets.map((a) => (
                    <option key={a.id} value={a.id}>
                        {a.name}
                    </option>
                ))}
            </select>

            <input
                placeholder="Amount"
                className="w-full border p-2"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
            />

            <input
                placeholder="Deskripsi"
                className="w-full border p-2"
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
            />

            <button onClick={handleSubmit} className="w-full bg-black text-white p-2">
                Submit Distribution
            </button>
        </div>
    )
}