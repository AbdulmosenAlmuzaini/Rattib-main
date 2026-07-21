import {
  Workspace,
  User,
  Client,
  ServiceCategory,
  ServiceTemplate,
  Transaction,
  AppDocument,
  Task,
  Payment,
  Expense,
  AppNotification,
  ActivityLog,
  AuditLog
} from './types';

export const initialWorkspaces: Workspace[] = [
  {
    id: 'ws-1',
    name: 'رتّب – مكتب المعقّب الذكي (الفرع الرئيسي)',
    slug: 'rattib-main',
    brandingColor: '#1597B8',
    phone: '0501234567',
    city: 'الرياض',
    isActive: true,
    createdAt: '2026-01-01T08:00:00Z',
  },
  {
    id: 'ws-2',
    name: 'الريادة للخدمات العامة والتعقيب',
    slug: 'reyada-office',
    brandingColor: '#23B78D',
    phone: '0557654321',
    city: 'جدة',
    isActive: true,
    createdAt: '2026-03-15T09:00:00Z',
  }
];

export const initialUsers: User[] = [
  {
    id: 'usr-1',
    email: 'owner@rattib.com',
    fullName: 'أحمد بن علي المعقّب',
    phone: '0501111111',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=faces',
    role: 'owner',
    isActive: true
  },
  {
    id: 'usr-2',
    email: 'employee1@rattib.com',
    fullName: 'سلطان الدوسري',
    phone: '0502222222',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=faces',
    role: 'employee',
    isActive: true
  },
  {
    id: 'usr-3',
    email: 'employee2@rattib.com',
    fullName: 'خالد العتيبي',
    phone: '0503333333',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=faces',
    role: 'employee',
    isActive: true
  },
  {
    id: 'usr-4',
    email: 'accountant@rattib.com',
    fullName: 'سعيد الغامدي',
    phone: '0504444444',
    role: 'accountant',
    isActive: true
  },
  {
    id: 'usr-5',
    email: 'viewer@rattib.com',
    fullName: 'عبدالرحمن الشهري',
    phone: '0505555555',
    role: 'viewer',
    isActive: true
  }
];

export const initialCategories: ServiceCategory[] = [
  { id: 'cat-1', workspaceId: 'ws-1', name: 'خدمات الجوازات والوافدين' },
  { id: 'cat-2', workspaceId: 'ws-1', name: 'خدمات وزارة التجارة والسجلات' },
  { id: 'cat-3', workspaceId: 'ws-1', name: 'خدمات بلدي والبلديات' },
  { id: 'cat-4', workspaceId: 'ws-1', name: 'خدمات المرور ورخص المركبات' },
];

