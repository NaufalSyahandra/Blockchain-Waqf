'use client'

import { useEffect, useMemo, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
    Zap, Gift, FileCheck2, Building2, Users, Inbox, XCircle, LucideIcon
} from 'lucide-react'

// ── Types ─────────────────────────────────────────────────
type Activity = {
    id: string
    asset_id: string
    action: string
    description: string
    actor_id: string
    actor_email?: string
    actor_role?: string
    created_at: string
    asset_name?: string
    registry_address?: string
    registry_name?: string
}

type ActionConfigItem = {
    label: string
    Icon: LucideIcon
    badgeClass: string
}

// ── Config ────────────────────────────────────────────────
const ACTION_CONFIG: Record<string, ActionConfigItem> = {
    activity: {
        label: 'Aktivitas',
        Icon: Zap,
        badgeClass: 'bg-neutral-100 text-neutral-700 border-neutral-200 hover:bg-neutral-100',
    },
    benefit: {
        label: 'Distribusi Manfaat',
        Icon: Gift,
        badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-50',
    },
    approval: {
        label: 'Persetujuan',
        Icon: FileCheck2,
        badgeClass: 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-50',
    },
    rejected: {
        label: 'Ditolak',
        Icon: XCircle,
        badgeClass: 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-50',
    },
}

const getActionConfig = (action: string): ActionConfigItem => {
    return ACTION_CONFIG[action] || ACTION_CONFIG.default
}

// ── Helpers ───────────────────────────────────────────────
const formatDateTime = (d: string) =>
    new Date(d).toLocaleString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })

// ── Skeleton ──────────────────────────────────────────────
function TableSkeleton() {
    return (
        <div className="bg-white rounded-xl border border-neutral-200/80 shadow-sm p-4 space-y-3">
            {[...Array(6)].map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-5 w-24 rounded-full" />
                    <Skeleton className="h-4 w-24 ml-auto" />
                </div>
            ))}
        </div>
    )
}

