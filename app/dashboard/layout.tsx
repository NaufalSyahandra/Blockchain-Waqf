'use client'

import {
    SidebarProvider,
    SidebarInset,
} from '@/components/ui/sidebar'

import AppSidebar from '@/components/layout/AppSidebar'
import Navbar from '@/components/layout/Navbar'

export default function DashboardLayout({
                                            children,
                                        }: {
    children: React.ReactNode
}) {
    return (
        <SidebarProvider>
            <AppSidebar />

            <SidebarInset
                className="min-h-screen"
                style={{ background: '#F8F9FA' }}
            >
                {/* sticky navbar */}
                <div className="sticky top-0 z-50">
                    <Navbar />
                </div>

                {/* page content */}
                <div className="p-6">
                    {children}
                </div>
            </SidebarInset>
        </SidebarProvider>
    )
}