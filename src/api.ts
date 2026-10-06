import axios from 'axios'
import type { Pokemon } from './types'

const client = axios.create({ baseURL: 'https://pokeapi.co/api/v2' })

const fallback: Pokemon[] = [
  ['Bulbasaur', ['grass', 'poison'], 1, 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/1.png'],
  ['Charmander', ['fire'], 4, 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/4.png'],
  ['Squirtle', ['water'], 7, 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/7.png'],
  ['Pikachu', ['electric'], 25, 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/25.png'],
  ['Jigglypuff', ['fairy', 'normal'], 39, 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/39.png'],
  ['Meowth', ['normal'], 52, 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/52.png'],
  ['Psyduck', ['water'], 54, 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/54.png'],
  ['Eevee', ['normal'], 133, 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/133.png'],
].map(([name, types, id, image]) => ({
  id: id as number, name: name as string, types: types as string[], image: image as string,
  height: 6, weight: 60, experience: 100, abilities: ['adaptability'],
  stats: [{ name: 'hp', value: 60 }, { name: 'attack', value: 55 }, { name: 'speed', value: 55 }],
}))

export async function getPokemon(): Promise<Pokemon[]> {
  try {
    const { data } = await client.get<{ results: { name: string; url: string }[] }>('/pokemon?limit=60')
    const records = await Promise.all(data.results.map(({ url }) => client.get(url).then((response) => response.data)))
    return records.map((item) => ({
      id: item.id,
      name: item.name,
      image: item.sprites.other['official-artwork'].front_default ?? item.sprites.front_default,
      types: item.types.map((entry: { type: { name: string } }) => entry.type.name),
      height: item.height,
      weight: item.weight,
      experience: item.base_experience ?? 0,
      abilities: item.abilities.map((entry: { ability: { name: string } }) => entry.ability.name),
      stats: item.stats.map((entry: { stat: { name: string }; base_stat: number }) => ({ name: entry.stat.name, value: entry.base_stat })),
    }))
  } catch {
    return fallback
  }
}
