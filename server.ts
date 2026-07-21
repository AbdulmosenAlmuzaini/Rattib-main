import 'dotenv/config';
import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { PrismaClient } from '@prisma/client';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';
import { z } from 'zod';
import multer from 'multer';
import { randomUUID } from 'crypto';
import {
  authenticate,
  clearSessionCookie,
  createSession,
  hashPassword,
  requirePermission,
  setSessionCookie,
  tokenHash,
  verifyPassword,
} from './src/server/security';
import {
  checksumSha256,
  createStorageKey,
  deleteDocumentObject,
  ensureStorageBucket,
  getDocument,
  putDocument,
  storageEnabled,
} from './src/server/storage';
import { startNotificationScheduler } from './src/server/notifications';
import { 
  initialWorkspaces, 
  initialUsers, 
  initialCategories, 
  initialServiceTemplates, 
  initialClients, 
  initialAllTransactions, 
  initialDocuments, 
  initialTasks, 
  initialPayments, 
  initialExpenses, 
  initialNotifications, 
  initialActivityLogs, 
  initialAuditLogs 
} from './src/seedData';

const prisma = new PrismaClient();
const app = express();
const PORT = Number(process.env.PORT || 3000);
if (process.env.NODE_ENV === 'production') app.set('trust proxy', 1);
const documentUpload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024, files: 1 } });
const acceptDocumentUpload = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  documentUpload.single('file')(req, res, error => {
    if (error) return res.status(400).json({ error: error instanceof multer.MulterError && error.code === 'LIMIT_FILE_SIZE' ? 'File exceeds the 5 MB limit' : 'Invalid file upload' });
    next();
  });
};

app.use(express.json({ limit: '1mb', strict: true }));
app.disable('x-powered-by');
app.use(helmet({
  contentSecurityPolicy: process.env.NODE_ENV === 'production' ? {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      fontSrc: ["'self'", 'data:'],
      connectSrc: ["'self'"],
      objectSrc: ["'none'"],
      frameAncestors: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
    },
  } : false,
}));
app.use(cookieParser());
app.use((req, res, next) => {
  const requestId = req.get('x-request-id')?.slice(0, 100) || randomUUID();
  const started = process.hrtime.bigint();
  res.setHeader('x-request-id', requestId);
  res.on('finish', () => {
    if (process.env.NODE_ENV !== 'production') return;
    const durationMs = Number(process.hrtime.bigint() - started) / 1_000_000;
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      level: res.statusCode >= 500 ? 'error' : 'info',
      type: 'http_request',
      requestId,
      method: req.method,
      path: req.path,
      status: res.statusCode,
      durationMs: Number(durationMs.toFixed(1)),
      ip: req.ip,
    }));
  });
  next();
});
app.use('/api', rateLimit({ windowMs: 60_000, limit: 180, standardHeaders: true, legacyHeaders: false }));
app.use('/api', (req, res, next) => {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();
  const origin = req.get('origin');
  if (!origin) return next();
  try {
    if (new URL(origin).host !== req.get('host')) return res.status(403).json({ error: 'Cross-site request rejected' });
  } catch {
    return res.status(403).json({ error: 'Invalid request origin' });
  }
  next();
});

app.get('/healthz', (_req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  res.json({ status: 'ok' });
});

app.get('/readyz', async (_req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: 'ready', database: 'ok', storageConfigured: storageEnabled });
  } catch (error) {
    console.error('Readiness check failed', error);
    res.status(503).json({ status: 'not_ready', database: 'unavailable' });
  }
});

const loginSchema = z.object({
  email: z.string().email().max(254).transform(value => value.trim().toLowerCase()),
  password: z.string().min(10).max(128),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(10).max(128),
  newPassword: z.string().min(14).max(128)
    .regex(/[a-z]/, 'Password must include a lowercase letter')
    .regex(/[A-Z]/, 'Password must include an uppercase letter')
    .regex(/[0-9]/, 'Password must include a number')
    .regex(/[^A-Za-z0-9]/, 'Password must include a symbol'),
});

const idSchema = z.string().trim().min(1).max(100);
const optionalText = (max: number) => z.string().trim().max(max).nullish();
const moneySchema = z.coerce.number().finite().min(0).max(100_000_000);
const dateSchema = z.string().trim().regex(/^\d{4}-\d{2}-\d{2}(?:T.*)?$/, 'Invalid date');

const clientSchema = z.object({
  id: idSchema,
  fullName: z.string().trim().min(2).max(200),
  clientType: z.enum(['individual', 'company']).default('individual'),
  phone: z.string().trim().min(7).max(20),
  email: z.string().trim().email().max(254).nullish().or(z.literal('')),
  city: optionalText(100),
  nationalId: optionalText(30),
  residenceId: optionalText(30),
  commercialRegister: optionalText(30),
  commercialRegistration: optionalText(30),
  companyName: optionalText(200),
  nationality: optionalText(100),
  notes: optionalText(4000),
  status: z.enum(['active', 'archived']).default('active'),
  createdAt: z.string().datetime().optional(),
}).passthrough();

const transactionSchema = z.object({
  id: idSchema,
  referenceNumber: z.string().trim().min(1).max(100).optional(),
  title: z.string().trim().min(2).max(250),
  clientId: idSchema,
  serviceTemplateId: idSchema.nullish(),
  description: optionalText(4000),
  assignedUserId: idSchema.nullish(),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).default('normal'),
  status: z.enum(['new', 'waiting_docs', 'ready', 'in_progress', 'needs_review', 'pending', 'completed', 'cancelled']).default('new'),
  receivedDate: dateSchema,
  expectedCompletionDate: dateSchema.nullish(),
  nextFollowUpDate: dateSchema.nullish(),
  completedDate: dateSchema.nullish(),
  serviceFee: moneySchema.default(0),
  governmentFee: moneySchema.default(0),
  extraExpenses: moneySchema.default(0),
  totalAmount: moneySchema.default(0),
  receivedAmount: moneySchema.default(0),
  remainingAmount: moneySchema.default(0),
  paymentStatus: z.enum(['unpaid', 'partially_paid', 'fully_paid', 'refunded']).default('unpaid'),
  internalNotes: optionalText(8000),
  sharedNotes: optionalText(8000),
  checklist: z.array(z.unknown()).default([]),
}).passthrough();