export const initialServiceTemplates: ServiceTemplate[] = [
  {
    id: 'tmpl-1',
    workspaceId: 'ws-1',
    categoryId: 'cat-1',
    name: 'تجديد إقامة مهنية',
    description: 'تجديد الإقامة للموظفين والعمال عبر بوابة قوى ومنصة مقيم التابعة لوزارة الموارد البشرية والجوازات.',
    expectedDurationDays: 3,
    defaultServiceFee: 350,
    defaultGovernmentFee: 650,
    requiredDocuments: ['صورة الإقامة الحالية', 'فحص طبي معتمد', 'تأمين طبي ساري'],
    checklistSteps: ['التأكد من سداد المخالفات المرورية الكلية للوافد', 'سداد رسوم رخصة العمل عبر قوى', 'سداد رسوم الجوازات عبر سداد', 'طلب التجديد النهائي عبر منصة مقيم']
  },
  {
    id: 'tmpl-2',
    workspaceId: 'ws-1',
    categoryId: 'cat-1',
    name: 'نقل خدمات عامل (كفالة)',
    description: 'نقل الكفالة أو نقل الخدمات للموظفين الوافدين بين المؤسسات والشركات عبر منصة قوى.',
    expectedDurationDays: 5,
    defaultServiceFee: 800,
    defaultGovernmentFee: 2000,
    requiredDocuments: ['خطاب التنازل من الكفيل السابق مصدق', 'صورة جواز السفر والإقامة للوافد', 'موافقة قوى من الكفيل الجديد'],
    checklistSteps: ['تقديم طلب نقل الخدمات في منصة قوى', 'قبول الطلب من العامل عبر منصة أبشر الكلية', 'سداد رسوم نقل الخدمات عبر البنك', 'تحديث الإقامة وطباعتها']
  },
  {
    id: 'tmpl-3',
    workspaceId: 'ws-1',
    categoryId: 'cat-2',
    name: 'تأسيس وإصدار سجل تجاري مؤسسة',
    description: 'تأسيس السجل التجاري لفرع رئيسي أو فرعي لمؤسسة فردية عبر موقع وزارة التجارة.',
    expectedDurationDays: 2,
    defaultServiceFee: 500,
    defaultGovernmentFee: 200,
    requiredDocuments: ['الهوية الوطنية للمالك', 'عقد إيجار موقع أو صك ملكية'],
    checklistSteps: ['حجز الاسم التجاري المناسب', 'تقديم طلب إصدار سجل تجاري رئيسي', 'سداد الرسوم الحكومية والغرفة التجارية', 'تحميل السجل التجاري وطباعته للعميل']
  },
  {
    id: 'tmpl-4',
    workspaceId: 'ws-1',
    categoryId: 'cat-2',
    name: 'تعديل وتجديد سجل تجاري',
    description: 'تجديد السجل التجاري المنتهي أو تعديل الأنشطة التجارية أو تغيير اسم المدير المسؤول.',
    expectedDurationDays: 2,
    defaultServiceFee: 300,
    defaultGovernmentFee: 200,
    requiredDocuments: ['صورة السجل التجاري الحالي', 'قرار الشركاء أو المالك بالتعديل'],
    checklistSteps: ['الدخول لحساب وزارة التجارة الخاص بالمنشأة', 'اختيار تجديد السجل التجاري أو تقديم طلب التعديل', 'تحديث الأنشطة وسداد فاتورة التجديد', 'إرسال السجل المحدث للعميل']
  },
  {
    id: 'tmpl-5',
    workspaceId: 'ws-1',
    categoryId: 'cat-3',
    name: 'إصدار رخصة بلدية (بلدي)',
    description: 'إصدار أو تجديد رخصة الأنشطة التجارية للمحلات والمكاتب عبر منصة بلدي التابعة لوزارة الشؤون البلدية والقروية.',
    expectedDurationDays: 7,
    defaultServiceFee: 1200,
    defaultGovernmentFee: 500,
    requiredDocuments: ['عقد الإيجار ساري المفعول', 'السجل التجاري للمنشأة', 'شهادة تركيب أدوات السلامة (الدفاع المدني)'],
    checklistSteps: ['رفع الطلب على منصة بلدي وتحديد النشاط والمساحة', 'إرفاق شهادة الدفاع المدني وصور اللوحة والموقع', 'تنسيق موعد زيارة مراقب البلدية للموقع وتجاوزها', 'سداد الرسوم البلدية المتولدة وطباعة الرخصة']
  },
  {
    id: 'tmpl-6',
    workspaceId: 'ws-1',
    categoryId: 'cat-4',
    name: 'نقل ملكية مركبة ورخصة سير',
    description: 'نقل ملكية السيارات والمركبات المختلفة بين الأفراد أو المؤسسات عبر منصة أبشر أو نظام تم مع الفحص المعتمد.',
    expectedDurationDays: 3,
    defaultServiceFee: 400,
    defaultGovernmentFee: 150,
    requiredDocuments: ['أصل رخصة السير (الاستمارة)', 'شهادة الفحص الدوري سارية المفعول', 'تأمين المركبة باسم المالك الجديد'],
    checklistSteps: ['التحقق من سداد المخالفات المرورية للبائع والمشتري', 'تنفيذ مبايعة المركبة في نظام تم أو أبشر', 'سداد الرسوم الحكومية لنقل الملكية', 'تسليم رخصة السير الجديدة للمالك']
  },
  {
    id: 'tmpl-7',
    workspaceId: 'ws-1',
    categoryId: 'cat-1',
    name: 'تأشيرة خروج وعودة',
    description: 'إصدار تأشيرات خروج وعودة مفردة أو متعددة للعمالة والموظفين عبر منصة مقيم أو أبشر أعمال.',
    expectedDurationDays: 1,
    defaultServiceFee: 150,
    defaultGovernmentFee: 200,
    requiredDocuments: ['جواز السفر ساري الصلاحية للوافد', 'الإقامة سارية المفعول'],
    checklistSteps: ['سداد رسوم التأشيرة المناسبة (مفردة/متعددة) عبر البنك', 'التحقق من صلاحية الجواز والإقامة', 'إصدار التأشيرة عبر مقيم وتحميل نسختها الإلكترونية']
  },
  {
    id: 'tmpl-8',
    workspaceId: 'ws-1',
    categoryId: 'cat-4',
    name: 'تجديد رخصة قيادة',
    description: 'تجديد رخص القيادة للأفراد بعد إجراء الفحص الطبي المعتمد وسداد الرسوم والمخالفات.',
    expectedDurationDays: 2,
    defaultServiceFee: 150,
    defaultGovernmentFee: 200,
    requiredDocuments: ['الفحص الطبي المعتمد في نظام إفادة', 'الهوية الوطنية أو الإقامة الحالية'],
    checklistSteps: ['التأكد من سداد المخالفات المرورية', 'ربط نتيجة الفحص الطبي إلكترونياً بنظام إفادة', 'طلب التجديد وإصدار الرخصة عبر أبشر', 'تنسيق تسليم رخصة القيادة الجديدة']
  }
];

