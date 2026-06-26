# Project StatsPro(TM)

Project StatsPro(TM) is a responsive project tracking dashboard built with plain HTML, CSS, and JavaScript. It helps track projects, tasks, progress, priority, time logs, streaks, and category breakdowns in a polished dark/light interface.

## Features

- Responsive dashboard with sidebar navigation and off-canvas menu
- Dark and light mode toggle
- Project creation, editing, archiving, and deletion
- Task management with priority, status, notes, and time logging
- Overall progress, weekly activity, streak, priority, and category charts
- Local login, registration, email verification demo, forgot password, and profile flow
- Administrator approval flow for new users
- Admin-only reset action
- Export project data as JSON
- LocalStorage-based persistence
- Custom favicon and branded UI

## Demo Admin

This project currently uses browser LocalStorage for demo authentication.

```text
Email: admin@wts.local
Password: admin123
```

The signup verification and password reset codes are generated locally for demo purposes. To use real email delivery and secure accounts, connect the app to a backend service.

## Project Structure

```text
.
├── index.html
├── styles.css
├── app.js
├── favicon.svg
└── README.md
```

## Run Locally

Open `index.html` directly in a browser, or run a simple local server:

```bash
python3 -m http.server 8000
```

Then visit:

```text
http://localhost:8000
```

## Tech Stack

- HTML5
- CSS3
- JavaScript
- Chart.js
- Font Awesome
- Google Fonts

## Notes

This is a frontend-only demo. Data is stored in the browser using LocalStorage, so clearing browser storage will remove saved projects and users.

## Footer

All Rights Reservered | 2026 | Project StatsPro(TM)
