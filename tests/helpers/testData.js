// @ts-check
import { randomInt } from 'node:crypto';

export const API_BASE_URL = process.env.E2E_API_BASE_URL || 'http://localhost:5001/api';

/** Unique 10-digit phone number per run (Indian format, starts with 9). */
export function uniquePhone() {
  return `9${String(Date.now()).slice(-7)}${String(randomInt(0, 100)).padStart(2, '0')}`;
}

/** Unique email address per run. */
export function uniqueEmail(prefix = 'e2e') {
  return `${prefix}-${Date.now()}-${randomInt(1000, 9999)}@e2e.test`;
}

/** Unique user name per run. */
export function uniqueName(prefix = 'E2E Rider') {
  return `${prefix} ${Date.now().toString().slice(-7)}`;
}

/**
 * Create a user through the OTP endpoints (no password set).
 * Returns { phone, name, role, token, user }.
 */
export async function createOtpUser(request, { name, phone, role = 'customer' } = {}) {
  const p = phone ?? uniquePhone();
  const n = name ?? uniqueName();

  const sendRes = await request.post(`${API_BASE_URL}/auth/otp/send`, { data: { phone: p } });
  if (!sendRes.ok()) {
    throw new Error(`OTP send failed (${sendRes.status()}): ${await sendRes.text()}`);
  }
  const { otp } = await sendRes.json();

  const verifyRes = await request.post(`${API_BASE_URL}/auth/otp/verify`, {
    data: { phone: p, otp, name: n, role },
  });
  if (!verifyRes.ok()) {
    throw new Error(`OTP verify failed (${verifyRes.status()}): ${await verifyRes.text()}`);
  }
  const body = await verifyRes.json();
  return { phone: p, name: n, role, token: body.token, user: body.user };
}

/**
 * Create a user through the email/password registration endpoint.
 * Returns { phone, email, name, password, role, token, user }.
 */
export async function createPasswordUser(request, {
  name,
  phone,
  email,
  password = 'Secret@123',
  role = 'customer',
} = {}) {
  const data = {
    name: name ?? uniqueName(),
    phone: phone ?? uniquePhone(),
    email: email ?? uniqueEmail(),
    password,
    role,
  };

  const res = await request.post(`${API_BASE_URL}/auth/register`, { data });
  if (!res.ok()) {
    throw new Error(`Registration failed (${res.status()}): ${await res.text()}`);
  }
  const body = await res.json();
  return { ...data, token: body.token, user: body.user };
}
