# API Reference

## Overview

- Base URL prefix: `/api`
- Main controller prefix: `/auth`
- Full auth route base: `/api/auth`
- Response envelope: success and error responses are standardized.
- Global auth behavior: all routes are protected by the JWT guard unless marked with `@Public()`.

## Cross-Cutting Rules

### Authentication

- Protected endpoints require `Authorization: Bearer <access_token>`.
- Protected endpoints also reject access tokens whose `jti` was blacklisted before their natural expiration.
- Public endpoints bypass the global JWT guard through the `@Public()` decorator.
- Refresh token flows use the `refresh_token` httpOnly cookie instead of a request body payload.

### Validation

- Validation is enforced globally with whitelist mode enabled.
- Unknown fields are rejected.
- DTO transformation is enabled.
- Validation failures use the shared error envelope.

### Cookie Behavior

- Cookie name: `refresh_token`
- Cookie type: httpOnly
- SameSite: `lax`
- Path: `/auth`
- Domain: `COOKIE_DOMAIN` or `localhost`
- Secure: `COOKIE_SECURE === 'true'`

### Response Envelope

Success shape:

```json
{
  "success": true,
  "data": {}
}
```

Error shape:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable message",
    "details": {
      "validation": ["Validation message"]
    }
  }
}
```

## Public Endpoints

### POST /api/auth/register

Creates a new user account, issues an access token, and sets a refresh token cookie.

Request body:

```json
{
  "firstName": "Lautaro",
  "lastName": "Example",
  "email": "lautaro@example.com",
  "password": "StrongPass123",
  "birthDate": "1998-06-14",
  "termsAccepted": true
}
```

Field rules:

- `firstName`: required string, minimum length `1`
- `lastName`: required string, minimum length `1`
- `email`: required valid email
- `password`: required string, minimum length `8`
- `birthDate`: required ISO date string
- `termsAccepted`: required boolean

Success response:

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "firstName": "Lautaro",
      "lastName": "Example",
      "email": "lautaro@example.com"
    },
    "accessToken": "jwt",
    "accessTokenExpiresAt": "2026-04-05T21:00:00.000Z"
  }
}
```

Side effects:

- Sets the `refresh_token` cookie.

### POST /api/auth/login

Authenticates a user, issues an access token, and sets a refresh token cookie.

Request body:

```json
{
  "email": "lautaro@example.com",
  "password": "StrongPass123"
}
```

Field rules:

- `email`: required valid email
- `password`: required string, minimum length `1`

Success response:

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "firstName": "Lautaro",
      "lastName": "Example",
      "email": "lautaro@example.com"
    },
    "accessToken": "jwt",
    "accessTokenExpiresAt": "2026-04-05T21:00:00.000Z"
  }
}
```

Side effects:

- Sets the `refresh_token` cookie.

### POST /api/auth/refresh

Rotates the refresh token and returns a new access token.

Request body:

```json
{}
```

Required cookie:

- `refresh_token`

Success response:

```json
{
  "success": true,
  "data": {
    "accessToken": "jwt",
    "accessTokenExpiresAt": "2026-04-05T21:00:00.000Z"
  }
}
```

Failure case when the cookie is missing:

```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "No refresh token provided"
  }
}
```

Side effects:

- Replaces the existing `refresh_token` cookie with a new one.

### POST /api/auth/logout

Requires a valid bearer access token, blacklists that access token until its original expiration time, revokes the refresh token if present, and clears the refresh token cookie.

Request body:

```json
{}
```

Required header:

- `Authorization: Bearer <access_token>`

Optional cookie:

- `refresh_token`

Success response:

```json
{
  "success": true,
  "data": {
    "loggedOut": true
  }
}
```

Side effects:

- Stores the access token `jti` in Redis with TTL until the JWT expires.
- Clears the `refresh_token` cookie.

### POST /api/auth/forgot-password

Starts the password reset flow.

Request body:

```json
{
  "email": "lautaro@example.com"
}
```

Field rules:

- `email`: required valid email

Success response:

```json
{
  "success": true,
  "data": {
    "submitted": true
  }
}
```

Notes:

- This endpoint is public.
- The implementation is designed to return success without exposing whether the email exists.

### POST /api/auth/reset-password

Consumes a password reset token and updates the user password.

Request body:

```json
{
  "token": "reset-token-from-email",
  "password": "NewStrongPass123"
}
```

Field rules:

- `token`: required string, minimum length `1`
- `password`: required string, minimum length `8`

Success response:

```json
{
  "success": true,
  "data": {
    "passwordUpdated": true
  }
}
```

## Protected Endpoints

### GET /api/auth/verify

Verifies that the access token is valid and returns the authenticated user.

Headers:

```http
Authorization: Bearer <access_token>
```

Success response:

```json
{
  "success": true,
  "data": {
    "valid": true,
    "user": {
      "id": "uuid",
      "firstName": "Lautaro",
      "lastName": "Example",
      "email": "lautaro@example.com"
    }
  }
}
```

Notes:

- The JWT is extracted from the bearer token header.
- The strategy checks that the user still exists and is active.

### GET /api/auth/me

Returns the authenticated user profile.

Headers:

```http
Authorization: Bearer <access_token>
```

Success response:

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "firstName": "Lautaro",
      "lastName": "Example",
      "email": "lautaro@example.com"
    }
  }
}
```

## Auth-Related Data Shapes

### AuthUser

```json
{
  "id": "uuid",
  "firstName": "Lautaro",
  "lastName": "Example",
  "email": "lautaro@example.com"
}
```

### AuthTokens

```json
{
  "accessToken": "jwt",
  "accessTokenExpiresAt": "2026-04-05T21:00:00.000Z"
}
```

## Environment-Driven Auth Settings

- `JWT_ACCESS_SECRET`
- `JWT_ACCESS_EXPIRES_IN`, default `15m`
- `JWT_REFRESH_SECRET`
- `JWT_REFRESH_EXPIRES_IN`, default `7d`
- `PASSWORD_RESET_SECRET`
- `PASSWORD_RESET_EXPIRES_IN`, default `1h`
- `COOKIE_DOMAIN`, default `localhost`
- `COOKIE_SECURE`, interpreted as boolean through string comparison with `true`
- `THROTTLE_TTL`, default `60`
- `THROTTLE_LIMIT`, default `10`

## Current Scope Note

This reference documents the currently exposed HTTP endpoints found in the auth controller. If new controllers are added later, this file should be extended instead of repurposed.