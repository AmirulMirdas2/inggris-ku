import { motion } from 'framer-motion'
import { PixelIcon } from '../PixelIcon'
import type { Word } from '../../lib/types'
import { speak } from '../../lib/audio'
import { PosBadge } from '../PosBadge'
import SpeakCheck from './SpeakCheck'

// FASE A — kenali tanpa tekanan.
export default function PhaseRecognize({ word, onDone }: { word: Word; onDone: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: [0.6, 0, 0.4, 1] }}
      className="card space-y-5 text-center"
    >
      <div>
        <button
          onClick={() => speak(word.text)}
          className="group inline-flex items-center gap-2 rounded-full px-2 transition duration-200 ease-soft hover:text-brand/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
          aria-label={`Dengar ${word.text}`}
        >
          <span className="text-4xl font-extrabold text-brand">{word.text}</span>
          <PixelIcon name="speaker" size={24} className="transition-transform duration-75 ease-soft group-hover:scale-110" />
        </button>
        {word.phonetic && <p className="mt-1 muted">{word.phonetic}</p>}
        <p className="mt-2 text-xl">{word.translation_id}</p>
        <div className="mt-2"><PosBadge pos={word.part_of_speech} /></div>
        {word.chunk && <p className="mt-1 text-sm muted">frasa: {word.chunk}</p>}
      </div>

      {word.example_en && (
        <div className="rounded-xl bg-black/5 p-4 text-left dark:bg-white/5">
          <button onClick={() => speak(word.example_en!)} className="font-semibold text-brand">
            <span className="inline-flex items-center gap-2"><PixelIcon name="speaker" size={16} /> {word.example_en}</span>
          </button>
          <p className="muted">{word.example_id}</p>
          <div className="mt-2"><SpeakCheck target={word.example_en} /></div>
        </div>
      )}

      <button onClick={onDone} className="btn-primary">Saya paham</button>
    </motion.div>
  )
}
