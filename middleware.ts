import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
    let res = NextResponse.next()

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                get(name) {
                    return req.cookies.get(name)?.value
                },
                set(name, value, options) {
                    res.cookies.set({ name, value, ...options })
                },
                remove(name, options) {
                    res.cookies.set({ name, value: '', ...options })
                },
            },
        }
    )

    // 🔐 ambil user (diverifikasi ke Supabase Auth server)
    const {
        data: { user },
    } = await supabase.auth.getUser()

    const url = req.nextUrl

    // =========================
    // ❌ BELUM LOGIN
    // =========================
    if (!user) {
        if (url.pathname.startsWith('/dashboard') || url.pathname === '/') {
            return NextResponse.redirect(new URL('/login', req.url))
        }
        return res
    }

    // =========================
    // ✅ SUDAH LOGIN
    // =========================

    // ambil role dari DB
    const { data: userData } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single()

    const role = userData?.role

    // 🚫 cegah akses halaman login/register kalau sudah login
    if (url.pathname === '/login' || url.pathname === '/register') {
        return NextResponse.redirect(new URL('/dashboard', req.url))
    }

    // 🔒 PROTECT ROLE
    if (url.pathname.startsWith('/dashboard/wakif') && role !== 'wakif') {
        return NextResponse.redirect(new URL('/dashboard', req.url))
    }

    if (url.pathname.startsWith('/dashboard/nazhir') && role !== 'nazhir') {
        return NextResponse.redirect(new URL('/dashboard', req.url))
    }

    if (url.pathname.startsWith('/dashboard/sharia') && role !== 'sharia') {
        return NextResponse.redirect(new URL('/dashboard', req.url))
    }

    return res
}

export const config = {
    matcher: ['/dashboard/:path*', '/login', '/register', '/'],
}