#!/usr/bin/env python3
"""Search-engine and AI-engine (SEO/GEO) layer for flyingmink.com.

Run from the repo root:  python3 _tools/sync_seo.py

For every page in PAGES it:
  * sets <title>, meta description and meta keywords
  * adds a canonical link (and fixes og:url) when missing or wrong
  * writes one JSON-LD block between  <!-- SEO:LD:START --> ... <!-- SEO:LD:END -->
  * optionally writes a visible FAQ section between
    <!-- SEO:FAQ:START --> ... <!-- SEO:FAQ:END -->  (placed right before `faq_before`)

The FAQ on laws.html is generated from the page's own countries-data JSON,
so after editing a country, re-run this script to refresh it.

Everything lives between markers, so the script can be re-run safely.
_tools/ is not published by GitHub Pages.
"""
import html
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SITE = "https://flyingmink.com/"
ORG = {
    "@type": "Organization",
    "@id": SITE + "#org",
    "name": "Flying Mink Drone Solutions",
    "alternateName": ["פליינג מינק", "Flying Mink"],
    "url": SITE,
    "logo": SITE + "assets/img/logo-square.png",
    "founder": {"@type": "Person", "name": "Maor Shtolz", "alternateName": "מאור שטולץ"},
    "sameAs": ["https://www.instagram.com/flyingmink"],
}
COURSE_REF = {"@type": "Course", "name": "קורס הרחפנים של Flying Mink", "url": SITE + "guides.html"}
ALL_FAQ_LINK = '<p class="fm-faq-more"><a href="faq.html">לכל השאלות הנפוצות על רחפנים ←</a></p>'

# ---------------------------------------------------------------- FAQ content
QUIZ_FAQ = [
    ("איזה רחפן כדאי לקנות למתחילים?",
     "זה תלוי בתקציב ובמה שרוצים לעשות עם הרחפן. בתקציב של עד כ-1,200 ₪ מומלץ DJI Neo 2, שוקל 151 גרם ויש לו חיישני מכשולים מכל הכיוונים. "
     "בין 1,200 ל-2,500 ₪ מומלץ DJI Lito 1, שוקל פחות מ-249 גרם, מצלם 4K ומגיע עם שלט. "
     "בין 2,500 ל-3,500 ₪ מומלץ DJI Lito X1, עם סנסור גדול יותר ווידאו 10 ביט. בין 3,500 ל-5,500 ₪ מומלץ DJI Mini 5 Pro. "
     "השאלון בדף הזה נותן המלצה אישית לפי תקציב, ניסיון ושימוש."),
    ("מה ההבדל בין DJI Lito 1 ל-DJI Lito X1?",
     "שניהם שוקלים פחות מ-249 גרם וכוללים חיישני מכשולים מכל הכיוונים. ל-Lito X1 סנסור גדול יותר (1/1.3 אינץ׳ לעומת 1/2 אינץ׳), "
     "וידאו 10 ביט עם D-Log M ו-LiDAR קדמי. בישראל Lito 1 עולה כ-1,450–2,300 ₪, ו-Lito X1 כ-2,500–3,000 ₪ בקומבו עם שלט RC 2 עם מסך."),
    ("מה ההבדל בין DJI Neo ל-DJI Neo 2?",
     "Neo 2 שוקל 151 גרם ומוסיף חיישני מכשולים מכל הכיוונים עם LiDAR, וידאו 4K עד 100fps ושליטה במחוות ובקול. "
     "עם שלט או Motion Controller הוא מגיע לטווח ארוך ותומך ב-FPV עם משקפיים. Neo המקורי (135 גרם) זול יותר, כ-600–900 ₪, "
     "ומתאים לסלפי ולכיף. Neo 2 עולה כ-1,000 ₪ לרחפן בלבד וכ-1,900 ₪ בקומבו עם שלט."),
    ("איזה רחפן FPV מתאים למתחילים?",
     "לצילום FPV סינמטי: DJI Avata 2, שמגיע עם ייצוב ומצבי טיסה שמונעים קריסה. מי שרוצה ללמוד ACRO מתחיל ברחפן Whoop קטן וסלחני "
     "כמו Happymodel Mobula 8 (כ-150–250 ₪) ובמקביל בסימולטור, ואחר כך עובר ל-GEPRC Pavo Pico או Pavo 20 Pro."),
    ("כמה עולה רחפן טוב לצילום?",
     "מתחת ל-250 גרם: DJI Mini 5 Pro עולה כ-3,000–4,500 ₪ ו-Mini 4 Pro כ-3,300–4,000 ₪. מעל 250 גרם: Air 3S עולה כ-5,500–7,500 ₪ "
     "ו-Mavic 4 Pro כ-7,900–13,500 ₪. המחירים משתנים לפי יבואן, חבילה ומבצעים."),
    ("צריך רישיון כדי להטיס רחפן מתחת ל-250 גרם?",
     "כן. מאז נובמבר 2024 כל מי שמטיס רחפן בישראל לפנאי צריך רישיון מטיסן, גם לרחפן מתחת ל-250 גרם. "
     "רחפן עד 250 גרם פטור מרישום בהטסת פנאי; רחפן מעל 250 גרם חייב גם ברישום ברשות התעופה האזרחית."),
]