export const initialClients: Client[] = [
  {
    id: 'cli-1',
    workspaceId: 'ws-1',
    fullName: 'عبدالله بن محمد القحطاني',
    clientType: 'individual',
    phone: '0551112222',
    email: 'abdullah@gmail.com',
    city: 'الرياض',
    nationalId: '1023456789',
    nationality: 'سعودي',
    notes: 'عميل دائم، يتعامل معنا في تجديد رخص سياراته والتعقيب الشخصي الخاص به.',
    status: 'active',
    createdAt: '2026-02-10T10:00:00Z',
    updatedAt: '2026-02-10T10:00:00Z'
  },
  {
    id: 'cli-2',
    workspaceId: 'ws-1',
    fullName: 'شركة النور للمقاولات العامة',
    clientType: 'company',
    phone: '0569998888',
    email: 'contact@alnoor-const.com',
    city: 'الرياض',
    commercialRegister: '1010345678',
    companyName: 'شركة النور للمقاولات العامة',
    notes: 'مكتب مقاولات لديه أكثر من 30 موظفاً وافداً، نقوم بجميع معاملاتهم بشكل دوري.',
    status: 'active',
    createdAt: '2026-01-20T11:00:00Z',
    updatedAt: '2026-01-20T11:00:00Z'
  },
  {
    id: 'cli-3',
    workspaceId: 'ws-1',
    fullName: 'مؤسسة أفق التقنية للاتصالات',
    clientType: 'company',
    phone: '0543334444',
    email: 'info@ofuqtech.sa',
    city: 'جدة',
    commercialRegister: '4030123456',
    companyName: 'مؤسسة أفق التقنية للاتصالات',
    notes: 'مؤسسة خدمات تقنية متكاملة ولدينا معهم اتفاقية سنوية لإدارة معاملات قوى ومقيم.',
    status: 'active',
    createdAt: '2026-03-01T08:30:00Z',
    updatedAt: '2026-03-01T08:30:00Z'
  },
  {
    id: 'cli-4',
    workspaceId: 'ws-1',
    fullName: 'سلطان بن عبدالرحمن آل سعود',
    clientType: 'individual',
    phone: '0505050505',
    city: 'الرياض',
    nationalId: '1000222333',
    nationality: 'سعودي',
    notes: 'يطلب خدمات رخص بلدي وإصدار السجلات للمشاريع الجديدة الخاصة به.',
    status: 'active',
    createdAt: '2026-04-12T14:20:00Z',
    updatedAt: '2026-04-12T14:20:00Z'
  },
  {
    id: 'cli-5',
    workspaceId: 'ws-1',
    fullName: 'خالد بن فهد العتيبي',
    clientType: 'individual',
    phone: '0555556666',
    email: 'khaled.f@outlook.com',
    city: 'الخرج',
    nationalId: '1054321098',
    nationality: 'سعودي',
    status: 'active',
    createdAt: '2026-05-02T09:00:00Z',
    updatedAt: '2026-05-02T09:00:00Z'
  },
  {
    id: 'cli-6',
    workspaceId: 'ws-1',
    fullName: 'صالون الأناقة الرجالي للاستثمار',
    clientType: 'company',
    phone: '0547778888',
    city: 'الرياض',
    commercialRegister: '1010777666',
    companyName: 'صالون الأناقة الرجالي',
    notes: 'مجموعة صالونات تجميل رجالية نتابع معهم التراخيص البلدية ووزارة الموارد البشرية.',
    status: 'active',
    createdAt: '2026-05-20T12:00:00Z',
    updatedAt: '2026-05-20T12:00:00Z'
  },
  {
    id: 'cli-7',
    workspaceId: 'ws-1',
    fullName: 'فهد بن غازي الحربي',
    clientType: 'individual',
    phone: '0531234567',
    city: 'المدينة المنورة',
    nationalId: '1098765432',
    nationality: 'سعودي',
    status: 'active',
    createdAt: '2026-06-11T15:00:00Z',
    updatedAt: '2026-06-11T15:00:00Z'
  },
  {
    id: 'cli-8',
    workspaceId: 'ws-1',
    fullName: 'مطعم مذاق الشام للأغذية',
    clientType: 'company',
    phone: '0562345678',
    city: 'الدمام',
    commercialRegister: '2050112233',
    companyName: 'مطعم مذاق الشام للأغذية',
    notes: 'مجموعة مطاعم، نتعامل معهم في نقل كفالات العمالة وتراخيص البلدية (بلدي).',
    status: 'active',
    createdAt: '2026-06-15T10:15:00Z',
    updatedAt: '2026-06-15T10:15:00Z'
  },
  {
    id: 'cli-9',
    workspaceId: 'ws-1',
    fullName: 'يوسف بن إبراهيم السليم',
    clientType: 'individual',
    phone: '0549876543',
    city: 'بريدة',
    nationalId: '1033221144',
    nationality: 'سعودي',
    status: 'archived', // مؤرشف لتجربة الأرشفة
    createdAt: '2026-01-15T10:00:00Z',
    updatedAt: '2026-06-30T17:00:00Z'
  },
  {
    id: 'cli-10',
    workspaceId: 'ws-1',
    fullName: 'مؤسسة ركائز الإعمار اللوجستية',
    clientType: 'company',
    phone: '0509988776',
    email: 'info@rakaiz.sa',
    city: 'الرياض',
    commercialRegister: '1010998877',
    companyName: 'مؤسسة ركائز الإعمار اللوجستية',
    notes: 'مؤسسة نقليات كبيرة نتعامل معهم بشكل مستمر في معاملات المرور ورخص النقل.',
    status: 'active',
    createdAt: '2026-07-01T09:00:00Z',
    updatedAt: '2026-07-01T09:00:00Z'
  }
];

