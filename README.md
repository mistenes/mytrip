<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy the app

This contains everything you need to run your app locally.

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Run the app frontend:
   `npm run dev`
3. Start the API server (requires MongoDB):
   `npm run server`

The server uses the `MONGODB_URI` environment variable and defaults to `mongodb://localhost:27017/myTrip`.
When deployed, the Express server serves `index.html` at the root path so the frontend and backend can share the same host. A health check is available at `/health`.

If an account with username `admin` does not exist, setting `ADMIN_PASSWORD` seeds one on startup. The password is hashed and the account must change its password on first login.

## Personal data management

Administrators can configure which personal data fields are collected and whether they are editable. Use the following API endpoints:

- `GET /api/field-config` – list available fields
- `PUT /api/field-config/:field` – create or update a field (expects `label`, `type`, `enabled`, `locked`)
- `PUT /api/users/:id/personal-data` – update a user's field value (respects field configuration and per-user lock)
- `PUT /api/users/:id/personal-data/:field/lock` – lock or unlock a field for a specific user
- `POST /api/users/:id/passport-photo` – upload a passport photo (`photo` form field). Uploaded files are served from `/uploads`.

Add `uploads/` to `.gitignore` so passport photos aren't committed to source control.

Organizers or administrators can choose a traveler on a trip's personal data page to view their details and can print or save the displayed information as a PDF.

## Invitations

Super admins or organizers can send signup links via Brevo. Each invitation includes the desired user role and optional trip to join. Links expire after 7 days so registration is only possible through email invitations.

Endpoints:

- `POST /api/invitations` – body: `{ email, role, tripId }`. Generates a token, emails the signup link, and stores expiration.
- `GET /api/invitations` – list active invitations that haven't expired or been used.
- `POST /api/invitations/:id/resend` – regenerate the token, extend its expiration by 7 days and resend the email.
- `DELETE /api/invitations/:id` – remove an invitation and invalidate the token immediately.
- `GET /api/invitations/:token` – verify that an invitation token is still valid.
- `POST /api/register/:token` – body: `{ firstName, lastName, username, dateOfBirth, password, verifyPassword }`. Creates the user with English-only names, records their username and birth date, assigns them to the invitation's trip, and marks the token as used.

Attempting to invite an email address that already has a non-expired invite returns HTTP 409; resend the existing invitation instead of creating a new one.

## Trip and user management

Trips can have multiple organizers and travelers. Use these endpoints to manage participants and accounts:

- `POST /api/trips/:id/organizers` – body: `{ userId }`. Adds an organizer to a trip.
- `DELETE /api/trips/:id/organizers/:userId` – remove an organizer from a trip.
- `POST /api/trips/:id/travelers` – body: `{ userId }`. Adds a traveler to a trip.
- `DELETE /api/trips/:id/travelers/:userId` – remove a traveler from a trip.
- `DELETE /api/users/:id` – delete a user and detach them from all trips.

Set the following environment variables to enable email delivery:

| Variable | Purpose |
| -------- | ------- |
| `BREVO_API_KEY` | Brevo API key used to send the email |
| `BREVO_SENDER_EMAIL` | The from-address for invitations |
| `BREVO_SENDER_NAME` *(optional)* | Display name for the sender |
| `ADMIN_PASSWORD` | Seed password for the initial admin user (username `admin`; must be changed on first login) |

You can also configure `APP_URL` so links point to your frontend host.