LIFT_FAQ = [
    ("איך מטוס נשאר באוויר?",
     "הכנף בנויה ומוטה כך שהיא מסיטה את האוויר שזורם סביבה כלפי מטה. כתוצאה מכך הלחץ מעל הכנף נמוך מהלחץ שמתחתיה, "
     "וההפרש יוצר כוח עילוי כלפי מעלה. כל עוד העילוי שווה למשקל המטוס, המטוס נשאר באוויר. המנועים לא מרימים את המטוס ישירות: "
     "הם יוצרים דחף שמתגבר על הגרר ושומר על מהירות, והמהירות היא שמאפשרת לכנף לייצר עילוי."),
    ("איך רחפן נשאר באוויר בלי כנפיים?",
     "המדחפים של הרחפן הם בעצם כנפיים קטנות שמסתובבות. כל להב יוצר עילוי בדיוק כמו כנף של מטוס, וכל המדחפים יחד דוחפים אוויר "
     "כלפי מטה ומחזיקים את הרחפן. בקר הטיסה משנה את מהירות כל מנוע מאות פעמים בשנייה כדי לשמור על איזון, והמדחפים מסתובבים "
     "בזוגות בכיוונים הפוכים כדי שהרחפן לא יסתובב סביב עצמו."),
    ("מהם ארבעת הכוחות שפועלים על כלי טיס?",
     "עילוי (כלפי מעלה), משקל (כלפי מטה), דחף (קדימה) וגרר (התנגדות האוויר, אחורה). בטיסה ישרה ויציבה העילוי מאזן את המשקל "
     "והדחף מאזן את הגרר."),
    ("מה זה עקרון ברנולי ואיך הוא קשור לכנף?",
     "לפי עקרון ברנולי, בזרימת אוויר הלחץ נמוך יותר במקום שבו המהירות גבוהה יותר. האוויר מעל הכנף זורם מהר יותר מהאוויר שמתחתיה, "
     "ולכן הלחץ מעליה נמוך יותר. זה חלק אחד מההסבר לעילוי; החלק המשלים הוא שהכנף מסיטה אוויר כלפי מטה, ולפי החוק השלישי של ניוטון "
     "האוויר דוחף אותה כלפי מעלה."),
    ("מה זו זווית התקפה?",
     "הזווית בין הכנף לבין כיוון זרימת האוויר שפוגע בה. הגדלת הזווית מגדילה את העילוי, אבל רק עד גבול מסוים."),
    ("מה זו הזדקרות (Stall)?",
     "כשזווית ההתקפה גדולה מדי, האוויר מפסיק לזרום בצמוד לחלק העליון של הכנף ומתנתק ממנה. העילוי צונח בבת אחת והמטוס מתחיל "
     "לאבד גובה. לכן טייסים שומרים על מהירות וזווית בטוחות, בעיקר בהמראה ובנחיתה."),
    ("מה נוסחת העילוי?",
     "L = ½·ρ·V²·S·Cl — העילוי תלוי בצפיפות האוויר (ρ), בריבוע המהירות (V²), בשטח הכנף (S) ובמקדם העילוי (Cl), שתלוי בצורת הכנף "
     "ובזווית ההתקפה. הכפלת המהירות מגדילה את העילוי פי ארבעה."),
]

