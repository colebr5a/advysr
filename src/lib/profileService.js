import { supabase } from './supabase.js'
import { currentUsageMonth } from './usage.js'

// The PIN is never stored in profile_data — only a non-secret `hasPin` flag.
// This also strips plaintext PINs from legacy profiles before they're re-saved.
export function sanitizeProfile(profileData) {
  if (!profileData) return profileData
  const { pin, ...rest } = profileData
  return pin ? { ...rest, hasPin: true } : rest
}

export async function fetchAiUsage(userId) {
  const { data, error } = await supabase
    .from('ai_usage')
    .select('queries')
    .eq('user_id', userId)
    .eq('month', currentUsageMonth())
    .maybeSingle()
  if (error) return 0
  return data?.queries ?? 0
}

export async function fetchProfile(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('profile_data')
    .eq('id', userId)
    .single()
  if (error && error.code !== 'PGRST116') throw error
  return {
    profileData: data?.profile_data ?? null,
  }
}

export async function saveProfile(userId, email, profileData) {
  const { error } = await supabase.from('profiles').upsert({
    id: userId,
    email,
    profile_data: sanitizeProfile(profileData),
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
