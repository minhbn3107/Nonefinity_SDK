# Contributing to Nonefinity AI SDK

Thank you for your interest in contributing to the Nonefinity AI SDK! This document provides guidelines and instructions for contributing.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Coding Standards](#coding-standards)
- [Testing](#testing)
- [Submitting Changes](#submitting-changes)

## Code of Conduct

By participating in this project, you agree to maintain a respectful and inclusive environment for all contributors.

## Getting Started

### Prerequisites

- Node.js 18+ or Bun
- Git
- TypeScript knowledge
- React knowledge (for component contributions)

### Setup

1. Fork the repository
2. Clone your fork:
   ```bash
   git clone https://github.com/YOUR_USERNAME/Nonefinity_Agents.git
   cd Nonefinity_Agents/Nonefinity_SDK
   ```

3. Install dependencies:
   ```bash
   npm install
   # or
   bun install
   ```

4. Create a branch:
   ```bash
   git checkout -b feature/your-feature-name
   ```

## Development Workflow

### Project Structure

```
Nonefinity_SDK/
├── src/
│   ├── client/          # API client
│   ├── components/      # React components
│   ├── types/          # TypeScript types
│   └── index.ts        # Main entry point
├── examples/           # Usage examples
├── dist/              # Built files (generated)
└── package.json
```

### Development Commands

```bash
# Build the SDK
npm run build

# Watch mode (rebuild on changes)
npm run dev

# Type checking
npm run type-check

# Linting
npm run lint
```

### Making Changes

1. **Core Client** (`src/client/NonefinityClient.ts`)
   - Add new API methods
   - Improve error handling
   - Enhance streaming logic

2. **Components** (`src/components/`)
   - Improve UI/UX
   - Add new features
   - Fix bugs

3. **Types** (`src/types/`)
   - Add new type definitions
   - Update existing types

## Coding Standards

### TypeScript

- Use TypeScript for all code
- Provide proper type annotations
- Avoid `any` type unless absolutely necessary
- Document complex types

### Code Style

- Use 2 spaces for indentation
- Use semicolons
- Use double quotes for strings
- Follow existing code patterns

### Documentation

- Add JSDoc comments for public APIs
- Include usage examples
- Update README.md if adding features

Example:
```typescript
/**
 * Create a new chat session
 * @param data - Session creation data
 * @returns Promise resolving to the created session
 * @example
 * ```typescript
 * const session = await client.createSession({
 *   chat_config_id: "config-id",
 *   name: "My Session"
 * });
 * ```
 */
async createSession(data: ChatSessionCreate): Promise<ApiResponse<ChatSession>> {
  // Implementation
}
```

### Error Handling

- Catch and handle errors appropriately
- Provide meaningful error messages
- Use the debug flag for detailed logging

### React Components

- Use functional components with hooks
- Provide proper prop types
- Handle loading and error states
- Make components accessible

## Testing

### Manual Testing

1. Build the SDK:
   ```bash
   npm run build
   ```

2. Link locally:
   ```bash
   npm link
   ```

3. Test in a sample project:
   ```bash
   cd /path/to/test-project
   npm link @nonefinity/ai-sdk
   ```

### Testing Checklist

- [ ] Core functionality works
- [ ] Error cases handled properly
- [ ] No TypeScript errors
- [ ] No console errors in browser
- [ ] Mobile responsive (for UI components)
- [ ] Works with different auth methods

## Submitting Changes

### Commit Messages

Use clear, descriptive commit messages:

```
feat: add support for custom headers in client
fix: resolve streaming connection timeout
docs: update API reference for new methods
refactor: simplify error handling logic
```

Prefixes:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `refactor`: Code refactoring
- `test`: Testing
- `chore`: Maintenance

### Pull Request Process

1. Update documentation
2. Ensure all checks pass
3. Create a pull request with:
   - Clear title and description
   - Reference any related issues
   - Screenshots (for UI changes)

### Pull Request Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
How was this tested?

## Checklist
- [ ] Code follows project style
- [ ] Documentation updated
- [ ] No TypeScript errors
- [ ] Tested locally
```

## Questions?

If you have questions:
- Open an issue for discussion
- Check existing issues and PRs
- Review the documentation

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

Thank you for contributing! 🎉
