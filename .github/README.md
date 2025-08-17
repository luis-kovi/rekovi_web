# GitHub Actions Workflows

This directory contains the CI/CD pipeline configuration for the ReKovi Web project.

## Workflows

### CI Pipeline (`ci.yml`)
- **Trigger**: Push to main/master branches and pull requests
- **Node.js versions**: 18.x, 20.x (matrix build)
- **Steps**:
  1. Checkout code
  2. Setup Node.js with npm caching
  3. Install dependencies with `npm ci`
  4. Run ESLint linting
  5. Build application (includes TypeScript type checking)
  6. Cache build artifacts (Node.js 18.x only)
- **Features**:
  - Fail-fast strategy for quick feedback
  - Skip CI with `[skip ci]` in commit messages
  - 15-minute timeout
  - Concurrency control to cancel previous runs

### Deploy Pipeline (`deploy.yml`)
- **Trigger**: Push to main/master branches (after CI passes)
- **Dependencies**: Waits for CI workflow to complete successfully
- **Steps**:
  1. Wait for CI completion
  2. Checkout code
  3. Setup Node.js 18.x with npm caching
  4. Install dependencies
  5. Install Vercel CLI
  6. Pull Vercel environment configuration
  7. Build project with Vercel
  8. Deploy to production
- **Features**:
  - Skip deployment with `[skip ci]` or `[skip deploy]` in commit messages
  - 10-minute timeout
  - Requires Vercel secrets configuration

## Required Secrets

Configure the following secrets in your GitHub repository:

- `VERCEL_TOKEN`: Your Vercel authentication token
- `VERCEL_ORG_ID`: Your Vercel organization ID
- `VERCEL_PROJECT_ID`: Your Vercel project ID

## Performance Optimizations

- **NPM Caching**: Automatic caching of node_modules
- **Build Caching**: Next.js build cache (Node.js 18.x builds only)
- **Parallel Jobs**: CI runs on multiple Node.js versions simultaneously
- **Concurrency Control**: Cancels previous runs when new commits are pushed
- **Telemetry Disabled**: Next.js telemetry is disabled for faster builds