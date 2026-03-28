export class FormForError extends Error {
  code: string
  status?: number

  constructor(code: string, message: string, status?: number) {
    super(message)
    this.name = 'FormForError'
    this.code = code
    this.status = status
  }
}
