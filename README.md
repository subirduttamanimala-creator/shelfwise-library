# Shelfwise

A responsive, browser based library desk for managing a small collection and reader loans. Built with plain HTML, CSS, and JavaScript; no build step or server is required.

## Features

- Collection dashboard with title, available copy, active loan, and overdue counts
- Search by title, author, genre, or ISBN; filter by genre and availability
- Add, edit, and remove books, with safeguards for checked out copies
- Check out available copies to readers and record a due date
- Mark books returned and browse active, returned, or all loan records
- Export the collection as CSV
- Saves records in the current browser using local storage
- Responsive layout for desktop, tablet, and mobile

## Run locally

Open `index.html` in a modern browser. Your collection is saved in that browser on that device. Use the export button to make a CSV backup before clearing browser data or moving to another device.

The first visit starts with a few example books and loans so the dashboard is ready to explore. To start with an empty library, clear the `shelfwise-library-v1` entry from the browser's local storage.

## Publish with GitHub Pages

1. Create a public GitHub repository and add these project files to its root.
2. In the repository, open **Settings → Pages** and select **GitHub Actions** as the build and deployment source.
3. The included workflow publishes the site on every push to the `main` branch. The first run can take a minute or two.
4. Your site URL will be `https://YOUR-USERNAME.github.io/YOUR-REPOSITORY/`.

## Project files

- `index.html` — accessible page structure and dialogs
- `style.css` — responsive visual design
- `app.js` — collection, search, loan tracking, and local storage logic
- `.github/workflows/pages.yml` — static GitHub Pages deployment

## Notes

This is a front-end demonstration. Data stays in the browser's local storage; it does not sync between users or devices and does not use a hosted database.