const taskSchema = z.object({
  id: idSchema,
  title: z.string().trim().min(2).max(250),
  description: optionalText(4000),
  transactionId: idSchema.nullish(),
  clientId: idSchema.nullish(),
  assignedUserId: idSchema.nullish(),
  startDate: dateSchema.nullish(),
  dueDate: dateSchema,
  priority: z.enum(['low', 'normal', 'high']).default('normal'),
  status: z.string().trim().min(1).max(50).default('pending'),
  isCompleted: z.boolean().default(false),
  taskType: z.string().trim().min(1).max(50).default('general'),
  createdAt: z.string().datetime().optional(),
}).passthrough();

const paymentSchema = z.object({
  id: idSchema,
  transactionId: idSchema,
  clientId: idSchema,
  amount: moneySchema.positive(),
  paymentDate: dateSchema,
  paymentMethod: z.enum(['cash', 'bank_transfer', 'card', 'network', 'other']).default('cash'),
  referenceNumber: optionalText(100),
  notes: optionalText(4000),
  status: z.enum(['received', 'pending']).default('received'),
  createdAt: z.string().datetime().optional(),
}).passthrough();

const expenseSchema = z.object({
  id: idSchema,
  title: z.string().trim().min(2).max(250),
  amount: moneySchema.positive(),
  expenseDate: dateSchema,
  category: z.string().trim().min(1).max(100),
  transactionId: idSchema.nullish(),
}).passthrough();