GNSS_FAQ = [
    ("איך הרחפן יודע איפה הוא נמצא?",
     "מקלט ה-GNSS ברחפן קולט אותות מלוויינים. כל לוויין משדר את מיקומו ואת השעה המדויקת שבה שלח את האות. מהזמן שלקח לאות להגיע "
     "הרחפן מחשב את המרחק לכל לוויין, ומהמרחקים לכמה לוויינים יחד הוא מחשב את מיקומו (טרילטרציה). למיקום תלת-ממדי ולתיקון "
     "שגיאת השעון של המקלט צריך לפחות ארבעה לוויינים."),
    ("מה ההבדל בין GPS ל-GNSS?",
     "GNSS הוא השם הכללי לכל מערכות הניווט הלוויני. GPS היא המערכת האמריקאית, ולצידה פועלות GLONASS (רוסיה), Galileo (אירופה) "
     "ו-BeiDou (סין). רחפנים מודרניים קולטים כמה מערכות במקביל, וכך רואים יותר לוויינים ומקבלים מיקום מהיר ויציב יותר."),
    ("מה זה מצב ATTI ברחפן?",
     "מצב שבו הרחפן לא משתמש בלוויינים כדי להחזיק מיקום. הוא עדיין שומר על גובה ויציבות, אבל נסחף עם הרוח, ופונקציות כמו חזרה "
     "הביתה לא זמינות. הרחפן עלול לעבור ל-ATTI כשהקליטה חלשה או כשיש הפרעה, ואז צריך להטיס ידנית ובזהירות."),
    ("מה זה RTK?",
     "שיטת תיקון שמשתמשת בתחנת בסיס עם מיקום ידוע כדי לתקן את שגיאות ה-GNSS בזמן אמת ולהגיע לדיוק של סנטימטרים במקום מטרים. "
     "משתמשים בה במיפוי, במדידות ובחקלאות."),
    ("כמה זמן לחכות לפני המראה?",
     "עד שאפליקציית הטיסה מאשרת שנקודת הבית (Home Point) נרשמה. בלי נקודת בית מעודכנת, מנגנון החזרה הביתה לא יחזיר את הרחפן "
     "למקום הנכון."),
]

RTH_FAQ = [
    ("מה זה RTH ברחפן?",
     "RTH (Return to Home) הוא מנגנון שמחזיר את הרחפן אוטומטית לנקודת ההמראה (Home Point) ומנחית אותו: הרחפן מטפס לגובה החזרה "
     "שהוגדר, טס בחזרה לפי הלוויינים ונוחת."),
    ("מתי RTH מופעל אוטומטית?",
     "בשלושה מצבים: כשהמטיס לוחץ על כפתור החזרה (Smart RTH), כשהקשר עם השלט אובד (Failsafe RTH), וכשהסוללה מגיעה לרמה שמספיקה "
     "רק כדי לחזור (Low Battery RTH)."),
    ("לאיזה גובה להגדיר RTH?",
     "גבוה מהמכשול הגבוה ביותר באזור הטיסה — עצים, בניינים ועמודי חשמל — כדי שהרחפן לא יפגע בהם בדרך חזרה. בישראל הגובה המרבי "
     "בהטסת פנאי הוא 50 מטר מעל פני השטח, אלא אם נקבע אחרת לאזור."),
    ("RTH עובד גם בלי GPS?",
     "לא באופן אמין. RTH מבוסס על המיקום מהלוויינים ועל נקודת בית שנרשמה לפני ההמראה. במצב ATTI או בלי קליטת לוויינים הרחפן לא "
     "יודע לאן לחזור."),
    ("יש RTH ברחפני FPV?",
     "ברוב רחפני ה-FPV אין חזרה הביתה מובנית, ואובדן קליטה עלול להסתיים בנפילה. ברחפני DJI כמו Avata 2 ו-Neo 2 יש מנגנון חזרה."),
]

SCHOOLS_FAQ = [
    ("יש מקום שעושה סדנאות רחפנים לבתי ספר?",
     "כן. Flying Mink מעבירה סדנאות רחפנים לבתי ספר יסודיים, לחטיבות ביניים, לתיכונים ולמכינות קדם-צבאיות, מסדנה של מפגש אחד ועד "
     "תוכנית של חמישה מפגשים. התלמידים לומדים איך רחפן טס, מטיסים בעצמם בפיקוח מדריך, ומכירים צילום אווירי, FPV ובטיחות. את "
     "הסדנאות מעביר מפעיל רחפנים עם רישיון מסחרי ורקע מבצעי."),
    ("מה לומדים בסדנת רחפנים בבית ספר?",
     "איך רחפן טס (אווירודינמיקה וחיישנים), הטסה מעשית ותרגילי שליטה, בטיחות וחוקי הטסה, צילום אווירי, FPV וסימולטורים. בסדנאות "
     "לנוער ולמכינות מוסיפים היכרות עם השימוש ברחפנים בשדה הקרב ועם איומי רחפנים."),
    ("מאיזה גיל ילדים יכולים להשתתף בסדנת רחפנים?",
     "מגילאי בית הספר היסודי ועד התיכון והמכינות הקדם-צבאיות, עם תכנים מותאמים לכל גיל. ילדים מתחת לגיל 12 מטיסים רק בהשגחה "
     "צמודה, ובסדנה ההטסה מתבצעת תמיד בפיקוח מדריך."),
    ("יש גם ימי שיא והפעלות רחפנים?",
     "כן. מלבד סדנאות ותוכניות קבועות, Flying Mink מעבירה ימי שיא והפעלות רחפנים לקבוצות בכל הגילאים. לתיאום פונים בוואטסאפ."),
]

