# Abduallah & Shrouk Wedding Invitation

Static English wedding invitation with a countdown, venue directions, a photo placeholder, and an RSVP preview.

## Preview

Run `python3 -m http.server 4173 --directory dist` and open http://localhost:4173.

## Deploy on Vercel

Import this repository. The included `vercel.json` serves `dist` with no build step or framework.

## Current limitations

- RSVP requires deploying setup/Code.gs as a Google Apps Script web app and configuring RSVP_SCRIPT_URL and RSVP_SECRET in Vercel. Until configured, submissions return an unavailable message.
- Local static preview cannot run /api/rsvp; live end-to-end verification is still pending.
- The venue illustration is decorative, not a depiction of the actual venue.
- The couple photo is a placeholder.
- Event time assumes 11 December 2026, 7–11 PM, Cairo time.
