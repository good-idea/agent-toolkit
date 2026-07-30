# Contributing Guidelines

## Code Style

### General Principles

- Write clear, self-documenting code
- Prefer readability over cleverness
- Keep functions small and focused
- Use descriptive variable and function names

### JavaScript/TypeScript

- Prefer `const` over `let` when possible
- Use async/await over promise chains
- Destructure objects and arrays when appropriate

### Git Commits

Use Conventional Commits format:

```
<type>: <short description> (#NNN)
```

Types: `feat`, `fix`, `refactor`, `style`, `test`, `docs`, `chore`, `agent`

- Write in the imperative mood ("Add feature" not "Added feature")
- Keep the subject line ≤ 72 characters
- Reference the task number when applicable

### Pull Requests

- Create a descriptive PR title
- Include a summary of changes in the PR body
- Reference the related task
- Ensure all checks pass before requesting review

## Testing

- Write tests for new functionality
- Run `pnpm test` before committing

## Code Review

- Be constructive and respectful
- Focus on code quality and maintainability
- Approve when satisfied with changes
