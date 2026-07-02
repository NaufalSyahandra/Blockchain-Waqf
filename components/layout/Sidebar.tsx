'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useUser } from '@/hooks/useUser'
import { supabase } from '@/lib/supabase'
import { useDisconnect } from 'wagmi'

import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'

export default function Sidebar() {
    const pathname = usePathname()
    const router = useRouter()
    const { user } = useUser()
    const { disconnect } = useDisconnect()

    const menu = {
        wakif: [
            { name: 'Dashboard', href: '/dashboard/wakif' },
            { name: 'Analytics', href: '/dashboard/analytics' },
            { name: 'Register Asset', href: '/dashboard/wakif/create' },
            { name: 'My History', href: '/dashboard/wakif/history' },
        ],
        nazhir: [
            { name: 'Dashboard', href: '/dashboard/nazhir' },
            { name: 'Analytics', href: '/dashboard/analytics' },
            { name: 'Create Registry', href: '/dashboard/nazhir/create' },
            { name: 'Manage Assets', href: '/dashboard/nazhir/assets' },
        ],
        sharia: [
            { name: 'Dashboard', href: '/dashboard/sharia' },
            { name: 'Analytics', href: '/dashboard/analytics' },
            { name: 'Approval', href: '/dashboard/sharia/approval' },
            { name: 'Audit Trail', href: '/dashboard/sharia/audit' },
        ],
    }

    if (!user) return null

    const roleMenu = menu[user.role as keyof typeof menu] || []

    const handleLogout = async () => {
        await supabase.auth.signOut()
        disconnect()
        router.push('/login')
    }

    return (
        <div className="h-full bg-[#0F3D2E] text-white flex flex-col justify-between p-5">

            {/* TOP */}
            <div>
                <h1 className="text-lg font-bold mb-8">
                    Ethical Architect
                </h1>

                <div className="space-y-2">
                    {roleMenu.map((item) => {
                        const isActive = pathname === item.href

                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`block px-4 py-2 rounded-lg transition ${
                                    isActive
                                        ? 'bg-green-500'
                                        : 'hover:bg-green-700'
                                }`}
                            >
                                {item.name}
                            </Link>
                        )
                    })}
                </div>
            </div>

            {/* BOTTOM */}
            <div className="space-y-3">

                <Separator className="bg-white/20" />

                <Link href="/dashboard/settings">
                    <Button
                        variant="ghost"
                        className="w-full justify-start text-white hover:bg-green-700"
                    >
                        ⚙️ Settings
                    </Button>
                </Link>

                <Button
                    variant="destructive"
                    className="w-full"
                    onClick={handleLogout}
                >
                    🚪 Logout
                </Button>

            </div>
        </div>
    )
}