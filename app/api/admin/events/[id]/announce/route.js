import { prisma } from "@/lib/db";
// P0 (B3): admin role is re-read from the DB by the shared
// requireAdmin() in lib/auth.js, not trusted from the JWT claim.
import { requireAdmin } from "@/lib/auth";
import { ok, fail } from "@/lib/json";
import { buildAnnouncementMail, sendMail, studentsGroupEmail } from "@/lib/mail";

// Same recipient rules as the standalone mail route
// (/api/admin/mail): the same address pattern and the same 200
// cap, so the two mail screens behave the same way.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_RECIPIENTS = 200;

// The admin edit page links with the event slug in this [id] position,
// while other admin routes use the event id, so accept either one.
async function findEvent(key) {
  const byId = await prisma.event.findUnique({ where: { id: key } });
  if (byId) return byId;
  return prisma.event.findUnique({ where: { slug: key } });
}

// GET: the exact preview the admin sees before sending. No mail is sent here.
// The preview no longer names a recipient: the To field on the edit
// page starts empty, and the group address below is only the value
// the "Add student group" button can fill in, with one deliberate
// click. Nothing here prefills it.
export async function GET(request, { params }) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;
  const event = await findEvent(params.id);
  if (!event) return fail("EVENT_NOT_FOUND", 404);
  const mail = buildAnnouncementMail(event);
  return ok({
    groupEmail: studentsGroupEmail(),
    subject: mail.subject,
    body: mail.text,
    alreadySent: Boolean(event.announcementSentAt),
    announcementSentAt: event.announcementSentAt,
  });
}

// POST: send the announcement once. Editing the event afterwards does not
// resend it, because the edit endpoint never touches announcementSentAt
// and this route refuses when it is already set.
export async function POST(request, { params }) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;
  const event = await findEvent(params.id);
  if (!event) return fail("EVENT_NOT_FOUND", 404);
  // M1: only a published or ongoing event may be announced to the
  // whole college. Announcing a draft (or cancelled) event mails
  // students about an event nobody can see or register for.
  if (event.status !== "PUBLISHED" && event.status !== "ONGOING") {
    return fail("EVENT_NOT_PUBLISHED", 400);
  }
  if (event.announcementSentAt) {
    return fail("ANNOUNCEMENT_ALREADY_SENT", 400);
  }
  // The To list comes from the admin, never prefilled: the field
  // starts empty on the edit page, so an accidental click cannot
  // mail the whole student group. Accept a comma-separated string
  // (what the page sends) or an array of addresses. Validation runs
  // BEFORE the claim below, so a bad list never consumes the one
  // announcement this event gets. Unlike the standalone mail route,
  // which silently drops bad addresses, an invalid address here is
  // rejected outright: for a one-shot announcement the admin must
  // know a mistyped address did not go out.
  let payload;
  try {
    payload = await request.json();
  } catch {
    return fail("INVALID_BODY", 400);
  }
  if (!payload || typeof payload !== "object") return fail("INVALID_BODY", 400);
  const rawList =
    typeof payload.to === "string"
      ? payload.to.split(",")
      : Array.isArray(payload.to)
        ? payload.to
        : [];
  const entered = rawList
    .map((v) => String(v ?? "").trim().toLowerCase())
    .filter((v) => v !== "");
  if (entered.length === 0) return fail("NO_RECIPIENTS", 400);
  if (entered.some((v) => !EMAIL_RE.test(v))) return fail("INVALID_RECIPIENT", 400);
  const recipients = [...new Set(entered)];
  if (recipients.length > MAX_RECIPIENTS) return fail("TOO_MANY_RECIPIENTS", 400);
  // P1 (B7): claim the send atomically BEFORE sending the mail. The
  // old code checked the flag, sent the mail, then set the flag, so
  // two concurrent POSTs (two admins, or a retry racing the first)
  // both passed the check and the whole student group got the mail
  // twice. This conditional update succeeds for exactly one caller:
  // only the caller whose update changed 1 row may send.
  const claimedAt = new Date();
  const claimed = await prisma.event.updateMany({
    where: { id: event.id, announcementSentAt: null },
    data: { announcementSentAt: claimedAt },
  });
  if (claimed.count !== 1) {
    return fail("ANNOUNCEMENT_ALREADY_SENT", 400);
  }
  const mail = buildAnnouncementMail(event);
  // One mail per address, one log row per send, exactly like the
  // standalone mail route: no recipient ever sees the others.
  // Sends run one after another inside this request; the realistic
  // list is one address (the student group) or a few test
  // addresses, so this stays quick.
  const failedEmails = [];
  let sent = 0;
  for (const toEmail of recipients) {
    const result = await sendMail({
      to: toEmail,
      subject: mail.subject,
      text: mail.text,
      html: mail.html,
    });
    // The mail log is record-keeping: if writing it fails, the send
    // result above is still the truth, so a log failure must not
    // turn a sent mail into a 500, and must not stop the rest of
    // the list.
    try {
      await prisma.mailLog.create({
        data: {
          eventId: event.id,
          toEmail,
          type: "ANNOUNCEMENT",
          subject: mail.subject,
          status: result.sent ? "SENT" : "FAILED",
          error: result.sent ? null : result.error,
          sentAt: result.sent ? new Date() : null,
        },
      });
    } catch {
      console.error("Could not write the announcement mail log.");
    }
    if (result.sent) sent += 1;
    else failedEmails.push(toEmail);
  }
  if (failedEmails.length === recipients.length) {
    // Nothing went out, so the claim is released and the admin can
    // retry. Only a send that reached at least one address keeps
    // the event marked as sent.
    await prisma.event.updateMany({
      where: { id: event.id, announcementSentAt: claimedAt },
      data: { announcementSentAt: null },
    });
    return fail("MAIL_FAILED", 502);
  }
  // A partial failure keeps the claim: sending again would mail the
  // addresses that already got it a second time. The failed
  // addresses are reported back so the admin can mail them from
  // the Mail section instead.
  return ok({
    announcementSentAt: claimedAt,
    sent,
    failed: failedEmails.length,
    total: recipients.length,
    failedEmails,
  });
}
