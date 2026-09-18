DH MANAGER UPGRADE
==================
ارفع محتويات هذا الملف فوق نفس المسارات في مشروع GitHub الحالي.

يستبدل:
- app/page.tsx
- app/globals.css
- app/manifest.ts

مهم:
1) لا تحذف ملفات المشروع الأخرى.
2) قاعدة Supabase يجب أن تحتوي migration الذي أضفنا فيه profiles/activity_logs/logo_url/image_url.
3) رفع الصور يستخدم bucket باسم dh-manager-media.
4) النسخة تعرض المستخدم الحالي وسجل النشاط، وتخفي رقم العميل من بطاقات القائمة.
5) هذه الحزمة لا تضع كلمة مرور الإدارة داخل الكود لأن ذلك غير آمن. قفل التعديل الآمن يحتاج route server-side + secret في Vercel، وسيتم إضافته كمرحلة منفصلة حتى لا نضع كلمة السر في المتصفح.
