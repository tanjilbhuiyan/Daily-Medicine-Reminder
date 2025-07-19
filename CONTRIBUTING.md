# Contributing to Medicine Reminder

Thank you for your interest in contributing to Medicine Reminder! This document provides guidelines and information for contributors.

## 🚀 Getting Started

### Prerequisites
- Node.js 22+ 
- npm or yarn
- Git
- Docker (optional, for containerized development)

### Development Setup

1. **Fork and Clone**
   ```bash
   git clone https://github.com/yourusername/med-reminder.git
   cd med-reminder
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Start Development Server**
   ```bash
   npm run dev
   ```

4. **Access the Application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:3001

## 📋 How to Contribute

### Types of Contributions

We welcome various types of contributions:

- 🐛 **Bug Reports**: Help us identify and fix issues
- ✨ **Feature Requests**: Suggest new functionality
- 🔧 **Code Contributions**: Submit bug fixes or new features
- 📚 **Documentation**: Improve or add documentation
- 🎨 **UI/UX Improvements**: Enhance user experience
- 🔒 **Security**: Report vulnerabilities responsibly

### Before You Start

1. **Check Existing Issues**: Look for existing issues or discussions
2. **Create an Issue**: For new features or bugs, create an issue first
3. **Discuss**: Engage with maintainers and community before major changes

## 🔄 Development Workflow

### 1. Create a Branch
```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/issue-description
```

### 2. Make Changes
- Follow the coding standards (see below)
- Write tests for new functionality
- Update documentation as needed

### 3. Test Your Changes
```bash
# Run all tests
npm test

# Test in development
npm run dev

# Test production build
npm run build
npm start
```

### 4. Commit Your Changes
```bash
git add .
git commit -m "feat: add medicine export functionality"
```

### 5. Push and Create PR
```bash
git push origin feature/your-feature-name
```

Then create a Pull Request on GitHub.

## 📝 Coding Standards

### JavaScript/Vue.js

#### Code Style
- Use ES6+ features
- 2 spaces for indentation
- Semicolons required
- Single quotes for strings
- Trailing commas in objects/arrays

#### Vue.js Specific
```vue
<template>
  <!-- Use semantic HTML -->
  <div class="component-name">
    <h2>{{ title }}</h2>
    <button @click="handleClick">Click me</button>
  </div>
</template>

<script>
export default {
  name: 'ComponentName',
  props: {
    title: {
      type: String,
      required: true
    }
  },
  data() {
    return {
      // Component state
    }
  },
  methods: {
    handleClick() {
      // Method implementation
    }
  }
}
</script>
```

#### Backend (Node.js/Express)
```javascript
/**
 * API endpoint documentation
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
app.get('/api/endpoint', validation, (req, res) => {
  try {
    // Implementation
    res.json({ success: true })
  } catch (error) {
    console.error('Error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})
```

### CSS
- Use BEM methodology for class names
- Mobile-first responsive design
- Consistent spacing (8px grid system)
- CSS custom properties for theming

```css
/* Component styles */
.medicine-card {
  padding: 16px;
  border-radius: 8px;
  background-color: var(--card-background);
}

.medicine-card__title {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 8px;
}

.medicine-card--archived {
  opacity: 0.7;
}
```

## 🧪 Testing Guidelines

### Frontend Testing
- Component tests for Vue components
- Integration tests for user workflows
- Accessibility testing

### Backend Testing
- Unit tests for utility functions
- Integration tests for API endpoints
- Security testing for input validation

### Test Structure
```javascript
describe('Medicine API', () => {
  describe('POST /api/medicines', () => {
    it('should create a new medicine with valid data', async () => {
      // Test implementation
    })
    
    it('should reject invalid medicine data', async () => {
      // Test implementation
    })
  })
})
```

## 🔒 Security Guidelines

### Input Validation
- Always validate user inputs
- Sanitize data before processing
- Use parameterized queries for database operations

### Error Handling
- Don't expose internal errors to users
- Log errors for debugging
- Provide helpful error messages

### Dependencies
- Keep dependencies updated
- Review security advisories
- Use `npm audit` regularly

## 📚 Documentation

### Code Documentation
- JSDoc comments for functions
- README updates for new features
- API documentation for endpoints

### Commit Messages
Follow conventional commits format:
```
type(scope): description

feat(api): add medicine export endpoint
fix(ui): resolve calendar navigation bug
docs(readme): update installation instructions
style(css): improve mobile responsiveness
refactor(db): optimize query performance
test(api): add validation tests
chore(deps): update dependencies
```

## 🐛 Bug Reports

### Before Reporting
1. Check existing issues
2. Try to reproduce the bug
3. Test on latest version

### Bug Report Template
```markdown
**Bug Description**
A clear description of the bug.

**Steps to Reproduce**
1. Go to '...'
2. Click on '...'
3. See error

**Expected Behavior**
What you expected to happen.

**Screenshots**
If applicable, add screenshots.

**Environment**
- OS: [e.g. Windows 10]
- Browser: [e.g. Chrome 91]
- Version: [e.g. 1.0.0]
```

## ✨ Feature Requests

### Feature Request Template
```markdown
**Feature Description**
A clear description of the feature.

**Problem Statement**
What problem does this solve?

**Proposed Solution**
How should this feature work?

**Alternatives Considered**
Other solutions you've considered.

**Additional Context**
Any other context or screenshots.
```

## 🎯 Pull Request Guidelines

### PR Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Tests added/updated
- [ ] Documentation updated
- [ ] No breaking changes (or clearly documented)
- [ ] Security considerations addressed

### PR Template
```markdown
## Description
Brief description of changes.

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Manual testing completed

## Screenshots (if applicable)
Add screenshots of UI changes.
```

## 🏆 Recognition

Contributors will be recognized in:
- README.md contributors section
- Release notes
- GitHub contributors page

## 📞 Getting Help

- **GitHub Issues**: For bugs and feature requests
- **Discussions**: For questions and general discussion
- **Email**: For security issues (security@yourproject.com)

## 📄 License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing to Medicine Reminder! 🎉