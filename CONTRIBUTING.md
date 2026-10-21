# Contributing to Wegenz Practice Mobile

Thank you for your interest in contributing to Wegenz Practice Mobile!

## Development Guidelines

1. **Package Manager**: Use `pnpm` exclusively (`pnpm install`, `pnpm run start`).
2. **Type Safety**: Keep TypeScript checks passing with `pnpm run typecheck`. No `any` without strict necessity.
3. **Pure Native UI**: Ensure high performance on mobile devices. Use native components (`View`, `Text`, `TouchableOpacity`, `FlatList`, `ScrollView`).
4. **Cloud Builds**: Do not run local Android SDK or Gradle builds on memory-constrained servers. Use GitHub Actions for native APK compilation.
5. **Formulas**: Render math and chemical formulas using the provided `<MathView />` component.

## Pull Requests

1. Create a feature branch from `main`.
2. Commit your changes with clear, descriptive commit messages.
3. Verify type checking with `pnpm run typecheck`.
4. Submit a pull request to `main`.
