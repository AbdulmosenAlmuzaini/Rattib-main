export interface Workspace {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string;
  brandingColor: string;
  phone?: string;
  city?: string;
  isActive: boolean;
  createdAt: string;
}

export interface User {
  id: string;
  email: string;
  fullName: string;
  phone?: string;
  avatarUrl?: string;
  role: 'owner' | 'admin' | 'employee' | 'accountant' | 'viewer';
  isActive: boolean;
}

export interface Client {
  id: string;
  workspaceId: string;
  fullName: string;
  clientType: 'individual' | 'company';
  phone: string;
  email?: string;
  city?: string;
  nationalId?: string; // Will mask in tables unless explicitly revealed
  residenceId?: string;
  commercialRegister?: string;
  companyName?: string;
  nationality?: string;
  notes?: string;
  status: 'active' | 'archived';
  createdAt: string;
  updatedAt: string;
}

export interface ServiceCategory {
  id: string;
  workspaceId: string;
  name: string;
}

export interface ServiceTemplate {
  id: string;
  workspaceId: string;
  categoryId: string;
  name: string;
  description?: string;
  expectedDurationDays: number;
  defaultServiceFee: number;
  defaultGovernmentFee: number;
  requiredDocuments: string[]; // List of names
  checklistSteps: string[]; // List of step names
}

export interface ChecklistItem {
  id: string;
  stepName: string;
  isCompleted: boolean;
  completedBy?: string;
  completedAt?: string;
}

export interface Transaction {
  id: string;
  workspaceId: string;
  referenceNumber: string;
  title: string;
  clientId: string;
  serviceTemplateId?: string;
  description?: string;
  assignedUserId?: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  status: 'new' | 'waiting_docs' | 'ready' | 'in_progress' | 'needs_review' | 'pending' | 'completed' | 'cancelled';
  receivedDate: string;
  expectedCompletionDate?: string;
  nextFollowUpDate?: string;
  completedDate?: string;
  serviceFee: number;
  governmentFee: number;
  extraExpenses: number;
  totalAmount: number;
  receivedAmount: number;
  remainingAmount: number;
  paymentStatus: 'unpaid' | 'partially_paid' | 'fully_paid' | 'refunded';
  internalNotes?: string;
  sharedNotes?: string;
  checklist: ChecklistItem[];
  createdAt: string;
  updatedAt: string;
}

export interface TransactionUpdate {
  id: string;
  transactionId: string;
  userId: string;
  userName: string;
  updateType: string; // e.g., 'status_change', 'payment', 'doc_uploaded', 'note_added', 'checklist_update'
  oldValue?: string;
  newValue?: string;
  note?: string;
  createdAt: string;
}

export interface AppDocument {
  id: string;
  workspaceId: string;
  clientId?: string;
  transactionId?: string;
  documentType: 'national_id' | 'residence_id' | 'passport' | 'cr' | 'license' | 'authorization' | 'contract' | 'receipt' | 'invoice' | 'letter' | 'other';
  fileName: string;
  fileSize: number; // in KB
  mimeType?: string;
  hasFile?: boolean;
  uploadedBy?: string;
  issueDate?: string;
  expiryDate?: string;
  notes?: string;
  createdAt: string;
}

export interface Task {
  id: string;
  workspaceId: string;
  title: string;
  description?: string;
  transactionId?: string;
  clientId?: string;
  assignedUserId?: string;
  startDate: string;
  dueDate: string;
  priority: 'low' | 'normal' | 'high';
  status: 'pending' | 'in_progress' | 'completed' | 'overdue' | 'cancelled';
  taskType: 'general' | 'review' | 'call' | 'payment_collect' | 'doc_request';
  createdAt: string;
}

export interface Payment {
  id: string;
  workspaceId: string;
  transactionId: string;
  clientId?: string;
  amount: number;
  paymentDate: string;
  paymentMethod: 'cash' | 'bank_transfer' | 'card' | 'network' | 'other';
  referenceNumber?: string;
  receiptNumber?: string;
  notes?: string;
  recordedBy: string;
  createdAt: string;
}

export interface Expense {
  id: string;
  workspaceId: string;
  title: string;
  amount: number;
  expenseDate: string;
  category: string;
  voucherNumber?: string;
  transactionId?: string;
  recordedBy: string;
}

export interface AppNotification {
  id: string;
  workspaceId: string;
  userId: string;
  title: string;
  message: string;
  notificationType: 'expiry' | 'overdue_task' | 'overdue_transaction' | 'payment_due' | 'assignment';
  type?: string;
  isRead: boolean;
  actionUrl?: string;
  createdAt: string;
}

export interface ActivityLog {
  id: string;
  workspaceId: string;
  userId: string;
  userName: string;
  action: string;
  entityType: 'client' | 'transaction' | 'document' | 'payment' | 'task';
  entityId: string;
  details?: string;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  workspaceId?: string;
  userId?: string;
  userName?: string;
  event: string;
  severity: 'info' | 'warning' | 'critical';
  details?: string;
  createdAt: string;
}
