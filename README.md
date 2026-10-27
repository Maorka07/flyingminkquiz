# Flying Mink · מפת הקבצים

האתר flyingmink.com מתפרסם מהריפו הזה דרך GitHub Pages.

## דף הבית

`index.html` הוא שלד בלבד. התוכן נמצא בתיקייה `_includes/home/`, ו-GitHub Pages מחבר את כל החלקים לדף אחד בכל פרסום. כדי לשנות משהו בדף הבית, פותחים רק את הקובץ של החלק הרלוונטי.

| קובץ | מה יש בו |
|---|---|
| `_includes/home/head.html` | כותרת הדף, תיאור, SEO, Schema.org, Google Analytics, גופנים |
| `_includes/home/loader.html` | מסך הטעינה |
| `_includes/home/menu.html` | כפתורים צפים, בחירת שפה, סמל נגישות, תפריט צד |
| `_includes/home/hero.html` | וידאו הפתיחה |
| `_includes/home/quiz-and-map.html` | הבועות הראשונות: שאלון הרחפנים, שאלות נפוצות, המפה, הצ׳קליסט |
| `_includes/home/services-and-faq.html` | שירותים (באנר השאלות הנפוצות עבר ל-quiz-and-map) |
| `_includes/home/free-course.html` | הקורס החינמי |
| `_includes/home/workshops-and-laws.html` | סדנאות ובתי ספר + באנר החוקים בחו״ל |
| `_includes/home/gallery-banner.html` | הבועה שמובילה לגלריה |
| `_includes/home/contact.html` | צור קשר |
| `_includes/home/partners.html` | שותפים |
| `_includes/home/footer.html` | פוטר, כולל הקישור למדיניות הפרטיות |
| `_includes/home/whatsapp-fab.html` | כפתור הוואטסאפ הצף (במקום הבוט) |
| `assets/css/home.css` | העיצוב של דף הבית |
| `assets/js/home.js` | החלפת שפה, תפריט, טופס יצירת קשר |

## עמודים

| קובץ | עמוד |
|---|---|
| `gallery.html` | גלריית צילומי אוויר |
| `quiz.html` | שאלון בחירת רחפן |
| `faq.html` | שאלות נפוצות |
| `laws.html` | חוקי הטסה לפי מדינה (WorldLaws) |
| `schools.html` | סדנאות לבתי ספר |
| `check.html` | צ׳קליסט לפני, במהלך ואחרי טיסה |
| `guides.html`, `guide-*.html` | הקורס החינמי ופרקיו |
| `operation.html` | תפעול בסיסי: הדלקה, כיבוי, נוריות |
| `used-drone.html` | מדריך לקניית רחפן יד 2 |
| `rth-lesson.html` | RTH: חזרה אוטומטית הביתה |
| `gnss.html` | GPS ו-GNSS |
| `lift.html` | כוח העילוי |
| `photography.html` | הזמנת צילום אווירי |
| `program.html` | הזמנת שיעור |
| `israelmap.html` | מפת אזורי הטיסה |
| `privacy.html` | תקנון, תנאי שימוש ומדיניות פרטיות (קישור מהפוטר ומטופס יצירת הקשר) |
| `accessibility.html` | הצהרת נגישות (קישור מסמל הנגישות בראש דף הבית) |
| `assets/css/legal.css` | העיצוב המשותף לשני העמודים האלה |

## סרגל הניווט האחיד

כל עמוד חוץ מדף הבית מתחיל באותו סרגל: תמונת המינק מהלוגו, חזרה לקורס (רק בעמודי הקורס), חזרה לדף הבית, וואטסאפ ואינסטגרם.

| קובץ | מה יש בו |
|---|---|
| `assets/css/site-nav.css` | העיצוב של הסרגל ושל כפתור הוואטסאפ הצף |
| `assets/img/mink-mark.webp` | המינק מהלוגו, חתוך על רקע שקוף |
| `_tools/site-nav.html` | הקוד של הסרגל (מקור אחד לכל העמודים) |
| `_tools/sync_site_nav.py` | מעתיק את הסרגל לכל העמודים: `python3 _tools/sync_site_nav.py` |

בכל עמוד הסרגל נמצא בין `<!-- FM-NAV:START -->` ל-`<!-- FM-NAV:END -->`. בעמודי הקורס כתוב `FM-NAV:START course`, וזה מה שמוסיף את כפתור החזרה לקורס. עמוד חדש מקבל את הסרגל כשמוסיפים לו את שתי השורות האלה ומריצים את הסקריפט.

עמודי הקורס מקושרים מ-`guides.html`. הצ׳קליסט מקושר גם מבאנר בדף הבית, מתחת לבאנר המפה.

## תמונות ווידאו

| תיקייה | מה יש בה |
|---|---|
| `assets/img/` | תמונת הרקע של הפתיחה, רקע האתר, לוגו קטן |
| `assets/video/hero.mp4` | וידאו הפתיחה (גרסה דחוסה) |
| `assets/gallery/` | תמונות הגלריה בגודל מלא |
| `assets/gallery/thumbs/` | אותן תמונות בגודל קטן, לרשת הגלריה |

## הוספת תמונה לגלריה

1. גרסה גדולה (רוחב עד 1920 פיקסלים) נכנסת ל-`assets/gallery/NAME.jpg`, וגרסה קטנה (רוחב 720) ל-`assets/gallery/thumbs/NAME.jpg`.
2. מוסיפים שורה אחת לרשימה `GALLERY_PHOTOS` בראש הסקריפט ב-`gallery.html`.

## ארכיון

התיקייה `_archive/` שמורה בריפו ולא מתפרסמת באתר. כרגע יש בה את הבוט (`_archive/bot/`), עם הוראות להחזרה.

## חשוב לדעת

- כשמשנים משהו באתר שקשור לאיסוף מידע (טופס חדש, כלי מדידה, שירות חיצוני) או לנגישות, צריך לעדכן גם את `privacy.html` או את `accessibility.html` ואת תאריך העדכון שבראשם.

- הצ׳קליסט (`check.html`) מצפה גם לקבצים `check-sw.js`, `check.webmanifest` ולאייקונים `check-icon-*.png`. בלעדיהם הדף עובד, אבל לא יעבוד בלי אינטרנט ולא יהיה אפשר להתקין אותו כאפליקציה.

- פתיחה של `index.html` בלחיצה כפולה מהמחשב תציג דף חלקי. הדף המלא נבנה רק באתר המפורסם.
- בקבצים שבתוך `_includes/home/` אסור לכתוב `{{` או `{%`. זה התחביר של Jekyll, והוא ישבור את בניית האתר.
