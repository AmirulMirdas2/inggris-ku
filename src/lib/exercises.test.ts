import { describe, it, expect } from 'vitest'
import { blankSentence, checkBlank, checkArrange, tokenize, levelForWeek } from './exercises'

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
})
