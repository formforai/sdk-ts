# formfor

TypeScript SDK for [FormFor](https://formfor.ai) -- structured input infrastructure for AI agents. Collect human input, approvals, and structured data from within your AI workflows.

## Installation

```bash
npm install formfor
```

## Quick Start

```typescript
import { FormFor } from 'formfor'

const formfor = new FormFor('ff_live_...')
const { approved } = await formfor.ask('Deploy to production?', { to: 'ops@company.com' })
```

## Methods

### `ask(question, options)` -- Quick yes/no approval

Creates a confirmation form, sends it, and waits for a response.

```typescript
const result = await formfor.ask('Approve $5,000 expense?', {
  to: 'manager@company.com',
  context: 'Q1 marketing budget',
  expires: '24h',
})

console.log(result.approved) // true | false
console.log(result.notes)    // optional reviewer notes
console.log(result.form_id)  // form ID for reference
```

**Parameters:**
- `question` (string) -- The yes/no question to ask
- `options.to` (string) -- Recipient email or phone
- `options.context` (string, optional) -- Additional context for the recipient
- `options.expires` (string, optional) -- Expiration duration (e.g., `"1h"`, `"24h"`, `"7d"`)
- `options.webhook_url` (string, optional) -- Webhook URL for async notification
- `options.metadata` (Record<string, any>, optional) -- Custom metadata

### `collect(options)` -- Collect structured data

Creates a multi-field form and waits for the response.

```typescript
const response = await formfor.collect({
  title: 'Customer Onboarding',
  to: 'customer@example.com',
  fields: [
    { id: 'name', type: 'text', label: 'Full Name', required: true },
    { id: 'email', type: 'email', label: 'Work Email', required: true },
    { id: 'company', type: 'text', label: 'Company Name' },
    { id: 'plan', type: 'select', label: 'Plan', options: ['starter', 'pro', 'enterprise'] },
  ],
  expires: '7d',
})

console.log(response.data.name)    // "Jane Smith"
console.log(response.data.email)   // "jane@acme.com"
console.log(response.data.plan)    // "pro"
```

### `createForm(params)` -- Create a form (non-blocking)

Creates a form and returns immediately without waiting for a response.

```typescript
const form = await formfor.createForm({
  title: 'Feedback Survey',
  fields: [
    { id: 'rating', type: 'rating', label: 'How would you rate us?' },
    { id: 'feedback', type: 'textarea', label: 'Any comments?' },
  ],
  to: 'user@example.com',
  webhook_url: 'https://your-app.com/webhooks/formfor',
  expires: '7d',
})

console.log(form.id)     // "form_abc123"
console.log(form.url)    // "https://formfor.ai/f/form_abc123"
console.log(form.status) // "pending"
```

### `getResponse(formId)` -- Get form response

Returns the response for a form, or `null` if not yet completed.

```typescript
const response = await formfor.getResponse('form_abc123')
if (response) {
  console.log(response.data)
}
```

### `listForms(options?)` -- List forms

```typescript
const result = await formfor.listForms({
  status: 'pending',
  limit: 10,
  offset: 0,
})

console.log(result.forms)  // Form[]
console.log(result.total)  // total count
```

### `cancelForm(formId)` -- Cancel a pending form

```typescript
await formfor.cancelForm('form_abc123')
```

### `remindForm(formId)` -- Send a reminder

```typescript
await formfor.remindForm('form_abc123')
```

### `waitForResponse(formId, timeout?)` -- Wait for response

Waits for a form response using WebSocket (with automatic polling fallback).

```typescript
const form = await formfor.createForm({ /* ... */ })
const response = await formfor.waitForResponse(form.id, '2h')
```

## Field Types

| Type | Description |
|------|-------------|
| `text` | Single-line text input |
| `textarea` | Multi-line text input |
| `number` | Numeric input |
| `email` | Email address |
| `url` | URL |
| `phone` | Phone number |
| `select` | Single selection from options |
| `multi_select` | Multiple selections from options |
| `confirm` | Yes/no confirmation |
| `date` | Date picker |
| `datetime` | Date and time picker |
| `file` | File upload |
| `rating` | Star rating |
| `signature` | Signature capture |

## Conditional Fields

Show fields based on other field values:

```typescript
const response = await formfor.collect({
  to: 'user@example.com',
  fields: [
    { id: 'role', type: 'select', label: 'Role', options: ['engineer', 'manager', 'other'] },
    { id: 'team_size', type: 'number', label: 'Team Size', when: { field: 'role', equals: 'manager' } },
    { id: 'role_other', type: 'text', label: 'Specify Role', when: { field: 'role', equals: 'other' } },
  ],
})
```

## Validation

```typescript
{
  id: 'age',
  type: 'number',
  label: 'Age',
  validate: { min: 18, max: 120 }
}

{
  id: 'document',
  type: 'file',
  label: 'Upload Document',
  validate: { maxSize: '10MB', accept: '.pdf,.docx' }
}
```

## Error Handling

```typescript
import { FormFor, FormForError } from 'formfor'

try {
  const result = await formfor.ask('Approve?', { to: 'user@example.com', expires: '1h' })
} catch (err) {
  if (err instanceof FormForError) {
    console.error(err.code)    // "timeout", "expired", "api_error", etc.
    console.error(err.message) // Human-readable message
    console.error(err.status)  // HTTP status code (if applicable)
  }
}
```

## Configuration

```typescript
const formfor = new FormFor('ff_live_...', {
  baseUrl: 'https://api.formfor.ai',  // Custom API base URL
})
```

## TypeScript

All types are exported for full TypeScript support:

```typescript
import type {
  FormField,
  FieldType,
  Form,
  FormResponse,
  CreateFormParams,
  AskOptions,
  AskResult,
  CollectOptions,
  Branding,
  ListFormsOptions,
  ListFormsResult,
  FormForOptions,
} from 'formfor'
```

## Links

- [Documentation](https://docs.formfor.ai)
- [API Reference](https://docs.formfor.ai/api)
- [Dashboard](https://app.formfor.ai)
