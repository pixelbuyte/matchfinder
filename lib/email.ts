import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

// Change this to your domain once verified e.g. notifications@matchfinder.app
const FROM = "MatchFinder <onboarding@resend.dev>";

export async function sendJoinedEmail({
  creatorEmail,
  creatorName,
  joinerName,
  matchTitle,
  matchId,
}: {
  creatorEmail: string;
  creatorName: string;
  joinerName: string;
  matchTitle: string;
  matchId: number;
}) {
  await resend.emails.send({
    from: FROM,
    to: creatorEmail,
    subject: `${joinerName} joined your match — ${matchTitle}`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px">
        <h2 style="color:#1d4ed8">Someone joined your match!</h2>
        <p>Hey ${creatorName},</p>
        <p><strong>${joinerName}</strong> just joined your match <strong>${matchTitle}</strong>.</p>
        <a href="${process.env.NEXT_PUBLIC_URL}/matches/${matchId}"
           style="display:inline-block;margin-top:16px;padding:12px 24px;background:#2563eb;color:#fff;border-radius:8px;text-decoration:none;font-weight:600">
          View Match
        </a>
        <p style="margin-top:24px;color:#6b7280;font-size:12px">MatchFinder — Find your next game</p>
      </div>
    `,
  });
}

export async function sendLeftEmail({
  creatorEmail,
  creatorName,
  leaverName,
  matchTitle,
  matchId,
}: {
  creatorEmail: string;
  creatorName: string;
  leaverName: string;
  matchTitle: string;
  matchId: number;
}) {
  await resend.emails.send({
    from: FROM,
    to: creatorEmail,
    subject: `${leaverName} left your match — ${matchTitle}`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px">
        <h2 style="color:#dc2626">A player left your match</h2>
        <p>Hey ${creatorName},</p>
        <p><strong>${leaverName}</strong> has left your match <strong>${matchTitle}</strong>. There is now a spot open.</p>
        <a href="${process.env.NEXT_PUBLIC_URL}/matches/${matchId}"
           style="display:inline-block;margin-top:16px;padding:12px 24px;background:#2563eb;color:#fff;border-radius:8px;text-decoration:none;font-weight:600">
          View Match
        </a>
        <p style="margin-top:24px;color:#6b7280;font-size:12px">MatchFinder — Find your next game</p>
      </div>
    `,
  });
}

export async function sendJoinConfirmationEmail({
  userEmail,
  userName,
  matchTitle,
  matchLocation,
  matchDate,
  matchId,
}: {
  userEmail: string;
  userName: string;
  matchTitle: string;
  matchLocation: string;
  matchDate: string;
  matchId: number;
}) {
  await resend.emails.send({
    from: FROM,
    to: userEmail,
    subject: `You joined — ${matchTitle}`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px">
        <h2 style="color:#16a34a">You're in!</h2>
        <p>Hey ${userName},</p>
        <p>You successfully joined <strong>${matchTitle}</strong>.</p>
        <table style="margin:16px 0;border-collapse:collapse;width:100%">
          <tr><td style="padding:6px 0;color:#6b7280">📍 Location</td><td style="padding:6px 0"><strong>${matchLocation}</strong></td></tr>
          <tr><td style="padding:6px 0;color:#6b7280">📅 Date</td><td style="padding:6px 0"><strong>${new Date(matchDate).toLocaleString()}</strong></td></tr>
        </table>
        <a href="${process.env.NEXT_PUBLIC_URL}/matches/${matchId}"
           style="display:inline-block;margin-top:16px;padding:12px 24px;background:#2563eb;color:#fff;border-radius:8px;text-decoration:none;font-weight:600">
          View Match Details
        </a>
        <p style="margin-top:24px;color:#6b7280;font-size:12px">MatchFinder — Find your next game</p>
      </div>
    `,
  });
}
