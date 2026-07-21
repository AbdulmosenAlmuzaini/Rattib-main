# مخطط قاعدة البيانات - منصة «رتّب – مكتب المعقّب الذكي»

يعتمد تصميم قاعدة البيانات على محرك **PostgreSQL** وباستخدام **Drizzle ORM**. تم تخطيط الجداول لتدعم العزل التام بين المكاتب (Multi-Tenancy) من خلال الحقل `workspace_id` وتطبيق الصلاحيات بدقة.

---

## 1. الفهارس والعزل العام (Multi-Tenancy Security Indices)
*   جميع الجداول المرتبطة بمكتب أو مساحة عمل تحتوي على الحقل `workspace_id` كـ `Foreign Key` يشير لجدول `workspaces`.
*   يتم إنشاء فهرس مركب (Composite Index) يجمع بين `workspace_id` ومعرف السجل الأساسي في كل جدول لتسريع عمليات البحث وضمان العزل التام على مستوى نظام الفهرسة.

---

## 2. هيكلية الجداول (Tables Definition)

### 1. workspaces (مساحات العمل / مكاتب التعقيب)
*   `id`: serial [Primary Key]
*   `name`: varchar(255) (اسم المكتب)
*   `slug`: varchar(255) [Unique] (رابط فريد للمكتب)
*   `logo_url`: text [Nullable]
*   `branding_color`: varchar(50) [Default: '#1597B8'] (اللون الأساسي المخصص للمكتب)
*   `phone`: varchar(50) [Nullable]
*   `city`: varchar(100) [Nullable]
*   `is_active`: boolean [Default: true]
*   `created_at`: timestamp [Default: now()]
*   `updated_at`: timestamp [Default: now()]

### 2. users (المستخدمون - مسجلون عبر Firebase Auth)
*   `id`: serial [Primary Key]
*   `uid`: text [Unique, Not Null] (معرف المستخدم الفريد في Firebase Auth UID)
*   `email`: varchar(255) [Unique, Not Null]
*   `full_name`: varchar(255) [Not Null]
*   `phone`: varchar(50) [Nullable]
*   `avatar_url`: text [Nullable]
*   `is_active`: boolean [Default: true]
*   `created_at`: timestamp [Default: now()]
*   `updated_at`: timestamp [Default: now()]

### 3. roles (الأدوار)
*   `id`: serial [Primary Key]
*   `name`: varchar(100) [Unique] (اسم الدور: owner, admin, employee, accountant, viewer)
*   `description`: text [Nullable]
*   `created_at`: timestamp [Default: now()]

### 4. permissions (الصلاحيات التفصيلية)
*   `id`: serial [Primary Key]
*   `code`: varchar(100) [Unique] (مثل: `client:create`, `transaction:delete`, `payment:view`)
*   `name`: varchar(255)
*   `description`: text [Nullable]

### 5. role_permissions (ربط الأدوار بالصلاحيات التفصيلية)
*   `role_id`: integer [References roles.id]
*   `permission_id`: integer [References permissions.id]
*   [Composite Primary Key: (role_id, permission_id)]

### 6. workspace_members (أعضاء مساحة العمل - ربط المستخدمين بالمكاتب والأدوار)
*   `id`: serial [Primary Key]
*   `workspace_id`: integer [References workspaces.id, Not Null]
*   `user_id`: integer [References users.id, Not Null]
*   `role_id`: integer [References roles.id, Not Null]
*   `is_active`: boolean [Default: true]
*   `joined_at`: timestamp [Default: now()]
*   [Unique Constraint: (workspace_id, user_id)] (لا يمكن للمستخدم أن يمتلك أكثر من دور واحد في نفس مساحة العمل)

### 7. settings (إعدادات مساحة العمل التفصيلية)
*   `id`: serial [Primary Key]
*   `workspace_id`: integer [References workspaces.id, Unique, Not Null]
*   `currency`: varchar(10) [Default: 'SAR']
*   `tax_rate`: decimal(5,2) [Default: 15.00] (النسبة الضريبية الافتراضية إن وجدت)
*   `document_expiry_alert_days`: integer[] [Default: '[30, 15, 7, 1]'] (أيام التنبيه المفضلة قبل انتهاء المستندات)
*   `updated_at`: timestamp [Default: now()]

