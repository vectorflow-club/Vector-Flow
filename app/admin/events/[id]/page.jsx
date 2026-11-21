"use client";

import { useEffect, useState } from "react";
import EventForm from "@/components/EventForm";
import Skeleton from "@/components/Skeleton";

// P1 (B5): format in Asia/Kolkata local time, not UTC. The old
// code used toISOString() (UTC), so an event at 10:00 IST was shown
// as "04:30" in the datetime-local input, and saving it wrote back
// 04:30 IST -- every edit shifted all times 5h30m earlier.
// datetime-local inputs are read as local time, so the value shown
// here must be the club's local (IST) wall-clock time.
function toLocal(value) {
  if (!value) return "";
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date(value));
  const p = {};
  for (const part of parts) p[part.type] = part.value;
  return `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}`;
}

// Same address pattern as the announce route and the standalone
// mail route. The page checks before sending so a typo is caught
// at once; the server checks again and is the authority.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_RECIPIENTS = 200;

function parseRecipients(value) {
  return String(value || "")
    .split(",")
    .map((v) => v.trim().toLowerCase())
    .filter((v) => v !== "");
}

export default function EditEvent({ params }) {
  const [initial, setInitial] = useState(null);
  const [error, setError] = useState("");
  const [preview, setPreview] = useState(null);
  const [previewError, setPreviewError] = useState(false);
  const [announceMessage, setAnnounceMessage] = useState("");
  const [announcing, setAnnouncing] = useState(false);
  // The To field starts empty on purpose and is never prefilled:
  // the student group only gets mailed when the admin deliberately
  // types an address or presses "Add student group".
  const [toInput, setToInput] = useState("");
  useEffect(() => {
    fetch(`/api/events/${params.id}`)
      .then((r) => r.json())
      .then((j) => {
        if (!j.ok) {
          setError("Event not found or admin access only.");
          return;
        }
        const e = j.data.event;
        setInitial({
          title: e.title || "",
          slug: e.slug || "",
          description: e.description || "",
          posterImageUrl: e.posterImageUrl || "",
          venue: e.venue || "",
          mode: e.mode || "ONSITE",
          startAt: toLocal(e.startAt),
          endAt: toLocal(e.endAt),
          registrationOpensAt: toLocal(e.registrationOpensAt),
          registrationClosesAt: toLocal(e.registrationClosesAt),
          feeType: e.feeType || "FREE",
          feeAmount: e.feeAmount ? String(e.feeAmount) : "",
          paymentReceiverName: e.paymentReceiverName || "",
          paymentReceiverContact: e.paymentReceiverContact || "",
          paymentQrImageUrl: e.paymentQrImageUrl || "",
          registrationMode: e.registrationMode || "SITE",
          externalRegistrationUrl: e.externalRegistrationUrl || "",
          driveLink: e.driveLink || "",
          status: e.status || "DRAFT",
        });
      })
      .catch(() => setError("Event not found or admin access only."));
  }, [params.id]);
  // M13: a failed preview fetch used to leave "Loading preview..."
  // on screen forever, because the failure was swallowed silently.
  // Now it shows an error with a retry button.
  function loadPreview() {
    setPreviewError(false);
    fetch(`/api/admin/events/${params.id}/announce`)
      .then((r) => r.json())
      .then((j) => {
        if (j.ok) setPreview(j.data);
        else setPreviewError(true);
      })
      .catch(() => setPreviewError(true));
  }
  useEffect(() => {
    loadPreview();
  }, [params.id]);
  // Fills in the student group address with one deliberate click.
  // The address comes from the preview (the server reads it from
  // STUDENTS_GROUP_EMAIL), never typed in here, and it is added
  // only once even if the button is pressed again.
  function addStudentGroup() {
    const group = preview && preview.groupEmail ? preview.groupEmail : "";
    if (!group) return;
    const current = [...new Set(parseRecipients(toInput))];
    if (current.includes(group.toLowerCase())) return;
    setToInput([...current, group].join(", "));
  }
  async function sendAnnouncement() {
    const recipients = [...new Set(parseRecipients(toInput))];
    if (recipients.length === 0) {
      setAnnounceMessage("Add at least one address in the To field first.");
      return;
    }
    if (recipients.some((v) => !EMAIL_RE.test(v))) {
      setAnnounceMessage(
        "One of the addresses does not look like an email address. Check the To field and try again."
      );
      return;
    }
    if (recipients.length > MAX_RECIPIENTS) {
      setAnnounceMessage("Too many addresses. At most 200.");
      return;
    }
    // M8: an announcement is one-way, so ask first and name the
    // audience before anything is sent.
    const shown = recipients.slice(0, 5).join(", ");
    const audience =
      recipients.length > 5 ? `${shown} and ${recipients.length - 5} more` : shown;
    if (!window.confirm(`Send this announcement to ${audience}? This cannot be undone.`)) return;
    setAnnouncing(true);
    setAnnounceMessage("");
    try {
      const res = await fetch(`/api/admin/events/${params.id}/announce`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to: toInput }),
      });
      const j = await res.json();
      if (!j.ok) {
        setAnnounceMessage(
          j.error === "ANNOUNCEMENT_ALREADY_SENT"
            ? "This announcement was already sent. Sending again is blocked."
            : j.error === "NO_RECIPIENTS"
              ? "Add at least one address in the To field first."
              : j.error === "INVALID_RECIPIENT"
                ? "One of the addresses is not a valid email address. Check the To field and try again."
                : j.error === "TOO_MANY_RECIPIENTS"
                  ? "Too many addresses. At most 200."
                  : j.error === "EVENT_NOT_PUBLISHED"
                    ? "Only a published or ongoing event can be announced."
                    : "Announcement mail failed to send. Nothing was marked as sent, so you can try again."
        );
        return;
      }
      const failed = j.data.failedEmails || [];
      setAnnounceMessage(
        failed.length === 0
          ? `Announcement sent to ${j.data.sent} ${j.data.sent === 1 ? "address" : "addresses"}.`
          : `Announcement sent to ${j.data.sent} of ${j.data.total} addresses. These did not go through: ${failed.join(", ")}. You can mail them from the Mail section.`
      );
      setPreview((p) => (p ? { ...p, alreadySent: true, announcementSentAt: j.data.announcementSentAt } : p));
    } catch {
      setAnnounceMessage("Announcement mail failed to send. Nothing was marked as sent, so you can try again.");
    } finally {
      setAnnouncing(false);
    }
  }
  if (error) return <p className="error">{error}</p>;
  if (!initial)
    return (
      <div className="admin-content-page event-edit-page" aria-label="Loading event" aria-busy="true">
        <Skeleton variant="row" count={3} />
      </div>
    );
  return (
    <div className="admin-content-page event-edit-page">
      <h1>Edit event</h1>
      <EventForm initial={initial} eventId={params.id} />
      <section className="card announcement-panel">
        <h2>Announcement mail</h2>
        <p>Editing this event afterwards does not send the announcement again.</p>
        {!preview && !previewError && (
          <div aria-label="Loading announcement preview">
            <Skeleton variant="row" count={3} />
          </div>
        )}
        {!preview && previewError && (
          <p>
            Could not load the announcement preview.{" "}
            <button onClick={loadPreview}>Try again</button>
          </p>
        )}
        {preview && preview.alreadySent && (
          <p>Announcement already sent. Sending again is blocked.</p>
        )}
        {preview && !preview.alreadySent && (
          <div>
            <label>
              To (separate addresses with commas)
              <input
                type="text"
                value={toInput}
                onChange={(e) => setToInput(e.target.value)}
                placeholder="name@example.com, other@example.com"
              />
            </label>
            <p>
              The field starts empty on purpose. Nothing is mailed until you add addresses.{" "}
              <button type="button" onClick={addStudentGroup} disabled={!preview.groupEmail}>
                Add student group
              </button>
            </p>
            <p>
              <strong>Subject:</strong> {preview.subject}
            </p>
            <pre style={{ whiteSpace: "pre-wrap" }}>{preview.body}</pre>
            <button onClick={sendAnnouncement} disabled={announcing}>
              {announcing ? "Sending..." : "Send announcement"}
            </button>
          </div>
        )}
        {announceMessage && <p>{announceMessage}</p>}
      </section>
    </div>
  );
}
