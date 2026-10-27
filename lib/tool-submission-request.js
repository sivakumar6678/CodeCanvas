export const MAX_TOOL_SUBMISSION_BODY_BYTES = 1024 * 1024;

export class ToolSubmissionRequestError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.name = 'ToolSubmissionRequestError';
    this.status = status;
  }
}

async function readBoundedBody(request) {
  const contentLength = Number(request.headers.get('content-length'));
  if (Number.isFinite(contentLength) && contentLength > MAX_TOOL_SUBMISSION_BODY_BYTES) {
    throw new ToolSubmissionRequestError('The submission is too large.', 413);
  }
  if (!request.body) return new Uint8Array();

  const reader = request.body.getReader();
  const chunks = [];
  let totalBytes = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    totalBytes += value.byteLength;
    if (totalBytes > MAX_TOOL_SUBMISSION_BODY_BYTES) {
      await reader.cancel();
      throw new ToolSubmissionRequestError('The submission is too large.', 413);
    }
    chunks.push(value);
  }

  const body = new Uint8Array(totalBytes);
  let offset = 0;
  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return body;
}

function parseJson(value) {
  try {
    return JSON.parse(value);
  } catch {
    throw new ToolSubmissionRequestError('Submission data must be valid JSON.');
  }
}

export async function parseToolSubmissionRequest(request) {
  const contentType = request.headers.get('content-type') || '';
  if (!contentType.toLowerCase().includes('application/json')) {
    throw new ToolSubmissionRequestError('Submit tool details and image URLs as JSON. File uploads are not supported.');
  }

  const body = await readBoundedBody(request);
  const payload = parseJson(new TextDecoder().decode(body));
  const idempotencyKey = payload?.idempotencyKey || payload?.idempotency_key;
  if (typeof idempotencyKey !== 'string') {
    throw new ToolSubmissionRequestError('An idempotency key is required.');
  }

  return { payload, idempotencyKey };
}
