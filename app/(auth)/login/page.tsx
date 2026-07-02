'use client'

import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { Input }     from '@/components/ui/input'
import { Button }    from '@/components/ui/button'
import { Label }     from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { AlertCircle, CheckCircle2 } from 'lucide-react'
import Link from 'next/link'

type FieldErrors = {
    email?:    string
    password?: string
    general?:  string
}

function parseSupabaseError(message: string): FieldErrors {
    const msg = message.toLowerCase()
    if (
        msg.includes('invalid login credentials') ||
        msg.includes('user not found') ||
        msg.includes('no user found') ||
        msg.includes('invalid credentials')
    ) {
        return { general: 'Email atau password salah. Periksa kembali dan coba lagi.' }
    }
    if (msg.includes('email not confirmed')) {
        return { email: 'Email belum diverifikasi. Cek inbox Anda.' }
    }
    if (msg.includes('too many requests') || msg.includes('rate limit')) {
        return { general: 'Terlalu banyak percobaan. Tunggu beberapa menit.' }
    }
    return { general: message }
}

export default function LoginPage() {
    const { signIn, loading } = useAuth()
    const [email, setEmail]       = useState('')
    const [password, setPassword] = useState('')
    const [errors, setErrors]     = useState<FieldErrors>({})

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setErrors({})

        const next: FieldErrors = {}
        if (!email)    next.email    = 'Email wajib diisi.'
        if (!password) next.password = 'Password wajib diisi.'
        if (Object.keys(next).length) { setErrors(next); return }

        try {
            await signIn(email, password)
        } catch (err: any) {
            // Supabase kadang return error di dalam object, bukan throw
            const message = err?.message ?? err?.error_description ?? String(err)
            setErrors(parseSupabaseError(message))
        }
    }

    const inputCls = (field: keyof FieldErrors) =>
        `h-11 text-[13px] rounded-xl border-2 transition-all bg-gray-50/50
         focus-visible:ring-0 focus-visible:bg-white
         ${errors[field]
            ? 'border-red-300 bg-red-50/30 focus-visible:border-red-400'
            : 'border-gray-100 focus-visible:border-emerald-400'}`

    return (
        <>
            <p className="text-[10px] text-emerald-600 uppercase tracking-[0.15em] mb-2 font-medium">
                Selamat datang kembali
            </p>
            <h1 className="text-[28px] font-bold text-gray-900 tracking-tight leading-tight mb-1">
                Masuk ke akun
            </h1>
            <p className="text-[13px] text-gray-400 mb-8">
                Lanjutkan pengelolaan aset waqf Anda
            </p>

            <div className="space-y-4">

                {/* Error banner */}
                {errors.general && (
                    <div className="flex items-start gap-2.5 text-[12px] text-red-700 bg-red-50 border border-red-200 rounded-xl px-3.5 py-3 leading-relaxed animate-in fade-in slide-in-from-top-1 duration-200">
                        <AlertCircle size={15} className="shrink-0 mt-0.5 text-red-500" />
                        <span>{errors.general}</span>
                    </div>
                )}

                <div className="space-y-1.5">
                    <Label htmlFor="email" className="text-[11px] font-semibold text-gray-500 uppercase tracking-widest">
                        Email
                    </Label>
                    <Input
                        id="email"
                        type="email"
                        placeholder="nama@email.com"
                        value={email}
                        onChange={e => {
                            setEmail(e.target.value)
                            if (errors.email) setErrors(p => ({ ...p, email: undefined }))
                        }}
                        className={inputCls('email')}
                    />
                    {errors.email && (
                        <p className="flex items-center gap-1 text-[11px] text-red-500 mt-1">
                            <AlertCircle size={11} /> {errors.email}
                        </p>
                    )}
                </div>

                <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                        <Label htmlFor="password" className="text-[11px] font-semibold text-gray-500 uppercase tracking-widest">
                            Password
                        </Label>
                        <Link href="/forgot-password" className="text-[11px] text-emerald-600 hover:text-emerald-700 transition-colors font-medium">
                            Lupa password?
                        </Link>
                    </div>
                    <Input
                        id="password"
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={e => {
                            setPassword(e.target.value)
                            if (errors.password) setErrors(p => ({ ...p, password: undefined }))
                        }}
                        className={inputCls('password')}
                    />
                    {errors.password && (
                        <p className="flex items-center gap-1 text-[11px] text-red-500 mt-1">
                            <AlertCircle size={11} /> {errors.password}
                        </p>
                    )}
                </div>

                <Button
                    onClick={handleSubmit}
                    disabled={loading}
                    className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-[13px] font-semibold rounded-xl transition-all shadow-sm shadow-emerald-200 hover:shadow-emerald-300 hover:shadow-md mt-2"
                >
                    {loading ? (
                        <span className="flex items-center gap-2">
                            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                            </svg>
                            Memproses...
                        </span>
                    ) : 'Masuk'}
                </Button>
            </div>

            <div className="flex items-center gap-3 my-6">
                <Separator className="flex-1 bg-gray-100" />
                <span className="text-[11px] text-gray-300">atau</span>
                <Separator className="flex-1 bg-gray-100" />
            </div>

            <p className="text-center text-[12px] text-gray-400">
                Belum punya akun?{' '}
                <Link href="/register" className="text-emerald-600 font-semibold hover:text-emerald-700 transition-colors">
                    Daftar sekarang
                </Link>
            </p>
        </>
    )
}