PROGRAM_FAQ = [
    ("כמה עולה שיעור פרטי בהטסת רחפן?",
     "שיעור פרטי של שעה וחצי לאדם אחד עולה 500 ₪. השיעור כולל טיסת היכרות ויסודות של טיסה בטוחה וצילום, מצגת הדרכה אחד על אחד, "
     "מעבר על חוקים חשובים וטיפים, גישה לסרטונים מוקלטים וגישה לשיעורים שעוזרים במבחן התיאוריה לרישיון מסחרי."),
    ("צריך ניסיון קודם כדי להגיע לשיעור?",
     "לא. השיעור מתאים גם למי שלא הטיס רחפן אף פעם, ומתחיל מטיסת היכרות ומיסודות הטיסה הבטוחה."),
    ("צריך להביא רחפן לשיעור?",
     "לא. השיעור מתקיים על הרחפן של Flying Mink, כך שאפשר להתנסות לפני שקונים רחפן."),
    ("איפה מתקיים השיעור?",
     "בבועת השרון, אזור טיסה תמידי במישור החוף שמצפון לתל אביב ועד אזור חדרה. את נקודת המפגש המדויקת מתאמים בוואטסאפ."),
    ("השיעור עוזר במבחן התיאוריה לרישיון רחפן?",
     "כן. השיעור כולל גישה לשיעורים שמקלים על הבנת הנושא ועוזרים גם בלמידה למבחן התיאוריה של רישיון מסחרי. המבחן עצמו נערך "
     "מול רשות התעופה האזרחית."),
    ("לומדים בשיעור גם FPV?",
     "לא. השיעור מתמקד בהטסת רחפן צילום רגיל, בטיחות וצילום למתחילים."),
]

# Hebrew "in <country>" forms for the laws.html FAQ
IN_COUNTRY = {
    "תאילנד": "בתאילנד", "הודו": "בהודו", "הפיליפינים": "בפיליפינים", "וייטנאם": "בווייטנאם",
    "ארגנטינה": "בארגנטינה", "ברזיל": "בברזיל", "ארצות הברית": "בארצות הברית",
    "מסגרת האיחוד האירופי": "באיחוד האירופי", "בולגריה": "בבולגריה", "גאורגיה": "בגאורגיה",
    "ישראל": "בישראל", "ניו זילנד": "בניו זילנד", "אוסטרליה": "באוסטרליה", "קנדה": "בקנדה", "בריטניה": "בבריטניה",
}


def laws_faq(page_html):
    data = re.search(r'<script id="countries-data" type="application/json">(.*?)</script>', page_html, re.S)
    countries = json.loads(data.group(1))
    out = []
    for c in countries:
        where = IN_COUNTRY.get(c["nameHe"], "ב" + c["nameHe"])
        answer = c["shortAnswer"].strip()
        if c.get("lastVerified"):
            answer += f" (נבדק לאחרונה: {c['lastVerified']})"
        out.append((f"מה צריך כדי להטיס רחפן {where}?", answer))
    return out


# ---------------------------------------------------------------- page config
def faq_ld(items):
    return {"@type": "FAQPage", "mainEntity": [
        {"@type": "Question", "name": q, "acceptedAnswer": {"@type": "Answer", "text": a}} for q, a in items]}


def learning(name, desc, url, about):
    return {"@type": "LearningResource", "name": name, "description": desc, "url": url, "inLanguage": "he",
            "learningResourceType": "שיעור אינטראקטיבי", "educationalLevel": "מתחילים", "isAccessibleForFree": True,
            "about": about, "isPartOf": COURSE_REF, "publisher": {"@id": SITE + "#org"}}


def service(name, stype, desc, url, extra=None):
    d = {"@type": "Service", "name": name, "serviceType": stype, "description": desc, "url": url,
         "provider": {"@id": SITE + "#org"}, "areaServed": {"@type": "Country", "name": "Israel"}}
    d.update(extra or {})
    return d


