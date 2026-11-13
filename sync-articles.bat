@echo off
chcp 65001 > nul
echo ========================================================
echo  تحديث ومزامنة مقالات فيسبوك - د. يحيى المرهبي
echo ========================================================
echo.
echo جاري جلب أحدث المقالات من صفحة الفيسبوك وتنزيل الصور...
echo.

node "%~dp0scripts\sync-facebook.js"

if errorlevel 1 (
    echo.
    echo [خطأ] حدث خطأ أثناء المزامنة. يرجى التحقق من اتصال الإنترنت.
    pause
    exit /b 1
)

echo.
echo ========================================================
echo جاري التحقق من التغييرات ورفعها إلى GitHub...
echo ========================================================
git add assets/data/article-index.js assets/data/article-content.js assets/data/core.js assets/images/articles/ sitemap.xml
git status --short

set /p PUSH_CHOICE="هل ترغب في رفع التحديثات الجديدة إلى GitHub الآن؟ (y/n): "
if /i "%PUSH_CHOICE%"=="y" (
    git commit -m "تحديث يدوي: مزامنة مقالات فيسبوك الجديدة"
    git push origin main
    echo.
    echo [نجاح] تم الرفع والمزامنة بنجاح إلى GitHub!
) else (
    echo.
    echo تم حفظ التحديثات محلياً فقط.
)

pause
