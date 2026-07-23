// Materi 16 tense — konten STATIS (tanpa AI). Tahap "Baca" & "Kenali" memakai
// data ini; hanya tahap "Produksi" yang memanggil AI (evaluate-sentence).
//
// Urutan = urutan belajar Indonesia klasik: Present → Past → Future → Past Future,
// tiap waktu 4 aspek (Simple, Continuous, Perfect, Perfect Continuous).
// `order` = indeks 0..15; tense terbuka bila tense sebelumnya sudah UNLOCK_AT benar.

export type TimeFrame = 'sekarang' | 'lampau' | 'depan'

export interface RecognitionItem {
  sentence: string
  answer: TimeFrame
  why: string
}
export interface Contrast {
  wrong: string
  right: string
  why: string
}
export interface Example {
  en: string
  id: string
}

export interface TenseInfo {
  key: string
  order: number
  name: string // nama Inggris
  nameId: string // nama Indonesia
  formula: string
  aiLabel: string // dikirim ke AI sebagai "tense yang diharapkan"
  blurb: string
  when: string[]
  examples: Example[]
  contrast: Contrast[]
  recognition: RecognitionItem[]
}

// Syarat: 10 kalimat benar membuka tense berikutnya, 50 menandai tense "mastered".
export const UNLOCK_AT = 10
export const MASTER_AT = 50