PAGES = {
    "quiz.html": dict(
        title="איזה רחפן לקנות? שאלון התאמה אישי 2026 | Flying Mink",
        desc="איזה רחפן מתאים לי? שאלון קצר שממליץ על רחפן לפי תקציב, ניסיון ושימוש — DJI Neo 2, Lito 1, Lito X1, Mini 5 Pro, Avata 2 ורחפני FPV — עם מחירים בישראל.",
        kw="איזה רחפן לקנות, איזה רחפן מתאים לי, רחפן למתחילים, רחפן מומלץ, רחפן עד 1500 שקל, רחפן לצילום, DJI Lito X1, DJI Lito 1, DJI Neo 2, Mini 5 Pro, רחפן FPV למתחילים, השוואת רחפנים",
        faq=QUIZ_FAQ, faq_before='<div class="footer">Flying Mink Drone Solutions',
        faq_css=".container .fm-faq{padding:0;margin:40px 0;color:#e2e8f0}",
        ld=lambda f: [{"@type": "WebApplication", "name": "איזה רחפן מתאים לי? — שאלון התאמה", "url": SITE + "quiz.html",
                       "applicationCategory": "LifestyleApplication", "operatingSystem": "Web", "inLanguage": "he",
                       "isAccessibleForFree": True, "offers": {"@type": "Offer", "price": "0", "priceCurrency": "ILS"},
                       "publisher": {"@id": SITE + "#org"}}, faq_ld(f)]),
    "laws.html": dict(
        title="חוקי רחפנים בחו״ל — מה צריך כדי להטיס רחפן בכל מדינה | Flying Mink",
        desc="מה צריך כדי להטיס רחפן בחו״ל? חוקי הטסת רחפן עד 250 גרם בתאילנד, ארה״ב, אירופה, גאורגיה, בריטניה, אוסטרליה ועוד — רישום, ביטוח, מבחן ואישורים לפי מדינה.",
        kw="חוקי רחפנים בחו\"ל, להטיס רחפן בחו\"ל, רחפן בתאילנד, רחפן באירופה, רחפן בארצות הברית, רחפן בגאורגיה, רחפן בבריטניה, רחפן בהודו, רחפן בווייטנאם, רחפן בישראל, רחפן עד 250 גרם, טיסה עם רחפן לחו\"ל",
        faq="laws", faq_before='<div class="disclaimer">', faq_title="מה צריך כדי להטיס רחפן בכל מדינה?",
        ld=lambda f: [{"@type": "WebPage", "name": "חוקי רחפנים לפי מדינה", "url": SITE + "laws.html", "inLanguage": "he",
                       "about": "חוקי הטסת רחפנים לתיירים", "publisher": {"@id": SITE + "#org"}}, faq_ld(f)]),
    "lift.html": dict(
        title="איך מטוס ורחפן נשארים באוויר? כוח העילוי — מעבדה אינטראקטיבית | Flying Mink",
        desc="למה מטוס לא נופל? הסבר פשוט על כוח העילוי, עקרון ברנולי, זווית התקפה והזדקרות — ואיך רחפן נשאר באוויר בלי כנפיים. מעבדה אינטראקטיבית בעברית.",
        kw="איך מטוס נשאר באוויר, איך רחפן נשאר באוויר, כוח העילוי, עקרון ברנולי, זווית התקפה, הזדקרות, נוסחת העילוי, ארבעת הכוחות בטיסה, אווירודינמיקה לילדים, פיזיקה של טיסה",
        faq=LIFT_FAQ, faq_before="<footer>",
        ld=lambda f: [learning("כוח העילוי — מה מחזיק כלי טיס באוויר", "מעבדה אינטראקטיבית על עילוי, ברנולי, זווית התקפה והזדקרות.",
                               SITE + "lift.html", "אווירודינמיקה"), faq_ld(f)]),
    "gnss.html": dict(
        title="GPS ו-GNSS ברחפן: איך הרחפן יודע איפה הוא? | Flying Mink",
        desc="הסבר אינטראקטיבי על מערכות הניווט הלוויני של הרחפן: GPS, GLONASS, Galileo ו-BeiDou, טרילטרציה, מצב ATTI ו-RTK — עם הדמיה.",
        kw="GPS ברחפן, GNSS, מצב ATTI, RTK, איך רחפן יודע איפה הוא, Galileo, GLONASS, BeiDou, טרילטרציה, Home Point",
        faq=GNSS_FAQ, faq_before='<p class="foot-note"',
        ld=lambda f: [learning("GPS ו-GNSS: איך הרחפן יודע איפה הוא", "הסבר אינטראקטיבי על ניווט לווייני ברחפנים.",
                               SITE + "gnss.html", "ניווט לווייני"), faq_ld(f)]),
    "rth-lesson.html": dict(
        title="RTH ברחפן DJI: איך עובדת חזרה אוטומטית הביתה ואיך מגדירים | Flying Mink",
        desc="המדריך המלא ל-RTH ברחפני DJI: מתי הרחפן חוזר הביתה לבד, איך מגדירים גובה חזרה, Smart RTH, Failsafe ו-Low Battery — עם סימולטור.",
        kw="RTH, Return to Home, חזרה הביתה רחפן, גובה RTH, Failsafe, איבוד קשר עם רחפן, Home Point, הגדרות DJI Fly",
        faq=RTH_FAQ, faq_before="<!-- ══════ FOOTER ══════ -->",
        ld=lambda f: [learning("RTH — חזרה אוטומטית הביתה", "איך עובד מנגנון החזרה הביתה ברחפני DJI ואיך מגדירים אותו.",
                               SITE + "rth-lesson.html", "בטיחות טיסה"), faq_ld(f)]),
    "schools.html": dict(
        title="סדנאות רחפנים לבתי ספר ומכינות | ימי שיא והפעלות | Flying Mink",
        desc="סדנת רחפנים לבתי ספר יסודיים, חטיבות ביניים, תיכונים ומכינות קדם-צבאיות: ממפגש אחד ועד תוכנית של חמישה מפגשים, ימי שיא והפעלות. מדריך עם רישיון מסחרי ורקע מבצעי.",
        kw="סדנת רחפנים, סדנת רחפנים לבתי ספר, חוג רחפנים, יום שיא רחפנים, הפעלת רחפנים, רחפנים לילדים, סדנה למכינה קדם צבאית, תוכנית לימודים רחפנים, סדנת STEM",
        faq=SCHOOLS_FAQ, faq_before='<footer class="footer">',
        ld=lambda f: [service("סדנאות רחפנים לבתי ספר", "סדנה חינוכית",
                              "סדנאות רחפנים ותוכניות של עד חמישה מפגשים לבתי ספר ולמכינות קדם-צבאיות.", SITE + "schools.html",
                              {"audience": {"@type": "EducationalAudience", "educationalRole": "student"}}), faq_ld(f)]),
    "guides.html": dict(
        title="קורס רחפנים חינמי בעברית — מדריכים למתחילים | Flying Mink",
        desc="קורס רחפנים חינמי בעברית: איזה רחפן לקנות, חוקים ואזורי טיסה, תפעול בסיסי, RTH, GPS, כוח העילוי, צ׳קליסט לפני טיסה וקניית רחפן יד שנייה.",
        kw="קורס רחפנים, קורס רחפן חינם, ללמוד להטיס רחפן, מדריך רחפן למתחילים, הטסת רחפן, קורס רחפן אונליין",
        ld="course"),
    "photography.html": dict(
        title="צילום אווירי ברחפן — חתונות, אירועים ונדל״ן | Flying Mink",
        desc="הזמנת צילום אווירי ברחפן: חתונות ואירועים, אירועי ספורט, נדל״ן, בנייה, תדמית ותוכן לרשתות. טייס מוסמך עם רישיון מסחרי וציוד מקצועי, בכל הארץ.",
        kw="צילום אווירי, צלם רחפן, צילום רחפן לחתונה, צילום רחפן לאירוע, צילום נדל\"ן ברחפן, צילום אירועי ספורט ברחפן, צלם רחפן מחיר",
        ld=lambda f: [service("צילום אווירי ברחפן", "צילום אווירי",
                              "צילום רחפן לחתונות, אירועים, נדל״ן, בנייה ותוכן שיווקי.", SITE + "photography.html")]),
    "program.html": dict(
        title="שיעור פרטי בהטסת רחפן — הזמנה | Flying Mink",
        desc="שיעור פרטי בהטסת רחפן, אחד על אחד בבועת השרון: שעה וחצי על הרחפן של Flying Mink, 500 ₪. טיסת היכרות, חוקים, מצגת הדרכה וגישה לחומרים למבחן התיאוריה.",
        kw="שיעור רחפן, שיעור פרטי רחפן, ללמוד להטיס רחפן, שיעור רחפן מחיר, שיעור רחפן בשרון, מדריך רחפן, קורס הטסת רחפן, מבחן תיאוריה רישיון רחפן",
        faq=PROGRAM_FAQ, faq_before='<footer class="pl-foot">',
        ld=lambda f: [service("שיעור פרטי בהטסת רחפן", "הדרכת הטסה",
                              "שיעור הטסת רחפן אחד על אחד של שעה וחצי בבועת השרון, על הרחפן של Flying Mink, ללא FPV.",
                              SITE + "program.html",
                              {"areaServed": {"@type": "Place", "name": "בועת השרון, ישראל"},
                               "offers": {"@type": "Offer", "price": "500", "priceCurrency": "ILS",
                                          "url": SITE + "program.html#price",
                                          "description": "שיעור אחד, שעה וחצי, אדם אחד"}}),
                        faq_ld(f)]),
    "israelmap.html": dict(
        title="איפה מותר להטיס רחפן בישראל? מפת אזורי טיסה אינטראקטיבית | Flying Mink",
        desc="מפה אינטראקטיבית של אזורי הטיסה לרחפנים בישראל: אזורים אסורים ומוגבלים, שדות תעופה, בועות טיסה, תכנון טיסה ומזג אוויר — מבוססת על מפת התעופה הספורטיבית.",
        kw="איפה מותר להטיס רחפן, מפת אזורי טיסה, מפת תעופה ספורטיבית, אזורים אסורים לרחפן, רחפן ליד שדה תעופה, פמ\"ת, NOTAM",
        ld=lambda f: [{"@type": "WebApplication", "name": "מפת אזורי טיסה לרחפנים בישראל", "url": SITE + "israelmap.html",
                       "applicationCategory": "TravelApplication", "operatingSystem": "Web", "inLanguage": "he",
                       "isAccessibleForFree": True, "offers": {"@type": "Offer", "price": "0", "priceCurrency": "ILS"},
                       "publisher": {"@id": SITE + "#org"}}]),
    "gallery.html": dict(
        kw="צילומי רחפן, צילום אווירי, גלריית צילומי אוויר, צילום רחפן ישראל",
        ld=lambda f: [{"@type": "ImageGallery", "name": "גלריית צילומי אוויר", "url": SITE + "gallery.html",
                       "inLanguage": "he", "publisher": {"@id": SITE + "#org"}}]),
    "check.html": dict(kw="צ׳קליסט רחפן, בדיקות לפני טיסת רחפן, צ'ק ליסט רחפן, נהלי חירום רחפן, תקנות רחפנים"),
    "operation.html": dict(kw="איך מדליקים רחפן, הדלקת רחפן DJI, נוריות רחפן, עצירת מנועים, תפעול רחפן למתחילים"),
    "used-drone.html": dict(kw="רחפן יד שנייה, קניית רחפן יד 2, מה לבדוק ברחפן משומש, רחפן משומש"),
}


