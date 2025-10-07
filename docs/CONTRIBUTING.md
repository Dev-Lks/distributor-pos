# Contributing Guide

## Welcome!

Thank you for considering contributing to Claudiao! This guide will help you get started.

## Code of Conduct

- Be respectful and inclusive
- Welcome newcomers
- Focus on constructive feedback
- Collaborate openly

## Getting Started

### 1. Fork the Repository

```bash
# Fork on GitHub, then clone
git clone https://github.com/YOUR_USERNAME/claudiao.git
cd claudiao
```

### 2. Set Up Development Environment

Follow the [Setup Guide](./SETUP.md) to configure your local environment.

### 3. Create a Branch

```bash
git checkout -b feature/your-feature-name
```

## Development Guidelines

### Code Style

We use ESLint and Prettier for code consistency:

```bash
# Check linting
pnpm lint

# Format code
pnpm format
```

### Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add new feature
fix: correct a bug
docs: update documentation
style: format code
refactor: restructure code
test: add tests
chore: update dependencies
```

**Examples:**
```bash
git commit -m "feat: add product filtering"
git commit -m "fix: resolve inventory calculation bug"
git commit -m "docs: update API documentation"
```

### TypeScript

- Use strict typing (no `any`)
- Define interfaces for all data structures
- Use type inference where obvious
- Export types from dedicated type files

**Example:**
```ts
// ❌ Bad
function createUser(data: any) {
  return data;
}

// ✅ Good
interface CreateUserData {
  name: string;
  email: string;
}

function createUser(data: CreateUserData): User {
  // ...
}
```

### Component Guidelines

**File Structure:**
```tsx
// Imports
import { useState } from 'react';
import { Button } from '@/components/ui/button';

// Types
interface ComponentProps {
  title: string;
  onSave: () => void;
}

// Component
export function Component({ title, onSave }: ComponentProps) {
  // Hooks
  const [state, setState] = useState();

  // Handlers
  const handleClick = () => {
    // ...
  };

  // Render
  return (
    <div>
      {/* ... */}
    </div>
  );
}
```

**Best Practices:**
- Keep components small and focused
- Extract complex logic to custom hooks
- Use meaningful prop names
- Add JSDoc comments for complex components

### API Routes

**Structure:**
```ts
import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { handleError } from '@/lib/errors';

export async function GET(request: NextRequest) {
  try {
    // Validate input
    // Business logic
    // Return response
    return NextResponse.json({ data });
  } catch (error) {
    return handleError(error);
  }
}
```

**Best Practices:**
- Always use try-catch
- Log errors with context
- Return appropriate HTTP status codes
- Validate all inputs

### Database Changes

**Creating Migrations:**
```bash
# Make schema changes in prisma/schema.prisma
# Create migration
pnpm prisma migrate dev --name description
```

**Best Practices:**
- Never modify existing migrations
- Test migrations locally first
- Include rollback strategy in description
- Update seed data if needed

## Testing

### Running Tests

```bash
# Run all tests
pnpm test

# Run specific test
pnpm test path/to/test

# Watch mode
pnpm test:watch
```

### Writing Tests

```ts
import { describe, it, expect } from 'vitest';

describe('Component', () => {
  it('should render correctly', () => {
    // Arrange
    const props = { title: 'Test' };

    // Act
    const { getByText } = render(<Component {...props} />);

    // Assert
    expect(getByText('Test')).toBeInTheDocument();
  });
});
```

## Pull Request Process

### 1. Update Your Branch

```bash
git fetch origin
git rebase origin/main
```

### 2. Run Checks

```bash
# Lint
pnpm lint

# Type check
pnpm type-check

# Build
pnpm build

# Test
pnpm test
```

### 3. Create Pull Request

**Title:** Use conventional commit format
```
feat: add product search functionality
```

**Description Template:**
```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
How to test these changes

## Screenshots (if applicable)

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex code
- [ ] Documentation updated
- [ ] No new warnings
- [ ] Tests added/updated
- [ ] All tests pass
```

### 4. Code Review

- Address all feedback
- Keep discussions professional
- Update PR as needed
- Resolve all comments

### 5. Merge

Once approved, maintainers will merge your PR.

## Project Areas

### Frontend (React/Next.js)
**Good First Issues:**
- UI improvements
- Component refactoring
- Form validation
- Loading states

**Skills Needed:**
- React
- TypeScript
- TailwindCSS

### Backend (API Routes)
**Good First Issues:**
- API endpoint improvements
- Error handling
- Data validation
- Performance optimization

**Skills Needed:**
- Node.js
- Prisma
- REST APIs
- TypeScript

### Database
**Good First Issues:**
- Schema improvements
- Query optimization
- Migration scripts
- Seed data

**Skills Needed:**
- PostgreSQL
- Prisma
- SQL

### Documentation
**Good First Issues:**
- API documentation
- Setup guides
- Code examples
- README improvements

**Skills Needed:**
- Technical writing
- Markdown

## Issue Guidelines

### Reporting Bugs

**Template:**
```markdown
**Describe the bug**
Clear description of the bug

**To Reproduce**
1. Go to '...'
2. Click on '...'
3. See error

**Expected behavior**
What should happen

**Screenshots**
If applicable

**Environment**
- OS: [e.g. macOS]
- Browser: [e.g. Chrome 120]
- Version: [e.g. 1.0.0]

**Additional context**
Any other relevant information
```

### Feature Requests

**Template:**
```markdown
**Is your feature request related to a problem?**
Clear description

**Describe the solution**
What you want to happen

**Describe alternatives**
Alternative solutions considered

**Additional context**
Mockups, examples, etc.
```

## Release Process

### Versioning

We follow [Semantic Versioning](https://semver.org/):
- MAJOR: Breaking changes
- MINOR: New features (backward compatible)
- PATCH: Bug fixes

### Changelog

Update `CHANGELOG.md` with all changes:

```markdown
## [1.2.0] - 2024-01-15

### Added
- Product search functionality
- Export to PDF

### Fixed
- Inventory calculation bug
- Login redirect issue

### Changed
- Updated dependencies
```

## Questions?

- Open an issue for bugs
- Start a discussion for questions
- Join our Discord (link)
- Email: support@claudiao.com

## Recognition

Contributors will be:
- Listed in README.md
- Credited in release notes
- Invited to contributor discussions

Thank you for contributing! 🎉
