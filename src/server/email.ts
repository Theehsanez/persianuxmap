/**
 * Transactional email via Resend (https://resend.com) — plain HTTPS, no SDK.
 * Enabled when RESEND_API_KEY is set; EMAIL_FROM must use a domain verified in Resend
 * (for quick tests Resend's shared `onboarding@resend.dev` works, but only to your own address).
 */
export const emailEnabled = () => !!process.env.RESEND_API_KEY?.trim()

export async function sendLoginCode(to: string, code: string) {
  const from = process.env.EMAIL_FROM?.trim() || 'Persian UX Map <onboarding@resend.dev>'
  const spaced = code.replace(/(\d{3})(\d{3})/, '$1 $2')
  const html = `<!doctype html><html><body style="margin:0;background:#f6f6f7;font-family:-apple-system,Segoe UI,Tahoma,sans-serif">
  <div style="max-width:440px;margin:32px auto;background:#fff;border-radius:16px;padding:32px;border:1px solid #eee">
    <p style="margin:0 0 4px;font-size:13px;color:#888">Persian UX Map</p>
    <h1 style="margin:0 0 16px;font-size:20px;color:#111">Your verification code</h1>
    <p style="margin:0 0 8px;font-size:32px;font-weight:700;letter-spacing:6px;color:#111">${spaced}</p>
    <p style="margin:0 0 24px;font-size:14px;color:#555">It expires in 10 minutes. If you didn’t request it, you can ignore this email.</p>
    <div dir="rtl" style="border-top:1px solid #eee;padding-top:16px;font-size:14px;color:#555;text-align:right">
      کد تأیید شما: <b style="color:#111">${spaced}</b><br/>این کد تا ۱۰ دقیقه معتبر است. اگر شما درخواست نداده‌اید، این ایمیل را نادیده بگیرید.
    </div>
  </div></body></html>`
  const text = `Your Persian UX Map code: ${code}\nIt expires in 10 minutes.\n\nکد تأیید Persian UX Map: ${code}`

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { authorization: `Bearer ${process.env.RESEND_API_KEY!.trim()}`, 'content-type': 'application/json' },
    body: JSON.stringify({ from, to: [to], subject: `${spaced} — Persian UX Map`, html, text }),
  })
  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(`Resend ${res.status}: ${body.slice(0, 300)}`)
  }
}
