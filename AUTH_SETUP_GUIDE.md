# InfinityXZ Authentication Setup Guide

## 1. Overview
This document specifies the credentials and environment variables required to activate the authentication system (Google + Facebook OAuth, and Ghost Portal Redirection).

## 2. Environment Variables Checklist
The following keys must be added to the `.env` file and the Vercel deployment environment.

### 2.1 Core Authentication
Required for `NextAuth.js`.

- [ ] **`NEXTAUTH_URL`**
  - **Value (Production)**: `https://infinityxz.com` (or your Vercel domain)
  - **Value (Local)**: `http://localhost:3000`

- [ ] **`NEXTAUTH_SECRET`**
  - **Generation**: Run `openssl rand -base64 32` in terminal.

---

### 2.2 Google OAuth Provider
Enables "Sign in with Google".

- [ ] **`GOOGLE_CLIENT_ID`**
- [ ] **`GOOGLE_CLIENT_SECRET`**

**Portal:** [Google Cloud Console](https://console.cloud.google.com/)
**Redirect URI:** `https://YOUR_DOMAIN/api/auth/callback/google`

---

### 2.3 Facebook OAuth Provider
Enables "Sign in with Facebook".

- [ ] **`FACEBOOK_CLIENT_ID`**
- [ ] **`FACEBOOK_CLIENT_SECRET`**

**Portal:** [Meta for Developers](https://developers.facebook.com/)
**Redirect URI:** `https://YOUR_DOMAIN/api/auth/callback/facebook`

---

### 2.4 Ghost Login (Email)
We are using **Flow A** (Direct Portal Redirect).
Users clicking "Login with Email" will be redirected to the official Ghost Portal.

- **No API Keys Required** for this flow.
- The redirect URL is hardcoded to: `https://worldtradefactory.ghost.io/#/portal/signin`

---

## 3. Implementation Verification
1.  **Login Page**: Navigate to `/login`. You should see "Continue with Google", "Continue with Facebook", and "Login with Email".
2.  **Email Flow**: Clicking "Login with Email" takes you to `worldtradefactory.ghost.io`.
3.  **OAuth Flow**: Clicking Google/Facebook initiates the pop-up flow.
