// Tiny client for the Mailpit dummy inbox (docker-compose.local.yml). Every address
// is a valid mailbox: just send to it and read it back here or at http://localhost:8025.
const MAILPIT = process.env.MAILPIT_URL || 'http://localhost:8025';

export interface MailSummary { ID: string; Subject: string; To: { Address: string }[]; Created: string }
export interface MailMessage extends MailSummary { Text: string; HTML: string; Attachments: { FileName: string; ContentType: string }[] }

export async function clearInbox() {
  await fetch(`${MAILPIT}/api/v1/messages`, { method: 'DELETE' });
}

/** Polls until a message to `to` (optionally with a subject fragment) arrives. */
export async function waitForMail(to: string, opts: { subject?: string; timeoutMs?: number } = {}): Promise<MailMessage> {
  const deadline = Date.now() + (opts.timeoutMs ?? 20000);
  while (Date.now() < deadline) {
    const res = await fetch(`${MAILPIT}/api/v1/search?query=${encodeURIComponent(`to:"${to}"`)}`);
    const body: any = await res.json();
    const hit = (body.messages as MailSummary[] | undefined)?.find(
      (m) => !opts.subject || m.Subject.toLowerCase().includes(opts.subject.toLowerCase()),
    );
    if (hit) {
      const full = await fetch(`${MAILPIT}/api/v1/message/${hit.ID}`);
      return (await full.json()) as MailMessage;
    }
    await new Promise((r) => setTimeout(r, 750));
  }
  throw new Error(`No email to ${to}${opts.subject ? ` matching "${opts.subject}"` : ''} arrived in Mailpit within the timeout`);
}

/** Pulls the "Temporary password" value out of a party-credentials email. */
export function tempPasswordFrom(mail: MailMessage): string {
  const m = mail.Text.match(/Temporary password\s*[:\-]?\s*(\S+)/i);
  if (!m) throw new Error('No temporary password found in the email body');
  return m[1];
}
