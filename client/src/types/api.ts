export type ApiOk<T> = { ok: true; data: T }
export type ApiErr = { ok: false; error: { message: string } }
export type ApiResponse<T> = ApiOk<T> | ApiErr

export type Scheme = {
  id: string
  name: string
  ministry: string
  state: string | null
  category: string
  description: string
  benefit: string
  updatedAt?: string | null
  eligibility: {
    minAge?: number | null
    maxAge?: number | null
    maxIncome?: number | null
    gender?: string[] | null
    casteCategory?: string[] | null
    states?: string[] | null
    userType?: string[] | null
  }
  documents: string[]
  applicationSteps: string[]
  officialLink: string
  deadline: string | null
}
