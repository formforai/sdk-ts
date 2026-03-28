export type FieldType =
  | 'text'
  | 'textarea'
  | 'number'
  | 'email'
  | 'url'
  | 'phone'
  | 'select'
  | 'multi_select'
  | 'confirm'
  | 'date'
  | 'datetime'
  | 'file'
  | 'rating'
  | 'signature'

export interface FormField {
  id: string
  type: FieldType
  label: string
  required?: boolean
  placeholder?: string
  help?: string
  default?: any
  options?: string[]
  validate?: {
    min?: number
    max?: number
    pattern?: string
    maxSize?: string
    accept?: string
  }
  when?: {
    field: string
    equals?: any
    notEquals?: any
    in?: any[]
  }
}

export interface Branding {
  logo?: string
  accent?: string
  company_name?: string
  powered_by?: boolean
}

export interface CreateFormParams {
  title: string
  description?: string
  fields: FormField[]
  to?: string
  context?: string
  webhook_url?: string
  expires?: string
  reminders?: string[]
  branding?: Branding
  metadata?: Record<string, any>
  sub_account?: string
}

export interface Form {
  id: string
  url: string
  status: 'pending' | 'completed' | 'expired' | 'cancelled'
  delivery?: { channel: string; status: string }
  expires_at?: string
  created_at: string
}

export interface FormResponse {
  id: string
  form_id: string
  data: Record<string, any>
  respondent?: {
    email?: string
    completed_at?: string
    time_to_complete_ms?: number
  }
}

export interface AskOptions {
  to: string
  context?: string
  expires?: string
  webhook_url?: string
  metadata?: Record<string, any>
}

export interface AskResult {
  approved: boolean
  notes?: string
  form_id: string
}

export interface CollectOptions extends Omit<CreateFormParams, 'title'> {
  title?: string
}

export interface FormForOptions {
  baseUrl?: string
}

export interface ListFormsOptions {
  status?: 'pending' | 'completed' | 'expired'
  limit?: number
  offset?: number
}

export interface ListFormsResult {
  forms: Form[]
  total: number
  limit: number
  offset: number
}