export const initialTransactions: Transaction[] = [
  {
    id: 'tx-1',
    workspaceId: 'ws-1',
    referenceNumber: 'TX-2026-0001',
    title: 'تجديد إقامة - المهندس محمد كمال',
    clientId: 'cli-2', // شركة النور
    serviceTemplateId: 'tmpl-1',
    description: 'تجديد الإقامة السنوية لمهندس الموقع محمد كمال (مصري الجنسية) بسبب انتهاء الإقامة السابقة في نهاية الشهر الحالي.',
    assignedUserId: 'usr-2', // سلطان الدوسري
    priority: 'high',
    status: 'in_progress',
    receivedDate: '2026-07-15',
    expectedCompletionDate: '2026-07-18',
    nextFollowUpDate: '2026-07-17',
    serviceFee: 350,
    governmentFee: 650,
    extraExpenses: 0,
    totalAmount: 1000,
    receivedAmount: 1000,
    remainingAmount: 0,
    paymentStatus: 'fully_paid',
    internalNotes: 'العميل دفع المبلغ كاملاً نقداً عند استلام المعاملة.',
    checklist: [
      { id: 'tx-1-chk-1', stepName: 'التأكد من سداد المخالفات المرورية الكلية للوافد', isCompleted: true, completedBy: 'usr-2', completedAt: '2026-07-15T11:00:00Z' },
      { id: 'tx-1-chk-2', stepName: 'سداد رسوم رخصة العمل عبر قوى', isCompleted: true, completedBy: 'usr-2', completedAt: '2026-07-16T10:30:00Z' },
      { id: 'tx-1-chk-3', stepName: 'سداد رسوم الجوازات عبر سداد', isCompleted: false },
      { id: 'tx-1-chk-4', stepName: 'طلب التجديد النهائي عبر منصة مقيم', isCompleted: false }
    ],
    createdAt: '2026-07-15T09:00:00Z',
    updatedAt: '2026-07-16T10:30:00Z'
  },
  {
    id: 'tx-2',
    workspaceId: 'ws-1',
    referenceNumber: 'TX-2026-0002',
    title: 'نقل كفالة - العامل راجو كومار',
    clientId: 'cli-2', // شركة النور
    serviceTemplateId: 'tmpl-2',
    description: 'نقل خدمات العامل راجو كومار من كفيل فردي سابق إلى شركة النور للمقاولات العامة للاستفادة من خدماته بالموقع.',
    assignedUserId: 'usr-3', // خالد العتيبي
    priority: 'normal',
    status: 'waiting_docs',
    receivedDate: '2026-07-14',
    expectedCompletionDate: '2026-07-19',
    nextFollowUpDate: '2026-07-18',
    serviceFee: 800,
    governmentFee: 2000,
    extraExpenses: 50,
    totalAmount: 2850,
    receivedAmount: 1000,
    remainingAmount: 1850,
    paymentStatus: 'partially_paid',
    internalNotes: 'بانتظار خطاب التنازل المصدق من الكفيل السابق لتقديمه في قوى. تم استلام دفعة أولى 1000 ريال.',
    checklist: [
      { id: 'tx-2-chk-1', stepName: 'تقديم طلب نقل الخدمات في منصة قوى', isCompleted: false },
      { id: 'tx-2-chk-2', stepName: 'قبول الطلب من العامل عبر منصة أبشر الكلية', isCompleted: false },
      { id: 'tx-2-chk-3', stepName: 'سداد رسوم نقل الخدمات عبر البنك', isCompleted: false },
      { id: 'tx-2-chk-4', stepName: 'تحديث الإقامة وطباعتها', isCompleted: false }
    ],
    createdAt: '2026-07-14T10:00:00Z',
    updatedAt: '2026-07-14T10:15:00Z'
  },
  {
    id: 'tx-3',
    workspaceId: 'ws-1',
    referenceNumber: 'TX-2026-0003',
    title: 'إصدار رخصة بلدية - فرع صالون الأناقة الجديد',
    clientId: 'cli-6', // صالون الأناقة
    serviceTemplateId: 'tmpl-5',
    description: 'إصدار رخصة بلدية فورية للموقع الجديد لصالون الأناقة الكائن في حي الملك فهد بالرياض.',
    assignedUserId: 'usr-2', // سلطان الدوسري
    priority: 'urgent',
    status: 'in_progress',
    receivedDate: '2026-07-10',
    expectedCompletionDate: '2026-07-17',
    nextFollowUpDate: '2026-07-17',
    serviceFee: 1200,
    governmentFee: 500,
    extraExpenses: 200,
    totalAmount: 1900,
    receivedAmount: 1900,
    remainingAmount: 0,
    paymentStatus: 'fully_paid',
    internalNotes: 'المعاملة في حالة متقدمة بانتظار زيارة المراقب اليوم للتأكد من مواصفات اللوحة.',
    checklist: [
      { id: 'tx-3-chk-1', stepName: 'رفع الطلب على منصة بلدي وتحديد النشاط والمساحة', isCompleted: true, completedBy: 'usr-2', completedAt: '2026-07-10T12:00:00Z' },
      { id: 'tx-3-chk-2', stepName: 'إرفاق شهادة الدفاع المدني وصور اللوحة والموقع', isCompleted: true, completedBy: 'usr-2', completedAt: '2026-07-11T15:00:00Z' },
      { id: 'tx-3-chk-3', stepName: 'تنسيق موعد زيارة مراقب البلدية للموقع وتجاوزها', isCompleted: false },
      { id: 'tx-3-chk-4', stepName: 'سداد الرسوم البلدية المتولدة وطباعة الرخصة', isCompleted: false }
    ],
    createdAt: '2026-07-10T11:00:00Z',
    updatedAt: '2026-07-11T15:00:00Z'
  },
  {
    id: 'tx-4',
    workspaceId: 'ws-1',
    referenceNumber: 'TX-2026-0004',
    title: 'نقل ملكية سيارة لاندكروزر 2024',
    clientId: 'cli-1', // عبدالله القحطاني
    serviceTemplateId: 'tmpl-6',
    description: 'نقل ملكية سيارة لاندكروزر من العميل عبدالله القحطاني للمشتري الجديد مع إنهاء إجراءات الفحص والتبايع نظام تم.',
    assignedUserId: 'usr-3', // خالد العتيبي
    priority: 'normal',
    status: 'completed',
    receivedDate: '2026-07-11',
    expectedCompletionDate: '2026-07-14',
    completedDate: '2026-07-14',
    serviceFee: 400,
    governmentFee: 150,
    extraExpenses: 0,
    totalAmount: 550,
    receivedAmount: 550,
    remainingAmount: 0,
    paymentStatus: 'fully_paid',
    internalNotes: 'تم نقل الملكية بنجاح وتسليم الرخصة والمفاتيح للمشتري والعميل راضٍ جداً.',
    checklist: [
      { id: 'tx-4-chk-1', stepName: 'التحقق من سداد المخالفات المرورية للبائع والمشتري', isCompleted: true, completedBy: 'usr-3', completedAt: '2026-07-12T10:00:00Z' },
      { id: 'tx-4-chk-2', stepName: 'تنفيذ مبايعة المركبة في نظام تم أو أبشر', isCompleted: true, completedBy: 'usr-3', completedAt: '2026-07-13T09:15:00Z' },
      { id: 'tx-4-chk-3', stepName: 'سداد الرسوم الحكومية لنقل الملكية', isCompleted: true, completedBy: 'usr-3', completedAt: '2026-07-13T12:00:00Z' },
      { id: 'tx-4-chk-4', stepName: 'تسليم رخصة السير الجديدة للمالك', isCompleted: true, completedBy: 'usr-3', completedAt: '2026-07-14T14:30:00Z' }
    ],
    createdAt: '2026-07-11T09:00:00Z',
    updatedAt: '2026-07-14T14:30:00Z'
  },
  {
    id: 'tx-5',
    workspaceId: 'ws-1',
    referenceNumber: 'TX-2026-0005',
    title: 'تأسيس سجل تجاري - صالون الأناقة النسائي',
    clientId: 'cli-6', // صالون الأناقة
    serviceTemplateId: 'tmpl-3',
    description: 'تأسيس السجل التجاري الفرعي لصالون الأناقة النسائي بالرياض لاستكمال شروط رخصة بلدي والتأمينات.',
    assignedUserId: 'usr-2', // سلطان الدوسري
    priority: 'normal',
    status: 'new',
    receivedDate: '2026-07-18',
    expectedCompletionDate: '2026-07-20',
    serviceFee: 500,
    governmentFee: 200,
    extraExpenses: 0,
    totalAmount: 700,
    receivedAmount: 0,
    remainingAmount: 700,
    paymentStatus: 'unpaid',
    internalNotes: 'معاملة جديدة تم استلام تفاصيلها اليوم، بانتظار سداد الدفعة الأولى قبل تفعيل حجز الاسم التجاري.',
    checklist: [
      { id: 'tx-5-chk-1', stepName: 'حجز الاسم التجاري المناسب', isCompleted: false },
      { id: 'tx-5-chk-2', stepName: 'تقديم طلب إصدار سجل تجاري رئيسي', isCompleted: false },
      { id: 'tx-5-chk-3', stepName: 'سداد الرسوم الحكومية والغرفة التجارية', isCompleted: false },
      { id: 'tx-5-chk-4', stepName: 'تحميل السجل التجاري وطباعته للعميل', isCompleted: false }
    ],
    createdAt: '2026-07-18T10:00:00Z',
    updatedAt: '2026-07-18T10:00:00Z'
  },
  {
    id: 'tx-6',
    workspaceId: 'ws-1',
    referenceNumber: 'TX-2026-0006',
    title: 'خروج وعودة - عمال المطعم (3 عمال)',
    clientId: 'cli-8', // مطعم مذاق الشام
    serviceTemplateId: 'tmpl-7',
    description: 'إصدار تأشيرة خروج وعودة متعددة لمدة 60 يوماً لكل من العمال: أحمد عبد الهادي، سامر الحمصي، وشادي اليوسف.',
    assignedUserId: 'usr-3', // خالد العتيبي
    priority: 'normal',
    status: 'completed',
    receivedDate: '2026-07-12',
    expectedCompletionDate: '2026-07-13',
    completedDate: '2026-07-13',
    serviceFee: 450, // 150 * 3
    governmentFee: 600, // 200 * 3
    extraExpenses: 0,
    totalAmount: 1050,
    receivedAmount: 1050,
    remainingAmount: 0,
    paymentStatus: 'fully_paid',
    checklist: [
      { id: 'tx-6-chk-1', stepName: 'سداد رسوم التأشيرة المناسبة (مفردة/متعددة) عبر البنك', isCompleted: true, completedBy: 'usr-3', completedAt: '2026-07-12T14:00:00Z' },
      { id: 'tx-6-chk-2', stepName: 'التحقق من صلاحية الجواز والإقامة', isCompleted: true, completedBy: 'usr-3', completedAt: '2026-07-12T15:30:00Z' },
      { id: 'tx-6-chk-3', stepName: 'إصدار التأشيرة عبر مقيم وتحميل نسختها الإلكترونية', isCompleted: true, completedBy: 'usr-3', completedAt: '2026-07-13T10:00:00Z' }
    ],
    createdAt: '2026-07-12T11:00:00Z',
    updatedAt: '2026-07-13T10:00:00Z'
  },
  {
    id: 'tx-7',
    workspaceId: 'ws-1',
    referenceNumber: 'TX-2026-0007',
    title: 'تجديد رخصة قيادة - خالد فهد',
    clientId: 'cli-5', // خالد فهد العتيبي
    serviceTemplateId: 'tmpl-8',
    description: 'تجديد رخصة القيادة الخاصة بالعميل خالد العتيبي بعد اجتيازه الفحص الطبي وربطه إلكترونياً بنظام أبشر.',
    assignedUserId: 'usr-3', // خالد العتيبي
    priority: 'low',
    status: 'pending',
    receivedDate: '2026-07-16',
    expectedCompletionDate: '2026-07-18',
    nextFollowUpDate: '2026-07-18',
    serviceFee: 150,
    governmentFee: 200,
    extraExpenses: 0,
    totalAmount: 350,
    receivedAmount: 150,
    remainingAmount: 200,
    paymentStatus: 'partially_paid',
    internalNotes: 'تم حجز الفحص الطبي للعميل في مجمع أضواء الطبي وسيسافر لإجرائه اليوم. متبقي 200 ريال رسوم حكومية سيسددها عند الإنجاز.',
    checklist: [
      { id: 'tx-7-chk-1', stepName: 'التأكد من سداد المخالفات المرورية', isCompleted: true, completedBy: 'usr-3', completedAt: '2026-07-16T12:00:00Z' },
      { id: 'tx-7-chk-2', stepName: 'ربط نتيجة الفحص الطبي إلكترونياً بنظام إفادة', isCompleted: false },
      { id: 'tx-7-chk-3', stepName: 'طلب التجديد وإصدار الرخصة عبر أبشر', isCompleted: false },
      { id: 'tx-7-chk-4', stepName: 'تنسيق تسليم رخصة القيادة الجديدة', isCompleted: false }
    ],
    createdAt: '2026-07-16T11:00:00Z',
    updatedAt: '2026-07-16T12:00:00Z'
  },
  {
    id: 'tx-8',
    workspaceId: 'ws-1',
    referenceNumber: 'TX-2026-0008',
    title: 'تجديد إقامة - السائق الخاص فالح الشمري',
    clientId: 'cli-4', // سلطان آل سعود
    serviceTemplateId: 'tmpl-1',
    description: 'تجديد إقامة السائق الخاص سمير خان لصالح كفيله سلطان آل سعود، وتجديد تأمينه الطبي وسداد رسومه.',
    assignedUserId: 'usr-2', // سلطان الدوسري
    priority: 'high',
    status: 'waiting_docs',
    receivedDate: '2026-07-13',
    expectedCompletionDate: '2026-07-16',
    serviceFee: 350,
    governmentFee: 600,
    extraExpenses: 0,
    totalAmount: 950,
    receivedAmount: 0,
    remainingAmount: 950,
    paymentStatus: 'unpaid',
    internalNotes: 'بانتظار سداد رسوم التجديد من المالك مباشرة في حسابه بأبشر، حيث تعذر السداد عبر مكتبنا مؤقتاً.',
    checklist: [
      { id: 'tx-8-chk-1', stepName: 'التأكد من سداد المخالفات المرورية الكلية للوافد', isCompleted: true, completedBy: 'usr-2', completedAt: '2026-07-13T11:00:00Z' },
      { id: 'tx-8-chk-2', stepName: 'سداد رسوم رخصة العمل عبر قوى', isCompleted: false },
      { id: 'tx-8-chk-3', stepName: 'سداد رسوم الجوازات عبر سداد', isCompleted: false },
      { id: 'tx-8-chk-4', stepName: 'طلب التجديد النهائي عبر منصة مقيم', isCompleted: false }
    ],
    createdAt: '2026-07-13T09:30:00Z',
    updatedAt: '2026-07-13T11:00:00Z'
  },
  {
    id: 'tx-9',
    workspaceId: 'ws-1',
    referenceNumber: 'TX-2026-0009',
    title: 'تجديد سجل تجاري - ركائز الإعمار',
    clientId: 'cli-10', // ركائز الإعمار
    serviceTemplateId: 'tmpl-4',
    description: 'تجديد السجل التجاري الرئيسي لمؤسسة ركائز الإعمار اللوجستية المنتهي منذ شهرين.',
    assignedUserId: 'usr-2', // سلطان الدوسري
    priority: 'normal',
    status: 'needs_review',
    receivedDate: '2026-07-14',
    expectedCompletionDate: '2026-07-16',
    serviceFee: 300,
    governmentFee: 200,
    extraExpenses: 0,
    totalAmount: 500,
    receivedAmount: 500,
    remainingAmount: 0,
    paymentStatus: 'fully_paid',
    internalNotes: 'تم التجديد بانتظار سداد العميل لاشتراك الغرفة التجارية لتسليمه السجل مطبوعاً، العقد والرسوم مسددة بالكامل.',
    checklist: [
      { id: 'tx-9-chk-1', stepName: 'الدخول لحساب وزارة التجارة الخاص بالمنشأة', isCompleted: true, completedBy: 'usr-2', completedAt: '2026-07-14T11:00:00Z' },
      { id: 'tx-9-chk-2', stepName: 'اختيار تجديد السجل التجاري أو تقديم طلب التعديل', isCompleted: true, completedBy: 'usr-2', completedAt: '2026-07-15T10:00:00Z' },
      { id: 'tx-9-chk-3', stepName: 'تحديث الأنشطة وسداد فاتورة التجديد', isCompleted: true, completedBy: 'usr-2', completedAt: '2026-07-15T15:00:00Z' },
      { id: 'tx-9-chk-4', stepName: 'إرسال السجل المحدث للعميل', isCompleted: false }
    ],
    createdAt: '2026-07-14T10:00:00Z',
    updatedAt: '2026-07-15T15:00:00Z'
  },
  {
    id: 'tx-10',
    workspaceId: 'ws-1',
    referenceNumber: 'TX-2026-0010',
    title: 'إصدار رخصة بلدية - مطعم مذاق الشام',
    clientId: 'cli-8', // مطعم مذاق الشام
    serviceTemplateId: 'tmpl-5',
    description: 'تجديد رخصة البلدية ومراجعة الاشتراطات الصحية لفرع الدمام تجنباً للمخالفات.',
    assignedUserId: 'usr-3', // خالد العتيبي
    priority: 'high',
    status: 'pending',
    receivedDate: '2026-07-16',
    expectedCompletionDate: '2026-07-23',
    serviceFee: 1200,
    governmentFee: 500,
    extraExpenses: 0,
    totalAmount: 1700,
    receivedAmount: 0,
    remainingAmount: 1700,
    paymentStatus: 'unpaid',
    internalNotes: 'بانتظار تقرير فحص الدفاع المدني لتنصيب طفايات جديدة قبل رفع رخصة بلدي سداد الرسوم.',
    checklist: [
      { id: 'tx-10-chk-1', stepName: 'رفع الطلب على منصة بلدي وتحديد النشاط والمساحة', isCompleted: false },
      { id: 'tx-10-chk-2', stepName: 'إرفاق شهادة الدفاع المدني وصور اللوحة والموقع', isCompleted: false },
      { id: 'tx-10-chk-3', stepName: 'تنسيق موعد زيارة مراقب البلدية للموقع وتجاوزها', isCompleted: false },
      { id: 'tx-10-chk-4', stepName: 'سداد الرسوم البلدية المتولدة وطباعة الرخصة', isCompleted: false }
    ],
    createdAt: '2026-07-16T15:00:00Z',
    updatedAt: '2026-07-16T15:00:00Z'
  }
];

