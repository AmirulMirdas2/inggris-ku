import { describe, it, expect } from 'vitest'
import { blankSentence, checkBlank, checkArrange, tokenize, levelForWeek, isCrossTenseTarget } from './exercises'

describe('exercises', () => {
  it('blank mengganti kata target', () => {
    const { prompt, answer } = blankSentence('I eat rice every day.', 'eat')
    expect(prompt).toBe('I ___ rice every day.')
    expect(answer.toLowerCase()).toBe('eat')
  })

  it('checkBlank longgar terhadap huruf besar', () => {
    expect(checkBlank(' Eat ', 'eat')).toBe(true)
    expect(checkBlank('go', 'eat')).toBe(false)
  })

  it('checkArrange abaikan tanda baca', () => {
    expect(checkArrange(tokenize('I eat rice'), 'I eat rice.')).toBe(true)
    expect(checkArrange(['rice', 'eat', 'I'], 'I eat rice.')).toBe(false)
  })

  it('level dari minggu', () => {
    expect(levelForWeek(1)).toBe(1)
    expect(levelForWeek(3)).toBe(2)
    expect(levelForWeek(5)).toBe(3)
  })

  it('target lintas-tense: benda & sifat selalu boleh', () => {
    expect(isCrossTenseTarget('noun', 'water')).toBe(true)
    expect(isCrossTenseTarget('adjective', 'good')).toBe(true)
  })

  it('target lintas-tense: verba dasar boleh, bentuk terkunci ditolak', () => {
    expect(isCrossTenseTarget('verb', 'go')).toBe(true)
    expect(isCrossTenseTarget('verb', 'eat')).toBe(true)
    // penyebab bug user: be-verb lampau & bentuk -ing tak boleh jadi target
    expect(isCrossTenseTarget('verb', 'was')).toBe(false)
    expect(isCrossTenseTarget('verb', 'is')).toBe(false)
    expect(isCrossTenseTarget('verb', 'going')).toBe(false)
    expect(isCrossTenseTarget('verb', 'eaten')).toBe(false)
    // ter-tag continuous/past → tolak walau lolos ejaan
    expect(isCrossTenseTarget('verb', 'ate', 'pastSimple')).toBe(false)
  })

  it('target lintas-tense: kata fungsi (article/pronoun) ditolak', () => {
    expect(isCrossTenseTarget('article', 'the')).toBe(false)
    expect(isCrossTenseTarget('pronoun', 'i')).toBe(false)
  })
})
