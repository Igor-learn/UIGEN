import { test, expect, vi, beforeEach, afterEach } from "vitest";
import { createSession } from "../auth";

vi.mock("server-only", () => ({}));

const mockCookieStore = {
  set: vi.fn(),
  get: vi.fn(),
  delete: vi.fn(),
};

vi.mock("next/headers", () => ({
  cookies: vi.fn(() => Promise.resolve(mockCookieStore)),
}));

const mockSign = vi.fn();

vi.mock("jose", () => ({
  SignJWT: vi.fn(() => ({
    setProtectedHeader: vi.fn().mockReturnThis(),
    setExpirationTime: vi.fn().mockReturnThis(),
    setIssuedAt: vi.fn().mockReturnThis(),
    sign: mockSign,
  })),
  jwtVerify: vi.fn(),
}));

beforeEach(() => {
  vi.clearAllMocks();
  process.env.JWT_SECRET = "test-secret-key";
  process.env.NODE_ENV = "test";
});

afterEach(() => {
  delete process.env.JWT_SECRET;
  delete process.env.NODE_ENV;
});

test("createSession creates a JWT token and sets a cookie", async () => {
  const userId = "user-123";
  const email = "test@example.com";
  const mockToken = "mock-jwt-token";

  mockSign.mockResolvedValue(mockToken);

  await createSession(userId, email);

  expect(mockSign).toHaveBeenCalled();

  expect(mockCookieStore.set).toHaveBeenCalledWith(
    "auth-token",
    mockToken,
    expect.objectContaining({
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      path: "/",
      expires: expect.any(Date),
    })
  );
});

test("createSession sets secure cookie in production", async () => {
  process.env.NODE_ENV = "production";
  const mockToken = "mock-jwt-token";
  mockSign.mockResolvedValue(mockToken);

  await createSession("user-123", "test@example.com");

  expect(mockCookieStore.set).toHaveBeenCalledWith(
    "auth-token",
    mockToken,
    expect.objectContaining({
      secure: true,
    })
  );
});

test("createSession sets cookie expiration to 7 days", async () => {
  const mockToken = "mock-jwt-token";
  mockSign.mockResolvedValue(mockToken);

  const beforeCall = Date.now();
  await createSession("user-123", "test@example.com");
  const afterCall = Date.now();

  const setCalls = mockCookieStore.set.mock.calls;
  expect(setCalls.length).toBeGreaterThan(0);

  const cookieOptions = setCalls[0][2];
  const expiresDate = cookieOptions.expires as Date;

  const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
  const expectedMin = beforeCall + sevenDaysMs;
  const expectedMax = afterCall + sevenDaysMs;

  expect(expiresDate.getTime()).toBeGreaterThanOrEqual(expectedMin);
  expect(expiresDate.getTime()).toBeLessThanOrEqual(expectedMax);
});

test("createSession includes correct session data in JWT", async () => {
  const userId = "user-789";
  const email = "data@example.com";
  const mockToken = "mock-jwt-token";

  mockSign.mockResolvedValue(mockToken);

  const { SignJWT } = await import("jose");
  const mockSignJWT = SignJWT as any;

  await createSession(userId, email);

  const signJWTCalls = mockSignJWT.mock.calls;
  expect(signJWTCalls.length).toBeGreaterThan(0);

  const sessionData = signJWTCalls[signJWTCalls.length - 1][0];
  expect(sessionData.userId).toBe(userId);
  expect(sessionData.email).toBe(email);
  expect(sessionData.expiresAt).toBeInstanceOf(Date);
});

test("createSession uses custom JWT secret from environment", async () => {
  process.env.JWT_SECRET = "custom-secret-key";
  const mockToken = "mock-jwt-token";
  mockSign.mockResolvedValue(mockToken);

  await createSession("user-123", "test@example.com");

  expect(mockSign).toHaveBeenCalled();
});

test("createSession uses default JWT secret when not set", async () => {
  delete process.env.JWT_SECRET;
  const mockToken = "mock-jwt-token";
  mockSign.mockResolvedValue(mockToken);

  await createSession("user-123", "test@example.com");

  expect(mockSign).toHaveBeenCalled();
});

test("createSession sets httpOnly flag to true", async () => {
  const mockToken = "mock-jwt-token";
  mockSign.mockResolvedValue(mockToken);

  await createSession("user-123", "test@example.com");

  expect(mockCookieStore.set).toHaveBeenCalledWith(
    "auth-token",
    mockToken,
    expect.objectContaining({
      httpOnly: true,
    })
  );
});

test("createSession sets sameSite to lax", async () => {
  const mockToken = "mock-jwt-token";
  mockSign.mockResolvedValue(mockToken);

  await createSession("user-123", "test@example.com");

  expect(mockCookieStore.set).toHaveBeenCalledWith(
    "auth-token",
    mockToken,
    expect.objectContaining({
      sameSite: "lax",
    })
  );
});

test("createSession sets cookie path to root", async () => {
  const mockToken = "mock-jwt-token";
  mockSign.mockResolvedValue(mockToken);

  await createSession("user-123", "test@example.com");

  expect(mockCookieStore.set).toHaveBeenCalledWith(
    "auth-token",
    mockToken,
    expect.objectContaining({
      path: "/",
    })
  );
});
