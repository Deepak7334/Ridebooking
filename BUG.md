# BUG.md — Defects found during QA of Login & Signup

**Discovered by:** Playwright auth test suite (`tests/login/*`, `tests/signup/*`)
**Date:** 2026-11-11
**Environment:** backend :5001 (`backend/`), frontend :3000 (`frontend/`), MongoDB, Chromium via Playwright

Reproduce any of these locally with:

```bash
npx playwright test --project=chromium
```

---

## AUTH-001 — Auth token is wiped from localStorage on every page load

**Severity:** High
**Component:** `frontend/src/context/AuthContext.js`
**Related test:** `tests/login/LO-08-session-persists-after-reload.spec.js`

### Description
On every page load, `AuthProvider.checkAuthStatus()` removes the auth token from `localStorage`, destroying the user's session. The user appears logged in only until the next navigation/refresh, after which they are bounced back to `/login`.

### Root cause
`AuthContext.js:20` calls `AUTH_ENDPOINTS.LOGIN` (`/auth/login`) with **GET**:

```js
// frontend/src/context/AuthContext.js:17-28
const token = localStorage.getItem('authToken');
if (token) {
  try {
    const response = await axiosInstance.get(AUTH_ENDPOINTS.LOGIN); // GET /auth/login
    setUser(response.data.user);
  } catch (err) {
    localStorage.removeItem('authToken');   // <-- wipes the session
    setUser(null);
  }
}
```

- `GET /api/auth/login` has no route handler (`backend/routes/auth.routes.js` only registers `router.post('/login')`), so the request returns **404**.
- The intended endpoint is `AUTH_ENDPOINTS.ME` (`/auth/me`), which exists and requires auth.

### Impact
- Sessions do not survive a page reload (token removed ~immediately after mount).
- Any authenticated request made after page load fails with 401, because the `Authorization` header is no longer attached (`frontend/src/api/axios.js:16`).
- The defect also makes all tests that assert token persistence racy.

### Steps to reproduce
1. Log in (any flow) and confirm `authToken` exists in localStorage.
2. Reload the page (or navigate to any protected route fresh).
3. Within ~1s, `localStorage.authToken` is removed. Reloading again redirects to `/login`.

### Expected
The app should call `GET /api/auth/me` with the Bearer token and keep the session intact across reloads.

### Suggested fix
```js
const response = await axiosInstance.get(AUTH_ENDPOINTS.ME);
```

---

## AUTH-002 — 401 interceptor redirects to /login, hiding all credential/OTP error messages

**Severity:** Medium
**Component:** `frontend/src/api/axios.js`
**Related tests:** `LO-03`, `LO-04`, `LO-05`, `LO-09`, `SU-07`

### Description
Wrong password, wrong OTP, or any other 401 response triggers a full-page redirect to `/login` instead of letting the page display its error banner. The messages "Invalid credentials" and "Invalid OTP" are never visible to the user. During signup, a wrong OTP additionally **bounces the user out of the signup flow entirely**.

### Root cause
```js
// frontend/src/api/axios.js:28-37
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('authToken');
      window.location.href = '/login';   // <-- full reload, error state lost
    }
    return Promise.reject(error);
  }
);
```

`window.location.href = '/login'` performs a full page load, which remounts `Login.jsx`/`Signup.jsx` and clears their error state. It also removes the token even when the 401 comes from an unauthenticated flow (e.g. login attempt, OTP verify) where there was nothing to invalidate.

### Impact
- Users get no feedback for invalid credentials/OTP; they just "stay on" or are bounced to the login page.
- A wrong OTP during signup drops the user back to `/login` mid-registration.

### Steps to reproduce
1. Go to `/login` → Email tab, enter any email + wrong password → Login.
2. Observe: page flashes and reloads; no "Invalid credentials" message is ever shown.

### Expected
401s from auth endpoints (`/auth/login`, `/auth/otp/verify`) should surface the server's error message on the page. The global redirect should apply only to 401s on **authenticated** API calls (expired/invalid token on e.g. `/rides/*`).

### Suggested fix
Only redirect when a token was actually attached to the failed request (i.e. session expiry), or exclude the auth endpoints from the interceptor; let the caller handle and display the error.

---

## AUTH-003 — Optional email sent as empty string breaks signup with duplicate-key 500

**Severity:** High
**Component:** `frontend/src/pages/Auth/Signup.jsx` + `backend/routes/auth.routes.js`
**Related test:** `tests/signup/SU-04-signup-password-mode-happy-path.spec.js`

