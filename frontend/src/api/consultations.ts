import { apiClient } from './client'
import type { Consultation, CreateConsultationPayload, SOAPReport } from '@/types'

export const consultationsApi = {
  list: (params = {}) =>
    apiClient.get('/consultations', { params }).then((r) => r.data),

  get: (id: string) =>
    apiClient.get<Consultation>(`/consultations/${id}`).then((r) => r.data),

  create: (data: CreateConsultationPayload) =>
    apiClient.post<Consultation>('/consultations', data).then((r) => r.data),

  start: (id: string) =>
    apiClient.post(`/consultations/${id}/start`).then((r) => r.data),

  end: (id: string, audioData: string) =>
    apiClient.post(`/consultations/${id}/end`, { audio_data: audioData }).then((r) => r.data),

  getTranscription: (id: string) =>
    apiClient.get(`/consultations/${id}/transcription`).then((r) => r.data),

  getReport: (id: string) =>
    apiClient.get<SOAPReport>(`/consultations/${id}/report`).then((r) => r.data),

  updateReport: (id: string, data: Partial<SOAPReport>) =>
    apiClient.put(`/consultations/${id}/report`, data).then((r) => r.data),

  approveReport: (id: string, signature_pin: string) =>
    apiClient.post(`/consultations/${id}/report/approve`, { signature_pin }).then((r) => r.data),

  /** Trigger AI SOAP generation from consultation transcript */
  generateSoap: (id: string) =>
    apiClient.post(`/consultations/${id}/generate-soap`).then((r) => r.data),
  
  update: (id: string, data: any) =>
    apiClient.put(`/consultations/${id}`, data).then((r) => r.data),

  delete: (id: string) =>
    apiClient.delete(`/consultations/${id}`).then((r) => r.data),
}
