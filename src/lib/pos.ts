// Label kelas kata dalam Bahasa Indonesia. Ditampilkan di tiap kata supaya
// siswa tahu SENDIRI aturan tense (mis. -s Simple Present hanya untuk kata
// kerja; kata sifat butuh "is") tanpa harus diberitahu AI dulu.
const POS_ID: Record<string, string> = {
  noun: 'kata benda',
  verb: 'kata kerja',
  adjective: 'kata sifat',
  adverb: 'kata keterangan',
  pronoun: 'kata ganti',
  preposition: 'kata depan',
  conjunction: 'kata sambung',
  article: 'kata sandang',
  determiner: 'kata sandang',
  interjection: 'kata seru',
  numeral: 'kata bilangan',
}

// null → tak usah tampilkan badge. Nilai tak dikenal (mis. dari AI) dipakai apa adanya.
export function posId(pos: string | null | undefined): string | null {
  if (!pos) return null
  return POS_ID[pos.trim().toLowerCase()] ?? pos
}