// Let's populate the remaining 10 transactions to hit the 20 requested by the seed data constraint!
const extraTransactions: Transaction[] = Array.from({ length: 10 }).map((_, i) => {
  const index = i + 11;
  const clientIds = ['cli-1', 'cli-2', 'cli-3', 'cli-4', 'cli-5', 'cli-6', 'cli-7', 'cli-8', 'cli-10'];
  const templateIds = ['tmpl-1', 'tmpl-3', 'tmpl-4', 'tmpl-6', 'tmpl-7', 'tmpl-8'];
  const statuses: Transaction['status'][] = ['completed', 'cancelled', 'new', 'waiting_docs', 'in_progress', 'ready', 'needs_review', 'pending'];
  const priorities: Transaction['priority'][] = ['low', 'normal', 'high', 'urgent'];
  
  const client = initialClients.find(c => c.id === clientIds[index % clientIds.length]) || initialClients[0];
  const template = initialServiceTemplates.find(t => t.id === templateIds[index % templateIds.length]) || initialServiceTemplates[0];
  const status = statuses[index % statuses.length];
  const priority = priorities[index % priorities.length];
  
  const serviceFee = template.defaultServiceFee;
  const governmentFee = template.defaultGovernmentFee;
  const totalAmount = serviceFee + governmentFee;
  const receivedAmount = status === 'completed' ? totalAmount : (status === 'new' ? 0 : Math.round(totalAmount / 2));
  const remainingAmount = totalAmount - receivedAmount;
  const paymentStatus = receivedAmount === totalAmount ? 'fully_paid' : (receivedAmount === 0 ? 'unpaid' : 'partially_paid');

  return {
    id: `tx-${index}`,
    workspaceId: 'ws-1',
    referenceNumber: `TX-2026-00${index}`,
    title: `${template.name} - ${client.fullName}`,
    clientId: client.id,
    serviceTemplateId: template.id,
    description: `معاملة تجريبية مدعومة من نظام بذور رتّب الذكي لـ ${template.name}.`,
    assignedUserId: index % 2 === 0 ? 'usr-2' : 'usr-3',
    priority,
    status,
    receivedDate: `2026-07-${10 + (index % 8)}`,
    expectedCompletionDate: `2026-07-${15 + (index % 8)}`,
    completedDate: status === 'completed' ? `2026-07-${14 + (index % 4)}` : undefined,
    serviceFee,
    governmentFee,
    extraExpenses: 0,
    totalAmount,
    receivedAmount,
    remainingAmount,
    paymentStatus,
    checklist: template.checklistSteps.map((step, sIdx) => ({
      id: `tx-${index}-chk-${sIdx}`,
      stepName: step,
      isCompleted: status === 'completed' ? true : (status === 'new' ? false : sIdx < 2),
      completedBy: status === 'completed' || sIdx < 2 ? 'usr-2' : undefined,
      completedAt: status === 'completed' || sIdx < 2 ? '2026-07-16T12:00:00Z' : undefined
    })),
    createdAt: `2026-07-${10 + (index % 8)}T09:00:00Z`,
    updatedAt: `2026-07-16T12:00:00Z`
  };
});

