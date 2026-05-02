export type Regiao = 'Salvador' | 'RMS'

export interface Cidade {
  nome: string
  regiao: Regiao
}

// Municípios oficiais da Região Metropolitana de Salvador (IBGE)
export const CIDADES: Cidade[] = [
  // Capital
  { nome: 'Salvador', regiao: 'Salvador' },
  // RMS — ordem alfabética
  { nome: 'Camaçari', regiao: 'RMS' },
  { nome: 'Candeias', regiao: 'RMS' },
  { nome: 'Dias d\'Ávila', regiao: 'RMS' },
  { nome: 'Itaparica', regiao: 'RMS' },
  { nome: 'Lauro de Freitas', regiao: 'RMS' },
  { nome: 'Madre de Deus', regiao: 'RMS' },
  { nome: 'Mata de São João', regiao: 'RMS' },
  { nome: 'Pojuca', regiao: 'RMS' },
  { nome: 'São Francisco do Conde', regiao: 'RMS' },
  { nome: 'São Sebastião do Passé', regiao: 'RMS' },
  { nome: 'Simões Filho', regiao: 'RMS' },
  { nome: 'Vera Cruz', regiao: 'RMS' },
]

export function buscarCidades(query: string): Cidade[] {
  if (!query.trim()) return CIDADES
  const q = query.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  return CIDADES.filter(c => {
    const nome = c.nome.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    return nome.includes(q)
  })
}

export const NOMES_CIDADES = CIDADES.map(c => c.nome)
