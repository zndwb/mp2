export type Pokemon = {
  id: number
  name: string
  image: string
  types: string[]
  height: number
  weight: number
  experience: number
  abilities: string[]
  stats: { name: string; value: number }[]
}

export type SortKey = 'id' | 'name' | 'experience'
export type SortDirection = 'asc' | 'desc'