export const initialAllTransactions: Transaction[] = [...initialTransactions, ...extraTransactions];

export const initialDocuments: AppDocument[] = [
  {
    id: 'doc-1',
    workspaceId: 'ws-1',
    clientId: 'cli-1',
    documentType: 'national_id',
    fileName: 'هوية_وطنية_عبدالله_القحطاني.pdf',
    fileSize: 420,
    issueDate: '2022-04-12',
    expiryDate: '2026-08-20', // Expiring in ~30 days!
    notes: 'أصل الهوية الوطنية الممسوحة ضوئياً للتقديم والمطابقة.',
    createdAt: '2026-02-10T10:10:00Z'
  },
  {
    id: 'doc-2',
    workspaceId: 'ws-1',
    clientId: 'cli-2',
    transactionId: 'tx-1',
    documentType: 'residence_id',
    fileName: 'إقامة_المهندس_محمد_كمال.pdf',
    fileSize: 310,
    issueDate: '2025-07-30',
    expiryDate: '2026-07-30', // Expiring very soon!
    notes: 'صورة واضحة وملونة من الإقامة السابقة للموظف لإجراء التجديد.',
    createdAt: '2026-07-15T09:15:00Z'
  },
  {
    id: 'doc-3',
    workspaceId: 'ws-1',
    clientId: 'cli-6',
    documentType: 'cr',
    fileName: 'سجل_تجاري_الأناقة.pdf',
    fileSize: 1150,
    issueDate: '2024-05-15',
    expiryDate: '2026-07-19', // Expiring in 1 day!
    notes: 'صورة السجل التجاري لصالون الأناقة، مستند للتراخيص البلدية.',
    createdAt: '2026-05-20T12:10:00Z'
  },
  {
    id: 'doc-4',
    workspaceId: 'ws-1',
    clientId: 'cli-8',
    documentType: 'license',
    fileName: 'شهادة_الدفاع_المدني_سلامة.pdf',
    fileSize: 850,
    issueDate: '2025-06-01',
    expiryDate: '2026-12-01',
    notes: 'شهادة تركيب أدوات السلامة المعتمدة لاستخراج رخص بلدي.',
    createdAt: '2026-06-15T10:30:00Z'
  }
];

