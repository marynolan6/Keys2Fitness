# Keys2Fitness application

This directory contains the Expo/React Native application. The main project overview, screenshots, conceptual ERD, team information, and roadmap are in the [project README](../README.md).

## Quick start

Run from this directory using Node.js 22.23+ (or a newer compatible LTS release):

```bash
npm ci
npm start
```

Use an Expo Go version compatible with **Expo SDK 58**, or an appropriate development build. Firebase-backed features require access to an authorized Firebase project; see the [setup instructions](../README.md#getting-started).

## Checks

```bash
npm run test:workouts
node --test tests/coach-tips.test.mjs tests/profile.test.mjs
npx tsc --noEmit
npm run lint
```

## Development references

- [Android and WSL setup](docs/android-setup.md)
- [Workout architecture](docs/workout-architecture.md)
- [UI/theme standards](docs/theme-standards.md)
- [Feature verification notes](docs)
- [Development instructions](AGENTS.md)

Routes live in `src/app`; reusable components, controllers, models, services, and storage adapters live elsewhere under `src`.