export const TENSES: TenseInfo[] = [
  {
    key: 'presentSimple',
    order: 0,
    name: 'Present Simple',
    nameId: 'Waktu Sekarang Sederhana',
    formula: 'S + V1 (+s/es untuk he/she/it)',
    aiLabel:
      'Present Simple — S + verb-1 (tambah -s/-es untuk he/she/it). Untuk fakta, kebiasaan, kebenaran umum. Contoh: "I eat rice every day.", "She works here."',
    blurb:
      'Dipakai untuk kebiasaan, fakta, dan kebenaran umum — hal yang benar secara umum, bukan yang sedang terjadi tepat sekarang.',
    when: ['Kebiasaan sehari-hari (I go to work every day)', 'Fakta & kebenaran umum (Water boils at 100°C)', 'Jadwal tetap (The train leaves at 7)'],
    examples: [
      { en: 'I drink coffee every morning.', id: 'Saya minum kopi setiap pagi.' },
      { en: 'She lives in Aceh.', id: 'Dia tinggal di Aceh.' },
      { en: 'They play football on Sunday.', id: 'Mereka bermain sepak bola hari Minggu.' },
    ],
    contrast: [
      { wrong: 'She go to school.', right: 'She goes to school.', why: 'Subjek he/she/it wajib +s/es pada kata kerja.' },
      { wrong: 'I am eat rice every day.', right: 'I eat rice every day.', why: 'Kebiasaan pakai Present Simple, bukan "am + kerja".' },
    ],
    recognition: [
      { sentence: 'I brush my teeth every night.', answer: 'sekarang', why: 'Kebiasaan rutin → Present Simple (waktu sekarang secara umum).' },
      { sentence: 'The sun rises in the east.', answer: 'sekarang', why: 'Kebenaran umum → Present Simple.' },
      { sentence: 'She visited her aunt yesterday.', answer: 'lampau', why: '"yesterday" + visited → sudah lewat.' },
      { sentence: 'We will travel next week.', answer: 'depan', why: '"will + next week" → masa depan.' },
    ],
  },
  {
    key: 'presentContinuous',
    order: 1,
    name: 'Present Continuous',
    nameId: 'Waktu Sekarang Berlangsung',
    formula: 'S + am/is/are + V-ing',
    aiLabel:
      'Present Continuous — S + am/is/are + verb-ing. Untuk aksi yang sedang berlangsung sekarang atau di sekitar waktu ini. Contoh: "I am eating now.", "They are working."',
    blurb: 'Aksi yang sedang berlangsung tepat sekarang, atau rencana pasti dalam waktu dekat.',
    when: ['Sedang terjadi saat ini (I am reading now)', 'Situasi sementara (She is staying with us this week)', 'Rencana pasti dekat (We are meeting tonight)'],
    examples: [
      { en: 'I am studying English now.', id: 'Saya sedang belajar bahasa Inggris sekarang.' },
      { en: 'She is cooking in the kitchen.', id: 'Dia sedang memasak di dapur.' },
      { en: 'They are playing outside.', id: 'Mereka sedang bermain di luar.' },
    ],
    contrast: [
      { wrong: 'I am study now.', right: 'I am studying now.', why: 'Setelah am/is/are, kata kerja wajib -ing.' },
      { wrong: 'She cooking now.', right: 'She is cooking now.', why: 'Jangan lupa to be (is) sebelum kata kerja -ing.' },
    ],
    recognition: [
      { sentence: 'Look! The baby is sleeping.', answer: 'sekarang', why: 'is + sleeping → sedang terjadi sekarang.' },
      { sentence: 'I am writing a letter right now.', answer: 'sekarang', why: '"right now" + am writing → Present Continuous.' },
      { sentence: 'He works at a bank.', answer: 'sekarang', why: 'Fakta/kebiasaan → Present Simple, tetap waktu sekarang.' },
      { sentence: 'They were dancing last night.', answer: 'lampau', why: '"were + last night" → lampau, bukan sekarang.' },
    ],
  },
  {
    key: 'presentPerfect',
    order: 2,
    name: 'Present Perfect',
    nameId: 'Waktu Sekarang Sempurna',
    formula: 'S + have/has + V3',
    aiLabel:
      'Present Perfect — S + have/has + verb-3 (past participle). Untuk aksi yang sudah selesai tapi hasilnya relevan sekarang, atau pengalaman tanpa waktu spesifik. Contoh: "I have finished my work.", "She has visited Bali."',
    blurb: 'Menghubungkan masa lalu dengan sekarang: sesuatu sudah terjadi dan hasilnya terasa sekarang, atau pengalaman hidup (tanpa menyebut kapan persisnya).',
    when: ['Baru saja selesai, terasa sekarang (I have eaten — kenyang sekarang)', 'Pengalaman hidup (I have been to Japan)', 'Dengan just/already/yet/ever/never'],
    examples: [
      { en: 'I have finished my homework.', id: 'Saya sudah menyelesaikan PR saya.' },
      { en: 'She has never eaten durian.', id: 'Dia belum pernah makan durian.' },
      { en: 'We have lived here for five years.', id: 'Kami sudah tinggal di sini selama lima tahun.' },
    ],
    contrast: [
      { wrong: 'I have finish my work.', right: 'I have finished my work.', why: 'Setelah have/has pakai kata kerja bentuk ke-3 (V3).' },
      { wrong: 'She have gone home.', right: 'She has gone home.', why: 'he/she/it pakai "has", bukan "have".' },
    ],
    recognition: [
      { sentence: 'I have just finished lunch.', answer: 'sekarang', why: 'have + just finished → selesai, hasilnya terasa sekarang.' },
      { sentence: 'She has already read that book.', answer: 'sekarang', why: 'Present Perfect: relevan sampai sekarang.' },
      { sentence: 'I finished lunch an hour ago.', answer: 'lampau', why: '"an hour ago" → waktu lampau jelas → Past Simple.' },
      { sentence: 'They have known each other for years.', answer: 'sekarang', why: 'Dimulai dahulu, masih berlaku sekarang.' },
    ],
  },
  {
    key: 'presentPerfectContinuous',
    order: 3,
    name: 'Present Perfect Continuous',
    nameId: 'Waktu Sekarang Sempurna Berlangsung',
    formula: 'S + have/has + been + V-ing',
    aiLabel:
      'Present Perfect Continuous — S + have/has + been + verb-ing. Untuk aksi yang dimulai di masa lalu dan MASIH berlangsung sekarang, menekankan durasi. Contoh: "I have been studying for two hours."',
    blurb: 'Menekankan berapa lama sebuah aksi berlangsung: mulai dulu, masih berjalan sampai sekarang (atau baru saja berhenti).',
    when: ['Aksi berlanjut dari dulu sampai kini (I have been waiting for an hour)', 'Dengan for/since', 'Menekankan durasi, bukan hasil'],
    examples: [
      { en: 'I have been studying since morning.', id: 'Saya sudah belajar sejak pagi.' },
      { en: 'It has been raining for three hours.', id: 'Hujan sudah turun selama tiga jam.' },
      { en: 'She has been working here since 2020.', id: 'Dia sudah bekerja di sini sejak 2020.' },
    ],
    contrast: [
      { wrong: 'I have been study for hours.', right: 'I have been studying for hours.', why: 'Setelah "been" wajib kata kerja -ing.' },
      { wrong: 'I have studying since noon.', right: 'I have been studying since noon.', why: 'Perlu "been" antara have dan kerja -ing.' },
    ],
    recognition: [
      { sentence: 'I have been waiting for you since 5 o’clock.', answer: 'sekarang', why: 'Mulai dulu, masih menunggu sekarang.' },
      { sentence: 'She has been cooking all afternoon.', answer: 'sekarang', why: 'Aksi berdurasi yang berlanjut sampai kini.' },
      { sentence: 'He had been sleeping when I called.', answer: 'lampau', why: '"had been" → Past Perfect Continuous, di masa lampau.' },
      { sentence: 'They have been living here for a decade.', answer: 'sekarang', why: 'Dari dulu, masih tinggal di sini.' },
    ],
  },
  {
    key: 'pastSimple',
    order: 4,
    name: 'Past Simple',
    nameId: 'Waktu Lampau Sederhana',
    formula: 'S + V2',
    aiLabel:
      'Past Simple — S + verb-2 (past tense). Untuk aksi yang selesai di waktu lampau yang jelas. Contoh: "I ate rice yesterday.", "She went home."',
    blurb: 'Aksi yang sudah selesai pada waktu lampau tertentu (kemarin, tadi, tahun lalu) — sudah tuntas.',
    when: ['Aksi selesai di masa lalu (I visited grandma yesterday)', 'Rangkaian kejadian lampau', 'Dengan yesterday / ago / last ...'],
    examples: [
      { en: 'I watched a movie last night.', id: 'Saya menonton film tadi malam.' },
      { en: 'She bought a new bag.', id: 'Dia membeli tas baru.' },
      { en: 'We went to the beach yesterday.', id: 'Kami pergi ke pantai kemarin.' },
    ],
    contrast: [
      { wrong: 'I go to Jakarta last week.', right: 'I went to Jakarta last week.', why: 'Waktu lampau → kata kerja bentuk ke-2 (went).' },
      { wrong: 'She buyed a book.', right: 'She bought a book.', why: 'buy tidak beraturan → bought, bukan "buyed".' },
    ],
    recognition: [
      { sentence: 'I called my mother yesterday.', answer: 'lampau', why: '"yesterday" + called → lampau.' },
      { sentence: 'We ate at a warung two days ago.', answer: 'lampau', why: '"ago" → waktu lampau.' },
      { sentence: 'I eat breakfast at 7 every day.', answer: 'sekarang', why: 'Kebiasaan → Present Simple.' },
      { sentence: 'She will call you tomorrow.', answer: 'depan', why: '"will + tomorrow" → masa depan.' },
    ],
  },
  {
    key: 'pastContinuous',
    order: 5,
    name: 'Past Continuous',
    nameId: 'Waktu Lampau Berlangsung',
    formula: 'S + was/were + V-ing',
    aiLabel:
      'Past Continuous — S + was/were + verb-ing. Untuk aksi yang sedang berlangsung pada satu titik di masa lalu, sering terganggu aksi lain. Contoh: "I was sleeping when he called."',
    blurb: 'Aksi yang sedang berlangsung pada waktu tertentu di masa lalu — sering dipotong oleh kejadian lain (Past Simple).',
    when: ['Sedang berlangsung di masa lalu (At 8 pm I was studying)', 'Aksi panjang dipotong aksi pendek (I was cooking when she arrived)', 'Dua aksi berbarengan di masa lalu'],
    examples: [
      { en: 'I was reading when you called.', id: 'Saya sedang membaca ketika kamu menelepon.' },
      { en: 'They were playing football at 5 pm.', id: 'Mereka sedang bermain bola pukul 5 sore.' },
      { en: 'She was cooking while I was cleaning.', id: 'Dia sedang memasak sementara saya membersihkan.' },
    ],
    contrast: [
      { wrong: 'I was read when he came.', right: 'I was reading when he came.', why: 'Setelah was/were wajib kata kerja -ing.' },
      { wrong: 'They was playing.', right: 'They were playing.', why: 'Subjek jamak (they) pakai "were".' },
    ],
    recognition: [
      { sentence: 'I was watching TV when the lamp went off.', answer: 'lampau', why: 'was watching → sedang berlangsung di masa lalu.' },
      { sentence: 'At noon yesterday, we were eating.', answer: 'lampau', why: '"yesterday" + were eating → lampau.' },
      { sentence: 'I am watching TV now.', answer: 'sekarang', why: '"am watching + now" → sekarang.' },
      { sentence: 'She was writing a letter all evening.', answer: 'lampau', why: 'Aksi berdurasi di masa lalu.' },
    ],
  },
  {
    key: 'pastPerfect',
    order: 6,
    name: 'Past Perfect',
    nameId: 'Waktu Lampau Sempurna',
    formula: 'S + had + V3',
    aiLabel:
      'Past Perfect — S + had + verb-3 (past participle). Untuk aksi yang selesai SEBELUM aksi lampau lain. Contoh: "The train had left before I arrived."',
    blurb: 'Aksi yang sudah selesai sebelum aksi lampau lain terjadi — "masa lalu dari masa lalu".',
    when: ['Kejadian lebih dulu di antara dua kejadian lampau', 'Dengan before / after / by the time', 'Menegaskan urutan waktu di masa lalu'],
    examples: [
      { en: 'The bus had left before I arrived.', id: 'Bus sudah berangkat sebelum saya tiba.' },
      { en: 'She had finished dinner when we came.', id: 'Dia sudah selesai makan malam ketika kami datang.' },
      { en: 'I had never seen snow before that trip.', id: 'Saya belum pernah melihat salju sebelum perjalanan itu.' },
    ],
    contrast: [
      { wrong: 'The bus had left before I arrive.', right: 'The bus had left before I arrived.', why: 'Aksi kedua tetap Past Simple (arrived).' },
      { wrong: 'She had finish dinner.', right: 'She had finished dinner.', why: 'Setelah had pakai V3 (finished).' },
    ],
    recognition: [
      { sentence: 'By the time I woke up, he had gone.', answer: 'lampau', why: 'Dua kejadian lampau; had gone lebih dulu.' },
      { sentence: 'They had eaten before the movie started.', answer: 'lampau', why: 'had eaten → sebelum kejadian lampau lain.' },
      { sentence: 'I have eaten already.', answer: 'sekarang', why: '"have eaten" → Present Perfect, relevan sekarang.' },
      { sentence: 'She had studied French before she moved to Paris.', answer: 'lampau', why: 'Urutan dua kejadian lampau.' },
    ],
  },
  {
    key: 'pastPerfectContinuous',
    order: 7,
    name: 'Past Perfect Continuous',
    nameId: 'Waktu Lampau Sempurna Berlangsung',
    formula: 'S + had + been + V-ing',
    aiLabel:
      'Past Perfect Continuous — S + had + been + verb-ing. Untuk aksi yang sudah berlangsung selama suatu durasi SEBELUM aksi lampau lain. Contoh: "I had been waiting for an hour before the bus came."',
    blurb: 'Menekankan durasi sebuah aksi yang berlangsung sampai suatu titik di masa lalu, lalu berhenti/terganggu.',
    when: ['Durasi aksi sebelum kejadian lampau lain', 'Dengan for / since di konteks lampau', 'Menjelaskan penyebab keadaan lampau'],
    examples: [
      { en: 'I had been waiting for an hour when the bus came.', id: 'Saya sudah menunggu satu jam ketika bus datang.' },
      { en: 'She was tired because she had been working all day.', id: 'Dia lelah karena sudah bekerja seharian.' },
      { en: 'They had been living there for years before they moved.', id: 'Mereka sudah tinggal di sana bertahun-tahun sebelum pindah.' },
    ],
    contrast: [
      { wrong: 'I had been wait for an hour.', right: 'I had been waiting for an hour.', why: 'Setelah "been" wajib kata kerja -ing.' },
      { wrong: 'I had waiting for an hour.', right: 'I had been waiting for an hour.', why: 'Perlu "been" di antara had dan kerja -ing.' },
    ],
    recognition: [
      { sentence: 'He had been running before he got injured.', answer: 'lampau', why: 'Durasi aksi berhenti di titik lampau.' },
      { sentence: 'We had been talking for hours when she left.', answer: 'lampau', why: 'had been + kejadian lampau lain (left).' },
      { sentence: 'I have been reading since this morning.', answer: 'sekarang', why: '"have been" → masih berlangsung sekarang.' },
      { sentence: 'The ground was wet because it had been raining.', answer: 'lampau', why: 'Penyebab keadaan lampau.' },
    ],
  },
  {
    key: 'futureSimple',
    order: 8,
    name: 'Future Simple',
    nameId: 'Waktu Depan Sederhana',
    formula: 'S + will + V1',
    aiLabel:
      'Future Simple — S + will + verb-1 (bentuk dasar). Untuk keputusan spontan, janji, prediksi, atau fakta masa depan. Contoh: "I will call you tonight.", "It will rain tomorrow."',
    blurb: 'Untuk masa depan: keputusan yang baru diambil, janji, tawaran, atau prediksi. Inilah tempat kata "will".',
    when: ['Keputusan spontan (I will help you)', 'Janji & tawaran (I will pay you back)', 'Prediksi (It will be sunny tomorrow)'],
    examples: [
      { en: 'I will visit you tomorrow.', id: 'Saya akan mengunjungimu besok.' },
      { en: 'She will pass the exam.', id: 'Dia akan lulus ujian.' },
      { en: 'We will eat out tonight.', id: 'Kami akan makan di luar malam ini.' },
    ],
    contrast: [
      { wrong: 'I will to call you.', right: 'I will call you.', why: 'Setelah will pakai kata kerja dasar tanpa "to".' },
      { wrong: 'She will calls you.', right: 'She will call you.', why: 'Setelah will, kata kerja tetap dasar (tanpa -s).' },
    ],
    recognition: [
      { sentence: 'I will finish this report tomorrow.', answer: 'depan', why: '"will + tomorrow" → masa depan.' },
      { sentence: 'Don’t worry, I will help you.', answer: 'depan', why: 'Keputusan/janji → will → masa depan.' },
      { sentence: 'I finished the report an hour ago.', answer: 'lampau', why: '"finished + ago" → lampau.' },
      { sentence: 'She is helping me right now.', answer: 'sekarang', why: '"is helping + now" → sekarang.' },
    ],
  },
  {
    key: 'futureContinuous',
    order: 9,
    name: 'Future Continuous',
    nameId: 'Waktu Depan Berlangsung',
    formula: 'S + will + be + V-ing',
    aiLabel:
      'Future Continuous — S + will + be + verb-ing. Untuk aksi yang akan sedang berlangsung pada satu titik di masa depan. Contoh: "This time tomorrow I will be flying to Bali."',
    blurb: 'Aksi yang akan sedang berlangsung pada waktu tertentu di masa depan.',
    when: ['Sedang berlangsung di titik masa depan (At 9 pm I will be sleeping)', 'Rencana yang sedang berjalan nanti', 'Menanyakan rencana dengan sopan'],
    examples: [
      { en: 'This time tomorrow I will be flying to Bali.', id: 'Jam segini besok saya akan sedang terbang ke Bali.' },
      { en: 'At 8 pm we will be having dinner.', id: 'Pukul 8 malam kami akan sedang makan malam.' },
      { en: 'She will be waiting for you at the station.', id: 'Dia akan sedang menunggumu di stasiun.' },
    ],
    contrast: [
      { wrong: 'I will be fly tomorrow.', right: 'I will be flying tomorrow.', why: 'Setelah "will be" wajib kata kerja -ing.' },
      { wrong: 'I will flying tomorrow.', right: 'I will be flying tomorrow.', why: 'Perlu "be" antara will dan kerja -ing.' },
    ],
    recognition: [
      { sentence: 'At noon tomorrow I will be teaching.', answer: 'depan', why: 'will be + titik waktu depan.' },
      { sentence: 'They will be traveling next week.', answer: 'depan', why: '"will be + next week" → masa depan.' },
      { sentence: 'I was teaching at noon yesterday.', answer: 'lampau', why: '"was teaching + yesterday" → lampau.' },
      { sentence: 'She is traveling this week.', answer: 'sekarang', why: '"is traveling + this week" → sekarang.' },
    ],
  },
  {
    key: 'futurePerfect',
    order: 10,
    name: 'Future Perfect',
    nameId: 'Waktu Depan Sempurna',
    formula: 'S + will + have + V3',
    aiLabel:
      'Future Perfect — S + will + have + verb-3 (past participle). Untuk aksi yang akan selesai SEBELUM suatu waktu di masa depan. Contoh: "By next year I will have graduated."',
    blurb: 'Aksi yang akan sudah selesai sebelum satu titik waktu di masa depan.',
    when: ['Selesai sebelum batas waktu depan (By 2030 I will have finished)', 'Dengan by / by the time', 'Menegaskan sesuatu akan tuntas nanti'],
    examples: [
      { en: 'By next month I will have finished the course.', id: 'Bulan depan saya akan sudah menyelesaikan kursus ini.' },
      { en: 'She will have left by the time you arrive.', id: 'Dia akan sudah pergi saat kamu tiba.' },
      { en: 'We will have saved enough by December.', id: 'Kami akan sudah menabung cukup pada Desember.' },
    ],
    contrast: [
      { wrong: 'By next year I will have graduate.', right: 'By next year I will have graduated.', why: 'Setelah "will have" pakai V3 (graduated).' },
      { wrong: 'I will has finished by then.', right: 'I will have finished by then.', why: 'Setelah will selalu "have", bukan "has".' },
    ],
    recognition: [
      { sentence: 'By 8 pm I will have cooked dinner.', answer: 'depan', why: 'will have + batas waktu depan.' },
      { sentence: 'They will have arrived by midnight.', answer: 'depan', why: 'Akan selesai sebelum titik masa depan.' },
      { sentence: 'By 8 pm yesterday I had cooked dinner.', answer: 'lampau', why: '"had cooked + yesterday" → Past Perfect, lampau.' },
      { sentence: 'I have cooked dinner already.', answer: 'sekarang', why: '"have cooked" → Present Perfect, sekarang.' },
    ],
  },
  {
    key: 'futurePerfectContinuous',
    order: 11,
    name: 'Future Perfect Continuous',
    nameId: 'Waktu Depan Sempurna Berlangsung',
    formula: 'S + will + have + been + V-ing',
    aiLabel:
      'Future Perfect Continuous — S + will + have + been + verb-ing. Untuk menekankan durasi aksi sampai satu titik di masa depan. Contoh: "By June I will have been working here for ten years."',
    blurb: 'Menekankan berapa lama sebuah aksi akan berlangsung sampai satu titik di masa depan.',
    when: ['Durasi sampai batas waktu depan', 'Dengan for + titik waktu depan', 'Jarang dipakai, untuk penekanan durasi'],
    examples: [
      { en: 'By June I will have been working here for ten years.', id: 'Pada Juni saya akan sudah bekerja di sini selama sepuluh tahun.' },
      { en: 'By 5 pm she will have been studying for six hours.', id: 'Pukul 5 sore dia akan sudah belajar selama enam jam.' },
      { en: 'Next month we will have been living here for a year.', id: 'Bulan depan kami akan sudah tinggal di sini selama setahun.' },
    ],
    contrast: [
      { wrong: 'I will have been work for years.', right: 'I will have been working for years.', why: 'Setelah "been" wajib kata kerja -ing.' },
      { wrong: 'I will have working for years.', right: 'I will have been working for years.', why: 'Perlu "been" antara have dan kerja -ing.' },
    ],
    recognition: [
      { sentence: 'By next week I will have been waiting for a month.', answer: 'depan', why: 'will have been + durasi ke masa depan.' },
      { sentence: 'By 2030 they will have been running the shop for 20 years.', answer: 'depan', why: 'Durasi sampai titik masa depan.' },
      { sentence: 'I had been waiting for a month by then.', answer: 'lampau', why: '"had been" → Past Perfect Continuous, lampau.' },
      { sentence: 'I have been waiting for a month.', answer: 'sekarang', why: '"have been" → masih berlangsung sekarang.' },
    ],
  },
  {
    key: 'pastFutureSimple',
    order: 12,
    name: 'Past Future Simple',
    nameId: 'Waktu Depan di Masa Lalu Sederhana',
    formula: 'S + would + V1',
    aiLabel:
      'Past Future Simple (future in the past) — S + would + verb-1. Untuk masa depan yang dilihat dari sudut masa lalu, sering di kalimat tak langsung. Contoh: "She said she would come.", "I knew he would help."',
    blurb: 'Masa depan yang dilihat dari masa lalu — "akan" versi lampau. Sering muncul saat menceritakan ulang ucapan orang (reported speech).',
    when: ['Reported speech (He said he would call)', 'Rencana lampau untuk masa depan', 'Pengandaian (I would help if I could)'],
    examples: [
      { en: 'She said she would call me.', id: 'Dia bilang dia akan meneleponku.' },
      { en: 'I knew you would come.', id: 'Saya tahu kamu akan datang.' },
      { en: 'They promised they would help.', id: 'Mereka berjanji akan membantu.' },
    ],
    contrast: [
      { wrong: 'She said she will call.', right: 'She said she would call.', why: 'Kalimat utama lampau (said) → "will" jadi "would".' },
      { wrong: 'I would to help you.', right: 'I would help you.', why: 'Setelah would pakai kata kerja dasar tanpa "to".' },
    ],
    recognition: [
      { sentence: 'He told me he would arrive at nine.', answer: 'depan', why: 'would = "akan" dilihat dari masa lalu → mengarah ke depan.' },
      { sentence: 'I thought it would rain.', answer: 'depan', why: 'Prediksi masa depan dari sudut lampau.' },
      { sentence: 'He arrived at nine.', answer: 'lampau', why: '"arrived" → Past Simple, sudah terjadi.' },
      { sentence: 'He will arrive at nine.', answer: 'depan', why: '"will arrive" → Future Simple biasa.' },
    ],
  },
  {
    key: 'pastFutureContinuous',
    order: 13,
    name: 'Past Future Continuous',
    nameId: 'Waktu Depan di Masa Lalu Berlangsung',
    formula: 'S + would + be + V-ing',
    aiLabel:
      'Past Future Continuous — S + would + be + verb-ing. Aksi yang (dari sudut masa lalu) akan sedang berlangsung. Contoh: "She said she would be waiting."',
    blurb: 'Dari sudut masa lalu, aksi yang akan sedang berlangsung di "masa depannya" — biasanya di reported speech.',
    when: ['Reported speech dari Future Continuous', 'Rencana lampau yang sedang berjalan nanti', 'Menceritakan rencana orang lain'],
    examples: [
      { en: 'She said she would be waiting at the gate.', id: 'Dia bilang dia akan sedang menunggu di gerbang.' },
      { en: 'I knew they would be sleeping by then.', id: 'Saya tahu mereka akan sedang tidur saat itu.' },
      { en: 'He said he would be working late.', id: 'Dia bilang dia akan sedang bekerja sampai larut.' },
    ],
    contrast: [
      { wrong: 'She said she would be wait.', right: 'She said she would be waiting.', why: 'Setelah "would be" wajib kata kerja -ing.' },
      { wrong: 'She said she would waiting.', right: 'She said she would be waiting.', why: 'Perlu "be" antara would dan kerja -ing.' },
    ],
    recognition: [
      { sentence: 'He said he would be studying at 8.', answer: 'depan', why: 'would be + rencana ke depan (dari sudut lampau).' },
      { sentence: 'I thought you would be traveling.', answer: 'depan', why: 'Rencana masa depan dilihat dari lampau.' },
      { sentence: 'He was studying at 8 last night.', answer: 'lampau', why: '"was studying + last night" → lampau.' },
      { sentence: 'She will be traveling tomorrow.', answer: 'depan', why: '"will be traveling" → Future Continuous biasa.' },
    ],
  },
  {
    key: 'pastFuturePerfect',
    order: 14,
    name: 'Past Future Perfect',
    nameId: 'Waktu Depan di Masa Lalu Sempurna',
    formula: 'S + would + have + V3',
    aiLabel:
      'Past Future Perfect — S + would + have + verb-3. Untuk pengandaian masa lalu (yang tidak terjadi) atau future perfect dalam reported speech. Contoh: "I would have helped if you had asked."',
    blurb: 'Sering untuk pengandaian masa lalu yang tak jadi terjadi ("seandainya... pasti sudah..."), atau reported speech dari Future Perfect.',
    when: ['Pengandaian tipe-3 (I would have come if I had known)', 'Penyesalan masa lalu', 'Reported speech dari Future Perfect'],
    examples: [
      { en: 'I would have helped if you had asked.', id: 'Saya pasti sudah membantu seandainya kamu meminta.' },
      { en: 'She would have passed if she had studied.', id: 'Dia pasti sudah lulus seandainya dia belajar.' },
      { en: 'They said they would have finished by noon.', id: 'Mereka bilang mereka akan sudah selesai pada siang.' },
    ],
    contrast: [
      { wrong: 'I would have help you.', right: 'I would have helped you.', why: 'Setelah "would have" pakai V3 (helped).' },
      { wrong: 'I would has helped.', right: 'I would have helped.', why: 'Setelah would selalu "have", bukan "has".' },
    ],
    recognition: [
      { sentence: 'I would have called you if I had known.', answer: 'lampau', why: 'Pengandaian masa lalu yang tak terjadi.' },
      { sentence: 'She would have arrived by then.', answer: 'lampau', why: 'Perkiraan tentang masa lalu (yang tak terjadi).' },
      { sentence: 'I will have called you by then.', answer: 'depan', why: '"will have called" → Future Perfect, masa depan.' },
      { sentence: 'I called you last night.', answer: 'lampau', why: '"called + last night" → Past Simple.' },
    ],
  },
  {
    key: 'pastFuturePerfectContinuous',
    order: 15,
    name: 'Past Future Perfect Continuous',
    nameId: 'Waktu Depan di Masa Lalu Sempurna Berlangsung',
    formula: 'S + would + have + been + V-ing',
    aiLabel:
      'Past Future Perfect Continuous — S + would + have + been + verb-ing. Menekankan durasi dalam pengandaian masa lalu. Sangat jarang. Contoh: "By then I would have been working for ten years."',
    blurb: 'Tense paling langka: menekankan durasi sebuah aksi dalam pengandaian masa lalu atau reported speech.',
    when: ['Pengandaian masa lalu dengan penekanan durasi', 'Reported speech dari Future Perfect Continuous', 'Jarang dipakai sehari-hari'],
    examples: [
      { en: 'By 2020 I would have been living there for a decade.', id: 'Pada 2020 saya akan sudah tinggal di sana satu dekade.' },
      { en: 'She would have been working for hours by the time we came.', id: 'Dia akan sudah bekerja berjam-jam saat kami datang.' },
      { en: 'They said they would have been waiting for an hour.', id: 'Mereka bilang mereka akan sudah menunggu satu jam.' },
    ],
    contrast: [
      { wrong: 'I would have been work for years.', right: 'I would have been working for years.', why: 'Setelah "been" wajib kata kerja -ing.' },
      { wrong: 'I would have working for years.', right: 'I would have been working for years.', why: 'Perlu "been" antara have dan kerja -ing.' },
    ],
    recognition: [
      { sentence: 'By then I would have been studying for six hours.', answer: 'lampau', why: 'Perkiraan durasi dalam konteks lampau/pengandaian.' },
      { sentence: 'She would have been waiting for ages if we were late.', answer: 'lampau', why: 'Pengandaian masa lalu.' },
      { sentence: 'By June I will have been working here for ten years.', answer: 'depan', why: '"will have been" → Future Perfect Continuous, masa depan.' },
      { sentence: 'I have been studying for six hours.', answer: 'sekarang', why: '"have been" → masih berlangsung sekarang.' },
    ],
  },
]