# ---------------------------------------------------------------- rendering
FAQ_CSS = """<style>
.fm-faq{max-width:820px;margin:48px auto;padding:0 16px;color:inherit;font-family:inherit;direction:rtl;text-align:right}
.fm-faq h2{font-size:clamp(1.3rem,3.5vw,1.7rem);font-weight:900;margin:0 0 16px;line-height:1.3}
.fm-faq details{border:1px solid color-mix(in srgb,currentColor 18%,transparent);border-radius:14px;margin:0 0 10px;
  background:color-mix(in srgb,currentColor 4%,transparent);transition:background .2s}
.fm-faq details[open]{background:color-mix(in srgb,currentColor 7%,transparent)}
.fm-faq summary{cursor:pointer;padding:14px 18px;font-weight:700;font-size:1rem;line-height:1.5;list-style:none;display:flex;gap:10px;justify-content:space-between;align-items:center}
.fm-faq summary::-webkit-details-marker{display:none}
.fm-faq summary::after{content:"+";font-size:1.3rem;line-height:1;opacity:.6;flex-shrink:0;transition:transform .2s}
.fm-faq details[open] summary::after{transform:rotate(45deg)}
.fm-faq summary:hover{opacity:.85}
.fm-faq summary:focus-visible{outline:2px solid currentColor;outline-offset:2px;border-radius:14px}
.fm-faq .fm-faq-a{padding:0 18px 16px;line-height:1.75;opacity:.88;font-size:.95rem}
.fm-faq .fm-faq-a p{margin:0}
.fm-faq-more{margin:18px 0 0;font-weight:700}
.fm-faq-more a{color:inherit;text-decoration:underline;text-underline-offset:3px}
</style>"""