### Description
When the optional email field is left empty on signup (password mode), the UI sends `email: ""`. The first such user is created successfully, but **every subsequent signup with an empty email fails with a 500 "Server error"**, because the unique sparse index on `email` treats `""` as a value and collides.

### Evidence (reproduced against the running API)

```bash
# First registration with empty email (already existing '' user in DB → 500)
curl -X POST http://localhost:5001/api/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"name":"Empty Email B","phone":"9111110004","password":"Secret@123","email":""}'

# → 500
# {"message":"Server error","error":"E11000 duplicate key error collection: Rapido.users index: email_1 dup key: { email: \"\" }"}
```

### Root cause
- `Signup.jsx` initialises the form with `email: ''` and posts the whole form object, so an untouched optional field is sent as an empty string.
- `backend/routes/auth.routes.js:111-114` only checks duplicates `if (email)` — an empty string skips the check — but `User.create()` still stores `email: ""`.
- The `User` model declares `email: { unique: true, sparse: true }`; `sparse` only excludes `undefined`/missing fields, **not** `""`.

### Impact
Registration with the optional email left blank effectively works only once; afterwards it fails for all users with a generic "Server error". This also affects driver signup (SU-03) since the same form is used.

### Steps to reproduce
1. Ensure one user with an empty-string email exists (e.g. sign up once leaving email blank).
2. Sign up again on `/signup` (password mode) with a new phone, leaving the email empty.
3. Error banner: "⚠️ Server error".

### Expected
An empty optional email should be treated as "no email" — either the frontend omits the field when blank, or the backend normalises `""` to `undefined` before creating the user.

### Suggested fix
Frontend: `email: form.email.trim() || undefined`.
Backend (defence in depth): `const cleanEmail = email && email.trim() ? email.toLowerCase().trim() : undefined;`

---

## AUTH-004 — Driver signup via OTP silently discards vehicle information

**Severity:** Medium
**Component:** `frontend/src/pages/Auth/Signup.jsx`, `backend/routes/auth.routes.js`
**Related test:** `tests/signup/SU-02-driver-signup-otp.spec.js`

### Description
When a user selects the Driver role, the "Vehicle Information" section (type + number) is displayed **even in OTP registration mode**. The user fills it in, but the OTP path never sends it: the driver account is created with `vehicleType: null` and `vehicleNumber: null`.

### Root cause
- `Signup.jsx:35` — OTP verify posts only `{ phone, otp, name, role }`; `vehicleType`/`vehicleNumber` are omitted.
- `backend/routes/auth/routes.js` `/otp/verify` creates the user with `{ phone, name, role }` only.
- Contrast with `/auth/register` (password mode), which stores `vehicleType`/`vehicleNumber` for drivers (works — covered by SU-03).

### Impact
Drivers who register via OTP (the default, "recommended" mode) have no vehicle data. Downstream ride-assignment logic that filters drivers by vehicle type will never match them, and the driver has no way to know data was dropped — the UI implied it was collected.

### Steps to reproduce
1. `/signup` → select Driver → fill name/phone and the vehicle fields → Send OTP → verify.
2. Land on `/driver`. Inspect the stored user (localStorage `user.vehicleType`): it is `null`.

### Expected
Either collect and persist vehicle data through the OTP flow (extend `/otp/verify` payload and handler), or hide the vehicle section until the OTP step is completed / in password mode only, and collect it in a follow-up step.

---

## Summary

| ID | Severity | Area | One-liner |
|---|---|---|---|
| AUTH-001 | High | Frontend auth | Token wiped from localStorage on every page load (`GET /auth/login` instead of `/auth/me`) |
| AUTH-002 | Medium | Frontend auth | 401 interceptor full-page redirect hides "Invalid credentials"/"Invalid OTP" messages |
| AUTH-003 | High | Frontend + backend | Empty optional email sent as `""` → E11000 duplicate-key 500 for every signup after the first |
| AUTH-004 | Medium | Frontend + backend | Driver OTP signup shows vehicle fields but never persists them |

Note: tests `SU-02`, `SU-04` and `LO-08` currently assert the **defective** behaviour on purpose so the suite stays green while these are open. Once a defect is fixed, the corresponding test will start failing and must be rewritten to assert the corrected behaviour (comments in each spec file describe the expected rewrite).
