# Ride Booking Workflow

## Current Project State

The repository contains the Expo mobile app and its REST API client. It does not currently contain a backend server, database, database schema, or migrations. The app runs a local demo when `EXPO_PUBLIC_API_URL` is unset. Demo rides and their changing statuses are held in app state only; they are not saved after the app closes.

## Rider Workflow

1. **Open the booking screen.** The app shows a map, pickup field, destination field, and driver and booking actions.
2. **Set pickup.** The rider types an address or taps the location control. The app requests foreground location permission, reads the current GPS coordinates, and reverse-geocodes them to an address where supported. If permission is denied, the rider can type an address. GPS coordinates are optional in the API request.
3. **Set destination.** The rider enters a destination address.
4. **Validate the route.** Both fields must contain non-whitespace text. Otherwise, booking and driver search stop and the screen shows an error.
5. **Find nearby drivers (optional).** The app calls `GET /drivers/nearby` with the pickup address and, when available, latitude and longitude. It displays the count returned by the service.
6. **Request the ride.** The app calls `POST /rides`. On success it displays a confirmation and starts the status view at the status returned by the API.
7. **Track the ride.** For a backend ride, the app calls `GET /rides/{id}` every five seconds. It displays the latest status and stops polling after `completed` or `cancelled`.
8. **Complete the ride.** The backend/driver workflow updates the ride to `completed`; the app receives that update on its next poll.

## Status Workflow

Normal ride progression:

```text
requested -> accepted -> driver_arriving -> in_progress -> completed
```

- `requested`: backend has created and persisted the rider's request.
- `accepted`: a driver has accepted the request.
- `driver_arriving`: the driver is travelling to the pickup point.
- `in_progress`: the rider has been picked up and the trip has started.
- `completed`: the trip has ended.
- `cancelled`: optional terminal state for a rider or driver cancellation.

The backend should validate transitions and reject invalid or out-of-order updates. A typical allowed transition is only to the next state above, or to `cancelled` from a non-terminal state. The app currently displays the status returned by the backend; it does not assign real driver statuses itself. Demo mode advances through the steps locally to demonstrate the UI.

## Backend API Contract

Set the API base URL in the mobile app environment as `EXPO_PUBLIC_API_URL`. The client expects:

| Method and path | Request | Response |
| --- | --- | --- |
| `GET /drivers/nearby?pickup=...&latitude=...&longitude=...` | Pickup text and optional coordinates in the query string | `{ "count": 4 }` or `{ "drivers": [] }` |
| `POST /rides` | `{ "pickup": "...", "destination": "...", "pickupCoordinates": { "latitude": 0, "longitude": 0 } }` (coordinates may be `null`) | `{ "id": "ride-id", "status": "requested" }` |
| `GET /rides/{id}` | Ride ID in the path | `{ "id": "ride-id", "status": "accepted" }` |

All responses should be JSON. Status strings accepted by the app are `requested`, `accepted`, `driver_arriving`, `in_progress`, `completed`, and `cancelled` (spaces and hyphens are normalized to underscores). The backend should return an appropriate non-2xx response and a useful error body for failures.

## Database Location

**There is no database configured in this repository yet.** `EXPO_PUBLIC_API_URL` points to the backend API, not directly to a database. The mobile app must never connect directly to PostgreSQL or contain database credentials.

Recommended backend layout when a server is added:

```text
ride-booking-app/
  backend/
    prisma/
      schema.prisma       # database models and migration source
    .env                  # backend-only DATABASE_URL; do not commit
    .env.example          # placeholder variable names, no credentials
```

Use PostgreSQL for persistent ride and driver data. In local development, PostgreSQL can run on the developer machine or in Docker, normally listening on port `5432`; its data files belong to the PostgreSQL server or Docker volume, not in the Expo app folder. In deployed environments, use a managed PostgreSQL service. Configure the actual connection string as the backend's `DATABASE_URL` secret. Keep database migrations in `backend/prisma/migrations/` if Prisma is selected.

Suggested records:

- `rides`: ID, rider ID, driver ID (nullable until accepted), pickup and destination text, pickup latitude/longitude, status, created/updated timestamps.
- `ride_status_events`: ride ID, previous status, new status, timestamp, and actor. This preserves a reliable status history.
- `drivers`: ID, availability, and current/last known location, subject to location retention and privacy requirements.

Persist a ride before returning a successful `POST /rides` response. Persist each valid status change and have `GET /rides/{id}` return the current persisted status. Driver search should use available drivers near the pickup coordinates; the current mobile contract only needs a count, so the API can keep driver details private.

## Environment Setup

1. Start the backend and its PostgreSQL database.
2. Apply the backend's database migrations and verify its health endpoint, if provided.
3. Set `EXPO_PUBLIC_API_URL` in the Expo app environment to the backend's reachable base URL, for example `http://localhost:4000` for a web browser on the same machine.
4. For a physical phone, use the development machine's LAN address instead of `localhost`, and ensure the phone can reach that port.
5. Restart Expo after changing environment values. `EXPO_PUBLIC_` values are bundled into the app, so only use it for the non-secret API base URL. Never put `DATABASE_URL`, passwords, or private API credentials in the mobile app.
6. Test driver lookup, booking, and each backend status transition. When no API URL is configured, verify the demo flow instead.