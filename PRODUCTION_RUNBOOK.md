# دليل تشغيل رتّب في الإنتاج

## المتطلبات

- خادم Linux حديث مع Docker Compose ومساحة تخزين دائمة.
- نطاق موجّه إلى الخادم، وفتح المنفذين 80 و443 فقط للعامة.
- نسخ احتياطي خارجي مشفر لا يعتمد على الخادم نفسه.
- كلمات مرور عشوائية مستقلة لقاعدة البيانات والتخزين والمالك الأول.

## النشر الأول

1. انسخ `deploy/.env.production.example` إلى `deploy/.env.production` ولا ترفعه إلى Git.
2. غيّر النطاق وجميع الأسرار. يجب ترميز كلمة مرور PostgreSQL داخل `DATABASE_URL` بصيغة URL.
3. ثبّت صور PostgreSQL وMinIO وCaddy على إصدارات أو بصمات تم اختبارها بدل الوسوم المتحركة.
4. اترك `BOOTSTRAP_PRODUCTION=true` في التشغيل الأول فقط، واضبط بيانات المكتب والمالك.
5. تحقق من الإعداد ثم شغّل الخدمات:

   ```powershell
   docker compose --env-file deploy/.env.production -f docker-compose.production.yml config
   docker compose --env-file deploy/.env.production -f docker-compose.production.yml build
   docker compose --env-file deploy/.env.production -f docker-compose.production.yml up -d
   ```

6. تأكد من اكتمال خدمة `migrate` ومن سلامة `app` و`postgres`:

   ```powershell
   docker compose --env-file deploy/.env.production -f docker-compose.production.yml ps
   docker compose --env-file deploy/.env.production -f docker-compose.production.yml logs --tail 200 app migrate caddy
   ```

7. سجّل الدخول بحساب المالك، ثم احذف قيم `BOOTSTRAP_*` و`SEED_ADMIN_PASSWORD` من ملف البيئة وأعد إنشاء خدمة التطبيق.
8. نفّذ بوابة القبول:

   ```powershell
   $env:ACCEPTANCE_BASE_URL='https://rattib.example.com'
   npm run production:check
   ```

يمكن إضافة `ACCEPTANCE_EMAIL` و`ACCEPTANCE_PASSWORD` مؤقتاً لاختبار جلسة الدخول، ثم حذفهما فوراً.

## التحديث الآمن

1. أنشئ نسخة احتياطية محققة قبل التحديث.
2. ابنِ الصورة الجديدة وشغّل بوابة CI (`lint`, `test`, `build`, `audit`).
3. شغّل `migrate` قبل تحويل التطبيق إلى الصورة الجديدة.
4. افحص `/readyz` والسجلات ثم نفّذ `production:check`.
5. لا تستخدم `prisma migrate reset` مطلقاً في الإنتاج.

## النسخ الاحتياطي اليومي

احصل على معرّف حاوية PostgreSQL ثم أنشئ النسخة:

```powershell
$dbContainer = docker compose --env-file deploy/.env.production -f docker-compose.production.yml ps -q postgres
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/backup.ps1 `
  -Container $dbContainer `
  -EnvironmentFile deploy/.env.production `
  -StorageEndpoint http://127.0.0.1:59000
```

تحقق من كل نسخة داخل قاعدة مؤقتة قبل اعتبارها صالحة، ثم انقلها مشفرة إلى موقع منفصل. السياسة المقترحة: 7 نسخ يومية، 5 أسبوعية، و12 شهرية.

## المراقبة والاستجابة

- راقب `GET /readyz` كل دقيقة، ونبّه عند ثلاث حالات فشل متتالية.
- اجمع سجل stdout JSON للتطبيق وCaddy خارج الخادم، وابحث باستخدام `requestId`.
- نبّه عند ارتفاع استجابات 5xx، امتلاء القرص، فشل النسخ، إعادة تشغيل الحاويات، أو انتهاء شهادة TLS.
- `/healthz` يقيس حياة العملية، و`/readyz` يقيس جاهزية قاعدة البيانات.
- عند حادث أمني: اعزل الخدمة، دوّر الأسرار والجلسات، احتفظ بالسجلات، واستعد آخر نسخة محققة في بيئة منفصلة أولاً.

## حدود هذا التكوين

هذا التكوين مناسب لخادم إنتاج واحد. التوافر العالي الحقيقي يتطلب PostgreSQL مُداراً متعدد المناطق، وتخزين S3 مُداراً مع versioning، وموازن حمل، ومراقبة خارجية مستقلة.