const documentSchema = z.object({
  id: idSchema,
  clientId: idSchema.nullish(),
  transactionId: idSchema.nullish(),
  documentType: z.enum(['national_id', 'residence_id', 'passport', 'cr', 'license', 'authorization', 'contract', 'receipt', 'invoice', 'letter', 'other']).default('other'),
  fileName: z.string().trim().min(1).max(255).refine(name => !/[\\/:*?"<>|]/.test(name), 'Invalid file name'),
  fileSize: z.coerce.number().finite().min(0).max(50 * 1024),
  issueDate: dateSchema.nullish(),
  expiryDate: dateSchema.nullish(),
  notes: optionalText(4000),
  createdAt: z.string().datetime().optional(),
}).passthrough();

const notificationUpdateSchema = z.object({ isRead: z.boolean() });
const activitySchema = z.object({
  id: idSchema,
  action: z.string().trim().min(2).max(500),
  entityType: z.enum(['client', 'transaction', 'payment', 'task', 'document', 'expense']),
  entityId: idSchema,
  details: optionalText(2000),
}).passthrough();

const categorySchema = z.object({ id: idSchema, name: z.string().trim().min(2).max(150) });
const serviceTemplateSchema = z.object({
  id: idSchema,
  categoryId: idSchema,
  name: z.string().trim().min(2).max(200),
  description: optionalText(4000),
  expectedDurationDays: z.coerce.number().int().min(1).max(3650),
  defaultServiceFee: moneySchema,
  defaultGovernmentFee: moneySchema,
  requiredDocuments: z.array(z.string().trim().min(1).max(200)).max(100),
  checklistSteps: z.array(z.string().trim().min(1).max(500)).max(200),
}).passthrough();

function parseBody<T extends z.ZodTypeAny>(schema: T, body: unknown, res: express.Response): z.infer<T> | undefined {
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid request data', issues: parsed.error.issues.map(issue => ({ path: issue.path.join('.'), message: issue.message })) });
    return undefined;
  }
  return parsed.data;
}

function handleRouteError(res: express.Response, error: unknown, publicMessage: string) {
  const candidate = error as { statusCode?: number; code?: string };
  if (candidate.statusCode) return res.status(candidate.statusCode).json({ error: candidate.statusCode === 404 ? 'Record not found' : publicMessage });
  if (candidate.code === 'P2002') return res.status(409).json({ error: 'A record with the same unique value already exists' });
  if (candidate.code === 'P2003') return res.status(409).json({ error: 'This operation conflicts with related records' });
  if (candidate.code === 'P2025') return res.status(404).json({ error: 'Record not found' });
  console.error(publicMessage, error);
  return res.status(500).json({ error: publicMessage });
}

function getSeedPassword() {
  const password = process.env.SEED_ADMIN_PASSWORD;
  if (process.env.NODE_ENV === 'production' && !password) {
    throw new Error('SEED_ADMIN_PASSWORD is required for initial production provisioning');
  }
  return password || 'ChangeMe-Only-For-Local-Dev-2026!';
}

async function bootstrapProductionDatabase() {
  if (process.env.BOOTSTRAP_PRODUCTION !== 'true') {
    throw new Error('The production database is empty. Set BOOTSTRAP_PRODUCTION=true for the first deployment only.');
  }
  const parsed = z.object({
    workspaceName: z.string().trim().min(2).max(200),
    workspaceSlug: z.string().trim().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(100),
    ownerName: z.string().trim().min(2).max(200),
    ownerEmail: z.string().trim().email().max(254).transform(value => value.toLowerCase()),
    ownerPassword: z.string().min(14).max(128)
      .regex(/[a-z]/).regex(/[A-Z]/).regex(/[0-9]/).regex(/[^A-Za-z0-9]/),
  }).safeParse({
    workspaceName: process.env.BOOTSTRAP_WORKSPACE_NAME,
    workspaceSlug: process.env.BOOTSTRAP_WORKSPACE_SLUG,
    ownerName: process.env.BOOTSTRAP_OWNER_NAME,
    ownerEmail: process.env.BOOTSTRAP_OWNER_EMAIL,
    ownerPassword: process.env.SEED_ADMIN_PASSWORD,
  });
  if (!parsed.success) throw new Error('Production bootstrap variables are incomplete or invalid');
  const passwordHash = await hashPassword(parsed.data.ownerPassword);
  await prisma.$transaction(async database => {
    const workspace = await database.workspace.create({
      data: { name: parsed.data.workspaceName, slug: parsed.data.workspaceSlug, brandingColor: '#1597B8' },
    });
    await database.user.create({
      data: { workspaceId: workspace.id, email: parsed.data.ownerEmail, fullName: parsed.data.ownerName, passwordHash, role: 'owner' },
    });
  });
  console.log('Production workspace and owner provisioned successfully. Remove BOOTSTRAP_PRODUCTION and bootstrap secrets before restarting.');
}

const serializeMoney = <T extends Record<string, any>>(record: T, fields: string[]) => {
  const serialized: Record<string, any> = { ...record };
  for (const field of fields) serialized[field] = Number(record[field] ?? 0);
  return serialized;
};

const maskSensitive = (value: string | null) => value ? `${'*'.repeat(Math.max(0, value.length - 4))}${value.slice(-4)}` : null;
const serializeClient = <T extends { nationalId: string | null; residenceId: string | null; commercialRegister: string | null; createdAt: Date }>(client: T) => ({
  ...client,
  nationalId: maskSensitive(client.nationalId),
  residenceId: maskSensitive(client.residenceId),
  commercialRegister: maskSensitive(client.commercialRegister),
  createdAt: client.createdAt.toISOString(),
});
const serializeTransaction = <T extends Record<string, any> & { checklist: string; createdAt: Date; updatedAt: Date }>(transaction: T) => ({
  ...transaction,
  ...serializeMoney(transaction, ['serviceFee', 'governmentFee', 'extraExpenses', 'totalAmount', 'receivedAmount', 'remainingAmount']),
  checklist: JSON.parse(transaction.checklist),
  createdAt: transaction.createdAt.toISOString(),
  updatedAt: transaction.updatedAt.toISOString(),
});
const serializeDocument = <T extends Record<string, any>>(document: T) => {
  const { storageKey, checksumSha256: _checksum, ...safe } = document;
  return { ...safe, hasFile: Boolean(storageKey) };
};

function detectAllowedDocumentType(buffer: Buffer) {
  if (buffer.subarray(0, 5).toString('ascii') === '%PDF-') return 'application/pdf';
  if (buffer.length >= 8 && buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'image/png';
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return 'image/jpeg';
  return null;
}

// Seeding function
async function seedDatabase() {
  const workspaceCount = await prisma.workspace.count();
  if (workspaceCount > 0) {
    const legacyUsers = await prisma.user.findMany({ where: { passwordHash: '' } });
    if (legacyUsers.length > 0) {
      const seedPassword = getSeedPassword();
      const passwordHash = await hashPassword(seedPassword);
      await prisma.user.updateMany({ where: { passwordHash: '' }, data: { workspaceId: 'ws-1', passwordHash } });
    }
    console.log('Database already has data. Skipping seed.');
    return;
  }

  if (process.env.NODE_ENV === 'production') {
    await bootstrapProductionDatabase();
    return;
  }

  console.log('Seeding database with rich default data...');

  try {
    // 1. Workspaces
    for (const ws of initialWorkspaces) {
      await prisma.workspace.create({
        data: {
          id: ws.id,
          name: ws.name,
          slug: ws.slug,
          brandingColor: ws.brandingColor,
          phone: ws.phone,
          city: ws.city,
          isActive: ws.isActive,
          createdAt: new Date(ws.createdAt)
        }
      });
    }

    // 2. Users
    for (const u of initialUsers) {
      const seedPassword = getSeedPassword();
      await prisma.user.create({
        data: {
          id: u.id,
          workspaceId: 'ws-1',
          email: u.email,
          fullName: u.fullName,
          phone: u.phone,
          avatarUrl: u.avatarUrl,
          passwordHash: await hashPassword(seedPassword),
          role: u.role,
          isActive: u.isActive
        }
      });
    }

    // 3. Categories
    for (const cat of initialCategories) {
      await prisma.serviceCategory.create({
        data: {
          id: cat.id,
          workspaceId: cat.workspaceId,
          name: cat.name
        }
      });
    }

    // 4. Templates
    for (const t of initialServiceTemplates) {
      await prisma.serviceTemplate.create({
        data: {
          id: t.id,
          workspaceId: t.workspaceId,
          categoryId: t.categoryId,
          name: t.name,
          description: t.description,
          expectedDurationDays: t.expectedDurationDays,
          defaultServiceFee: t.defaultServiceFee,
          defaultGovernmentFee: t.defaultGovernmentFee,
          requiredDocuments: JSON.stringify(t.requiredDocuments),
          checklistSteps: JSON.stringify(t.checklistSteps)
        }
      });
    }

    // 5. Clients
    for (const c of initialClients) {
      await prisma.client.create({
        data: {
          id: c.id,
          workspaceId: c.workspaceId,
          fullName: c.fullName,
          clientType: c.clientType,
          phone: c.phone,
          email: c.email,
          city: c.city,
          nationalId: c.nationalId,
          residenceId: c.residenceId,
          commercialRegister: c.commercialRegister || (c as any).commercialRegistration,
          companyName: c.companyName,
          nationality: c.nationality,
          notes: c.notes,
          status: c.status,
          createdAt: new Date(c.createdAt)
        }
      });
    }

    // 6. Transactions
    for (const tx of initialAllTransactions) {
      await prisma.transaction.create({
        data: {
          id: tx.id,
          workspaceId: tx.workspaceId,
          referenceNumber: tx.referenceNumber,
          title: tx.title,
          clientId: tx.clientId,
          serviceTemplateId: tx.serviceTemplateId,
          description: tx.description,
          assignedUserId: tx.assignedUserId,
          priority: tx.priority,
          status: tx.status,
          receivedDate: tx.receivedDate,
          expectedCompletionDate: tx.expectedCompletionDate,
          nextFollowUpDate: tx.nextFollowUpDate,
          completedDate: tx.completedDate,
          serviceFee: tx.serviceFee,
          governmentFee: tx.governmentFee,
          extraExpenses: tx.extraExpenses,
          totalAmount: tx.totalAmount,
          receivedAmount: tx.receivedAmount,
          remainingAmount: tx.remainingAmount,
          paymentStatus: tx.paymentStatus,
          internalNotes: tx.internalNotes,
          sharedNotes: tx.sharedNotes,
          checklist: JSON.stringify(tx.checklist),
          createdAt: new Date(tx.createdAt)
        }
      });
    }

    // 7. Documents
    for (const d of initialDocuments) {
      await prisma.appDocument.create({
        data: {
          id: d.id,
          workspaceId: d.workspaceId,
          clientId: d.clientId,
          transactionId: d.transactionId,
          documentType: d.documentType,
          fileName: d.fileName,
          fileSize: d.fileSize,
          issueDate: d.issueDate,
          expiryDate: d.expiryDate,
          notes: d.notes,
          createdAt: new Date(d.createdAt)
        }
      });
    }

    // 8. Tasks
    for (const t of initialTasks) {
      await prisma.task.create({
        data: {
          id: t.id,
          workspaceId: t.workspaceId,
          title: t.title,
          description: t.description,
          transactionId: t.transactionId,
          clientId: t.clientId,
          assignedUserId: t.assignedUserId,
          startDate: t.startDate,
          dueDate: t.dueDate,
          priority: t.priority,
          status: t.status,
          isCompleted: t.status === 'completed',
          taskType: t.taskType,
          createdAt: new Date(t.createdAt)
        }
      });
    }

    // 9. Payments
    for (const p of initialPayments) {
      const parentTx = initialAllTransactions.find(t => t.id === p.transactionId);
      const recorder = initialUsers.find(user => user.id === p.recordedBy || user.fullName === p.recordedBy);
      if (!recorder) throw new Error(`Seed payment ${p.id} has an unknown recorder`);
      await prisma.payment.create({
        data: {
          id: p.id,
          workspaceId: p.workspaceId,
          transactionId: p.transactionId,
          clientId: parentTx ? parentTx.clientId : '',
          amount: p.amount,
          paymentDate: p.paymentDate,
          paymentMethod: p.paymentMethod,
          referenceNumber: p.referenceNumber,
          notes: p.notes,
          recordedBy: recorder.id,
          status: 'received',
          createdAt: new Date(p.createdAt)
        }
      });
    }

    // 10. Expenses
    for (const e of initialExpenses) {
      const recorder = initialUsers.find(user => user.id === e.recordedBy || user.fullName === e.recordedBy);
      if (!recorder) throw new Error(`Seed expense ${e.id} has an unknown recorder`);
      await prisma.expense.create({
        data: {
          id: e.id,
          workspaceId: e.workspaceId,
          title: e.title,
          amount: e.amount,
          expenseDate: e.expenseDate,
          category: e.category,
          transactionId: e.transactionId,
          recordedBy: recorder.id
        }
      });
    }

    // 11. Notifications
    for (const n of initialNotifications) {
      await prisma.appNotification.create({
        data: {
          id: n.id,
          workspaceId: n.workspaceId,
          userId: n.userId,
          title: n.title,
          message: n.message,
          type: n.notificationType,
          isRead: n.isRead,
          createdAt: new Date(n.createdAt)
        }
      });
    }

    // 12. Activity Logs
    for (const a of initialActivityLogs) {
      await prisma.activityLog.create({
        data: {
          id: a.id,
          workspaceId: a.workspaceId,
          userId: a.userId,
          userName: a.userName,
          action: a.action,
          entityType: a.entityType,
          entityId: a.entityId,
          details: a.details,
          createdAt: new Date(a.createdAt)
        }
      });
    }

    // 13. Audit Logs
    for (const au of initialAuditLogs) {
      await prisma.auditLog.create({
        data: {
          id: au.id,
          workspaceId: au.workspaceId,
          userId: au.userId,
          userName: au.userName,
          event: au.event,
          severity: au.severity,
          details: au.details,
          createdAt: new Date(au.createdAt)
        }
      });
    }

    console.log('Database seeded successfully!');
  } catch (err) {
    console.error('Error seeding database:', err);
    throw err;
  }
}

async function synchronizeWorkspaceSequences() {
  const workspaces = await prisma.workspace.findMany({ select: { id: true, transactionSequence: true, receiptSequence: true, expenseSequence: true } });
  for (const workspace of workspaces) {
    const [transactionCount, paymentCount, expenseCount] = await Promise.all([
      prisma.transaction.count({ where: { workspaceId: workspace.id } }),
      prisma.payment.count({ where: { workspaceId: workspace.id } }),
      prisma.expense.count({ where: { workspaceId: workspace.id } }),
    ]);
    await prisma.workspace.update({
      where: { id: workspace.id },
      data: {
        transactionSequence: Math.max(workspace.transactionSequence, transactionCount),
        receiptSequence: Math.max(workspace.receiptSequence, paymentCount),
        expenseSequence: Math.max(workspace.expenseSequence, expenseCount),
      },
    });
  }
}

// Authentication endpoints must be registered before the protected API middleware.
app.post('/api/auth/login', rateLimit({ windowMs: 15 * 60_000, limit: 10 }), async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid login data' });

  const user = await prisma.user.findUnique({ where: { email: parsed.data.email }, include: { workspace: true } });
  if (!user || !user.isActive || !user.workspace.isActive || !(await verifyPassword(parsed.data.password, user.passwordHash))) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  await prisma.session.deleteMany({ where: { expiresAt: { lt: new Date() } } });
  const oldSessions = await prisma.session.findMany({ where: { userId: user.id }, orderBy: { lastUsedAt: 'desc' }, skip: 4, select: { id: true } });
  if (oldSessions.length) await prisma.session.deleteMany({ where: { id: { in: oldSessions.map(session => session.id) } } });
  const token = await createSession(prisma, user.id, user.workspaceId);
  setSessionCookie(res, token);
  await prisma.auditLog.create({
    data: {
      workspaceId: user.workspaceId,
      userId: user.id,
      userName: user.fullName,
      event: 'auth.login.success',
      severity: 'low',
      details: 'Successful interactive login',
      ipAddress: req.ip,
    },
  });
  res.json({ user: { id: user.id, email: user.email, fullName: user.fullName, role: user.role }, workspace: user.workspace });
});

app.post('/api/auth/logout', async (req, res) => {
  const token = req.cookies?.rattib_session;
  if (token) {
    const session = await prisma.session.findUnique({ where: { tokenHash: tokenHash(token) }, include: { user: true } });
    if (session) {
      await prisma.$transaction([
        prisma.session.delete({ where: { id: session.id } }),
        prisma.auditLog.create({ data: { workspaceId: session.workspaceId, userId: session.userId, userName: session.user.fullName, event: 'auth.logout', severity: 'low', details: 'User logged out', ipAddress: req.ip } }),
      ]);
    }
  }
  clearSessionCookie(res);
  res.json({ success: true });
});

app.use('/api', authenticate(prisma));

// Security audit records are generated by the server after successful mutations.
app.use('/api', (req, res, next) => {
  const isMutation = !['GET', 'HEAD', 'OPTIONS'].includes(req.method);
  const excluded = req.path === '/activity-logs' || req.path.startsWith('/notifications/');
  if (isMutation && !excluded) {
    res.on('finish', () => {
      if (res.statusCode >= 200 && res.statusCode < 400 && req.auth) {
        const sensitive = req.path.includes('password') || req.path.startsWith('/payments') || req.path.startsWith('/expenses') || req.path.startsWith('/documents');
        const recordId = (req.params as Record<string, string>).id;
        void prisma.auditLog.create({
          data: {
            workspaceId: req.auth.workspaceId,
            userId: req.auth.userId,
            userName: req.auth.fullName,
            event: `${req.method} ${req.path}`,
            severity: sensitive ? 'medium' : 'low',
            details: `Successful API mutation${recordId ? ` for record ${recordId}` : ''}`,
            ipAddress: req.ip,
          },
        }).catch(error => console.error('Failed to write security audit record', error));
      }
    });
  }
  next();
});

app.get('/api/auth/me', async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.auth!.userId } });
  const workspace = await prisma.workspace.findUnique({ where: { id: req.auth!.workspaceId } });
  if (!user || !workspace) return res.status(401).json({ error: 'Invalid session' });
  res.json({ user: { id: user.id, email: user.email, fullName: user.fullName, role: user.role, phone: user.phone, avatarUrl: user.avatarUrl, isActive: user.isActive }, workspace });
});

