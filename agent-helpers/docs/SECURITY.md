# Security Documentation

This document outlines the security measures implemented in the application.

## Input Sanitization

### SQL Injection Prevention
- **Prisma ORM**: All database queries use Prisma, which uses parameterized queries to prevent SQL injection
- **No Raw SQL**: The codebase policy explicitly prohibits raw SQL queries
- **Zod Validation**: All tRPC inputs are validated using Zod schemas before processing

### XSS Prevention
- **React Escaping**: React automatically escapes all content rendered in JSX, preventing XSS attacks
- **No dangerouslySetInnerHTML**: The codebase does not use `dangerouslySetInnerHTML` for user-generated content
- **Input Sanitization**: Security utilities in `src/lib/utils/security.ts` provide additional sanitization functions

### File Upload Security
- **File Type Validation**: Only JPEG, PNG, and WebP images are allowed
- **File Size Limits**: Maximum 10MB for product images, 20MB for generated images
- **Filename Sanitization**: Filenames are sanitized to prevent directory traversal attacks
- **Content Validation**: File content is validated before upload

## Authentication Security

### Session Management
- **NextAuth**: Uses NextAuth with database sessions (strategy: "database")
- **Session Expiration**: Sessions expire based on NextAuth configuration
- **Secure Cookies**: NextAuth handles secure cookie configuration
- **CSRF Protection**: NextAuth automatically provides CSRF protection

### Authentication Flow
- **Email Magic Links**: Uses email-based magic link authentication (no passwords stored)
- **Session Verification**: All protected routes verify session via `protectedProcedure` middleware
- **Middleware Protection**: Routes are protected via Next.js middleware

## Authorization Checks

### User Ownership Verification
All tRPC procedures that access user data verify ownership:

1. **Project Router**: All queries filter by `userId` from session
2. **Brand Kit Router**: All queries filter by `userId` from session
3. **Image Router**: Verifies project belongs to user before accessing images
4. **A+ Content Router**: Verifies project belongs to user before accessing A+ content
5. **Export Router**: Verifies project belongs to user before exporting
6. **Subscription Router**: All queries filter by `userId` from session

### Protected Procedures
- All user-facing operations use `protectedProcedure` which requires authentication
- Public procedures are only used for non-sensitive operations

## Rate Limiting

### Implementation
- **Upload Endpoint**: 20 uploads per minute per user
- **Rate Limit Middleware**: Located in `src/lib/middleware/rateLimit.ts`
- **In-Memory Storage**: Currently uses in-memory Map (consider Redis for production)

### Rate Limit Headers
Responses include standard rate limit headers:
- `X-RateLimit-Limit`: Maximum requests allowed
- `X-RateLimit-Remaining`: Remaining requests in window
- `X-RateLimit-Reset`: Unix timestamp when limit resets

### Per-Tier Limits (Planned)
- FREE: 10 requests/minute, 100/hour
- STARTER: 30 requests/minute, 1000/hour
- PROFESSIONAL: 60 requests/minute, 5000/hour
- AGENCY: 200 requests/minute, 50000/hour

## Data Privacy

### User Data Isolation
- All database queries filter by `userId` to ensure users only see their own data
- RLS (Row Level Security) policies should be enabled in Supabase (see setup tasks)
- Storage policies restrict file access to user's own folders

### Data Encryption
- **At Rest**: Supabase handles database encryption at rest
- **In Transit**: All connections use HTTPS/TLS
- **Sensitive Data**: No sensitive data is logged or exposed in error messages

### PII Handling
- Email addresses are stored but not exposed to other users
- User IDs are used for internal operations only
- No personal information is shared between users

## API Security

### tRPC Security
- **Type Safety**: TypeScript and Zod provide compile-time and runtime type safety
- **Input Validation**: All inputs validated via Zod schemas
- **Error Handling**: Errors don't expose sensitive information

### API Route Security
- **Authentication Required**: All API routes check for valid session
- **CORS**: Configured appropriately for production
- **Headers**: Security headers should be configured in production (via Next.js config)

## Storage Security

### Supabase Storage
- **Public Buckets**: Product images, generated images, brand kits (public read, user-scoped write)
- **Private Buckets**: Exports (require signed URLs)
- **Path Structure**: Files organized by userId to prevent cross-user access
- **Storage Policies**: RLS policies restrict access (see Supabase setup tasks)

## Security Best Practices

### Code Practices
1. ✅ All user inputs validated with Zod
2. ✅ All database queries use Prisma (parameterized)
3. ✅ All user-facing operations require authentication
4. ✅ All data access verifies user ownership
5. ✅ File uploads validated for type and size
6. ✅ Filenames sanitized before storage

### Production Recommendations
1. ⚠️ Implement Redis-based rate limiting for distributed systems
2. ⚠️ Enable Supabase RLS policies on all tables
3. ⚠️ Configure security headers (CSP, HSTS, etc.)
4. ⚠️ Set up error tracking (Sentry) without exposing sensitive data
5. ⚠️ Regular security audits
6. ⚠️ Implement API key rotation for external services
7. ⚠️ Set up monitoring and alerting for suspicious activity

## Security Checklist

- [x] SQL injection prevention (Prisma)
- [x] XSS prevention (React escaping)
- [x] Input validation (Zod)
- [x] File upload validation
- [x] Authentication required for protected routes
- [x] User ownership verification
- [x] Rate limiting on upload endpoint
- [x] Filename sanitization
- [ ] RLS policies enabled (requires Supabase setup)
- [ ] Security headers configured (production)
- [ ] Error tracking configured (production)
- [ ] Regular security audits scheduled

