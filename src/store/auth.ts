import { create } from 'zustand'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import type { Profile } from '../lib/types'

interface AuthState {
  session: Session | null
  profile: Profile | null
  loading: boolean
  init: () => void
  loadProfile: () => Promise<void>
  setProfile: (p: Profile) => void
  signOut: () => Promise<void>
}

export const useAuth = create<AuthState>((set, get) => ({
  session: null,
  profile: null,
  loading: true,

  init: () => {
    supabase.auth.getSession().then(({ data }) => {
      set({ session: data.session, loading: false })
      if (data.session) get().loadProfile()
    })
    supabase.auth.onAuthStateChange((_e, session) => {
      set({ session })
      if (session) get().loadProfile()
      else set({ profile: null })
    })
  },

  loadProfile: async () => {
    const user = get().session?.user ?? (await supabase.auth.getUser()).data.user
    if (!user) return
    // maybeSingle: 0 baris → null tanpa error (bukan .single yang gagal diam-diam).
    let { data } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle()
    if (!data) {
      // Self-heal: trigger tak jalan / akun lama → buat baris profil sekarang.
      const { data: created, error } = await supabase.from('profiles')
        .insert({ id: user.id, email: user.email, display_name: user.email?.split('@')[0] })
        .select().single()
      if (error) console.error('Gagal membuat profil:', error.message)
      data = created
    }
    if (data) set({ profile: data as Profile })
  },

  setProfile: (p) => set({ profile: p }),

  signOut: async () => {
    await supabase.auth.signOut()
    set({ session: null, profile: null })
  },
}))
