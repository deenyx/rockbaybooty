import { supabase } from '@/lib/supabase'

export async function uploadProfilePhotos(userId: string, files: FileList): Promise<string[]> {
  const uploadedUrls: string[] = []
  for (const file of Array.from(files)) {
    const ext = file.name.split('.').pop() || 'jpg'
    const filePath = `profile-photos/${userId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
    const { error } = await supabase.storage.from('profile-photos').upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
    })
    if (error) throw error
    const { data } = supabase.storage.from('profile-photos').getPublicUrl(filePath)
    if (data?.publicUrl) uploadedUrls.push(data.publicUrl)
  }
  return uploadedUrls
}
