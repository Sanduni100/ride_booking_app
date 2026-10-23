# RideBook

An Expo ride-booking app with GPS pickup, nearby-driver lookup, ride requests, and live ride-status polling.

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

## Ride API

For the step-by-step rider workflow, status transitions, API contract, environment setup, and database location, see [RIDE_WORKFLOW.md](RIDE_WORKFLOW.md).

Set `EXPO_PUBLIC_API_URL` to the base URL of your ride service. Without it, the screen uses demo data and advances a sample ride through each status.

The API client expects these JSON endpoints:

- `GET /drivers/nearby?pickup=...&latitude=...&longitude=...` returns `{ "count": 4 }` or `{ "drivers": [] }`.
- `POST /rides` accepts `{ "pickup": "...", "destination": "...", "pickupCoordinates": { "latitude": 0, "longitude": 0 } }` and returns `{ "id": "ride-id", "status": "requested" }`.
- `GET /rides/{id}` returns `{ "id": "ride-id", "status": "accepted" }`.

Ride statuses are `requested`, `accepted`, `driver_arriving`, `in_progress`, and `completed` (with `cancelled` also recognized). Live rides are checked every five seconds.

You can start developing by editing the files inside the **src/app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **example** directory and create a blank **src/app** directory where you can start developing.

### Other setup steps

- To set up ESLint for linting, run `npx expo lint`, or follow our guide on ["Using ESLint and Prettier"](https://docs.expo.dev/guides/using-eslint/)
- If you'd like to set up unit testing, follow our guide on ["Unit Testing with Jest"](https://docs.expo.dev/develop/unit-testing/)
- Learn more about the TypeScript setup in this template in our guide on ["Using TypeScript"](https://docs.expo.dev/guides/typescript/)

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.