def render_faq(items, title, extra_css=""):
    rows = "\n".join(
        f'<details><summary>{html.escape(q)}</summary><div class="fm-faq-a"><p>{html.escape(a)}</p></div></details>'
        for q, a in items)
    css = FAQ_CSS.replace("</style>", extra_css + "</style>") if extra_css else FAQ_CSS
    return (f'<!-- SEO:FAQ:START -->\n{css}\n<section class="fm-faq" aria-labelledby="fm-faq-title">\n'
            f'<h2 id="fm-faq-title">{html.escape(title)}</h2>\n{rows}\n{ALL_FAQ_LINK}\n</section>\n<!-- SEO:FAQ:END -->\n')


def course_ld(page_html):
    block = re.search(r"const GUIDES = \[(.*?)\];", page_html, re.S).group(1)
    parts = []
    for m in re.finditer(r'title:"([^"]+)",desc:"([^"]+)",free:true[^}]*?link:"([^"]+)"', block):
        parts.append({"@type": "LearningResource", "name": m.group(1), "description": m.group(2),
                      "url": SITE + m.group(3), "isAccessibleForFree": True, "inLanguage": "he"})
    return [{"@type": "Course", "name": "קורס הרחפנים של Flying Mink", "url": SITE + "guides.html", "inLanguage": "he",
             "description": "קורס רחפנים חינמי בעברית למתחילים: בחירת רחפן, חוקים, תפעול, בטיחות וניווט.",
             "provider": {"@id": SITE + "#org"}, "isAccessibleForFree": True,
             "hasCourseInstance": {"@type": "CourseInstance", "courseMode": "online", "courseWorkload": "PT2H"},
             "hasPart": parts}]