// ── Main ──────────────────────────────────────────────────
export default function AuditPage() {
    const [activities, setActivities] = useState<Activity[]>([])
    const [loading, setLoading]       = useState(true)

    const [registryFilter, setRegistryFilter] = useState('all')
    const [actionFilter, setActionFilter]     = useState('all')
    const [roleFilter, setRoleFilter]         = useState('all')

    const fetchActivities = useCallback(async () => {
        setLoading(true)
        try {
            // 1. Ambil data dasar dari 3 tabel utama secara paralel
            const [activitiesRes, distributionsRes, approvedAssetsRes] = await Promise.all([
                supabase
                    .from('activities')
                    .select('id, asset_id, action, description, actor_id, created_at, users:actor_id (email, role), assets:asset_id (name, registry_address)')
                    .order('created_at', { ascending: false }),

                supabase
                    .from('distributions')
                    .select('id, asset_id, registry_address, amount, description, created_at, assets:asset_id (name)'),

                supabase
                    .from('assets')
                    .select('id, name, status, registry_address, approved_at, approved_by, created_at, users:approved_by (email, role)')
                    .in('status', ['approved', 'rejected'])
            ])

            if (activitiesRes.error) throw activitiesRes.error
            if (distributionsRes.error) throw distributionsRes.error
            if (approvedAssetsRes.error) throw approvedAssetsRes.error

            const rawActivities = activitiesRes.data || []
            const rawDistributions = distributionsRes.data || []
            const rawApprovedAssets = approvedAssetsRes.data || []

            // 2. Kumpulkan semua registry_address unik
            const allRegistryAddresses = [
                ...new Set([
                    ...rawActivities.map((a: any) => a.assets?.registry_address),
                    ...rawDistributions.map((d: any) => d.registry_address),
                    ...rawApprovedAssets.map((asset: any) => asset.registry_address)
                ].filter(Boolean))
            ]

            let registryMap: Record<string, string> = {}
            let nazhirUserMap: Record<string, { id: string; email: string; role: string }> = {}

            if (allRegistryAddresses.length > 0) {
                const { data: registriesData, error: regError } = await supabase
                    .from('registries')
                    .select('registry_address, name, nazhir_id, users:nazhir_id (email, role)')
                    .in('registry_address', allRegistryAddresses)

                if (regError) throw regError

                if (registriesData) {
                    registryMap = Object.fromEntries(registriesData.map(r => [r.registry_address, r.name]))

                    registriesData.forEach(r => {
                        if (r.registry_address && r.users) {
                            nazhirUserMap[r.registry_address] = {
                                id: r.nazhir_id,
                                email: (r.users as any).email ?? 'Tidak diketahui',
                                role: (r.users as any).role ?? 'nazhir'
                            }
                        }
                    })
                }
            }

            // 3. Transformasi data tabel `activities` biasa
            const formattedActivities: Activity[] = rawActivities.map((act: any) => {
                const isCustomAction = act.action && !['benefit', 'approval', 'rejected'].includes(act.action);

                return {
                    id: act.id,
                    asset_id: act.asset_id ?? '',
                    action: isCustomAction ? 'activity' : (act.action ?? 'activity'),
                    description: act.description || act.action || '',
                    actor_id: act.actor_id ?? '',
                    actor_email: act.users?.email ?? 'Tidak diketahui',
                    actor_role: act.users?.role ?? 'unknown',
                    created_at: act.created_at,
                    asset_name: act.assets?.name ?? 'Aset tidak ditemukan',
                    registry_address: act.assets?.registry_address,
                    registry_name: registryMap[act.assets?.registry_address] ?? 'Registry tidak dikenal',
                }
            })

            // 4. Transformasi data tabel `distributions`
            const formattedDistributions: Activity[] = rawDistributions.map((dist: any) => {
                const nazhirInfo = nazhirUserMap[dist.registry_address]

                return {
                    id: dist.id,
                    asset_id: dist.asset_id ?? '',
                    action: 'benefit',
                    description: dist.description || `Mendistribusikan dana manfaat sebesar Rp ${Number(dist.amount).toLocaleString('id-ID')}`,
                    actor_id: nazhirInfo?.id ?? '',
                    actor_email: nazhirInfo?.email ?? 'System / Nazhir',
                    actor_role: nazhirInfo?.role ?? 'nazhir',
                    created_at: dist.created_at,
                    asset_name: dist.assets?.name ?? 'Aset tidak ditemukan',
                    registry_address: dist.registry_address,
                    registry_name: registryMap[dist.registry_address] ?? 'Registry tidak dikenal',
                }
            })

            // 5. Transformasi data tabel `assets` (Approval & Rejection)
            const formattedApprovals: Activity[] = rawApprovedAssets.map((asset: any) => {
                const isApproved = asset.status === 'approved'

                const actorEmail = asset.users?.email ?? 'Dewan Syariah'
                const actorRole = asset.users?.role ?? 'sharia'

                return {
                    id: `review-${asset.id}`,
                    asset_id: asset.id,
                    action: isApproved ? 'approval' : 'rejected',
                    description: isApproved
                        ? `Menyetujui pengajuan aset wakaf "${asset.name}" untuk di-deploy on-chain.`
                        : `Menolak pengajuan aset wakaf "${asset.name}" karena dokumen tidak memenuhi kriteria syariah.`,
                    actor_id: asset.approved_by ?? 'system-sharia',
                    actor_email: actorEmail,
                    actor_role: actorRole,
                    created_at: asset.approved_at ?? asset.created_at,
                    asset_name: asset.name ?? 'Aset tidak ditemukan',
                    registry_address: asset.registry_address,
                    registry_name: registryMap[asset.registry_address] ?? 'Registry tidak dikenal',
                }
            })

            // 6. Urutkan secara kronologis
            const allMerged = [...formattedActivities, ...formattedDistributions, ...formattedApprovals].sort(
                (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            )

            setActivities(allMerged)
        } catch (err) {
            console.error('Error fetching audit logs:', JSON.stringify(err, null, 2), err)
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        fetchActivities()
    }, [fetchActivities])

    // ── Opsi filter memoized ──
    const registryOptions = useMemo(() => {
        const map = new Map<string, string>()
        activities.forEach(a => {
            if (a.registry_address) map.set(a.registry_address, a.registry_name || 'Registry tidak dikenal')
        })
        return Array.from(map, ([address, name]) => ({ address, name }))
    }, [activities])

    const roleOptions = useMemo(() => {
        return [...new Set(activities.map(a => a.actor_role).filter(Boolean))]
    }, [activities])

    const filteredActivities = useMemo(() => {
        return activities.filter(a => {
            const matchRegistry = registryFilter === 'all' || a.registry_address === registryFilter
            const matchAction   = actionFilter === 'all' || getActionConfig(a.action).label === actionFilter
            const matchRole     = roleFilter === 'all' || a.actor_role === roleFilter
            return matchRegistry && matchAction && matchRole
        })
    }, [activities, registryFilter, actionFilter, roleFilter])

    const uniqueRegistries = registryOptions.length
    const uniqueActors     = useMemo(() => new Set(activities.map(a => a.actor_id)).size, [activities])

    return (
        <div className="min-h-screen bg-neutral-50/50 p-6 sm:p-8">
            <div className="space-y-6 max-w-6xl mx-auto">

                {/* Header */}
                <div>
                    <p className="text-[11px] font-semibold tracking-widest uppercase text-neutral-400 mb-1">
                        Dewan Syariah · Oversight
                    </p>
                    <h1 className="text-2xl font-bold text-neutral-900 tracking-tight">Audit Trail</h1>
                    <p className="text-sm text-neutral-500 mt-0.5">
                        Seluruh aktivitas on-chain lintas registry &amp; nazhir
                    </p>
                </div>

                {/* Summary Strip */}
                {!loading && activities.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {[
                            {
                                label: 'Total aktivitas',
                                value: `${activities.length} entri`,
                                sub: 'seluruh registry',
                                Icon: FileCheck2,
                            },
                            {
                                label: 'Registry terlibat',
                                value: `${uniqueRegistries} registry`,
                                sub: 'dikelola nazhir berbeda',
                                Icon: Building2,
                            },
                            {
                                label: 'Aktor terlibat',
                                value: `${uniqueActors} akun`,
                                sub: 'wakif & nazhir',
                                Icon: Users,
                            },
                        ].map(s => (
                            <div
                                key={s.label}
                                className="bg-white rounded-xl p-4 border border-neutral-200/80 shadow-sm flex flex-col justify-between"
                            >
                                <div className="flex items-center justify-between mb-2">
                                    <p className="text-[10px] font-medium text-neutral-400 uppercase tracking-wider">
                                        {s.label}
                                    </p>
                                    <s.Icon size={16} className="text-neutral-400 shrink-0" />
                                </div>
                                <div>
                                    <p className="text-lg font-bold text-neutral-900">{s.value}</p>
                                    <p className="text-xs text-neutral-400 mt-0.5">{s.sub}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Filter Bar */}
                {!loading && activities.length > 0 && (
                    <div className="flex flex-wrap items-center gap-3 bg-white p-3 rounded-xl border border-neutral-200/80 shadow-sm">
                        <span className="text-xs font-medium text-neutral-400 uppercase tracking-wider pl-1">
                            Filter
                        </span>

                        <Select value={registryFilter} onValueChange={setRegistryFilter}>
                            <SelectTrigger className="w-[200px] h-8 text-xs">
                                <div className="flex items-center gap-1.5">
                                    <Building2 size={12} className="text-neutral-400" />
                                    <SelectValue placeholder="Semua registry" />
                                </div>
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Semua registry</SelectItem>
                                {registryOptions.map(r => (
                                    <SelectItem key={r.address} value={r.address}>{r.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Select value={actionFilter} onValueChange={setActionFilter}>
                            <SelectTrigger className="w-[180px] h-8 text-xs">
                                <SelectValue placeholder="Semua jenis aksi" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Semua jenis aksi</SelectItem>
                                {/* Perbaikan loop filter menggunakan objek ACTION_CONFIG */}
                                {Object.values(ACTION_CONFIG).map(c => (
                                    <SelectItem key={c.label} value={c.label}>{c.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Select value={roleFilter} onValueChange={setRoleFilter}>
                            <SelectTrigger className="w-[160px] h-8 text-xs">
                                <SelectValue placeholder="Semua aktor" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Semua aktor</SelectItem>
                                {roleOptions.map(r => (
                                    <SelectItem key={r} value={r} className="capitalize">{r}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        {(registryFilter !== 'all' || actionFilter !== 'all' || roleFilter !== 'all') && (
                            <button
                                onClick={() => { setRegistryFilter('all'); setActionFilter('all'); setRoleFilter('all') }}
                                className="text-xs font-medium text-neutral-400 hover:text-emerald-600 transition-colors"
                            >
                                Reset filter
                            </button>
                        )}

                        <span className="text-xs text-neutral-400 ml-auto">
                            Menampilkan {filteredActivities.length} dari {activities.length} entri
                        </span>
                    </div>
                )}

                <Separator className="bg-neutral-200/60" />

                {/* Table */}
                {loading ? (
                    <TableSkeleton />
                ) : activities.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center bg-white rounded-xl border border-neutral-200/80 shadow-sm">
                        <Inbox size={32} className="text-neutral-300 mb-2" />
                        <p className="text-sm text-neutral-500 font-medium">Belum ada aktivitas tercatat.</p>
                    </div>
                ) : filteredActivities.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center bg-white rounded-xl border border-neutral-200/80 shadow-sm">
                        <Inbox size={32} className="text-neutral-300 mb-2" />
                        <p className="text-sm text-neutral-500 font-medium">Tidak ada entri yang cocok dengan filter ini.</p>
                    </div>
                ) : (
                    <div className="bg-white rounded-xl border border-neutral-200/80 shadow-sm overflow-hidden">
                        <Table>
                            <TableHeader>
                                <TableRow className="hover:bg-transparent border-neutral-200">
                                    <TableHead className="text-xs font-medium text-neutral-400 uppercase tracking-wide">Waktu</TableHead>
                                    <TableHead className="text-xs font-medium text-neutral-400 uppercase tracking-wide">Aksi</TableHead>
                                    <TableHead className="text-xs font-medium text-neutral-400 uppercase tracking-wide">Aset</TableHead>
                                    <TableHead className="text-xs font-medium text-neutral-400 uppercase tracking-wide">Registry</TableHead>
                                    <TableHead className="text-xs font-medium text-neutral-400 uppercase tracking-wide">Aktor</TableHead>
                                    <TableHead className="text-xs font-medium text-neutral-400 uppercase tracking-wide">Deskripsi</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredActivities.map(act => {
                                    // Ambil konfigurasi gaya badge & ikon yang benar
                                    const cfg = getActionConfig(act.action)
                                    const { Icon } = cfg

                                    return (
                                        <TableRow key={act.id} className="border-neutral-100 hover:bg-neutral-50/80">
                                            <TableCell className="py-3 text-xs text-neutral-500 whitespace-nowrap">
                                                {formatDateTime(act.created_at)}
                                            </TableCell>
                                            <TableCell className="py-3">
                                                <Badge
                                                    variant="outline"
                                                    className={`text-[11px] font-medium rounded-full flex items-center gap-1 px-2 py-0.5 border w-fit ${cfg.badgeClass}`}
                                                >
                                                    <Icon size={10} />
                                                    {cfg.label}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="py-3">
                                                <p className="text-sm font-medium text-neutral-900 truncate max-w-[160px]">
                                                    {act.asset_name}
                                                </p>
                                            </TableCell>
                                            <TableCell className="py-3">
                                                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">
                                                    <Building2 size={10} />
                                                    {act.registry_name}
                                                </span>
                                            </TableCell>
                                            <TableCell className="py-3">
                                                <p className="text-xs text-neutral-700">{act.actor_email}</p>
                                                <p className="text-[10px] text-neutral-400 capitalize">{act.actor_role}</p>
                                            </TableCell>
                                            <TableCell className="py-3 text-sm text-neutral-600 max-w-xs truncate">
                                                {act.description}
                                            </TableCell>
                                        </TableRow>
                                    )
                                })}
                            </TableBody>
                        </Table>
                    </div>
                )}
            </div>
        </div>
    )
}