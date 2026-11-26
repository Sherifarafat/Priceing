// Reusable POS voice & chime helper for Instapay / checkout confirmations.
// Uses backend /api/tts MP3 stream (crystal-clear natural Arabic voice across all browsers)
// with automatic fallback to browser Web Speech API (speechSynthesis).

let sharedAudio: HTMLAudioElement | null = null
let sharedAudioUrl = ''
let isActivelySpeaking = false
let sharedAudioCtx: AudioContext | null = null

function getTtsUrl(text: string, lang: 'ar' | 'en' = 'ar') {
  return `/api/tts?lang=${encodeURIComponent(lang)}&text=${encodeURIComponent(text)}`
}

function getAudioContext(): AudioContext | null {
  try {
    const Ctx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!Ctx) return null
    if (!sharedAudioCtx) {
      sharedAudioCtx = new Ctx()
    }
    if (sharedAudioCtx.state === 'suspended') {
      sharedAudioCtx.resume().catch(() => {})
    }
    return sharedAudioCtx
  } catch {
    return null
  }
}

/**
 * Call synchronously inside a user click gesture (e.g. clicking Confirm Payment)
 * to preload the voice MP3 and unlock browser autoplay before delayed timers fire.
 */
export function preparePaymentVoice(text = 'تم الدفع بنجاح', lang: 'ar' | 'en' = 'ar') {
  try {
    getAudioContext()

    const url = getTtsUrl(text, lang)
    if (!sharedAudio) {
      sharedAudio = new Audio()
      sharedAudio.preload = 'auto'
    }

    isActivelySpeaking = false
    if (sharedAudioUrl !== url) {
      sharedAudio.src = url
      sharedAudioUrl = url
      sharedAudio.load()
    }

    // Silent user-gesture unlock so delayed playback after Instapay timer is never blocked
    sharedAudio.muted = true
    const playPromise = sharedAudio.play()
    if (playPromise && typeof playPromise.then === 'function') {
      playPromise
        .then(() => {
          if (!isActivelySpeaking && sharedAudio) {
            sharedAudio.pause()
            sharedAudio.currentTime = 0
            sharedAudio.muted = false
          }
        })
        .catch(() => {
          if (sharedAudio) sharedAudio.muted = false
        })
    } else {
      sharedAudio.pause()
      sharedAudio.currentTime = 0
      sharedAudio.muted = false
    }

    // Warm up speechSynthesis voices list for offline fallback
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.getVoices()
    }
  } catch {
    // Ignore audio pre-warm errors
  }
}

/**
 * Pleasant 2-tone POS confirmation chime (G5 -> C6)
 */
export function playPaymentChime() {
  try {
    const ctx = getAudioContext()
    if (!ctx) return

    const now = ctx.currentTime
    const notes = [
      { freq: 783.99, start: 0, dur: 0.16, peak: 0.22 }, // G5
      { freq: 1046.5, start: 0.11, dur: 0.32, peak: 0.26 }, // C6
    ]

    for (const n of notes) {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.setValueAtTime(n.freq, now + n.start)

      gain.gain.setValueAtTime(0.001, now + n.start)
      gain.gain.linearRampToValueAtTime(n.peak, now + n.start + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.001, now + n.start + n.dur)

      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start(now + n.start)
      osc.stop(now + n.start + n.dur + 0.02)
    }
  } catch {
    // Ignore Web Audio errors
  }
}

function speakWithBrowserFallback(text: string, lang: 'ar' | 'en' = 'ar') {
  try {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return
    const synth = window.speechSynthesis
    synth.cancel()

    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = lang === 'ar' ? 'ar-EG' : 'en-US'
    utterance.rate = 0.95
    utterance.pitch = 1.0
    utterance.volume = 1.0

    const voices = synth.getVoices()
    if (voices.length > 0) {
      const preferred =
        lang === 'ar'
          ? voices.find((v) => /ar-eg/i.test(v.lang) && /salma|shakir|hoda|natural/i.test(v.name)) ||
            voices.find((v) => /ar-eg/i.test(v.lang)) ||
            voices.find((v) => /^ar/i.test(v.lang))
          : voices.find((v) => /^en/i.test(v.lang))

      if (preferred) {
        utterance.voice = preferred
        utterance.lang = preferred.lang
      }
    }

    synth.speak(utterance)
  } catch {
    // Ignore speechSynthesis errors
  }
}

/**
 * Plays a short confirmation chime and speaks the confirmation phrase clearly out loud.
 */
export function speakPaymentSuccess(text = 'تم الدفع بنجاح', lang: 'ar' | 'en' = 'ar') {
  playPaymentChime()

  const playVoice = () => {
    try {
      const url = getTtsUrl(text, lang)
      if (!sharedAudio) {
        sharedAudio = new Audio(url)
        sharedAudioUrl = url
      } else if (sharedAudioUrl !== url) {
        sharedAudio.src = url
        sharedAudioUrl = url
      }

      isActivelySpeaking = true
      sharedAudio.muted = false
      sharedAudio.volume = 1.0
      sharedAudio.currentTime = 0

      sharedAudio.onended = () => {
        isActivelySpeaking = false
      }
      sharedAudio.onerror = () => {
        isActivelySpeaking = false
        speakWithBrowserFallback(text, lang)
      }

      const p = sharedAudio.play()
      if (p && typeof p.catch === 'function') {
        p.catch(() => {
          isActivelySpeaking = false
          speakWithBrowserFallback(text, lang)
        })
      }
    } catch {
      isActivelySpeaking = false
      speakWithBrowserFallback(text, lang)
    }
  }

  // Slight 180ms pause so the chime introduces the voice cleanly
  window.setTimeout(playVoice, 180)
}
