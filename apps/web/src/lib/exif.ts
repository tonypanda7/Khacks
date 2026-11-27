import exifr from 'exifr'

export interface ParsedExif {
  lat: number
  lon: number
  capturedAt: Date | null
  raw: Record<string, any>
}

export async function parseExif(buffer: Buffer): Promise<ParsedExif | null> {
  try {
    const exif = await exifr.parse(buffer, {
      gps: true,
      pick: ['GPSLatitude', 'GPSLatitudeRef', 'GPSLongitude', 'GPSLongitudeRef', 
             'DateTimeOriginal', 'OffsetTimeOriginal', 'Make', 'Model']
    })

    if (!exif) return null

    const lat = typeof exif.latitude === 'number' && Number.isFinite(exif.latitude) ? exif.latitude : undefined
    const lon = typeof exif.longitude === 'number' && Number.isFinite(exif.longitude) ? exif.longitude : undefined

    if (lat === undefined || lon === undefined) return null

    let capturedAt: Date | null = null
    if (exif.DateTimeOriginal) {
      capturedAt = new Date(exif.DateTimeOriginal)
    }

    return {
      lat,
      lon,
      capturedAt,
      raw: exif,
    }
  } catch (error) {
    console.error('EXIF parsing error:', error)
    return null
  }
}
