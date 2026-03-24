import { supabase } from './supabase.js'

export async function fetchProfile(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('profile_data')
    .eq('id', userId)
    .single()
  if (error && error.code !== 'PGRST116') throw error
  return data?.profile_data ?? null
}

export async function saveProfile(userId, email, profileData) {
  const { error } = await supabase.from('profiles').upsert({
    id: userId,
    email,
    profile_data: profileData,
    updated_at: new Date().toISOString(),
    last_seen: new Date().toISOString(),
  }, { onConflict: 'id' })
  if (error) throw error
}

export async function touchLastSeen(userId) {
  const { error } = await supabase
    .from('profiles')
    .update({ last_seen: new Date().toISOString() })
    .eq('id', userId)
  if (error) console.warn('touchLastSeen failed (first login is ok):', error.message)
}

export async function fetchAllProfiles() {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, email, profile_data, created_at, updated_at, last_seen')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function checkIsAdmin(userId) {
  const { data, error } = await supabase
    .from('admins')
    .select('user_id')
    .eq('user_id', userId)
    .single()
  if (error) return false
  return !!data
}
