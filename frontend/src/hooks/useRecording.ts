import {
  useRef,
  useCallback,
  useEffect,
  useState
} from 'react'

import toast from 'react-hot-toast'

import { useConsultationStore } from '@/store/consultationStore'


export function useRecording() {

  const {
    isRecording,
    startRecording,
    stopRecording,
    tick,
    appendTranscript
  } = useConsultationStore()

  const timerRef =
    useRef<ReturnType<typeof setInterval> | null>(null)

  const mediaRecorderRef =
    useRef<MediaRecorder | null>(null)

  const audioChunksRef =
    useRef<Blob[]>([])

  const audioContextRef =
    useRef<AudioContext | null>(null)

  const analyserRef =
    useRef<AnalyserNode | null>(null)

  const [audioBase64, setAudioBase64] =
    useState<string | null>(null)

  const [analyser, setAnalyser] =
    useState<AnalyserNode | null>(null)



  // START RECORDING
  const start = useCallback(async () => {

    try {

      const stream =
        await navigator.mediaDevices.getUserMedia({
          audio: {
            channelCount: 1,
            sampleRate: 16000,
            echoCancellation: true,
            noiseSuppression: true
          }
        })

      // Audio Visualization
      const audioContext = new (
        window.AudioContext ||
        (window as any).webkitAudioContext
      )({
        sampleRate: 16000
      })

      const source =
        audioContext.createMediaStreamSource(stream)

      const analyserNode =
        audioContext.createAnalyser()

      analyserNode.fftSize = 256

      source.connect(analyserNode)

      audioContextRef.current = audioContext

      analyserRef.current = analyserNode

      setAnalyser(analyserNode)

      // Reset audio chunks
      audioChunksRef.current = []

      // Create media recorder
      const mediaRecorder = new MediaRecorder(
        stream,
        {
          mimeType: 'audio/webm'
        }
      )

      mediaRecorder.ondataavailable = (event) => {

        if (event.data.size > 0) {

          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorder.start(1000)

      mediaRecorderRef.current = mediaRecorder

      startRecording()

      timerRef.current =
        window.setInterval(tick, 1000)

      console.log('Recording started')

    } catch (error) {

      console.error('Recording error:', error)

      toast.error('Could not access microphone')
    }

  }, [startRecording, tick])



  // STOP RECORDING
  const stop = useCallback((): Promise<string> => {

    return new Promise((resolve) => {

      stopRecording()

      // Stop timer
      if (timerRef.current) {

        window.clearInterval(timerRef.current)
      }

      // Close audio context
      if (audioContextRef.current) {

        audioContextRef.current.close()

        audioContextRef.current = null

        setAnalyser(null)
      }

      // Stop recording
      if (
        mediaRecorderRef.current &&
        mediaRecorderRef.current.state !== 'inactive'
      ) {

        mediaRecorderRef.current.onstop = async () => {

          try {

            // Create audio blob
            const audioBlob = new Blob(
              audioChunksRef.current,
              {
                type: 'audio/webm'
              }
            )

            // Convert to base64
            const reader = new FileReader()

            reader.readAsDataURL(audioBlob)

            reader.onloadend = async () => {

              const base64String =
                (reader.result as string).split(',')[1]

              setAudioBase64(base64String)

              // Send to backend
              const formData = new FormData()

              formData.append(
                'file',
                audioBlob,
                'recording.webm'
              )

              try {

                const response = await fetch(
                  'http://127.0.0.1:8000/api/v1/speech/transcribe',
                  {
                    method: 'POST',
                    body: formData
                  }
                )

                const data = await response.json()

                console.log('TRANSCRIPTION:', data)

                if (data.transcription) {

                  appendTranscript(
                    data.transcription
                  )

                  toast.success(
                    'Transcription completed'
                  )

                } else {

                  toast.error(
                    'No transcription returned'
                  )
                }

              } catch (error) {

                console.error(
                  'Transcription API error:',
                  error
                )

                toast.error(
                  'Backend transcription failed'
                )
              }

              resolve(base64String)
            }

          } catch (error) {

            console.error(
              'Audio processing error:',
              error
            )

            toast.error(
              'Audio processing failed'
            )

            resolve('')
          }
        }

        mediaRecorderRef.current.stop()

        mediaRecorderRef.current.stream
          .getTracks()
          .forEach(track => track.stop())

      } else {

        resolve('')
      }

    })

  }, [stopRecording, appendTranscript])



  // CLEANUP
  useEffect(() => {

    return () => {

      if (timerRef.current) {

        clearInterval(timerRef.current)
      }

      if (audioContextRef.current) {

        audioContextRef.current.close()
      }

      if (
        mediaRecorderRef.current &&
        mediaRecorderRef.current.state !== 'inactive'
      ) {

        mediaRecorderRef.current.stop()
      }
    }

  }, [])



  return {
    isRecording,
    start,
    stop,
    audioBase64,
    analyser
  }
}