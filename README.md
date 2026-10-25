# Flying Mink · מפת הקבצים

האתר flyingmink.com מתפרסם מהריפו הזה דרך GitHub Pages.

## דף הבית

`index.html` הוא שלד בלבד. התוכן נמצא בתיקייה `_includes/home/`, ו-GitHub Pages מחבר את כל החלקים לדף אחד בכל פרסום. כדי לשנות משהו בדף הבית, פותחים רק את הקובץ של החלק הרלוונטי.

| קובץ | מה יש בו |
|---|---|
| `_includes/home/head.html` | כותרת הדף, תיאור, SEO, Schema.org, Google Analytics, גופנים |
| `_includes/home/loader.html` | מסך הטעינה |
| `_includes/home/menu.html` | כפתורים צפים, בחירת שפה, תפריט צד |
| `_includes/home/hero.html` | וידאו הפתיחה |
| `_includes/home/quiz-and-map.html` | שאלון הרחפנים + באנר המפה |
| `_includes/home/services-and-faq.html` | שירותים + באנר שאלות נפוצות |
| `_includes/home/free-course.html` | הקורס החינמי |
| `_includes/home/workshops-and-laws.html` | סדנאות ובתי ספר + באנר החוקים בחו״ל |
| `_includes/home/gallery-banner.html` | הבועה שמובילה לגלריה |
| `_includes/home/contact.html` | צור קשר |
| `_includes/home/partners.html` | שותפים |
| `_includes/home/footer.html` | פוטר |
| `_includes/home/overlays.html` | חלון ההתחברות והבוט |
| `assets/css/home.css` | העיצוב של דף הבית |
| `assets/js/home.js` | החלפת שפה, תפריט, טופס יצירת קשר, התחברות, בוט |

## עמודים

| קובץ | עמוד |
|---|---|
| `gallery.html` | גלריית צילומי אוויר |
| `quiz.html` | שאלון בחירת רחפן |
| `guides.html`, `guide-*.html` | הקורס החינמי ופרקיו |
| `schools.html` | סדנאות לבתי ספר |
| `photography.html` | הזמנת צילום אווירי |
| `program.html` | הזמנת שיעור |
| `israelmap.html` | מפת אזורי הטיסה |

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

## חשוב לדעת

- פתיחה של `index.html` בלחיצה כפולה מהמחשב תציג דף חלקי. הדף המלא נבנה רק באתר המפורסם.
- בקבצים שבתוך `_includes/home/` אסור לכתוב `{{` או `{%`. זה התחביר של Jekyll, והוא ישבור את בניית האתר.
