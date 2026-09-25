# Contributing to TechNexusOrg

We are thrilled you want to contribute! TechNexusOrg is built by engineers, for engineers.

## Code of Conduct

We are committed to providing a welcoming, harassment-free environment for everyone. Respect, constructive feedback, and integrity in contributions are required.

## Developing Locally

1. Fork and clone the repository:
   ```bash
   git clone https://github.com/TechNexusOrg/platform.git
   cd platform
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Copy configuration:
   ```bash
   cp .env.example .env.local
   ```

4. Run tests and typecheck before creating a branch:
   ```bash
   npm test
   npm run typecheck
   npm run lint
   ```

## Pull Request Guidelines

1. **Meaningful Changes**: Trivial whitespace changes, automated bot PRs, or spam issues are rejected.
2. **Tests Included**: Every bugfix or feature must include automated unit/integration tests in Vitest.
3. **Commit Messages**: Follow conventional commits:
   - `feat: add issue filter component`
   - `fix: handle edge case in webhook signature verification`
   - `test: add test cases for core contributor progression`
4. **All Checks Pass**: Ensure `npm test`, `npm run typecheck`, `npm run lint`, and `npm run build` pass without warnings.