app.post('/api/auth/change-password', rateLimit({ windowMs: 15 * 60_000, limit: 5 }), async (req, res) => {
  const parsed = changePasswordSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid password', issues: parsed.error.issues.map(issue => issue.message) });
  const user = await prisma.user.findUnique({ where: { id: req.auth!.userId } });
  if (!user || !(await verifyPassword(parsed.data.currentPassword, user.passwordHash))) {
    return res.status(400).json({ error: 'Current password is incorrect' });
  }
  if (await verifyPassword(parsed.data.newPassword, user.passwordHash)) {
    return res.status(400).json({ error: 'New password must be different' });
  }
  const passwordHash = await hashPassword(parsed.data.newPassword);
  await prisma.$transaction([
    prisma.user.update({ where: { id: user.id }, data: { passwordHash } }),
    prisma.session.deleteMany({ where: { userId: user.id } }),
  ]);
  const token = await createSession(prisma, user.id, user.workspaceId);
  setSessionCookie(res, token);
  res.json({ success: true });
});

// REST API Endpoints. Every query is scoped from the authenticated session.
app.get('/api/all-data', async (req, res) => {
  try {
    const workspaceId = req.auth!.workspaceId;
    const workspaces = await prisma.workspace.findMany({ where: { id: workspaceId } });
    const users = await prisma.user.findMany({
      where: { workspaceId },
      select: { id: true, email: true, fullName: true, phone: true, avatarUrl: true, role: true, isActive: true },
    });
    const clientsRaw = await prisma.client.findMany({ where: { workspaceId } });
    const categories = await prisma.serviceCategory.findMany({ where: { workspaceId } });
    const templatesRaw = await prisma.serviceTemplate.findMany({ where: { workspaceId } });
    const transactionsRaw = await prisma.transaction.findMany({ where: { workspaceId } });
    const documentsRaw = req.auth!.role === 'accountant'
      ? []
      : await prisma.appDocument.findMany({ where: { workspaceId } });
    const documents = documentsRaw.map(serializeDocument);
    const tasksRaw = await prisma.task.findMany({ where: { workspaceId } });
    const paymentsRaw = await prisma.payment.findMany({ where: { workspaceId } });
    const expensesRaw = await prisma.expense.findMany({ where: { workspaceId } });
    const notificationsRaw = await prisma.appNotification.findMany({
      where: { workspaceId, userId: req.auth!.userId },
      orderBy: { createdAt: 'desc' },
    });
    const notifications = notificationsRaw.map(notification => ({
      ...notification,
      notificationType: notification.type,
      createdAt: notification.createdAt.toISOString(),
    }));
    const activityLogs = await prisma.activityLog.findMany({ where: { workspaceId }, orderBy: { createdAt: 'desc' } });
    const auditLogs = ['owner', 'admin'].includes(req.auth!.role)
      ? await prisma.auditLog.findMany({ where: { workspaceId }, orderBy: { createdAt: 'desc' } })
      : [];

    // Format fields stored as JSON strings back to arrays/objects
    const clients = clientsRaw.map(serializeClient);

    const templates = templatesRaw.map(t => ({
      ...t,
      defaultServiceFee: Number(t.defaultServiceFee),
      defaultGovernmentFee: Number(t.defaultGovernmentFee),
      requiredDocuments: JSON.parse(t.requiredDocuments),
      checklistSteps: JSON.parse(t.checklistSteps)
    }));

    const transactions = transactionsRaw.map(serializeTransaction);

    const tasks = tasksRaw.map(tsk => ({
      ...tsk,
      status: tsk.isCompleted ? 'completed' : tsk.status, // Sync status with isCompleted
      createdAt: tsk.createdAt.toISOString()
    }));
    const payments = paymentsRaw.map(payment => serializeMoney(payment, ['amount']));
    const expenses = expensesRaw.map(expense => serializeMoney(expense, ['amount']));

    res.json({
      workspaces,
      users,
      clients,
      categories,
      templates,
      transactions,
      documents,
      tasks,
      payments,
      expenses,
      notifications,
      activityLogs,
      auditLogs
    });
  } catch (err) {
    handleRouteError(res, err, 'Failed to fetch database data');
  }
});

