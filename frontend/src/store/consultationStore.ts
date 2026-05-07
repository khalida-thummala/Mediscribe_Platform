import { create } from 'zustand'

interface ConsultationState {
  isRecording: boolean
  transcript: string
  recSeconds: number
  confidence: number

  startRecording: () => void
  stopRecording: () => void

  appendTranscript: (text: string) => void

  setConfidence: (v: number) => void

  tick: () => void

  reset: () => void
}

export const useConsultationStore =
  create<ConsultationState>((set) => ({

    isRecording: false,

    transcript: '',

    recSeconds: 0,

    confidence: 0,

    startRecording: () =>
      set({
        isRecording: true,
        transcript: '',
        recSeconds: 0
      }),

    stopRecording: () =>
      set({
        isRecording: false
      }),

    appendTranscript: (text) =>
      set({
        transcript: text
      }),

    setConfidence: (confidence) =>
      set({
        confidence
      }),

    tick: () =>
      set((s) => ({
        recSeconds: s.recSeconds + 1
      })),

    reset: () =>
      set({
        isRecording: false,
        transcript: '',
        recSeconds: 0,
        confidence: 0
      })

  }))