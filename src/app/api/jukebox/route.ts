import { NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'

export async function GET() {
  try {
    const jukeboxDir = path.join(process.cwd(), 'public', 'jukebox')
    const files = await fs.readdir(jukeboxDir)
    const mp3s = files.filter((f) => f.endsWith('.mp3'))
    return NextResponse.json({ tracks: mp3s })
  } catch (error) {
    return NextResponse.json({ error: 'Could not read jukebox folder.' }, { status: 500 })
  }
}