// Read-only users can never mutate data, even if they call the API directly.
app.use('/api', (req, res, next) => {
  if (req.auth?.role === 'viewer' && !['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return res.status(403).json({ error: 'Read-only account' });
  }
  next();
});

async function assertWorkspaceRecord(model: string, id: string, workspaceId: string) {
  const record = await (prisma as any)[model].findFirst({ where: { id, workspaceId }, select: { id: true } });
  if (!record) {
    const error = new Error('Record not found');
    (error as any).statusCode = 404;
    throw error;
  }
}

async function assertOptionalWorkspaceRecord(model: string, id: string | null | undefined, workspaceId: string) {
  if (id) await assertWorkspaceRecord(model, id, workspaceId);
}

app.post('/api/categories', requirePermission('template.write'), async (req, res) => {
  try {
    const category = parseBody(categorySchema, req.body, res);
    if (!category) return;
    const saved = await prisma.serviceCategory.create({ data: { ...category, workspaceId: req.auth!.workspaceId } });
    res.status(201).json(saved);
  } catch (error) {
    handleRouteError(res, error, 'Failed to create service category');
  }
});

app.post('/api/templates', requirePermission('template.write'), async (req, res) => {
  try {
    const template = parseBody(serviceTemplateSchema, req.body, res);
    if (!template) return;
    await assertWorkspaceRecord('serviceCategory', template.categoryId, req.auth!.workspaceId);
    const saved = await prisma.serviceTemplate.create({
      data: {
        ...template,
        workspaceId: req.auth!.workspaceId,
        requiredDocuments: JSON.stringify(template.requiredDocuments),
        checklistSteps: JSON.stringify(template.checklistSteps),
      },
    });
    res.status(201).json({
      ...saved,
      defaultServiceFee: Number(saved.defaultServiceFee),
      defaultGovernmentFee: Number(saved.defaultGovernmentFee),
      requiredDocuments: JSON.parse(saved.requiredDocuments),
      checklistSteps: JSON.parse(saved.checklistSteps),
    });
  } catch (error) {
    handleRouteError(res, error, 'Failed to create service template');
  }
});

app.get('/api/clients/:id/sensitive', requirePermission('client.sensitive.read'), async (req, res) => {
  const fieldResult = z.enum(['nationalId', 'residenceId', 'commercialRegister']).safeParse(req.query.field);
  if (!fieldResult.success) return res.status(400).json({ error: 'Invalid sensitive field' });
  const client = await prisma.client.findFirst({ where: { id: req.params.id, workspaceId: req.auth!.workspaceId } });
  if (!client) return res.status(404).json({ error: 'Record not found' });
  const value = client[fieldResult.data];
  await prisma.auditLog.create({
    data: {
      workspaceId: req.auth!.workspaceId,
      userId: req.auth!.userId,
      userName: req.auth!.fullName,
      event: 'client.sensitive.reveal',
      severity: 'high',
      details: `Revealed ${fieldResult.data} for client ${client.id}`,
      ipAddress: req.ip,
    },
  });
  res.json({ field: fieldResult.data, value });
});

// Create client
app.post('/api/clients', requirePermission('client.write'), async (req, res) => {
  try {
    const c = parseBody(clientSchema, req.body, res);
    if (!c) return;
    const client = await prisma.client.create({
      data: {
        id: c.id,
        workspaceId: req.auth!.workspaceId,
        fullName: c.fullName,
        clientType: c.clientType,
        phone: c.phone,
        email: c.email || null,
        city: c.city || null,
        nationalId: c.nationalId || null,
        residenceId: c.residenceId || null,
        commercialRegister: c.commercialRegister || c.commercialRegistration || null,
        companyName: c.companyName || null,
        nationality: c.nationality || null,
        notes: c.notes || null,
        status: c.status || 'active',
        createdAt: c.createdAt ? new Date(c.createdAt) : new Date()
      }
    });
    res.json(serializeClient(client));
  } catch (err) {
    handleRouteError(res, err, 'Failed to create client');
  }
});

// Update client
app.put('/api/clients/:id', requirePermission('client.write'), async (req, res) => {
  try {
    const { id } = req.params;
    await assertWorkspaceRecord('client', id, req.auth!.workspaceId);
    const c = parseBody(clientSchema, req.body, res);
    if (!c) return;
    const existingClient = await prisma.client.findFirstOrThrow({ where: { id, workspaceId: req.auth!.workspaceId } });
    const client = await prisma.client.update({
      where: { id },
      data: {
        fullName: c.fullName,
        clientType: c.clientType,
        phone: c.phone,
        email: c.email || null,
        city: c.city || null,
        nationalId: c.nationalId?.includes('*') ? existingClient.nationalId : c.nationalId || null,
        residenceId: c.residenceId?.includes('*') ? existingClient.residenceId : c.residenceId || null,
        commercialRegister: (c.commercialRegister || c.commercialRegistration)?.includes('*') ? existingClient.commercialRegister : c.commercialRegister || c.commercialRegistration || null,
        companyName: c.companyName || null,
        nationality: c.nationality || null,
        notes: c.notes || null,
        status: c.status
      }
    });
    res.json(serializeClient(client));
  } catch (err) {
    handleRouteError(res, err, 'Failed to update client');
  }
});

// Create transaction
app.post('/api/transactions', requirePermission('transaction.write'), async (req, res) => {
  try {
    const tx = parseBody(transactionSchema, req.body, res);
    if (!tx) return;
    await assertWorkspaceRecord('client', tx.clientId, req.auth!.workspaceId);
    await assertOptionalWorkspaceRecord('serviceTemplate', tx.serviceTemplateId, req.auth!.workspaceId);
    await assertOptionalWorkspaceRecord('user', tx.assignedUserId, req.auth!.workspaceId);
    const totalAmount = tx.serviceFee + tx.governmentFee + tx.extraExpenses;
    const transaction = await prisma.$transaction(async database => {
      const workspace = await database.workspace.update({
        where: { id: req.auth!.workspaceId },
        data: { transactionSequence: { increment: 1 } },
        select: { transactionSequence: true },
      });
      const referenceNumber = `TX-${tx.receivedDate.slice(0, 4)}-${String(workspace.transactionSequence).padStart(6, '0')}`;
      return database.transaction.create({
        data: {
          id: tx.id,
          workspaceId: req.auth!.workspaceId,
          referenceNumber,
        title: tx.title,
        clientId: tx.clientId,
        serviceTemplateId: tx.serviceTemplateId || null,
        description: tx.description || null,
        assignedUserId: tx.assignedUserId || null,
        priority: tx.priority || 'normal',
        status: tx.status || 'new',
        receivedDate: tx.receivedDate,
        expectedCompletionDate: tx.expectedCompletionDate || null,
        nextFollowUpDate: tx.nextFollowUpDate || null,
        completedDate: tx.completedDate || null,
        serviceFee: Number(tx.serviceFee) || 0,
        governmentFee: Number(tx.governmentFee) || 0,
        extraExpenses: Number(tx.extraExpenses) || 0,
        totalAmount,
        receivedAmount: 0,
        remainingAmount: totalAmount,
        paymentStatus: 'unpaid',
        internalNotes: tx.internalNotes || null,
        sharedNotes: tx.sharedNotes || null,
          checklist: JSON.stringify(tx.checklist || [])
        }
      });
    });
    res.status(201).json(serializeTransaction(transaction));
  } catch (err) {
    handleRouteError(res, err, 'Failed to create transaction');
  }
});

// Update transaction
app.put('/api/transactions/:id', requirePermission('transaction.write'), async (req, res) => {
  try {
    const { id } = req.params;
    await assertWorkspaceRecord('transaction', id, req.auth!.workspaceId);
    const tx = parseBody(transactionSchema, req.body, res);
    if (!tx) return;
    await assertWorkspaceRecord('client', tx.clientId, req.auth!.workspaceId);
    await assertOptionalWorkspaceRecord('serviceTemplate', tx.serviceTemplateId, req.auth!.workspaceId);
    await assertOptionalWorkspaceRecord('user', tx.assignedUserId, req.auth!.workspaceId);
    const existingTransaction = await prisma.transaction.findFirstOrThrow({ where: { id, workspaceId: req.auth!.workspaceId } });
    const totalAmount = tx.serviceFee + tx.governmentFee + tx.extraExpenses;
    const receivedAmount = Number(existingTransaction.receivedAmount);
    const remainingAmount = Math.max(0, totalAmount - receivedAmount);
    const paymentStatus = receivedAmount <= 0 ? 'unpaid' : remainingAmount <= 0 ? 'fully_paid' : 'partially_paid';
    const transaction = await prisma.transaction.update({
      where: { id },
      data: {
        title: tx.title,
        clientId: tx.clientId,
        serviceTemplateId: tx.serviceTemplateId || null,
        description: tx.description || null,
        assignedUserId: tx.assignedUserId || null,
        priority: tx.priority,
        status: tx.status,
        receivedDate: tx.receivedDate,
        expectedCompletionDate: tx.expectedCompletionDate || null,
        nextFollowUpDate: tx.nextFollowUpDate || null,
        completedDate: tx.completedDate || null,
        serviceFee: Number(tx.serviceFee) || 0,
        governmentFee: Number(tx.governmentFee) || 0,
        extraExpenses: Number(tx.extraExpenses) || 0,
        totalAmount,
        receivedAmount,
        remainingAmount,
        paymentStatus,
        internalNotes: tx.internalNotes || null,
        sharedNotes: tx.sharedNotes || null,
        checklist: JSON.stringify(tx.checklist)
      }
    });
    res.json(serializeTransaction(transaction));
  } catch (err) {
    handleRouteError(res, err, 'Failed to update transaction');
  }
});

// Create task
app.post('/api/tasks', requirePermission('task.write'), async (req, res) => {
  try {
    const t = parseBody(taskSchema, req.body, res);
    if (!t) return;
    await assertOptionalWorkspaceRecord('transaction', t.transactionId, req.auth!.workspaceId);
    await assertOptionalWorkspaceRecord('client', t.clientId, req.auth!.workspaceId);
    await assertOptionalWorkspaceRecord('user', t.assignedUserId, req.auth!.workspaceId);
    const task = await prisma.task.create({
      data: {
        id: t.id,
        workspaceId: req.auth!.workspaceId,
        title: t.title,
        description: t.description || null,
        transactionId: t.transactionId || null,
        clientId: t.clientId || null,
        assignedUserId: t.assignedUserId || null,
        startDate: t.startDate || null,
        dueDate: t.dueDate,
        priority: t.priority || 'normal',
        status: t.status || 'pending',
        isCompleted: t.isCompleted || false,
        taskType: t.taskType || 'general',
        createdAt: t.createdAt ? new Date(t.createdAt) : new Date()
      }
    });
    res.json({
      ...task,
      createdAt: task.createdAt.toISOString()
    });
  } catch (err) {
    handleRouteError(res, err, 'Failed to create task');
  }
});

// Update task
app.put('/api/tasks/:id', requirePermission('task.write'), async (req, res) => {
  try {
    const { id } = req.params;
    await assertWorkspaceRecord('task', id, req.auth!.workspaceId);
    const t = parseBody(taskSchema, req.body, res);
    if (!t) return;
    const task = await prisma.task.update({
      where: { id },
      data: {
        title: t.title,
        description: t.description || null,
        dueDate: t.dueDate,
        priority: t.priority,
        status: t.status,
        isCompleted: t.isCompleted,
        taskType: t.taskType
      }
    });
    res.json({
      ...task,
      createdAt: task.createdAt.toISOString()
    });
  } catch (err) {
    handleRouteError(res, err, 'Failed to update task');
  }
});

// Create payment
app.post('/api/payments', requirePermission('finance.write'), async (req, res) => {
  try {
    const p = parseBody(paymentSchema, req.body, res);
    if (!p) return;
    const transaction = await prisma.transaction.findFirst({ where: { id: p.transactionId, clientId: p.clientId, workspaceId: req.auth!.workspaceId } });
    if (!transaction) return res.status(400).json({ error: 'Transaction and client do not belong to this workspace' });
    if (p.status === 'received' && p.amount > Number(transaction.remainingAmount)) {
      return res.status(400).json({ error: 'Payment exceeds the transaction remaining amount' });
    }
    const [payment, updatedTransaction] = await prisma.$transaction(async database => {
      const workspace = await database.workspace.update({
        where: { id: req.auth!.workspaceId },
        data: { receiptSequence: { increment: 1 } },
        select: { receiptSequence: true },
      });
      const receiptNumber = `REC-${new Date().getFullYear()}-${String(workspace.receiptSequence).padStart(6, '0')}`;
      const payment = await database.payment.create({
        data: {
          id: p.id,
          workspaceId: req.auth!.workspaceId,
          transactionId: p.transactionId,
          clientId: p.clientId,
          amount: p.amount,
          paymentDate: p.paymentDate,
          paymentMethod: p.paymentMethod,
          referenceNumber: p.referenceNumber || null,
          receiptNumber,
          notes: p.notes || null,
          recordedBy: req.auth!.userId,
          status: p.status,
          createdAt: p.createdAt ? new Date(p.createdAt) : new Date()
        }
      });
      const receivedAmount = Number(transaction.receivedAmount) + (p.status === 'received' ? p.amount : 0);
      const remainingAmount = Math.max(0, Number(transaction.totalAmount) - receivedAmount);
      const updated = await database.transaction.update({
        where: { id: transaction.id },
        data: {
          receivedAmount,
          remainingAmount,
          paymentStatus: receivedAmount <= 0 ? 'unpaid' : remainingAmount <= 0 ? 'fully_paid' : 'partially_paid'
        }
      });
      return [payment, updated] as const;
    });
    res.json({
      ...serializeMoney(payment, ['amount']),
      createdAt: payment.createdAt.toISOString(),
      updatedTransaction: serializeTransaction(updatedTransaction)
    });
  } catch (err) {
    handleRouteError(res, err, 'Failed to create payment');
  }
});

// Record expense
app.post('/api/expenses', requirePermission('finance.write'), async (req, res) => {
  try {
    const e = parseBody(expenseSchema, req.body, res);
    if (!e) return;
    await assertOptionalWorkspaceRecord('transaction', e.transactionId, req.auth!.workspaceId);
    const expense = await prisma.$transaction(async database => {
      const workspace = await database.workspace.update({
        where: { id: req.auth!.workspaceId },
        data: { expenseSequence: { increment: 1 } },
        select: { expenseSequence: true },
      });
      const voucherNumber = `EXP-${e.expenseDate.slice(0, 4)}-${String(workspace.expenseSequence).padStart(6, '0')}`;
      return database.expense.create({
        data: {
          id: e.id,
          workspaceId: req.auth!.workspaceId,
          title: e.title,
          amount: e.amount,
          expenseDate: e.expenseDate,
          category: e.category,
          voucherNumber,
          transactionId: e.transactionId || null,
          recordedBy: req.auth!.userId
        }
      });
    });
    res.json(serializeMoney(expense, ['amount']));
  } catch (err) {
    handleRouteError(res, err, 'Failed to record expense');
  }
});

// Upload document
app.post('/api/documents', requirePermission('document.write'), acceptDocumentUpload, async (req, res) => {
  try {
    if (!storageEnabled) return res.status(503).json({ error: 'Document storage is unavailable' });
    if (!req.file) return res.status(400).json({ error: 'A file is required' });
    const mimeType = detectAllowedDocumentType(req.file.buffer);
    if (!mimeType) return res.status(400).json({ error: 'Only genuine PDF, PNG, and JPEG files are allowed' });
    const d = parseBody(documentSchema, {
      ...req.body,
      fileName: path.basename(req.file.originalname),
      fileSize: Math.ceil(req.file.size / 1024),
    }, res);
    if (!d) return;
    await assertOptionalWorkspaceRecord('client', d.clientId, req.auth!.workspaceId);
    await assertOptionalWorkspaceRecord('transaction', d.transactionId, req.auth!.workspaceId);
    const storageKey = createStorageKey(req.auth!.workspaceId, d.id);
    const checksum = checksumSha256(req.file.buffer);
    await putDocument(storageKey, req.file.buffer, mimeType, { workspace: req.auth!.workspaceId, document: d.id, checksum });
    try {
      const doc = await prisma.appDocument.create({
        data: {
          id: d.id,
          workspaceId: req.auth!.workspaceId,
          clientId: d.clientId || null,
          transactionId: d.transactionId || null,
          documentType: d.documentType,
          fileName: d.fileName,
          fileSize: d.fileSize,
          storageKey,
          mimeType,
          checksumSha256: checksum,
          uploadedBy: req.auth!.userId,
          issueDate: d.issueDate || null,
          expiryDate: d.expiryDate || null,
          notes: d.notes || null,
          createdAt: d.createdAt ? new Date(d.createdAt) : new Date()
        }
      });
      res.status(201).json(serializeDocument(doc));
    } catch (error) {
      await deleteDocumentObject(storageKey).catch(() => undefined);
      throw error;
    }
  } catch (err) {
    handleRouteError(res, err, 'Failed to upload document');
  }
});

app.get('/api/documents/:id/content', requirePermission('document.read'), async (req, res) => {
  try {
    const document = await prisma.appDocument.findFirst({ where: { id: req.params.id, workspaceId: req.auth!.workspaceId } });
    if (!document?.storageKey) return res.status(404).json({ error: 'Document file not found' });
    const object = await getDocument(document.storageKey);
    res.setHeader('Content-Type', document.mimeType || 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(document.fileName)}`);
    res.setHeader('Cache-Control', 'private, no-store');
    await prisma.auditLog.create({ data: { workspaceId: req.auth!.workspaceId, userId: req.auth!.userId, userName: req.auth!.fullName, event: 'document.download', severity: 'high', details: `Downloaded document ${document.id}`, ipAddress: req.ip } });
    const body = object.Body as any;
    if (!body?.pipe) return res.status(502).json({ error: 'Storage returned an invalid response' });
    body.pipe(res);
  } catch (error) {
    if (!res.headersSent) handleRouteError(res, error, 'Failed to download document');
  }
});

// Delete document
app.delete('/api/documents/:id', requirePermission('document.write'), async (req, res) => {
  try {
    const { id } = req.params;
    const document = await prisma.appDocument.findFirst({ where: { id, workspaceId: req.auth!.workspaceId } });
    if (!document) return res.status(404).json({ error: 'Record not found' });
    if (document.storageKey) await deleteDocumentObject(document.storageKey);
    await prisma.appDocument.delete({ where: { id } });
    res.json({ success: true });
  } catch (err) {
    handleRouteError(res, err, 'Failed to delete document');
  }
});

// Update notification
app.put('/api/notifications/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const ownedNotification = await prisma.appNotification.findFirst({ where: { id, workspaceId: req.auth!.workspaceId, userId: req.auth!.userId } });
    if (!ownedNotification) return res.status(404).json({ error: 'Notification not found' });
    const parsed = parseBody(notificationUpdateSchema, req.body, res);
    if (!parsed) return;
    const { isRead } = parsed;
    const notification = await prisma.appNotification.update({
      where: { id },
      data: { isRead }
    });
    res.json(notification);
  } catch (err) {
    handleRouteError(res, err, 'Failed to update notification');
  }
});

// Log activity
app.post('/api/activity-logs', async (req, res) => {
  try {
    const a = parseBody(activitySchema, req.body, res);
    if (!a) return;
    const modelByEntity = { client: 'client', transaction: 'transaction', payment: 'payment', task: 'task', document: 'appDocument', expense: 'expense' } as const;
    await assertWorkspaceRecord(modelByEntity[a.entityType], a.entityId, req.auth!.workspaceId);
    const log = await prisma.activityLog.create({
      data: {
        id: a.id,
        workspaceId: req.auth!.workspaceId,
        userId: req.auth!.userId,
        userName: req.auth!.fullName,
        action: a.action,
        entityType: a.entityType,
        entityId: a.entityId,
        details: a.details || null
      }
    });
    res.json(log);
  } catch (err) {
    handleRouteError(res, err, 'Failed to create activity log');
  }
});

app.use('/api', (_req, res) => {
  res.status(404).json({ error: 'API endpoint not found' });
});

// Main startup routine
async function main() {
  await seedDatabase();
  await synchronizeWorkspaceSequences();
  if (storageEnabled) {
    await ensureStorageBucket();
  } else if (process.env.NODE_ENV === 'production') {
    throw new Error('S3-compatible document storage must be configured in production');
  }
  const stopNotificationScheduler = startNotificationScheduler(prisma);

  // Vite Integration for development vs production static serve
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const httpServer = app.listen(PORT, '0.0.0.0', () => {
    console.log(`Smart Mu'aqqeb Server listening on http://0.0.0.0:${PORT}`);
  });

  let shuttingDown = false;
  const shutdown = async (signal: string) => {
    if (shuttingDown) return;
    shuttingDown = true;
    console.log(JSON.stringify({ timestamp: new Date().toISOString(), level: 'info', type: 'shutdown', signal }));
    stopNotificationScheduler();
    const forceExit = setTimeout(() => process.exit(1), 10_000);
    forceExit.unref();
    await new Promise<void>(resolve => httpServer.close(() => resolve()));
    await prisma.$disconnect();
    clearTimeout(forceExit);
  };
  process.once('SIGTERM', () => void shutdown('SIGTERM'));
  process.once('SIGINT', () => void shutdown('SIGINT'));
}

main().catch(async err => {
  console.error('Fatal startup error:', err);
  await prisma.$disconnect().catch(() => undefined);
  process.exitCode = 1;
});