export const tenseByKey = (key: string): TenseInfo | undefined => TENSES.find((t) => t.key === key)

// AI kadang set sesuaiTenseTarget=false padahal tenseDetected justru = tense target
// (false-negative → koreksi "ubah ke X" padahal sudah X). Percayai deteksi konkret:
// cocok bila himpunan katanya sama ("Present Simple" == "Simple Present").
export function detectedMatchesTense(detected: string | undefined, tenseName: string): boolean {
  const words = (s: string) => new Set(s.toLowerCase().replace(/[^a-z ]/g, ' ').split(/\s+/).filter(Boolean))
  const a = words(detected ?? ''), b = words(tenseName)
  return a.size > 0 && a.size === b.size && [...b].every((w) => a.has(w))
}

// Bentuk minimal progress yang dibutuhkan helper (cocok dengan TenseProgress).
export interface TenseProgressLike {
  correct_count: number
}

/** Tense terbuka bila yang pertama (order 0) atau tense SEBELUMNYA sudah
 *  mencapai UNLOCK_AT kalimat benar. Murni → diuji tanpa jaringan. */
export function isUnlocked(order: number, byKey: Record<string, TenseProgressLike | undefined>): boolean {
  if (order <= 0) return true
  const prev = TENSES[order - 1]
  return (byKey[prev.key]?.correct_count ?? 0) >= UNLOCK_AT
}

export type TenseStage = 'locked' | 'learning' | 'mastered'

/** Status tampilan satu tense: terkunci / sedang dipelajari / dikuasai. */
export function tenseStage(
  tense: TenseInfo,
  byKey: Record<string, (TenseProgressLike & { status?: string }) | undefined>,
): TenseStage {
  if (!isUnlocked(tense.order, byKey)) return 'locked'
  const p = byKey[tense.key]
  if (p && (p.status === 'mastered' || p.correct_count >= MASTER_AT)) return 'mastered'
  return 'learning'
}
