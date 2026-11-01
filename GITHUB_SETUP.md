# 🚀 העלאת KingBalance ל־GitHub

## אפשרות 1 — דרך האתר

1. פתחו את https://github.com/new והקימו מאגר בשם **KingBalance**.
2. חלצו את קובץ ה־ZIP שהורדתם.
3. ב־Repository החדש בחרו **Add file → Upload files**.
4. העלו את כל תוכן התיקייה KingBalance, כולל index.html, assets, docs ויתר קובצי השורש.
5. שמרו את השינויים לענף main.
6. היכנסו אל **Settings → Pages → Build and deployment**.
7. בחרו **Deploy from a branch**, הענף main, ותיקיית /(root).
8. שמרו והמתינו לקישור GitHub Pages שיופיע באזור Pages.

## אפשרות 2 — דרך Git במחשב

מתוך התיקייה KingBalance:

    git init
    git add .
    git commit -m "feat: publish KingBalance 0.0.2 wisdom cards"
    git branch -M main
    git remote add origin https://github.com/USERNAME/KingBalance.git
    git push -u origin main

החליפו USERNAME בשם המשתמש שלכם. אם המאגר כבר קיים ויש בו קבצים, בדקו את תוכנו לפני העלאה.

## הפעלה מקומית

הממשק טוען קובצי Markdown באמצעות fetch. לכן פתיחה ישירה של index.html מתוך מערכת הקבצים עלולה להיחסם על ידי הדפדפן. הפעילו שרת מקומי:

    python3 -m http.server 8000

ואז פתחו http://localhost:8000.

## בדיקת שלמות המאגר

    node scripts/check.mjs
    node --check assets/app.js
    node --check assets/markdown.js

לא נדרשת התקנת חבילות npm.

## עדכון גרסאות

1. בחרו משימות מתוך TODO.md.
2. עדכנו את מסמכי docs/ ו/או את האתר.
3. סמנו משימות שהושלמו באמת בקובץ TODO.md.
4. הוסיפו סעיף ל־CHANGELOG.md.
5. עדכנו מספר גרסה בכותרת האתר וב־README.
6. הריצו בדיקות וצרו תג Git חדש.

## פרטיות וקרדיטים

היומן האישי העתידי הוא פרויקט נפרד. כעת נשמרים מקומית רק סימוני משימות והעדפות תצוגה. הספר המקורי אינו כלול במאגר. קראו ATTRIBUTION.md לפני פרסום או הרחבת התוכן.