### 8. clients (العملاء)
*   `id`: serial [Primary Key]
*   `workspace_id`: integer [References workspaces.id, Not Null]
*   `full_name`: varchar(255) [Not Null]
*   `client_type`: varchar(50) [Not Null] (فرد: 'individual' / مؤسسة: 'company')
*   `phone`: varchar(50) [Not Null]
*   `email`: varchar(255) [Nullable]
*   `city`: varchar(100) [Nullable]
*   `national_id`: varchar(50) [Nullable] (رقم الهوية الوطنية - مشفر/مخفي جزئيًا بالواجهة)
*   `residence_id`: varchar(50) [Nullable] (رقم الإقامة)
*   `commercial_register`: varchar(50) [Nullable] (رقم السجل التجاري)
*   `company_name`: varchar(255) [Nullable]
*   `nationality`: varchar(100) [Nullable]
*   `notes`: text [Nullable]
*   `status`: varchar(50) [Default: 'active'] (نشط: 'active' / مؤرشف: 'archived')
*   `created_by`: integer [References users.id]
*   `updated_by`: integer [References users.id]
*   `created_at`: timestamp [Default: now()]
*   `updated_at`: timestamp [Default: now()]

### 9. service_categories (تصنيفات الخدمات العامة)
*   `id`: serial [Primary Key]
*   `workspace_id`: integer [References workspaces.id, Not Null]
*   `name`: varchar(255) [Not Null] (مثل: خدمات الجوازات، خدمات مكتب العمل، رخص بلدي، مرور)
*   `created_at`: timestamp [Default: now()]

### 10. service_templates (قوالب الخدمات)
*   `id`: serial [Primary Key]
*   `workspace_id`: integer [References workspaces.id, Not Null]
*   `category_id`: integer [References service_categories.id]
*   `name`: varchar(255) [Not Null] (مثل: تجديد إقامة، نقل خدمات، إصدار رخصة بلدية)
*   `description`: text [Nullable]
*   `expected_duration_days`: integer [Default: 3] (المدة الافتراضية المتوقعة للإنجاز)
*   `default_service_fee`: decimal(10,2) [Default: 0.00] (رسوم الخدمة الافتراضية للمكتب)
*   `default_government_fee`: decimal(10,2) [Default: 0.00] (الرسوم الحكومية الافتراضية)
*   `default_assigned_user_id`: integer [References users.id, Nullable] (الموظف المسؤول افتراضياً)
*   `created_at`: timestamp [Default: now()]
*   `updated_at`: timestamp [Default: now()]

### 11. service_template_documents (المستندات المطلوبة في قالب الخدمة)
*   `id`: serial [Primary Key]
*   `template_id`: integer [References service_templates.id, On Delete Cascade]
*   `document_type_name`: varchar(255) [Not Null] (مثل: صورة الإقامة القديمة، تفويض مصدق، السجل التجاري)
*   `is_mandatory`: boolean [Default: true]

### 12. service_template_steps (خطوات التنفيذ الافتراضية لقالب الخدمة)
*   `id`: serial [Primary Key]
*   `template_id`: integer [References service_templates.id, On Delete Cascade]
*   `step_name`: varchar(255) [Not Null] (مثل: سداد الرسوم، التقديم عبر قوى، طباعة رخصة البلدية)
*   `step_order`: integer [Not Null]

### 13. transactions (المعاملات)
*   `id`: serial [Primary Key]
*   `workspace_id`: integer [References workspaces.id, Not Null]
*   `reference_number`: varchar(100) [Unique, Not Null] (رقم مرجعي تلقائي فريد مثل TX-2026-0001)
*   `title`: varchar(255) [Not Null] (عنوان المعاملة)
*   `client_id`: integer [References clients.id, Not Null]
*   `service_template_id`: integer [References service_templates.id, Nullable]
*   `description`: text [Nullable]
*   `assigned_user_id`: integer [References users.id, Nullable] (الموظف المسؤول)
*   `priority`: varchar(50) [Default: 'normal'] ('low', 'normal', 'high', 'urgent')
*   `status`: varchar(50) [Default: 'new'] (جديدة، بانتظار مستندات، جاهزة، تحت الإجراء، تحتاج مراجعة، معلقة، مكتملة، ملغاة)
*   `received_date`: date [Default: current_date] (تاريخ الاستلام)
*   `expected_completion_date`: date [Nullable] (الموعد المتوقع للإنجاز)
*   `next_follow_up_date`: date [Nullable] (تاريخ المتابعة القادمة)
*   `completed_date`: date [Nullable] (تاريخ الإنجاز الفعلي)
*   `service_fee`: decimal(10,2) [Default: 0.00] (رسوم الخدمة)
*   `government_fee`: decimal(10,2) [Default: 0.00] (الرسوم الحكومية)
*   `extra_expenses`: decimal(10,2) [Default: 0.00] (المصروفات الإضافية)
*   `total_amount`: decimal(10,2) [Default: 0.00] (الإجمالي = الخدمة + الحكومية + الإضافية)
*   `received_amount`: decimal(10,2) [Default: 0.00] (المبلغ المستلم)
*   `remaining_amount`: decimal(10,2) [Default: 0.00] (المبلغ المتبقي)
*   `payment_status`: varchar(50) [Default: 'unpaid'] ('unpaid', 'partially_paid', 'fully_paid', 'refunded')
*   `internal_notes`: text [Nullable]
*   `shared_notes`: text [Nullable] (الملاحظات القابلة للمشاركة مع العميل عبر الرسائل)
*   `created_by`: integer [References users.id]
*   `updated_by`: integer [References users.id]
*   `created_at`: timestamp [Default: now()]
*   `updated_at`: timestamp [Default: now()]