export const initialTasks: Task[] = [
  {
    id: 'tsk-1',
    workspaceId: 'ws-1',
    title: 'مراجعة إدارة مرور الروضة بالرياض',
    description: 'مراجعة المرور بشكل شخصي للتحقق من قيد المخالفة المقفلة التابعة لسيارة العميل عبدالله القحطاني.',
    transactionId: 'tx-4',
    clientId: 'cli-1',
    assignedUserId: 'usr-3', // خالد
    startDate: '2026-07-18T09:00:00Z',
    dueDate: '2026-07-18T12:00:00Z',
    priority: 'high',
    status: 'in_progress',
    taskType: 'general',
    createdAt: '2026-07-17T15:00:00Z'
  },
  {
    id: 'tsk-2',
    workspaceId: 'ws-1',
    title: 'الاتصال بالمهندس محمد كمال لاستلام التفويض المصدق',
    description: 'الاتصال تلفونياً والتأكيد على تسلم ملف التفويض لإكمال نقل الكفالة في قوى.',
    transactionId: 'tx-2',
    clientId: 'cli-2',
    assignedUserId: 'usr-2', // سلطان
    startDate: '2026-07-18T13:00:00Z',
    dueDate: '2026-07-18T15:00:00Z',
    priority: 'normal',
    status: 'pending',
    taskType: 'call',
    createdAt: '2026-07-17T16:00:00Z'
  },
  {
    id: 'tsk-3',
    workspaceId: 'ws-1',
    title: 'مراجعة بلدية الشمال لتسليم مخطط الصالون الجديد',
    description: 'تسليم المخطط الهندسي المعتمد لصالون الأناقة النسائي المطبوع لمراقب رخص بلدي.',
    transactionId: 'tx-3',
    clientId: 'cli-6',
    assignedUserId: 'usr-2',
    startDate: '2026-07-18T10:00:00Z',
    dueDate: '2026-07-18T14:00:00Z',
    priority: 'high',
    status: 'pending',
    taskType: 'general',
    createdAt: '2026-07-17T16:30:00Z'
  },
  {
    id: 'tsk-4',
    workspaceId: 'ws-1',
    title: 'تحصيل بقية المستحقات - شركة النور للمقاولات',
    description: 'طلب تحصيل المبلغ المتبقي وقدره 1850 ريال لمعاملة نقل كفالة راجو كومار.',
    transactionId: 'tx-2',
    clientId: 'cli-2',
    assignedUserId: 'usr-4', // سعيد المحاسب
    startDate: '2026-07-19T09:00:00Z',
    dueDate: '2026-07-20T17:00:00Z',
    priority: 'high',
    status: 'pending',
    taskType: 'payment_collect',
    createdAt: '2026-07-17T17:00:00Z'
  }
];

