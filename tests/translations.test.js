// Guards against the thing that goes wrong most easily with three
// languages: adding a line to English and forgetting the other two. The
// app would quietly fall back to English, which is easy to miss.

import { describe, it, expect } from 'vitest'
import { TRANSLATIONS, LANGUAGES } from '../src/lib/translations.js'

const ENGLISH_KEYS = Object.keys(TRANSLATIONS.en)

describe('translations', () => {
  it('has a table for every language in the picker', () => {
    LANGUAGES.forEach((language) => {
      expect(TRANSLATIONS[language.code]).toBeDefined()
    })
  })

  it('has no language in the tables that the picker does not offer', () => {
    const offered = LANGUAGES.map(language => language.code)

    expect(Object.keys(TRANSLATIONS).sort()).toEqual(offered.sort())
  })

  LANGUAGES.forEach((language) => {
    it(`has every English line in ${language.name}`, () => {
      const missing = ENGLISH_KEYS.filter(key => TRANSLATIONS[language.code][key] === undefined)

      expect(missing).toEqual([])
    })

    it(`has no extra lines in ${language.name}`, () => {
      const extra = Object.keys(TRANSLATIONS[language.code])
        .filter(key => TRANSLATIONS.en[key] === undefined)

      expect(extra).toEqual([])
    })

    it(`fills in the same {pieces} in ${language.name}`, () => {
      const wrong = []

      ENGLISH_KEYS.forEach((key) => {
        const english = TRANSLATIONS.en[key] || ''
        const other = TRANSLATIONS[language.code][key] || ''

        // A line saying {count} tracks is broken if the translation
        // forgot the {count}
        const englishPieces = (english.match(/{\w+}/g) || []).sort()
        const otherPieces = (other.match(/{\w+}/g) || []).sort()

        if (englishPieces.join() !== otherPieces.join()) {
          wrong.push(key)
        }
      })

      expect(wrong).toEqual([])
    })
  })
})
