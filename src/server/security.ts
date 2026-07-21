import { randomBytes, scrypt as scryptCallback, timingSafeEqual, createHash } from 'crypto';
import { promisify } from 'util';
import type { NextFunction, Request, Response } from 'express';
import type { PrismaClient } from '@prisma/client';

const scrypt = promisify(scryptCallback);
const SESSION_COOKIE = 'rattib_session';
const SESSION_TTL_MS = 1000 * 60 * 60 * 12;

export type AuthContext = {
  userId: string;
  workspaceId: string;
  role: string;
  fullName: string;
};

export type Permission =
  | 'client.write'
  | 'client.sensitive.read'
  | 'transaction.write'
  | 'template.write'
  | 'task.write'
  | 'finance.write'
  | 'document.write'
  | 'document.read'
  | 'audit.read'
  | 'user.manage'
  | 'workspace.manage';

const ROLE_PERMISSIONS: Record<string, ReadonlySet<Permission>> = {
  owner: new Set<Permission>(['client.write', 'client.sensitive.read', 'transaction.write', 'template.write', 'task.write', 'finance.write', 'document.write', 'document.read', 'audit.read', 'user.manage', 'workspace.manage']),
  admin: new Set<Permission>(['client.write', 'client.sensitive.read', 'transaction.write', 'template.write', 'task.write', 'finance.write', 'document.write', 'document.read', 'audit.read', 'user.manage']),
  employee: new Set<Permission>(['client.write', 'transaction.write', 'task.write', 'document.write', 'document.read']),
  accountant: new Set<Permission>(['finance.write']),
  viewer: new Set<Permission>(['document.read']),
};

declare global {
  namespace Express {
    interface Request {
      auth?: AuthContext;
    }
  }
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString('hex');
  const derived = (await scrypt(password, salt, 64)) as Buffer;
  return `scrypt:${salt}:${derived.toString('hex')}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [algorithm, salt, expectedHex] = stored.split(':');
  if (algorithm !== 'scrypt' || !salt || !expectedHex) return false;
  const expected = Buffer.from(expectedHex, 'hex');
  const actual = (await scrypt(password, salt, expected.length)) as Buffer;
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

export function tokenHash(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export async function createSession(prisma: PrismaClient, userId: string, workspaceId: string) {
  const token = randomBytes(32).toString('base64url');
  await prisma.session.create({
    data: {
      tokenHash: tokenHash(token),
      userId,
      workspaceId,
      expiresAt: new Date(Date.now() + SESSION_TTL_MS),
    },
  });
  return token;
}

export function setSessionCookie(res: Response, token: string) {
  res.cookie(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production',
    maxAge: SESSION_TTL_MS,
    path: '/',
  });
}

export function clearSessionCookie(res: Response) {
  res.clearCookie(SESSION_COOKIE, { httpOnly: true, sameSite: 'strict', path: '/' });
}

export function authenticate(prisma: PrismaClient) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const token = req.cookies?.[SESSION_COOKIE];
    if (!token) return res.status(401).json({ error: 'Authentication required' });

    const session = await prisma.session.findUnique({
      where: { tokenHash: tokenHash(token) },
      include: { user: true, workspace: true },
    });
    if (!session || session.expiresAt <= new Date() || !session.user.isActive || !session.workspace.isActive) {
      clearSessionCookie(res);
      return res.status(401).json({ error: 'Session expired' });
    }

    req.auth = {
      userId: session.userId,
      workspaceId: session.workspaceId,
      role: session.user.role,
      fullName: session.user.fullName,
    };
    void prisma.session.update({ where: { id: session.id }, data: { lastUsedAt: new Date() } });
    next();
  };
}

export function requireRoles(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.auth || !roles.includes(req.auth.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  };
}

export function requirePermission(permission: Permission) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.auth || !ROLE_PERMISSIONS[req.auth.role]?.has(permission)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  };
}
