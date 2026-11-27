export interface CategoryMeta {
  key: string
  label: string
  icon: string
  color: string
  bgClass: string
  borderClass: string
  textClass: string
}

export function formatCategory(category?: string | null): CategoryMeta {
  const cat = (category || '').toLowerCase().trim().replace(/[-\s]/g, '_')

  if (cat.includes('pothole')) {
    return {
      key: 'pothole',
      label: 'Pothole',
      icon: '🕳️',
      color: '#f97316',
      bgClass: 'bg-orange-950/80',
      borderClass: 'border-orange-500/40',
      textClass: 'text-orange-400',
    }
  }

  if (cat.includes('electr') || cat.includes('wire') || cat.includes('pole') || cat.includes('power') || cat.includes('cable')) {
    return {
      key: 'electrical_hazard',
      label: 'Electrical Hazard',
      icon: '⚡',
      color: '#eab308',
      bgClass: 'bg-yellow-950/80',
      borderClass: 'border-yellow-500/40',
      textClass: 'text-yellow-400',
    }
  }

  if (cat.includes('road') || cat.includes('pave') || cat.includes('asphalt') || cat.includes('crater') || cat.includes('broken')) {
    return {
      key: 'road_damage',
      label: 'Road Broken / Cave-in',
      icon: '🚧',
      color: '#ef4444',
      bgClass: 'bg-red-950/80',
      borderClass: 'border-red-500/40',
      textClass: 'text-red-400',
    }
  }

  if (cat.includes('drain') || cat.includes('sewer') || cat.includes('flood') || cat.includes('water') || cat.includes('manhole')) {
    return {
      key: 'drainage',
      label: 'Drainage / Sewer',
      icon: '🌊',
      color: '#06b6d4',
      bgClass: 'bg-cyan-950/80',
      borderClass: 'border-cyan-500/40',
      textClass: 'text-cyan-400',
    }
  }

  if (cat.includes('garb') || cat.includes('waste') || cat.includes('trash') || cat.includes('dump') || cat.includes('debris')) {
    return {
      key: 'garbage',
      label: 'Garbage Dump',
      icon: '🗑️',
      color: '#84cc16',
      bgClass: 'bg-lime-950/80',
      borderClass: 'border-lime-500/40',
      textClass: 'text-lime-400',
    }
  }

  if (cat.includes('tree') || cat.includes('branch') || cat.includes('foliage')) {
    return {
      key: 'fallen_tree',
      label: 'Fallen Tree / Debris',
      icon: '🌳',
      color: '#10b981',
      bgClass: 'bg-emerald-950/80',
      borderClass: 'border-emerald-500/40',
      textClass: 'text-emerald-400',
    }
  }

  if (cat.includes('light') || cat.includes('lamp') || cat.includes('illumination')) {
    return {
      key: 'street_light',
      label: 'Street Light Fault',
      icon: '💡',
      color: '#a855f7',
      bgClass: 'bg-purple-950/80',
      borderClass: 'border-purple-500/40',
      textClass: 'text-purple-400',
    }
  }

  // General or custom civic damage
  const readable = category 
    ? category.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
    : 'General Damage'

  return {
    key: cat || 'general_damage',
    label: readable,
    icon: '⚠️',
    color: '#f59e0b',
    bgClass: 'bg-amber-950/80',
    borderClass: 'border-amber-500/40',
    textClass: 'text-amber-400',
  }
}

export const KNOWN_CATEGORIES = [
  { key: '', label: 'All Categories', icon: '🌐' },
  { key: 'pothole', label: 'Pothole', icon: '🕳️' },
  { key: 'road_damage', label: 'Road Broken', icon: '🚧' },
  { key: 'electrical_hazard', label: 'Electrical Hazard', icon: '⚡' },
  { key: 'drainage', label: 'Drainage / Sewer', icon: '🌊' },
  { key: 'garbage', label: 'Garbage Dump', icon: '🗑️' },
  { key: 'fallen_tree', label: 'Fallen Tree', icon: '🌳' },
  { key: 'street_light', label: 'Street Light', icon: '💡' },
  { key: 'general_damage', label: 'General Damage', icon: '⚠️' },
]
