import React, { createContext, useContext, useState, useEffect } from 'react';
import { Login } from './components/Login';
import {
  Workspace,
  User,
  Client,
  ServiceCategory,
  ServiceTemplate,
  ChecklistItem,
  Transaction,
  AppDocument,
  Task,
  Payment,
  Expense,
  AppNotification,
  ActivityLog,
  AuditLog
} from './types';
import {
  initialWorkspaces,
  initialUsers,
  initialClients,
  initialCategories,
  initialServiceTemplates,
  initialAllTransactions,
  initialDocuments,
  initialTasks,
  initialPayments,
  initialExpenses,
  initialNotifications,
  initialActivityLogs,
  initialAuditLogs
} from './seedData';

const EMPTY_WORKSPACE: Workspace = { id: '', name: '', slug: '', brandingColor: '#1597B8', isActive: false, createdAt: '' };
const EMPTY_USER: User = { id: '', email: '', fullName: '', role: 'viewer', isActive: false };

interface AppContextType {
  workspaces: Workspace[];
  currentWorkspace: Workspace;
  users: User[];
  currentUser: User;
  clients: Client[];
  categories: ServiceCategory[];
  templates: ServiceTemplate[];
  transactions: Transaction[];
  documents: AppDocument[];
  tasks: Task[];
  payments: Payment[];
  expenses: Expense[];
  notifications: AppNotification[];
  activityLogs: ActivityLog[];
  auditLogs: AuditLog[];
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  
  // Actions
  addClient: (client: Omit<Client, 'id' | 'workspaceId' | 'status' | 'createdAt' | 'updatedAt'>) => void;
  updateClient: (client: Client) => void;
  archiveClient: (id: string) => void;
  addServiceTemplate: (template: Omit<ServiceTemplate, 'id' | 'workspaceId'>) => void;
  addCategory: (name: string) => void;
  addTransaction: (tx: Omit<Partial<Transaction>, 'id' | 'workspaceId' | 'referenceNumber' | 'totalAmount' | 'remainingAmount' | 'paymentStatus' | 'createdAt' | 'updatedAt'> & { title: string; clientId: string; customChecklistSteps?: string[], customRequiredDocuments?: string[] }) => void;
  updateTransactionStatus: (id: string, status: Transaction['status']) => void;
  updateTransactionChecklist: (txId: string, stepId: string, isCompleted: boolean) => Promise<Transaction | null>;
  addTransactionPayment: (txId: string, payment: Omit<Payment, 'id' | 'workspaceId' | 'transactionId' | 'recordedBy' | 'createdAt'> & { transactionId?: string }) => Promise<Transaction | null>;
  addExpense: (expense: Omit<Expense, 'id' | 'workspaceId' | 'recordedBy'>) => void;
  uploadDocument: (doc: Omit<AppDocument, 'id' | 'workspaceId' | 'createdAt'>, file: File) => Promise<boolean>;
  deleteDocument: (id: string) => void;
  addTask: (task: Omit<Task, 'id' | 'workspaceId' | 'status' | 'createdAt'>) => void;
  completeTask: (id: string, status: Task['status']) => void;
  addWorkspace: (workspace: Omit<Workspace, 'id' | 'isActive' | 'createdAt'>) => void;
  switchWorkspace: (id: string) => void;
  switchUser: (id: string) => void;
  addEmployee: (employee: Omit<User, 'id' | 'isActive'>) => void;
  markNotificationAsRead: (id: string) => Promise<void>;
  addActivityLog: (action: string, entityType: ActivityLog['entityType'], entityId: string, details?: string) => void;
  addAuditLog: (event: string, severity: AuditLog['severity'], details?: string) => void;
  clearAllState: () => void;
  logout: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [currentWorkspaceId, setCurrentWorkspaceId] = useState<string>('');
  const [users, setUsers] = useState<User[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string>('');

  const [clients, setClients] = useState<Client[]>([]);
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [templates, setTemplates] = useState<ServiceTemplate[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [documents, setDocuments] = useState<AppDocument[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [authenticated, setAuthenticated] = useState(false);
  const [authAttempt, setAuthAttempt] = useState(0);

  // Load data from API if available, or fallback gracefully to rich seed data for Vercel cloud previews.
  useEffect(() => {
    const loadAllData = async () => {
      setLoadError(null);
      try {
        const sessionResponse = await fetch('/api/auth/me', { credentials: 'same-origin' });
        if (sessionResponse.ok) {
          const session = await sessionResponse.json();
          const response = await fetch('/api/all-data');
          if (response.ok) {
            const data = await response.json();
            setWorkspaces(data.workspaces && data.workspaces.length > 0 ? data.workspaces : initialWorkspaces);
            setUsers(data.users && data.users.length > 0 ? data.users : initialUsers);
            setClients(data.clients && data.clients.length > 0 ? data.clients : initialClients);
            setCategories(data.categories && data.categories.length > 0 ? data.categories : initialCategories);
            setTemplates(data.templates && data.templates.length > 0 ? data.templates : initialServiceTemplates);
            setTransactions(data.transactions && data.transactions.length > 0 ? data.transactions : initialAllTransactions);
            setDocuments(data.documents && data.documents.length > 0 ? data.documents : initialDocuments);
            setTasks(data.tasks && data.tasks.length > 0 ? data.tasks : initialTasks);
            setPayments(data.payments && data.payments.length > 0 ? data.payments : initialPayments);
            setExpenses(data.expenses && data.expenses.length > 0 ? data.expenses : initialExpenses);
            setNotifications(data.notifications && data.notifications.length > 0 ? data.notifications : initialNotifications);
            setActivityLogs(data.activityLogs && data.activityLogs.length > 0 ? data.activityLogs : initialActivityLogs);
            setAuditLogs(data.auditLogs && data.auditLogs.length > 0 ? data.auditLogs : initialAuditLogs);
            
            setCurrentWorkspaceId(session.workspace?.id || initialWorkspaces[0]?.id);
            setCurrentUserId(session.user?.id || initialUsers[0]?.id);
            setAuthenticated(true);
            setLoading(false);
            return;
          }
        }
      } catch (err) {
        console.warn('API connection unavailable, activating interactive demo mode:', err);
      }

      // Fallback for Vercel / serverless / preview deployments:
      setWorkspaces(initialWorkspaces);
      setUsers(initialUsers);
      setClients(initialClients);
      setCategories(initialCategories);
      setTemplates(initialServiceTemplates);
      setTransactions(initialAllTransactions);
      setDocuments(initialDocuments);
      setTasks(initialTasks);
      setPayments(initialPayments);
      setExpenses(initialExpenses);
      setNotifications(initialNotifications);
      setActivityLogs(initialActivityLogs);
      setAuditLogs(initialAuditLogs);

      const storedWS = localStorage.getItem('rattib_current_workspace_id');
      if (storedWS && initialWorkspaces.some(w => w.id === storedWS)) {
        setCurrentWorkspaceId(storedWS);
      } else if (initialWorkspaces.length > 0) {
        setCurrentWorkspaceId(initialWorkspaces[0].id);
      }

      const storedUser = localStorage.getItem('rattib_current_user_id');
      if (storedUser && initialUsers.some(u => u.id === storedUser)) {
        setCurrentUserId(storedUser);
      } else if (initialUsers.length > 0) {
        setCurrentUserId(initialUsers[0].id);
      }

      setAuthenticated(true);
      setLoading(false);
    };
    loadAllData();
  }, [authAttempt]);

  // Sync current ID selections to localStorage for convenient session persistence
  useEffect(() => {
    localStorage.setItem('rattib_current_workspace_id', currentWorkspaceId);
  }, [currentWorkspaceId]);

  useEffect(() => {
    localStorage.setItem('rattib_current_user_id', currentUserId);
  }, [currentUserId]);

  // Derived Values
  const currentWorkspace = workspaces.find(w => w.id === currentWorkspaceId) || workspaces[0] || EMPTY_WORKSPACE;
  const currentUser = users.find(u => u.id === currentUserId) || users[0] || EMPTY_USER;

  // Action Helpers
  const addActivityLog = async (action: string, entityType: ActivityLog['entityType'], entityId: string, details?: string) => {
    const newLog: ActivityLog = {
      id: `act-${Date.now()}`,
      workspaceId: currentWorkspaceId,
      userId: currentUser.id,
      userName: currentUser.fullName,
      action,
      entityType,
      entityId,
      details,
      createdAt: new Date().toISOString()
    };
    try {
      const response = await fetch('/api/activity-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newLog)
      });
      if (response.ok) {
        const saved = await response.json();
        setActivityLogs(prev => [saved, ...prev]);
      }
    } catch (err) {
      console.error('Error logging activity:', err);
    }
  };

  const addAuditLog = async (event: string, severity: AuditLog['severity'], details?: string) => {
    // Security audit events are generated exclusively by the server.
    void event;
    void severity;
    void details;
  };

  const addClient = async (clientData: Omit<Client, 'id' | 'workspaceId' | 'status' | 'createdAt' | 'updatedAt'>) => {
    const newId = `cli-${Date.now()}`;
    const newClient: Client = {
      ...clientData,
      id: newId,
      workspaceId: currentWorkspaceId,
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    try {
      const response = await fetch('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newClient)
      });
      if (response.ok) {
        const savedClient = await response.json();
        setClients(prev => [...prev, savedClient]);
        addActivityLog(`إضافة عميل جديد: ${savedClient.fullName}`, 'client', savedClient.id);
      }
    } catch (err) {
      console.error('Error adding client to database:', err);
    }
  };

  const updateClient = async (updated: Client) => {
    try {
      const response = await fetch(`/api/clients/${updated.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated)
      });
      if (response.ok) {
        const saved = await response.json();
        setClients(prev => prev.map(c => c.id === saved.id ? saved : c));
        addActivityLog(`تعديل بيانات العميل: ${saved.fullName}`, 'client', saved.id);
      }
    } catch (err) {
      console.error('Error updating client in database:', err);
    }
  };

  const archiveClient = async (id: string) => {
    const target = clients.find(c => c.id === id);
    if (!target) return;
    const updated: Client = {
      ...target,
      status: 'archived',
      updatedAt: new Date().toISOString()
    };

    try {
      const response = await fetch(`/api/clients/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated)
      });
      if (response.ok) {
        const saved = await response.json();
        setClients(prev => prev.map(c => c.id === id ? saved : c));
        addActivityLog(`أرشفة ملف العميل: ${saved.fullName}`, 'client', id);
      }
    } catch (err) {
      console.error('Error archiving client in database:', err);
    }
  };

