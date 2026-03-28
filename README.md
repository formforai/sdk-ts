# FormFor

TypeScript SDK for [FormFor](https://formfor.ai) -- structured input infrastructure for AI agents. Collect human input, approvals, and structured data from within your AI workflows.

## Installation

```bash
npm install formfor
```

## Quick Start

```typescript
import { FormFor } from 'formfor'

const ff = new FormFor('ff_live_...')

// Yes/no approval -- blocks until the human responds
const { approved } = await ff.ask('Deploy to production?', {
  to: 'ops@company.com',
})

// Collect structured data
const response = await ff.collect({
  title: 'Customer Onboarding',
  to: 'customer@example.com',
  fields: [
    { id: 'name', type: 'text', label: 'Full Name', required: true },
    { id: 'plan', type: 'select', label: 'Plan', options: ['starter', 'pro', 'enterprise'] },
  ],
})

console.log(response.data) // { name: "Jane Smith", plan: "pro" }
```

## API

### `ask(question, options)` -- Yes/no approval

Creates a confirmation form, delivers it, and waits for the response.

```typescript
const result = await ff.ask('Approve $5,000 expense?', {
  to: 'manager@company.com',
  context: 'Q1 marketing budget',
  expires: '24h',
})

result.approved  // true | false
result.notes     // optional reviewer notes
result.form_id   // form ID for reference
```

| Option | Type | Description |
|--------|------|-------------|
| `to` | `string` | Recipient email (required) |
| `context` | `string` | Background info for the recipient |
| `expires` | `string` | Duration: `"1h"`, `"24h"`, `"7d"` |
| `webhook_url` | `string` | Async webhook notification |
| `metadata` | `Record<string, any>` | Custom metadata |

### `collect(options)` -- Structured data collection

Creates a multi-field form and waits for the response.

```typescript
const response = await ff.collect({
  title: 'Bug Report',
  to: 'eng@company.com',
  fields: [
    { id: 'severity', type: 'select', label: 'Severity', options: ['P0', 'P1', 'P2'] },
    { id: 'description', type: 'textarea', label: 'Description', required: true },
    { id: 'screenshot', type: 'file', label: 'Screenshot' },
  ],
  expires: '7d',
})
```

### `createForm(params)` -- Non-blocking

Creates a form and returns immediately.

```typescript
const form = await ff.createForm({
  title: 'Feedback',
  fields: [{ id: 'rating', type: 'rating', label: 'How would you rate us?' }],
  to: 'user@example.com',
  webhook_url: 'https://your-app.com/webhooks/formfor',
})

form.id      // "form_abc123"
form.url     // "https://forms.formfor.ai/form_abc123"
form.status  // "pending"
```

### `getResponse(formId)` -- Get response

```typescript
const response = await ff.getResponse('form_abc123')
// null if not yet completed
```

### `listForms(options?)` -- List forms

```typescript
const { forms, total } = await ff.listForms({ status: 'pending', limit: 10 })
```

### `cancelForm(formId)` -- Cancel

```typescript
await ff.cancelForm('form_abc123')
```

### `remindForm(formId)` -- Send reminder

```typescript
await ff.remindForm('form_abc123')
```

### `waitForResponse(formId, timeout?)` -- Wait

Waits for a response via WebSocket with automatic polling fallback.

```typescript
const form = await ff.createForm({ /* ... */ })
const response = await ff.waitForResponse(form.id, '2h')
```

## Field Types

| Type | Description |
|------|-------------|
| `text` | Single-line text |
| `textarea` | Multi-line text |
| `number` | Numeric input |
| `email` | Email address |
| `url` | URL |
| `phone` | Phone number |
| `select` | Single selection |
| `multi_select` | Multiple selections |
| `confirm` | Yes/no |
| `date` | Date picker |
| `datetime` | Date and time |
| `file` | File upload |
| `rating` | Star rating |
| `signature` | Signature capture |

## Conditional Fields

```typescript
fields: [
  { id: 'role', type: 'select', label: 'Role', options: ['engineer', 'manager', 'other'] },
  { id: 'team_size', type: 'number', label: 'Team Size', when: { field: 'role', equals: 'manager' } },
  { id: 'role_other', type: 'text', label: 'Specify', when: { field: 'role', equals: 'other' } },
]
```

## Validation

```typescript
{ id: 'age', type: 'number', label: 'Age', validate: { min: 18, max: 120 } }
{ id: 'doc', type: 'file', label: 'Document', validate: { maxSize: '10MB', accept: '.pdf,.docx' } }
```

## Error Handling

```typescript
import { FormFor, FormForError } from 'formfor'

try {
  await ff.ask('Approve?', { to: 'user@example.com', expires: '1h' })
} catch (err) {
  if (err instanceof FormForError) {
    err.code     // "timeout", "expired", "api_error", etc.
    err.message  // Human-readable
    err.status   // HTTP status (if applicable)
  }
}
```

## Configuration

```typescript
const ff = new FormFor('ff_live_...', {
  baseUrl: 'https://api.formfor.ai',  // default
})
```

## TypeScript

All types exported:

```typescript
import type {
  FormField, FieldType, Form, FormResponse, CreateFormParams,
  AskOptions, AskResult, CollectOptions, Branding,
  ListFormsOptions, ListFormsResult, FormForOptions,
} from 'formfor'
```

## Links

- [Documentation](https://formfor.ai/docs)
- [Dashboard](https://app.formfor.ai)

## License

MIT
