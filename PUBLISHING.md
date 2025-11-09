# Publishing Guide

This guide explains how to build and publish the Nonefinity AI SDK to npm.

## Prerequisites

1. **Node.js** (v18 or higher)
2. **npm** account with publish permissions
3. **Git** for version control

## Installation

First, install all dependencies:

```bash
npm install
# or
bun install
```

## Building the SDK

Build the SDK for production:

```bash
npm run build
# or
bun run build
```

This will:
- Compile TypeScript to JavaScript
- Generate type definitions (.d.ts files)
- Create both CommonJS and ESM bundles
- Copy CSS files to the dist folder

The output will be in the `dist/` directory:
```
dist/
├── index.js          # CommonJS bundle
├── index.mjs         # ESM bundle
├── index.d.ts        # Type definitions
├── ChatWidget.css    # Widget styles
└── ...
```

## Testing Locally

Before publishing, test the package locally:

### 1. Link the package

```bash
npm link
```

### 2. Use in another project

```bash
cd /path/to/your/project
npm link @nonefinity/ai-sdk
```

### 3. Test the import

```typescript
import { NonefinityClient, ChatWidget } from "@nonefinity/ai-sdk";
```

## Publishing to npm

### 1. Login to npm

```bash
npm login
```

### 2. Update version

Update the version in `package.json`:
- Patch release: `1.0.0` → `1.0.1`
- Minor release: `1.0.0` → `1.1.0`
- Major release: `1.0.0` → `2.0.0`

Or use npm version:
```bash
npm version patch  # or minor, major
```

### 3. Build and publish

```bash
npm run build
npm publish --access public
```

The `prepublishOnly` script will automatically run the build before publishing.

## Version Management

Follow [Semantic Versioning](https://semver.org/):

- **Patch** (1.0.x): Bug fixes, small improvements
- **Minor** (1.x.0): New features, backwards compatible
- **Major** (x.0.0): Breaking changes

## Release Checklist

Before publishing a new version:

- [ ] All tests pass
- [ ] Documentation is updated
- [ ] CHANGELOG is updated
- [ ] Version number is incremented
- [ ] Build succeeds without errors
- [ ] Package tested locally
- [ ] Git tag created

## Publishing Steps

```bash
# 1. Ensure clean working directory
git status

# 2. Update version
npm version patch  # or minor/major

# 3. Build
npm run build

# 4. Test
npm run type-check

# 5. Publish
npm publish --access public

# 6. Push tags
git push --follow-tags
```

## Troubleshooting

### Build Errors

If you encounter build errors:
```bash
# Clean and rebuild
rm -rf dist node_modules
npm install
npm run build
```

### TypeScript Errors

```bash
# Check types without building
npm run type-check
```

### React Peer Dependency Issues

The SDK uses React as a peer dependency. Users need to install React separately:
```bash
npm install react react-dom
```

## Unpublishing

If you need to unpublish (within 72 hours):
```bash
npm unpublish @nonefinity/ai-sdk@1.0.0
```

**Warning**: Unpublishing can break dependent projects. Consider deprecating instead:
```bash
npm deprecate @nonefinity/ai-sdk@1.0.0 "This version has been deprecated"
```

## CDN Distribution

After publishing, the package is automatically available via CDN:

### unpkg
```html
<script type="module">
  import { NonefinityClient } from 'https://unpkg.com/@nonefinity/ai-sdk/dist/index.mjs';
</script>
```

### jsDelivr
```html
<script type="module">
  import { NonefinityClient } from 'https://cdn.jsdelivr.net/npm/@nonefinity/ai-sdk/dist/index.mjs';
</script>
```

## Post-Publishing

After successful publication:

1. Create a GitHub release with the same version tag
2. Update documentation website
3. Announce on social media/community channels
4. Monitor for issues

## Support

For issues with publishing:
- Check [npm documentation](https://docs.npmjs.com/)
- Review [package.json specification](https://docs.npmjs.com/cli/v9/configuring-npm/package-json)
- Contact the Nonefinity team
