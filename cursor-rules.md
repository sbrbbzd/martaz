# Mart.az Project Guidelines

## Code Structure & Organization

### Project Structure
- `/frontend` - React frontend application
- `/backend` - Backend API and server logic
- `/docs` - Documentation files

### Frontend Structure
- `src/assets` - Static assets like images, fonts, and locale files
- `src/components` - Reusable UI components
- `src/pages` - Page components corresponding to routes
- `src/hooks` - Custom React hooks
- `src/utils` - Utility/helper functions
- `src/context` - React context providers
- `src/services` - API service integration

## Coding Conventions

### General
- Use meaningful variable and function names
- Add comments for complex logic
- Keep functions small and focused on a single task
- Follow DRY (Don't Repeat Yourself) principles

### JavaScript/TypeScript
- Use ES6+ features
- Use TypeScript types/interfaces for all components and functions
- Use async/await for asynchronous operations
- Prefer const over let, avoid var

### React
- Use functional components with hooks
- Keep components small and focused
- Use React context for global state
- Split complex components into smaller ones
- Use proper React keys for lists

### CSS/Styling
- Use TailwindCSS for styling
- For custom styles, use CSS modules
- Follow mobile-first approach for responsive design

## Internationalization (i18n) Guidelines

### Translation Files
- All translation files are stored in `src/assets/locales/{language}/translation.json`
- Currently supported languages: Azerbaijani (az), English (en), Russian (ru)
- Use nested structures for logical grouping of translations

### Translation Keys
- Use dot notation for nested keys (e.g., `common.submit`, `listing.price`)
- Group related translations under common parents
- Use lowercase for keys, with camelCase for multi-word keys
- Be descriptive in naming (e.g., use `listings.noResults` instead of `listings.empty`)

### Adding New Translations
- When adding a new feature, add translations for all supported languages
- Keep key structure consistent across all language files
- Ensure translations are grammatically correct in each language

### Translation Implementation
- Use the i18next `t` function for all user-facing text
- For text with variables, use the format: `t('key', { variable: value })`
- Test your UI in all languages to ensure text fits properly

## Git Workflow

### Branches
- `main` - Production-ready code
- `develop` - Main development branch
- `feature/{feature-name}` - For new features
- `bugfix/{bug-description}` - For bug fixes
- `hotfix/{issue-description}` - For urgent fixes to production

### Commits
- Use clear and descriptive commit messages
- Format: `[type]: Short description of change`
- Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`
- Examples:
  - `feat: Add user profile photo upload`
  - `fix: Resolve listing pagination issue`
  - `i18n: Add missing translations for listing page`

### Pull Requests
- Create descriptive PR titles
- Include a summary of changes
- Link related issues
- Request review from at least one team member
- Ensure all CI checks pass

## Development Process

### Starting New Features
1. Create a new branch from `develop`
2. Implement the feature
3. Add appropriate tests
4. Update documentation if needed
5. Create a PR to merge back to `develop`

### Bug Fixes
1. Create a bug fix branch from `develop` (or `main` for hotfixes)
2. Fix the issue
3. Add tests to prevent regression
4. Create a PR for review

### Code Review Guidelines
- Review code for functionality, readability, and adherence to guidelines
- Check for potential bugs or edge cases
- Verify all translations are included
- Ensure proper error handling
- Look for performance issues

## Testing Guidelines

### Unit Tests
- Write tests for all utility functions
- Test React components with React Testing Library
- Focus on testing behavior, not implementation

### Integration Tests
- Test interactions between components
- Ensure data flows correctly through the application

### E2E Tests
- Test critical user flows (e.g., listing creation, user registration)
- Run E2E tests before deploying to production

## Deployment

### Environments
- Development: For ongoing development
- Staging: For pre-production testing
- Production: Live environment for users

### Deployment Process
1. Merge PR to `develop`
2. Automated deployment to development environment
3. QA testing in development
4. Merge `develop` to `main` for production release
5. Automated deployment to production

## Performance Guidelines

- Keep bundle size minimal
- Optimize images
- Implement code splitting
- Use lazy loading for components and routes
- Minimize API calls and implement caching where appropriate 