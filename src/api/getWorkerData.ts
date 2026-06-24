import mock from '../../mock/mock.json'
import type { Worker } from './types/worker'

interface WorkerDataResponse {
  code: number
  message: string
  data: Worker[]
}

export const getWorkerData = async (): Promise<WorkerDataResponse> => {
  return mock as WorkerDataResponse
}
