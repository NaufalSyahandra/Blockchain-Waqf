'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAccount } from 'wagmi'

// shadcn
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

export default function SettingsPage() {
    const { address } = useAccount()

    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')

    // 🔥 UPDATE EMAIL
    const updateEmail = async () => {
        const { error } = await supabase.auth.updateUser({
            email,
        })

        if (error) {
            toast.error('Gagal update email')
        } else {
            toast.success('Email updated')
        }
    }

    // 🔥 UPDATE PASSWORD
    const updatePassword = async () => {
        const { error } = await supabase.auth.updateUser({
            password,
        })

        if (error) {
            toast.error('Gagal update password')
        } else {
            toast.success('Password updated')
        }
    }

    return (
        <div className="max-w-xl mx-auto mt-10 space-y-6">

            <h1 className="text-2xl font-bold">
                Settings
            </h1>

            {/* EMAIL */}
            <Card>
                <CardContent className="p-4 space-y-3">
                    <h2 className="font-semibold">Update Email</h2>

                    <Input
                        placeholder="New Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />

                    <Button onClick={updateEmail}>
                        Save Email
                    </Button>
                </CardContent>
            </Card>

            {/* PASSWORD */}
            <Card>
                <CardContent className="p-4 space-y-3">
                    <h2 className="font-semibold">Update Password</h2>

                    <Input
                        type="password"
                        placeholder="New Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />

                    <Button onClick={updatePassword}>
                        Save Password
                    </Button>
                </CardContent>
            </Card>

            {/* WALLET */}
            <Card>
                <CardContent className="p-4 space-y-2">
                    <h2 className="font-semibold">Wallet</h2>

                    <p className="text-sm text-gray-500">
                        Connected Wallet:
                    </p>

                    <p className="text-sm font-mono">
                        {address || 'Not connected'}
                    </p>

                    <p className="text-xs text-gray-400">
                        (Disconnect via Logout)
                    </p>
                </CardContent>
            </Card>

        </div>
    )
}