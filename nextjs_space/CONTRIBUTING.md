# Contributing to INMOVA

🚀 Thank you for your interest in contributing to INMOVA! This document provides guidelines and instructions for contributing.

## 📝 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Coding Standards](#coding-standards)
- [Commit Guidelines](#commit-guidelines)
- [Pull Request Process](#pull-request-process)
- [Testing](#testing)

## 🤝 Code of Conduct

### Our Pledge

We are committed to providing a welcoming and inspiring community for all. Please treat everyone with respect and professionalism.

### Standards

**Examples of behavior that contributes to a positive environment:**
- Using welcoming and inclusive language
- Being respectful of differing viewpoints
- Gracefully accepting constructive criticism
- Focusing on what is best for the community

**Unacceptable behavior includes:**
- Trolling, insulting/derogatory comments
- Public or private harassment
- Publishing others' private information
- Other conduct which could reasonably be considered inappropriate

## 🚀 Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL 15+
- Yarn package manager
- Git
- Basic knowledge of TypeScript, React, and Next.js

### Setup Development Environment

1. **Fork the repository**
```bash
git clone https://github.com/yourusername/inmova.git
cd inmova
```

2. **Install dependencies**
```bash
yarn install
```

3. **Setup environment**
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. **Setup database**
```bash
yarn prisma migrate dev
yarn prisma generate
yarn prisma db seed
```

5. **Start development server**
```bash
yarn dev
```

## 🛠️ Development Workflow

### Branch Strategy

- `main` - Production-ready code
- `develop` - Integration branch for features
- `feature/*` - New features
- `bugfix/*` - Bug fixes
- `hotfix/*` - Urgent production fixes

### Creating a Feature Branch

```bash
# Update develop branch
git checkout develop
git pull origin develop

# Create feature branch
git checkout -b feature/your-feature-name
```

### Making Changes

1. Make your changes in your feature branch
2. Write/update tests
3. Update documentation if needed
4. Ensure all tests pass
5. Commit your changes following commit guidelines

## 📝 Coding Standards

### TypeScript

- Use TypeScript for all new files
- Define proper types/interfaces
- Avoid `any` type unless absolutely necessary
- Use strict mode

```typescript
// Good
interface User {
  id: string;
  name: string;
  email: string;
}

function getUser(id: string): Promise<User> {
  // ...
}

// Bad
function getUser(id: any): any {
  // ...
}
```

### React Components

- Use functional components with hooks
- Extract reusable logic into custom hooks
- Keep components small and focused
- Use proper prop types

```typescript
// Good
interface ButtonProps {
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary';
}

export function Button({ label, onClick, variant = 'primary' }: ButtonProps) {
  return (
    <button onClick={onClick} className={`btn-${variant}`}>
      {label}
    </button>
  );
}
```

### File Organization

```
components/
├── ui/
│   ├── button.tsx
│   ├── card.tsx
│   └── input.tsx
├── layout/
│   ├── header.tsx
│   └── sidebar.tsx
└── dashboard/
    ├── KPICard.tsx
    └── AdvancedAnalytics.tsx
```

### Naming Conventions

- **Components**: PascalCase (`UserProfile.tsx`)
- **Utilities**: camelCase (`formatDate.ts`)
- **Constants**: UPPER_SNAKE_CASE (`MAX_RETRY_COUNT`)
- **Types/Interfaces**: PascalCase (`UserProfile`, `ApiResponse`)

### Code Style

- Use ESLint and Prettier
- 2 spaces for indentation
- Use semicolons
- Single quotes for strings
- Trailing commas

```bash
# Format code
yarn lint
yarn format
```

## 📦 Commit Guidelines

### Commit Message Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `perf`: Performance improvements
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

### Examples

```bash
feat(auth): add Google OAuth integration

fix(payments): resolve payment processing issue

docs(readme): update installation instructions

test(api): add unit tests for user endpoints
```

## 🔄 Pull Request Process

### Before Submitting

1. **Update your branch**
```bash
git checkout develop
git pull origin develop
git checkout feature/your-feature
git rebase develop
```

2. **Run tests**
```bash
yarn test:ci
yarn test:e2e
```

3. **Lint and format**
```bash
yarn lint
yarn format
```

4. **Build**
```bash
yarn build
```

### Submitting a Pull Request

1. Push your branch to GitHub
2. Create a Pull Request to `develop`
3. Fill out the PR template completely
4. Link any related issues
5. Request review from maintainers

### PR Template

```markdown
## Description
Brief description of the changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Unit tests added/updated
- [ ] E2E tests added/updated
- [ ] Manual testing completed

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex code
- [ ] Documentation updated
- [ ] No new warnings generated
- [ ] Tests pass locally
```

### Code Review Process

1. At least one maintainer must approve
2. All CI checks must pass
3. Address all review comments
4. Squash commits if requested
5. Merge after approval

## 🧩 Testing

### Writing Tests

#### Unit Tests

```typescript
import { describe, it, expect } from 'vitest';
import { formatCurrency } from './utils';

describe('formatCurrency', () => {
  it('formats USD correctly', () => {
    expect(formatCurrency(1000, 'USD')).toBe('$1,000.00');
  });

  it('handles zero', () => {
    expect(formatCurrency(0, 'USD')).toBe('$0.00');
  });
});
```

#### E2E Tests

```typescript
import { test, expect } from '@playwright/test';

test('user can login', async ({ page }) => {
  await page.goto('/login');
  await page.fill('input[name="email"]', 'test@example.com');
  await page.fill('input[name="password"]', 'password');
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL('/dashboard');
});
```

### Running Tests

```bash
# Unit tests
yarn test              # Watch mode
yarn test:ci           # CI mode with coverage

# E2E tests
yarn test:e2e          # Headless
yarn test:e2e:ui       # With UI

# Specific tests
yarn test UserService.test.ts
```

## 📚 Documentation

### Code Documentation

- Add JSDoc comments for functions
- Document complex logic
- Keep comments up to date

```typescript
/**
 * Calculates the total rent for a given period
 * @param amount - Monthly rent amount
 * @param months - Number of months
 * @param discount - Optional discount percentage
 * @returns Total rent after discount
 */
function calculateTotalRent(
  amount: number,
  months: number,
  discount?: number
): number {
  const total = amount * months;
  return discount ? total * (1 - discount / 100) : total;
}
```

### API Documentation

- Document all API endpoints
- Include request/response examples
- Document error codes

## ❓ Questions?

Feel free to:
- Open an issue
- Ask in discussions
- Email: dev@inmova.app

## 👏 Recognition

Contributors will be recognized in:
- CONTRIBUTORS.md
- Release notes
- GitHub insights

---

Thank you for contributing to INMOVA! 🚀
