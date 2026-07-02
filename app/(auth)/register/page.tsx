'use client'

import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { Input }     from '@/components/ui/input'
import { Button }    from '@/components/ui/button'
import { Label }     from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { AlertCircle, Eye, EyeOff } from 'lucide-react'
import Link from 'next/link'

type FieldErrors = {
    email?:    string
    password?: string
    confirm?:  string
    general?:  string
}

function parseSupabaseError(message: string): FieldErrors {
    const msg = message.toLowerCase()
    if (msg.includes('already registered') || msg.includes('user already exists')) {
        return { email: 'Email ini sudah terdaftar. Silakan masuk.' }
    }
    if (msg.includes('invalid email')) {
        return { email: 'Format email tidak valid.' }
    }
    if (msg.includes('password') && msg.includes('short')) {
        return { password: 'Password terlalu pendek, minimal 8 karakter.' }
    }
    if (msg.includes('too many requests') || msg.includes('rate limit')) {
        return { general: 'Terlalu banyak percobaan. Tunggu beberapa menit.' }
    }
    return { general: message }
}

function PasswordStrength({ password }: { password: string }) {
    if (!password) return null
    const checks = [
        password.length >= 8,
        /[A-Z]/.test(password),
        /[0-9]/.test(password),
        /[^A-Za-z0-9]/.test(password),
    ]
    const score = checks.filter(Boolean).length
    const labels = ['', 'Lemah', 'Cukup', 'Kuat', 'Sangat kuat']
    const colors = ['', 'bg-red-400', 'bg-yellow-400', 'bg-emerald-400', 'bg-emerald-500']
    const textColors = ['', 'text-red-500', 'text-yellow-600', 'text-emerald-600', 'text-emerald-600']

    return (
        <div className="mt-2 space-y-1.5">
            <div className="flex gap-1">
                {[1,2,3,4].map(i => (
                    <div
                        key={i}
                        className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                            i <= score ? colors[score] : 'bg-gray-100'
                        }`}
                    />
                ))}
            </div>
            <p className={`text-[11px] font-medium ${textColors[score]}`}>
                {labels[score]}
            </p>
        </div>
    )
}

export default function RegisterPage() {
    const { signUp, loading } = useAuth()
    const [email, setEmail]         = useState('')
    const [password, setPassword]   = useState('')
    const [confirm, setConfirm]     = useState('')
    const [errors, setErrors]       = useState<FieldErrors>({})
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirm, setShowConfirm]   = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setErrors({})

        const next: FieldErrors = {}
        if (!email)                     next.email    = 'Email wajib diisi.'
        if (!password)                  next.password = 'Password wajib diisi.'
        else if (password.length < 8)   next.password = 'Password minimal 8 karakter.'
        if (!confirm)                   next.confirm  = 'Konfirmasi password wajib diisi.'
        else if (password !== confirm)  next.confirm  = 'Password tidak cocok.'
        if (Object.keys(next).length) { setErrors(next); return }

        try {
            await signUp(email, password)
        } catch (err: any) {
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
                Bergabung bersama kami
            </p>
            <h1 className="text-[28px] font-bold text-gray-900 tracking-tight leading-tight mb-1">
                Buat akun baru
            </h1>
            <p className="text-[13px] text-gray-400 mb-8">
                Mulai kelola aset waqf secara transparan
            </p>

            <div className="space-y-4">

                {errors.general && (
                    <div className="flex items-start gap-2.5 text-[12px] text-red-700 bg-red-50 border border-red-200 rounded-xl px-3.5 py-3 leading-relaxed animate-in fade-in slide-in-from-top-1 duration-200">
                        <AlertCircle size={15} className="shrink-0 mt-0.5 text-red-500" />
                        <span>{errors.general}</span>
                    </div>
                )}

                {/* Email */}
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

                {/* Password */}
                <div className="space-y-1.5">
                    <Label htmlFor="password" className="text-[11px] font-semibold text-gray-500 uppercase tracking-widest">
                        Password
                    </Label>
                    <div className="relative">
                        <Input
                            id="password"
                            type={showPassword ? 'text' : 'password'}
                            placeholder="Min. 8 karakter"
                            value={password}
                            onChange={e => {
                                setPassword(e.target.value)
                                if (errors.password) setErrors(p => ({ ...p, password: undefined }))
                            }}
                            className={`${inputCls('password')} pr-10`}
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(v => !v)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                        >
                            {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                        </button>
                    </div>
                    {errors.password && (
                        <p className="flex items-center gap-1 text-[11px] text-red-500 mt-1">
                            <AlertCircle size={11} /> {errors.password}
                        </p>
                    )}
                    <PasswordStrength password={password} />
                </div>

                {/* Konfirmasi Password */}
                <div className="space-y-1.5">
                    <Label htmlFor="confirm" className="text-[11px] font-semibold text-gray-500 uppercase tracking-widest">
                        Konfirmasi password
                    </Label>
                    <div className="relative">
                        <Input
                            id="confirm"
                            type={showConfirm ? 'text' : 'password'}
                            placeholder="Ulangi password"
                            value={confirm}
                            onChange={e => {
                                setConfirm(e.target.value)
                                if (errors.confirm) setErrors(p => ({ ...p, confirm: undefined }))
                            }}
                            className={`${inputCls('confirm')} pr-10`}
                        />
                        <button
                            type="button"
                            onClick={() => setShowConfirm(v => !v)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                        >
                            {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
                        </button>
                    </div>
                    {errors.confirm && (
                        <p className="flex items-center gap-1 text-[11px] text-red-500 mt-1">
                            <AlertCircle size={11} /> {errors.confirm}
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
                    ) : 'Buat akun'}
                </Button>
            </div>

            <div className="flex items-center gap-3 my-6">
                <Separator className="flex-1 bg-gray-100" />
                <span className="text-[11px] text-gray-300">atau</span>
                <Separator className="flex-1 bg-gray-100" />
            </div>

            <p className="text-center text-[12px] text-gray-400">
                Sudah punya akun?{' '}
                <Link href="/login" className="text-emerald-600 font-semibold hover:text-emerald-700 transition-colors">
                    Masuk di sini
                </Link>
            </p>
        </>
    )
}