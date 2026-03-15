/**
 * Appends the AvidEdge unsubscribe footer to an email HTML body.
 * @param bodyHtml - The email body HTML content
 * @param contactId - The constituent/contact UUID for the unsubscribe link
 * @returns The email body with the unsubscribe footer appended
 */
export function appendUnsubscribeFooter(bodyHtml: string, contactId: string): string {
  const footer = `<div style="margin-top: 32px; padding-top: 16px; border-top: 1px solid #e5e7eb; text-align: center; font-family: sans-serif; font-size: 12px; color: #9ca3af;">
  <p>AvidEdge Technology Executive Search</p>
  <p>To stop receiving these emails, <a href="https://theaiwhisperersmn.app.n8n.cloud/webhook/avidedge-unsubscribe?contact_id=${encodeURIComponent(contactId)}" style="color: #6b7280;">click here to unsubscribe</a>.</p>
</div>`;

  return bodyHtml + footer;
}