export const initialPayments: Payment[] = [
  {
    id: 'pay-1',
    workspaceId: 'ws-1',
    transactionId: 'tx-1',
    amount: 1000,
    paymentDate: '2026-07-15',
    paymentMethod: 'cash',
    notes: 'تم استلام الرسوم الحكومية ومستحقات السعي والخدمة كاش من العميل فهد العتيبي.',
    recordedBy: 'أحمد بن علي المعقّب',
    createdAt: '2026-07-15T09:10:00Z'
  },
  {
    id: 'pay-2',
    workspaceId: 'ws-1',
    transactionId: 'tx-2',
    amount: 1000,
    paymentDate: '2026-07-14',
    paymentMethod: 'bank_transfer',
    referenceNumber: 'TR-BANK-99882',
    notes: 'دفعة أولى لتشغيل طلب نقل الكفالة في قوى.',
    recordedBy: 'أحمد بن علي المعقّب',
    createdAt: '2026-07-14T10:10:00Z'
  },
  {
    id: 'pay-3',
    workspaceId: 'ws-1',
    transactionId: 'tx-3',
    amount: 1900,
    paymentDate: '2026-07-10',
    paymentMethod: 'network',
    referenceNumber: 'NET-POS-0012',
    notes: 'سداد كامل شامل المصاريف الإضافية السعي بالبطاقة شبكة.',
    recordedBy: 'أحمد بن علي المعقّب',
    createdAt: '2026-07-10T11:15:00Z'
  },
  {
    id: 'pay-4',
    workspaceId: 'ws-1',
    transactionId: 'tx-4',
    amount: 550,
    paymentDate: '2026-07-11',
    paymentMethod: 'bank_transfer',
    referenceNumber: 'TR-BANK-00213',
    notes: 'سداد رسوم نقل الملكية سيارة كامري مع السعي.',
    recordedBy: 'سعيد الغامدي',
    createdAt: '2026-07-11T09:10:00Z'
  }
];

export const initialExpenses: Expense[] = [
  {
    id: 'exp-1',
    workspaceId: 'ws-1',
    title: 'شراء كراسة اشتراطات الدفاع المدني للموقع الجديد',
    amount: 200,
    expenseDate: '2026-07-11',
    category: 'مصروفات معاملات',
    transactionId: 'tx-3',
    recordedBy: 'سلطان الدوسري'
  },
  {
    id: 'exp-2',
    workspaceId: 'ws-1',
    title: 'رسوم فحص معتمد للمركبة لاندكروزر',
    amount: 150,
    expenseDate: '2026-07-12',
    category: 'مصروفات معاملات',
    transactionId: 'tx-4',
    recordedBy: 'خالد العتيبي'
  }
];

export const initialNotifications: AppNotification[] = [
  {
    id: 'not-1',
    workspaceId: 'ws-1',
    userId: 'usr-1',
    title: 'انتهاء صلاحية وثيقة عميل قريباً',
    message: 'وثيقة "سجل تجاري الأناقة" للعميل صالون الأناقة الرجالي ستنتهي صلاحيتها خلال يوم واحد (تاريخ الانتهاء 2026-07-19).',
    notificationType: 'expiry',
    isRead: false,
    createdAt: '2026-07-18T08:00:00Z'
  },
  {
    id: 'not-2',
    workspaceId: 'ws-1',
    userId: 'usr-1',
    title: 'مستندات قاربت على الانتهاء',
    message: 'هناك وثيقتان (هوية وطنية عبدالله القحطاني، وإقامة محمد كمال) ستنتهي صلاحيتهما خلال 30 يوماً.',
    notificationType: 'expiry',
    isRead: false,
    createdAt: '2026-07-18T08:15:00Z'
  },
  {
    id: 'not-3',
    workspaceId: 'ws-1',
    userId: 'usr-1',
    title: 'معاملة بانتظار تحديث منذ فترة',
    message: 'المعاملة رقم TX-2026-0002 لم يتم إضافة أي تحديث عليها منذ 5 أيام.',
    notificationType: 'overdue_transaction',
    isRead: false,
    createdAt: '2026-07-18T08:30:00Z'
  }
];

export const initialActivityLogs: ActivityLog[] = [
  {
    id: 'act-1',
    workspaceId: 'ws-1',
    userId: 'usr-1',
    userName: 'أحمد بن علي المعقّب',
    action: 'تأسيس مكتب "رتّب – مكتب المعقّب الذكي"',
    entityType: 'client',
    entityId: 'ws-1',
    createdAt: '2026-01-01T08:00:00Z'
  },
  {
    id: 'act-2',
    workspaceId: 'ws-1',
    userId: 'usr-1',
    userName: 'أحمد بن علي المعقّب',
    action: 'إضافة عميل جديد: شركة النور للمقاولات العامة',
    entityType: 'client',
    entityId: 'cli-2',
    createdAt: '2026-01-20T11:00:00Z'
  },
  {
    id: 'act-3',
    workspaceId: 'ws-1',
    userId: 'usr-1',
    userName: 'أحمد بن علي المعقّب',
    action: 'إنشاء معاملة تجديد إقامة للمهندس محمد كمال',
    entityType: 'transaction',
    entityId: 'tx-1',
    createdAt: '2026-07-15T09:00:00Z'
  },
  {
    id: 'act-4',
    workspaceId: 'ws-1',
    userId: 'usr-2',
    userName: 'سلطان الدوسري',
    action: 'تعديل حالة معاملة تجديد إقامة محمد كمال لـ "تحت الإجراء"',
    entityType: 'transaction',
    entityId: 'tx-1',
    createdAt: '2026-07-16T10:30:00Z'
  }
];

export const initialAuditLogs: AuditLog[] = [
  {
    id: 'aud-1',
    workspaceId: 'ws-1',
    userId: 'usr-1',
    userName: 'أحمد بن علي المعقّب',
    event: 'كشف وعرض رقم الهوية الوطنية الكامل للعميل عبدالله القحطاني',
    severity: 'info',
    details: 'المستخدم أحمد بن علي المعقّب قام بكشف البيانات الحساسة لأغراض تقديم الجوازات.',
    createdAt: '2026-07-18T09:12:00Z'
  }
];