### 14. transaction_statuses (الحالات المخصصة للمعاملات التابعة لكل مكتب)
*   `id`: serial [Primary Key]
*   `workspace_id`: integer [References workspaces.id, Not Null]
*   `name`: varchar(100) [Not Null]
*   `color`: varchar(50) [Default: '#6B7280']
*   `display_order`: integer [Default: 0]

### 15. transaction_checklists (قائمة التحقق وخطوات المعاملة)
*   `id`: serial [Primary Key]
*   `transaction_id`: integer [References transactions.id, On Delete Cascade, Not Null]
*   `step_name`: varchar(255) [Not Null]
*   `is_completed`: boolean [Default: false]
*   `completed_by`: integer [References users.id, Nullable]
*   `completed_at`: timestamp [Nullable]
*   `display_order`: integer [Default: 0]

### 16. transaction_updates (سجل تحديثات المعاملة والخط الزمني Timeline)
*   `id`: serial [Primary Key]
*   `transaction_id`: integer [References transactions.id, On Delete Cascade, Not Null]
*   `user_id`: integer [References users.id] (من قام بالإجراء)
*   `update_type`: varchar(100) [Not Null] (تغيير حالة، إضافة ملاحظة، رفع مستند، إلخ)
*   `old_value`: text [Nullable]
*   `new_value`: text [Nullable]
*   `note`: text [Nullable]
*   `created_at`: timestamp [Default: now()]

### 17. documents (المستندات والملفات المرفوعة)
*   `id`: serial [Primary Key]
*   `workspace_id`: integer [References workspaces.id, Not Null]
*   `client_id`: integer [References clients.id, Nullable]
*   `transaction_id`: integer [References transactions.id, Nullable]
*   `document_type`: varchar(100) [Not Null] (هوية، إقامة، جواز سفر، رخصة، سجل، إلخ)
*   `file_name`: varchar(255) [Not Null]
*   `file_path`: text [Not Null] (مسار التخزين الداخلي أو معرّف S3)
*   `file_size`: integer [Not Null]
*   `mime_type`: varchar(100) [Not Null]
*   `issue_date`: date [Nullable]
*   `expiry_date`: date [Nullable] (تاريخ انتهاء صلاحية المستند)
*   `notes`: text [Nullable]
*   `created_by`: integer [References users.id]
*   `created_at`: timestamp [Default: now()]

### 18. tasks (المهام والمواعيد)
*   `id`: serial [Primary Key]
*   `workspace_id`: integer [References workspaces.id, Not Null]
*   `title`: varchar(255) [Not Null]
*   `description`: text [Nullable]
*   `transaction_id`: integer [References transactions.id, Nullable]
*   `client_id`: integer [References clients.id, Nullable]
*   `assigned_user_id`: integer [References users.id, Nullable]
*   `start_date`: timestamp [Not Null]
*   `due_date`: timestamp [Not Null]
*   `priority`: varchar(50) [Default: 'normal'] ('low', 'normal', 'high')
*   `status`: varchar(50) [Default: 'pending'] ('pending', 'in_progress', 'completed', 'overdue', 'cancelled')
*   `task_type`: varchar(100) [Default: 'general'] (مهمة، مراجعة، اتصال، تحصيل، تذكير)
*   `created_by`: integer [References users.id]
*   `created_at`: timestamp [Default: now()]
*   `updated_at`: timestamp [Default: now()]