def set_head_tag(s, pattern, new_tag):
    """Replace the first tag matching pattern, or insert new_tag right after <title>."""
    if re.search(pattern, s):
        return re.sub(pattern, lambda _: new_tag, s, count=1)
    return re.sub(r"(</title>)", lambda m: m.group(1) + "\n" + new_tag, s, count=1)


def esc(v):
    return html.escape(v, quote=True)


def process(name, cfg):
    path = ROOT / name
    s = path.read_text(encoding="utf-8")
    url = SITE + name

    if "title" in cfg:
        if re.search(r"<title>.*?</title>", s, re.S):
            s = re.sub(r"<title>.*?</title>", lambda _: f"<title>{esc(cfg['title'])}</title>", s, count=1, flags=re.S)
        else:
            s = s.replace('<meta charset="UTF-8">', f'<meta charset="UTF-8">\n<title>{esc(cfg["title"])}</title>', 1) \
                if '<meta charset="UTF-8">' in s else re.sub(r"(<meta charset=\"utf-8\">)", lambda m: m.group(1) + f"\n<title>{esc(cfg['title'])}</title>", s, count=1, flags=re.I)
    if "desc" in cfg:
        s = set_head_tag(s, r'<meta name="description" content="[^"]*">', f'<meta name="description" content="{esc(cfg["desc"])}">')
    if "kw" in cfg:
        s = set_head_tag(s, r'<meta name="keywords" content="[^"]*">', f'<meta name="keywords" content="{esc(cfg["kw"])}">')
    s = set_head_tag(s, r'<link rel="canonical" href="[^"]*">', f'<link rel="canonical" href="{url}">')
    s = set_head_tag(s, r'<meta property="og:url" content="[^"]*">', f'<meta property="og:url" content="{url}">')

    faq_items = None
    if cfg.get("faq"):
        faq_items = laws_faq(s) if cfg["faq"] == "laws" else cfg["faq"]
        s = re.sub(r"<!-- SEO:FAQ:START -->.*?<!-- SEO:FAQ:END -->\n?", "", s, flags=re.S)
        anchor = cfg["faq_before"]
        assert s.count(anchor) >= 1, f"{name}: FAQ anchor not found"
        s = s.replace(anchor, render_faq(faq_items, cfg.get("faq_title", "שאלות נפוצות"), cfg.get("faq_css", "")) + anchor, 1)

    ld = cfg.get("ld")
    if ld:
        nodes = course_ld(s) if ld == "course" else ld(faq_items)
        graph = {"@context": "https://schema.org", "@graph": [ORG] + nodes}
        block = ('<!-- SEO:LD:START -->\n<script type="application/ld+json">\n'
                 + json.dumps(graph, ensure_ascii=False, indent=1) + "\n</script>\n<!-- SEO:LD:END -->\n")
        s = re.sub(r"<!-- SEO:LD:START -->.*?<!-- SEO:LD:END -->\n?", "", s, flags=re.S)
        s = s.replace("</head>", block + "</head>", 1)

    path.write_text(s, encoding="utf-8")
    return name


if __name__ == "__main__":
    done = [process(n, c) for n, c in PAGES.items()]
    print(f"{len(done)} pages updated: {', '.join(done)}")
