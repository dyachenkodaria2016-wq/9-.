# Навчальний симулятор Microsoft Access

Клієнтський навчальний вебзастосунок для знайомства з принципами роботи систем керування базами даних. Інтерфейс стилізовано під класичний Microsoft Access. Дані зберігаються локально у браузері, а база експортується у форматі SQLite з розширенням `.accdb` (це SQLite-файл для повторного відкриття саме в симуляторі, **не нативний формат Microsoft Access**).

## Можливості

- Навігація об'єктами: таблиці, запити, форми, звіти.
- Створення таблиць із типами полів, первинним ключем та автоматичним ID.
- Перегляд, додавання, редагування й видалення записів.
- Демо-база «Інтернет-магазин».
- Створення зв'язків між таблицями (1:N) та перевірка посилальної цілісності під час видалення.
- Конструктор простих запитів: вибір таблиці, поля, умови та сортування.
- SQL-режим для SELECT-запитів.
- Автоматичне створення форм і звітів.
- Друк звіту, експорт SQL, збереження/відкриття бази симулятора.
- Здавання роботи з даними учня та статистикою об'єктів.

## Важливе уточнення щодо `.accdb`

`sql.js` створює справжній файл бази SQLite у WebAssembly. Розширення `.accdb` тут використовується як навчальний контейнер для файлу SQLite, який симулятор може відкрити повторно. Він **не сумісний напряму** з Microsoft Access Desktop, оскільки `.accdb` Microsoft використовує закритий формат ACE. Для обміну SQL передбачено окремий експорт `.sql`; синтаксис SQL може потребувати адаптації перед імпортом у Access.

## Локальний запуск

Потрібен Node.js 20 або новіший.

```bash
git clone https://github.com/USERNAME/REPOSITORY.git
cd REPOSITORY
npm install
npm run dev
```

Відкрийте адресу, яку покаже Vite (зазвичай `http://localhost:5173`).

## Публікація на GitHub Pages

1. Створіть GitHub-репозиторій і завантажте до нього файли проєкту.
2. У репозиторії відкрийте **Settings → Pages**.
3. У полі **Build and deployment** виберіть **GitHub Actions**.
4. Переконайтеся, що workflow `.github/workflows/deploy.yml` присутній у вашій основній гілці (зазвичай `main`).
5. Виконайте push у цю гілку. GitHub Actions збере проєкт і опублікує папку `dist`.
6. Після успішного workflow адресу сайту буде показано в **Settings → Pages**.

`vite.config.ts` використовує `base: './'`, тому ресурси збираються з відносними шляхами й коректно завантажуються з адреси виду `https://USERNAME.github.io/REPOSITORY/`. WebAssembly-файл копіюється до `public/` автоматично під час `npm install` скриптом `postinstall`.

**Важливо:** у GitHub відкрийте `Settings → Pages` і встановіть `Source: GitHub Actions`. Не вибирайте `Deploy from a branch`. У репозиторій потрібно завантажити вміст папки проєкту, щоб `package.json`, `index.html` і папка `src/` лежали в корені репозиторію, а не всередині додаткової вкладеної папки.

## Якщо сторінка не відкривається

1. Переконайтеся, що файли проєкту розміщені в корені репозиторію.
2. Перевірте, що workflow `.github/workflows/deploy.yml` присутній у репозиторії.
3. Відкрийте вкладку `Actions` і дочекайтеся зеленого статусу `Build and deploy to GitHub Pages`. Якщо є червоний статус, відкрийте job `build` або `deploy` і перегляньте перший рядок помилки.
4. У `Settings → Pages` має бути вибрано `GitHub Actions`.
5. Відкривайте адресу, яку GitHub показує в `Settings → Pages` або в результаті job `deploy`; для звичайного репозиторію вона має вигляд `https://USERNAME.github.io/REPOSITORY/`.
6. Після успішного деплою оновіть сторінку без кешу: `Ctrl + F5`.

## Залежності та команди

- `npm run dev` — локальна розробка.
- `npm run build` — перевірка TypeScript і production-збірка.
- `npm run lint` — сувора перевірка TypeScript.
- `npm run preview` — перегляд production-збірки.
- `npm run deploy` — ручне розгортання через `gh-pages` (альтернатива; для рекомендованого GitHub Actions не потрібна).

## Структура

```text
access-learning-simulator/
├── .github/workflows/deploy.yml
├── public/
│   ├── .nojekyll
│   └── sql-wasm.wasm (створюється під час npm install)
├── src/
│   ├── components/
│   │   ├── Modal.tsx
│   │   ├── Ribbon.tsx
│   │   ├── Sidebar.tsx
│   │   └── Workspace.tsx
│   ├── hooks/
│   │   └── useDatabase.ts
│   ├── types/
│   │   └── database.ts
│   ├── utils/
│   │   ├── database.ts
│   │   └── export.ts
│   ├── App.tsx
│   ├── main.tsx
│   └── vite-env.d.ts
│   └── styles.css
├── .gitignore
├── index.html
├── package.json
├── README.md
├── tailwind.config.js
├── tsconfig*.json
└── vite.config.ts
```

## Приватність

Застосунок не надсилає дані на сервер. `localStorage` використовується для збереження навчального стану в поточному браузері. Експортований файл зберігайте окремо.