  const addCategory = async (name: string) => {
    const newCat = {
      id: `cat-${Date.now()}`,
      workspaceId: currentWorkspaceId,
      name
    };
    const response = await fetch('/api/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newCat),
    });
    if (response.ok) {
      const saved = await response.json();
      setCategories(prev => [...prev, saved]);
    }
  };

  const addServiceTemplate = async (tmplData: Omit<ServiceTemplate, 'id' | 'workspaceId'>) => {
    const newId = `tmpl-${Date.now()}`;
    const newTmpl: ServiceTemplate = {
      ...tmplData,
      id: newId,
      workspaceId: currentWorkspaceId
    };
    const response = await fetch('/api/templates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newTmpl),
    });
    if (response.ok) {
      const saved = await response.json();
      setTemplates(prev => [...prev, saved]);
    }
    addActivityLog(`إنشاء قالب خدمة جديد: ${newTmpl.name}`, 'client', newId);
  };

  const addTransaction = async (txData: Omit<Partial<Transaction>, 'id' | 'workspaceId' | 'referenceNumber' | 'totalAmount' | 'remainingAmount' | 'paymentStatus' | 'createdAt' | 'updatedAt'> & { title: string; clientId: string; customChecklistSteps?: string[], customRequiredDocuments?: string[] }) => {
    const newId = `tx-${Date.now()}`;
    const refNum = `TX-2026-${String(transactions.length + 1).padStart(4, '0')}`;
    
    const serviceFee = txData.serviceFee || 0;
    const governmentFee = txData.governmentFee || 0;
    const extraExpenses = txData.extraExpenses || 0;
    const receivedAmount = txData.receivedAmount || 0;
    const totalAmount = serviceFee + governmentFee + extraExpenses;
    const remainingAmount = totalAmount - receivedAmount;
    
    let paymentStatus: Transaction['paymentStatus'] = 'unpaid';
    if (receivedAmount >= totalAmount) {
      paymentStatus = 'fully_paid';
    } else if (receivedAmount > 0) {
      paymentStatus = 'partially_paid';
    }

    const steps = txData.customChecklistSteps || [];
    const checklistItems: ChecklistItem[] = steps.map((stepName, idx) => ({
      id: `chk-${Date.now()}-${idx}`,
      stepName,
      isCompleted: false
    }));

    const newTx: Transaction = {
      id: newId,
      workspaceId: currentWorkspaceId,
      referenceNumber: refNum,
      title: txData.title,
      clientId: txData.clientId,
      serviceTemplateId: txData.serviceTemplateId,
      description: txData.description,
      assignedUserId: txData.assignedUserId,
      priority: txData.priority || 'normal',
      status: txData.status || 'new',
      receivedDate: txData.receivedDate || new Date().toISOString().split('T')[0],
      expectedCompletionDate: txData.expectedCompletionDate,
      nextFollowUpDate: txData.nextFollowUpDate,
      serviceFee,
      governmentFee,
      extraExpenses,
      totalAmount,
      receivedAmount,
      remainingAmount,
      paymentStatus,
      internalNotes: txData.internalNotes,
      sharedNotes: txData.sharedNotes,
      checklist: checklistItems,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    try {
      const response = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTx)
      });
      if (response.ok) {
        const savedTx = await response.json();
        setTransactions(prev => [savedTx, ...prev]);
        addActivityLog(`إنشاء معاملة جديدة: ${savedTx.title} (${refNum})`, 'transaction', newId);

        // If there is initial received amount, create a payment record
        if (txData.receivedAmount > 0) {
          const newPayment: Payment = {
            id: `pay-${Date.now()}`,
            workspaceId: currentWorkspaceId,
            transactionId: newId,
            clientId: txData.clientId,
            amount: txData.receivedAmount,
            paymentDate: new Date().toISOString().split('T')[0],
            paymentMethod: 'cash',
            notes: 'دفعة افتتاحية مستلمة عند إنشاء المعاملة',
            recordedBy: currentUser.fullName,
            createdAt: new Date().toISOString()
          };
          const payResp = await fetch('/api/payments', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newPayment)
          });
          if (payResp.ok) {
            const savedPay = await payResp.json();
            setPayments(prev => [...prev, savedPay]);
          }
        }
      }
    } catch (err) {
      console.error('Error adding transaction to database:', err);
    }
  };

  const updateTransactionStatus = async (id: string, status: Transaction['status']) => {
    const tx = transactions.find(t => t.id === id);
    if (!tx) return;
    const completedDate = status === 'completed' ? new Date().toISOString().split('T')[0] : tx.completedDate;
    const updated: Transaction = {
      ...tx,
      status,
      completedDate,
      updatedAt: new Date().toISOString()
    };

    try {
      const response = await fetch(`/api/transactions/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated)
      });
      if (response.ok) {
        const saved = await response.json();
        setTransactions(prev => prev.map(t => t.id === id ? saved : t));
        addActivityLog(`تغيير حالة المعاملة (${saved.referenceNumber}) إلى: ${status}`, 'transaction', id);
      }
    } catch (err) {
      console.error('Error updating transaction status:', err);
    }
  };

  const updateTransactionChecklist = async (txId: string, stepId: string, isCompleted: boolean) => {
    const tx = transactions.find(t => t.id === txId);
    if (!tx) return null;
    const updatedChecklist = tx.checklist.map(item => {
      if (item.id === stepId) {
        return {
          ...item,
          isCompleted,
          completedBy: isCompleted ? currentUser.fullName : undefined,
          completedAt: isCompleted ? new Date().toISOString() : undefined
        };
      }
      return item;
    });
    const updated: Transaction = {
      ...tx,
      checklist: updatedChecklist,
      updatedAt: new Date().toISOString()
    };

    try {
      const response = await fetch(`/api/transactions/${txId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated)
      });
      if (response.ok) {
        const saved = await response.json();
        setTransactions(prev => prev.map(t => t.id === txId ? saved : t));
        return saved as Transaction;
      }
      return null;
    } catch (err) {
      console.error('Error updating transaction checklist:', err);
      return null;
    }
  };

  const addTransactionPayment = async (txId: string, paymentData: Omit<Payment, 'id' | 'workspaceId' | 'transactionId' | 'recordedBy' | 'createdAt'> & { transactionId?: string }) => {
    const tx = transactions.find(t => t.id === txId);
    if (!tx) return null;

    const newId = `pay-${Date.now()}`;
    const newPayment: Payment = {
      ...paymentData,
      id: newId,
      workspaceId: currentWorkspaceId,
      transactionId: txId,
      clientId: tx.clientId,
      recordedBy: currentUser.fullName,
      createdAt: new Date().toISOString()
    };

    try {
      const response = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPayment)
      });
      if (response.ok) {
        const payload = await response.json() as Payment & { updatedTransaction: Transaction };
        const { updatedTransaction, ...savedPayment } = payload;
        setPayments(prev => [...prev, savedPayment as Payment]);
        setTransactions(prev => prev.map(t => t.id === txId ? updatedTransaction : t));
        addActivityLog(`تسجيل دفعة جديدة بقيمة ${paymentData.amount} ريال للمعاملة (${updatedTransaction.referenceNumber})`, 'payment', newId);
        return updatedTransaction;
      }
      return null;
    } catch (err) {
      console.error('Error adding transaction payment:', err);
      return null;
    }
  };

  const addExpense = async (expenseData: Omit<Expense, 'id' | 'workspaceId' | 'recordedBy'>) => {
    const newId = `exp-${Date.now()}`;
    const newExpense: Expense = {
      ...expenseData,
      id: newId,
      workspaceId: currentWorkspaceId,
      recordedBy: currentUser.fullName
    };
    try {
      const response = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newExpense)
      });
      if (response.ok) {
        const saved = await response.json();
        setExpenses(prev => [...prev, saved]);
      }
    } catch (err) {
      console.error('Error recording expense:', err);
    }
  };

  const uploadDocument = async (docData: Omit<AppDocument, 'id' | 'workspaceId' | 'createdAt'>, file: File) => {
    const newId = `doc-${Date.now()}`;
    const newDoc: AppDocument = {
      ...docData,
      id: newId,
      workspaceId: currentWorkspaceId,
      createdAt: new Date().toISOString()
    };
    const form = new FormData();
    form.append('file', file);
    form.append('id', newDoc.id);
    form.append('documentType', newDoc.documentType);
    if (newDoc.clientId) form.append('clientId', newDoc.clientId);
    if (newDoc.transactionId) form.append('transactionId', newDoc.transactionId);
    if (newDoc.issueDate) form.append('issueDate', newDoc.issueDate);
    if (newDoc.expiryDate) form.append('expiryDate', newDoc.expiryDate);
    if (newDoc.notes) form.append('notes', newDoc.notes);
    let uploaded = false;
    try {
      const response = await fetch('/api/documents', {
        method: 'POST',
        body: form
      });
      if (response.ok) {
        const saved = await response.json();
        setDocuments(prev => [...prev, saved]);
        uploaded = true;
        addActivityLog(`رفع مستند جديد: ${docData.fileName}`, 'document', newId);
      }
    } catch (err) {
      console.error('Error uploading document:', err);
    }
    return uploaded;
  };

  const deleteDocument = async (id: string) => {
    const target = documents.find(d => d.id === id);
    try {
      const response = await fetch(`/api/documents/${id}`, {
        method: 'DELETE'
      });
      if (response.ok) {
        setDocuments(prev => prev.filter(d => d.id !== id));
        if (target) {
          addActivityLog(`حذف المستند: ${target.fileName}`, 'document', id);
        }
      }
    } catch (err) {
      console.error('Error deleting document:', err);
    }
  };

  const addTask = async (taskData: Omit<Task, 'id' | 'workspaceId' | 'status' | 'createdAt'>) => {
    const newId = `tsk-${Date.now()}`;
    const newTask: Task = {
      ...taskData,
      id: newId,
      workspaceId: currentWorkspaceId,
      status: 'pending',
      createdAt: new Date().toISOString()
    };

    try {
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTask)
      });
      if (response.ok) {
        const saved = await response.json();
        setTasks(prev => [...prev, saved]);
        addActivityLog(`إضافة مهمة جديدة: ${saved.title}`, 'task', saved.id);
      }
    } catch (err) {
      console.error('Error adding task to database:', err);
    }
  };

  const completeTask = async (id: string, status: Task['status']) => {
    const target = tasks.find(t => t.id === id);
    if (!target) return;
    const updated = {
      ...target,
      status,
      isCompleted: status === 'completed'
    };

    try {
      const response = await fetch(`/api/tasks/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated)
      });
      if (response.ok) {
        const saved = await response.json();
        setTasks(prev => prev.map(t => t.id === id ? saved : t));
        addActivityLog(`تعديل حالة المهمة (${saved.title}) إلى: ${status}`, 'task', id);
      }
    } catch (err) {
      console.error('Error completing task:', err);
    }
  };

  const addWorkspace = async (wsData: Omit<Workspace, 'id' | 'isActive' | 'createdAt'>) => {
    const newId = `ws-${Date.now()}`;
    const newWs: Workspace = {
      ...wsData,
      id: newId,
      isActive: true,
      createdAt: new Date().toISOString()
    };
    setWorkspaces(prev => [...prev, newWs]);
    // Create Default Service Category for new workspace
    const newCat = {
      id: `cat-${Date.now()}`,
      workspaceId: newId,
      name: 'عام'
    };
    setCategories(prev => [...prev, newCat]);
  };

  const switchWorkspace = (id: string) => {
    if (id !== currentWorkspaceId) return;
    setCurrentWorkspaceId(id);
    addAuditLog(`تبديل مساحة العمل الحالية إلى المعرف: ${id}`, 'info');
  };

  const switchUser = (id: string) => {
    if (id !== currentUserId) return;
    setCurrentUserId(id);
  };

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'same-origin' });
    localStorage.removeItem('rattib_current_workspace_id');
    localStorage.removeItem('rattib_current_user_id');
    setAuthenticated(false);
  };

  const addEmployee = async (empData: Omit<User, 'id' | 'isActive'>) => {
    const newId = `usr-${Date.now()}`;
    const newEmp: User = {
      ...empData,
      id: newId,
      isActive: true
    };
    setUsers(prev => [...prev, newEmp]);
  };

  const markNotificationAsRead = async (id: string) => {
    try {
      const response = await fetch(`/api/notifications/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isRead: true })
      });
      if (response.ok) {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
      }
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  const clearAllState = async () => {
    try {
      const response = await fetch('/api/reset-state', {
        method: 'POST'
      });
      if (response.ok) {
        const data = await (await fetch('/api/all-data')).json();
        setWorkspaces(data.workspaces);
        setUsers(data.users);
        setClients(data.clients);
        setCategories(data.categories);
        setTemplates(data.templates);
        setTransactions(data.transactions);
        setDocuments(data.documents);
        setTasks(data.tasks);
        setPayments(data.payments);
        setExpenses(data.expenses);
        setNotifications(data.notifications);
        setActivityLogs(data.activityLogs);
        setAuditLogs(data.auditLogs);
        localStorage.clear();
      }
    } catch (err) {
      console.error('Error resetting state in database:', err);
    }
  };

  // Render a beautiful loading overlay while database mounts
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen w-screen bg-[#F7F9FC] text-[#0F2742]" dir="rtl">
        <div className="w-12 h-12 border-4 border-[#1597B8] border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="font-sans font-bold text-sm">جاري الاتصال بقاعدة البيانات والتحميل...</p>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-[#F7F9FC] p-5 text-center" dir="rtl">
        <div className="w-full max-w-md rounded-3xl border border-red-100 bg-white p-7 shadow-xl" role="alert">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-xl">!</div>
          <h1 className="mb-2 text-lg font-black text-[#0F2742]">تعذر فتح المنصة</h1>
          <p className="mb-6 text-sm leading-6 text-gray-500">{loadError}</p>
          <button
            type="button"
            onClick={() => { setLoading(true); setAuthAttempt(value => value + 1); }}
            className="w-full rounded-xl bg-[#1597B8] px-5 py-3 text-sm font-bold text-white transition hover:bg-cyan-600 focus:outline-none focus:ring-4 focus:ring-[#1597B8]/20"
          >
            إعادة المحاولة
          </button>
        </div>
      </div>
    );
  }

  if (!authenticated) {
    return <Login onSuccess={() => { setLoading(true); setAuthAttempt(value => value + 1); }} />;
  }

  return (
    <AppContext.Provider value={{
      workspaces,
      currentWorkspace,
      users,
      currentUser,
      clients: clients.filter(c => c.workspaceId === currentWorkspaceId),
      categories: categories.filter(c => c.workspaceId === currentWorkspaceId),
      templates: templates.filter(t => t.workspaceId === currentWorkspaceId),
      transactions: transactions.filter(t => t.workspaceId === currentWorkspaceId),
      documents: documents.filter(d => d.workspaceId === currentWorkspaceId),
      tasks: tasks.filter(t => t.workspaceId === currentWorkspaceId),
      payments: payments.filter(p => p.workspaceId === currentWorkspaceId),
      expenses: expenses.filter(e => e.workspaceId === currentWorkspaceId),
      notifications: notifications.filter(n => n.workspaceId === currentWorkspaceId),
      activityLogs: activityLogs.filter(a => a.workspaceId === currentWorkspaceId),
      auditLogs: auditLogs.filter(a => a.workspaceId === currentWorkspaceId),
      currentTab,
      setCurrentTab,
      
      addClient,
      updateClient,
      archiveClient,
      addServiceTemplate,
      addCategory,
      addTransaction,
      updateTransactionStatus,
      updateTransactionChecklist,
      addTransactionPayment,
      addExpense,
      uploadDocument,
      deleteDocument,
      addTask,
      completeTask,
      addWorkspace,
      switchWorkspace,
      switchUser,
      addEmployee,
      markNotificationAsRead,
      addActivityLog,
      addAuditLog,
      clearAllState,
      logout
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
