'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useUser } from '@/hooks/useUser'
import { useDisconnect } from 'wagmi'
import { supabase } from '@/lib/supabase'

import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuItem,
    SidebarMenuButton,
    SidebarHeader,
} from '@/components/ui/sidebar'

import {
    LayoutDashboard,
    Plus,
    History,
    CheckCircle,
    LogOut,
    Settings,
    ScrollText,
    Globe,
} from 'lucide-react'

export default function AppSidebar() {
    const pathname = usePathname()
    const { user } = useUser()
    const { disconnect } = useDisconnect()

    if (!user) return null

    const menu = {
        wakif: [
            { name: 'Dashboard',       href: '/dashboard/wakif',         icon: LayoutDashboard },
            { name: 'Register Asset',  href: '/dashboard/wakif/create',  icon: Plus },
            { name: 'My History',      href: '/dashboard/wakif/history', icon: History },
        ],
        nazhir: [
            { name: 'Dashboard',       href: '/dashboard/nazhir',         icon: LayoutDashboard },
            { name: 'Create Registry', href: '/dashboard/nazhir/create',  icon: Plus },
            { name: 'Manage Assets',   href: '/dashboard/nazhir/assets',  icon: CheckCircle },
        ],
        sharia: [
            { name: 'Dashboard',  href: '/dashboard/sharia',          icon: LayoutDashboard },
            { name: 'Approval',   href: '/dashboard/sharia/approval', icon: CheckCircle },
            { name: 'Audit Trail',href: '/dashboard/sharia/audit',    icon: ScrollText },
        ],
    }

    const roleMenu = menu[user.role as keyof typeof menu] || []

    const handleLogout = async () => {
        await supabase.auth.signOut()
        disconnect()
        window.location.href = '/login'
    }

    return (
        <Sidebar
            className="border-none"
            style={{ background: '#1a3a2a', color: 'white' }}
        >
            {/* ── HEADER ── */}
            <SidebarHeader className="px-5 py-6 border-b border-white/[0.08]">
                <p
                    className="text-[19px] font-semibold tracking-wide text-[#c9a84c]"
                    style={{ fontFamily: 'var(--font-cormorant)' }}
                >
                    Ethical Architect
                </p>
                <p className="text-[9px] font-light tracking-[0.18em] uppercase text-[#7a9e82] mt-0.5">
                    Waqf Management
                </p>
            </SidebarHeader>

            {/* ── CONTENT ── */}
            <SidebarContent className="px-3 py-4">

                {/* Main menu */}
                <SidebarGroup>
                    <SidebarGroupLabel className="text-[9px] font-medium tracking-[0.18em] uppercase text-[#5a7a60] px-2 mb-1.5">
                        Main Menu
                    </SidebarGroupLabel>
                    <SidebarMenu>
                        {roleMenu.map((item) => {
                            const isActive = pathname === item.href
                            const Icon = item.icon
                            return (
                                <SidebarMenuItem key={item.href}>
                                    <SidebarMenuButton asChild>
                                        <Link
                                            href={item.href}
                                            className={`flex items-center gap-2.5 px-2.5 py-2 text-[12.5px] transition-all duration-150 mb-0.5 ${
                                                isActive
                                                    ? 'text-[#c9a84c] bg-[#c9a84c]/[0.08] border-l-2 border-[#c9a84c] !pl-[9px] rounded-none'
                                                    : 'text-white/60 hover:text-white/90 hover:bg-white/[0.05] rounded-sm'
                                            }`}
                                        >
                                            <Icon size={15} strokeWidth={1.5} />
                                            <span>{item.name}</span>
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            )
                        })}
                    </SidebarMenu>
                </SidebarGroup>

                {/* Divider */}
                <div className="h-px bg-white/[0.07] my-3.5 mx-2" />

                {/* Public */}
                <SidebarGroup>
                    <SidebarGroupLabel className="text-[9px] font-medium tracking-[0.18em] uppercase text-[#5a7a60] px-2 mb-1.5">
                        Public
                    </SidebarGroupLabel>
                    <SidebarMenu>
                        <SidebarMenuItem>
                            <SidebarMenuButton asChild>
                                <Link
                                    href="/explorer"
                                    className="flex items-center gap-2.5 px-2.5 py-2 rounded-sm text-[12.5px] text-white/60 hover:text-white/90 hover:bg-white/[0.05] transition-all duration-150"
                                >
                                    <Globe size={15} strokeWidth={1.5} />
                                    <span>Explorer</span>
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    </SidebarMenu>
                </SidebarGroup>

            </SidebarContent>

            {/* ── FOOTER ── */}
            <SidebarFooter className="px-3 py-3.5 border-t border-white/[0.08] space-y-0.5">
                <Link href="/dashboard/settings">
                    <button className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-sm text-[12px] text-white/50 hover:text-white/80 hover:bg-white/[0.05] transition-all duration-150">
                        <Settings size={14} strokeWidth={1.5} />
                        Settings
                    </button>
                </Link>
                <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-sm text-[12px] text-[#e57373]/80 hover:text-[#e57373] hover:bg-[#e57373]/[0.07] transition-all duration-150"
                >
                    <LogOut size={14} strokeWidth={1.5} />
                    Logout
                </button>
            </SidebarFooter>
        </Sidebar>
    )
}