### 19. reminders (التذكيرات المجدولة)
*   `id`: serial [Primary Key]
*   `workspace_id`: integer [References workspaces.id, Not Null]
*   `task_id`: integer [References tasks.id, Nullable]
*   `document_id`: integer [References documents.id, Nullable]
*   `reminder_date`: timestamp [Not Null]
*   `is_sent`: boolean [Default: false]
*   `created_at`: timestamp [Default: now()]

### 20. notifications (التنبيهات داخل النظام)
*   `id`: serial [Primary Key]
*   `workspace_id`: integer [References workspaces.id, Not Null]
*   `user_id`: integer [References users.id, Not Null] (الموظف المستهدف بالتنبيه)
*   `title`: varchar(255) [Not Null]
*   `message`: text [Not Null]
*   `notification_type`: varchar(100) [Not Null] (تأخر معاملة، انتهاء صلاحية مستند، مهمة جديدة)
*   `is_read`: boolean [Default: false]
*   `action_url`: text [Nullable]
*   `created_at`: timestamp [Default: now()]

### 21. payments (الدفعات المالية المقبوضة)
*   `id`: serial [Primary Key]
*   `workspace_id`: integer [References workspaces.id, Not Null]
*   `transaction_id`: integer [References transactions.id, Not Null]
*   `amount`: decimal(10,2) [Not Null]
*   `payment_date`: date [Default: current_date]
*   `payment_method`: varchar(50) [Not Null] (نقدي، تحويل بنكي، بطاقة، شبكة)
*   `reference_number`: varchar(100) [Nullable] (رقم الحوالة أو إيصال السداد)
*   `receipt_image_path`: text [Nullable]
*   `notes`: text [Nullable]
*   `recorded_by`: integer [References users.id, Not Null]
*   `created_at`: timestamp [Default: now()]

### 22. expenses (المصروفات التشغيلية للمكتب)
*   `id`: serial [Primary Key]
*   `workspace_id`: integer [References workspaces.id, Not Null]
*   `title`: varchar(255) [Not Null]
*   `amount`: decimal(10,2) [Not Null]
*   `expense_date`: date [Default: current_date]
*   `category`: varchar(100) [Nullable] (إيجار، رواتب، اشتراكات، مصروفات معاملات)
*   `transaction_id`: integer [References transactions.id, Nullable] (إذا كان المصروف مرتبطًا بمعاملة معينة)
*   `recorded_by`: integer [References users.id, Not Null]
*   `created_at`: timestamp [Default: now()]

### 23. message_templates (قوالب رسائل التواصل)
*   `id`: serial [Primary Key]
*   `workspace_id`: integer [References workspaces.id, Not Null]
*   `name`: varchar(100) [Not Null]
*   `message_type`: varchar(100) [Not Null] (مثل: 'incomplete_docs', 'status_update', 'completion_notice')
*   `template_text`: text [Not Null]
*   `created_at`: timestamp [Default: now()]

### 24. activity_logs (سجل النشاط العام للمكتب)
*   `id`: serial [Primary Key]
*   `workspace_id`: integer [References workspaces.id, Not Null]
*   `user_id`: integer [References users.id] (الموظف الذي قام بالإجراء)
*   `action`: varchar(255) [Not Null] (نوع النشاط، مثل: 'إنشاء عميل', 'حذف مستند')
*   `entity_type`: varchar(100) [Not Null] ('client', 'transaction', 'document')
*   `entity_id`: integer [Not Null]
*   `details`: jsonb [Nullable] (تفاصيل التغيير للمقارنة)
*   `ip_address`: varchar(45) [Nullable]
*   `created_at`: timestamp [Default: now()]

### 25. audit_logs (سجل الأمان للمطورين والمدراء)
*   `id`: serial [Primary Key]
*   `workspace_id`: integer [References workspaces.id, Nullable]
*   `user_id`: integer [References users.id, Nullable]
*   `event`: varchar(255) [Not Null] (مثل: 'فشل تسجيل دخول', 'عرض رقم هوية عميل كامل')
*   `severity`: varchar(50) [Default: 'info'] ('info', 'warning', 'critical')
*   `details`: jsonb [Nullable]
*   `ip_address`: varchar(45) [Nullable]
*   `user_agent`: text [Nullable]
*   `created_at`: timestamp [Default: now()]
