import type { PrismaClient } from '@prisma/client';

const DAY_MS = 24 * 60 * 60 * 1000;

export async function generateOperationalNotifications(prisma: PrismaClient) {
  const today = new Date().toISOString().slice(0, 10);
  const inThirtyDays = new Date(Date.now() + 30 * DAY_MS).toISOString().slice(0, 10);
  const workspaces = await prisma.workspace.findMany({ where: { isActive: true }, select: { id: true } });

  for (const workspace of workspaces) {
    const managers = await prisma.user.findMany({
      where: { workspaceId: workspace.id, isActive: true, role: { in: ['owner', 'admin'] } },
      select: { id: true },
    });
    const managerIds = managers.map(user => user.id);
    const notify = async (userIds: string[], dedupeKey: string, title: string, message: string, actionUrl: string) => {
      for (const userId of [...new Set(userIds)]) {
        await prisma.appNotification.upsert({
          where: { workspaceId_userId_dedupeKey: { workspaceId: workspace.id, userId, dedupeKey } },
          create: { workspaceId: workspace.id, userId, dedupeKey, title, message, type: 'warning', actionUrl },
          update: { title, message, actionUrl },
        });
      }
    };

    const expiringDocuments = await prisma.appDocument.findMany({
      where: { workspaceId: workspace.id, expiryDate: { gte: today, lte: inThirtyDays } },
      select: { id: true, fileName: true, expiryDate: true },
    });
    for (const document of expiringDocuments) {
      await notify(managerIds, `document-expiry:${document.id}:${document.expiryDate}`, 'مستند يقترب من الانتهاء', `${document.fileName} ينتهي بتاريخ ${document.expiryDate}`, '/documents?filter=expiring');
    }

    const overdueTasks = await prisma.task.findMany({
      where: { workspaceId: workspace.id, dueDate: { lt: today }, isCompleted: false, status: { notIn: ['completed', 'cancelled'] } },
      select: { id: true, title: true, dueDate: true, assignedUserId: true },
    });
    for (const task of overdueTasks) {
      await notify(task.assignedUserId ? [task.assignedUserId] : managerIds, `task-overdue:${task.id}:${task.dueDate}`, 'مهمة متأخرة', `${task.title} تجاوزت موعدها ${task.dueDate}`, '/tasks?filter=overdue');
    }

    const followUps = await prisma.transaction.findMany({
      where: { workspaceId: workspace.id, nextFollowUpDate: { lte: today }, status: { notIn: ['completed', 'cancelled'] } },
      select: { id: true, title: true, referenceNumber: true, nextFollowUpDate: true, assignedUserId: true },
    });
    for (const transaction of followUps) {
      await notify(transaction.assignedUserId ? [transaction.assignedUserId] : managerIds, `transaction-follow-up:${transaction.id}:${transaction.nextFollowUpDate}`, 'معاملة تحتاج متابعة', `${transaction.referenceNumber} — ${transaction.title}`, '/transactions?filter=follow-up');
    }
  }
}

export function startNotificationScheduler(prisma: PrismaClient) {
  const run = () => generateOperationalNotifications(prisma).catch(error => console.error('Notification scheduler failed', error));
  void run();
  const timer = setInterval(run, 60 * 60 * 1000);
  timer.unref();
  return () => clearInterval(timer);
}
