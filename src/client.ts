import { FormForError } from './errors'
import { parseMs, sleep } from './utils'
import type {
  AskOptions,
  AskResult,
  CollectOptions,
  CreateFormParams,
  Form,
  FormForOptions,
  FormResponse,
  ListFormsOptions,
  ListFormsResult,
} from './types'

export class FormFor {
  private apiKey: string
  private baseUrl: string
  private wsBaseUrl: string

  constructor(apiKey: string, options?: FormForOptions) {
    if (!apiKey) {
      throw new FormForError('invalid_key', 'API key is required')
    }
    this.apiKey = apiKey
    this.baseUrl = options?.baseUrl || 'https://api.formfor.ai'
    this.wsBaseUrl = this.baseUrl.replace('https', 'wss').replace('http', 'ws')
  }

  // ── Quick yes/no ────────────────────────────────────────
  async ask(question: string, options: AskOptions): Promise<AskResult> {
    const form = await this.createForm({
      title: question,
      fields: [{ id: 'approved', type: 'confirm', label: question }],
      ...options,
    })
    const response = await this.waitForResponse(form.id, options.expires)
    return {
      approved: response.data.approved,
      notes: response.data.notes,
      form_id: form.id,
    }
  }

  // ── Collect structured data (blocking) ──────────────────
  async collect(options: CollectOptions): Promise<FormResponse> {
    const form = await this.createForm({
      title: options.title || 'Input requested',
      ...options,
      fields: options.fields || [],
    })
    return this.waitForResponse(form.id, options.expires)
  }

  // ── Create form (non-blocking) ──────────────────────────
  async createForm(params: CreateFormParams): Promise<Form> {
    return this.request<Form>('POST', '/v1/forms', params)
  }

  // ── Get response for a form ─────────────────────────────
  async getResponse(formId: string): Promise<FormResponse | null> {
    try {
      return await this.request<FormResponse>('GET', `/v1/forms/${formId}/response`)
    } catch (e: any) {
      if (e.status === 404) return null
      throw e
    }
  }

  // ── List forms ──────────────────────────────────────────
  async listForms(options?: ListFormsOptions): Promise<ListFormsResult> {
    const params = new URLSearchParams()
    if (options?.status) params.set('status', options.status)
    if (options?.limit !== undefined) params.set('limit', String(options.limit))
    if (options?.offset !== undefined) params.set('offset', String(options.offset))
    const query = params.toString()
    const path = `/v1/forms${query ? `?${query}` : ''}`
    return this.request<ListFormsResult>('GET', path)
  }

  // ── Cancel a pending form ───────────────────────────────
  async cancelForm(formId: string): Promise<void> {
    await this.request<void>('POST', `/v1/forms/${formId}/cancel`)
  }

  // ── Send a reminder for a pending form ──────────────────
  async remindForm(formId: string): Promise<void> {
    await this.request<void>('POST', `/v1/forms/${formId}/remind`)
  }

  // ── Wait for a form response (WebSocket + polling) ──────
  async waitForResponse(formId: string, timeout?: string): Promise<FormResponse> {
    try {
      return await this.waitViaWebSocket(formId, timeout)
    } catch (e: any) {
      // If WebSocket itself failed to connect, the fallback to polling
      // is already handled inside waitViaWebSocket's onerror.
      // Re-throw timeout and expired errors as-is.
      throw e
    }
  }

  // ── Private: HTTP request helper ────────────────────────
  private async request<T>(method: string, path: string, body?: any): Promise<T> {
    const res = await fetch(`${this.baseUrl}${path}`, {
      method,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    })

    if (!res.ok) {
      const err = (await res.json().catch(() => ({}))) as Record<string, any>
      throw new FormForError(
        err.code || 'api_error',
        err.message || res.statusText,
        res.status,
      )
    }

    // Handle 204 No Content
    if (res.status === 204) {
      return undefined as T
    }

    return res.json() as Promise<T>
  }

  // ── Private: WebSocket wait implementation ──────────────
  private waitViaWebSocket(formId: string, timeout?: string): Promise<FormResponse> {
    return new Promise((resolve, reject) => {
      let ws: WebSocket

      try {
        ws = new WebSocket(`${this.wsBaseUrl}/v1/forms/${formId}/wait`, {
          headers: { 'Authorization': `Bearer ${this.apiKey}` },
        } as any)
      } catch {
        // WebSocket not available — fall back to polling
        this.pollForResponse(formId, timeout).then(resolve).catch(reject)
        return
      }

      let timeoutId: ReturnType<typeof setTimeout> | undefined

      if (timeout) {
        timeoutId = setTimeout(() => {
          ws.close()
          reject(new FormForError('timeout', 'Timed out waiting for response'))
        }, parseMs(timeout) + 5_000)
      }

      ws.onmessage = (event: MessageEvent) => {
        const msg = JSON.parse(typeof event.data === 'string' ? event.data : String(event.data))

        if (msg.state?.status === 'completed') {
          if (timeoutId) clearTimeout(timeoutId)
          ws.close()
          this.getResponse(formId).then((res) => {
            if (res) {
              resolve(res)
            } else {
              reject(new FormForError('no_response', 'Form completed but no response found'))
            }
          }).catch(reject)
        }

        if (msg.state?.status === 'expired') {
          if (timeoutId) clearTimeout(timeoutId)
          ws.close()
          reject(new FormForError('expired', 'Form expired without response'))
        }
      }

      ws.onerror = () => {
        if (timeoutId) clearTimeout(timeoutId)
        // Fallback to polling
        this.pollForResponse(formId, timeout).then(resolve).catch(reject)
      }
    })
  }

  // ── Private: Polling fallback ───────────────────────────
  private async pollForResponse(formId: string, timeout?: string): Promise<FormResponse> {
    const deadline = Date.now() + parseMs(timeout || '24h')

    while (Date.now() < deadline) {
      const response = await this.getResponse(formId)
      if (response) return response
      await sleep(2_000)
    }

    throw new FormForError('timeout', 'Timed out waiting for response')
  }
}
