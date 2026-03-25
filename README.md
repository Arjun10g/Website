# Stylish Key-Work Website

A single-page, modern portfolio site focused on your key projects, measurable outcomes, and professional positioning.

## Edit your content

Open `script.js` and update:

- `siteContent.meta` for name, title, about text, and contact details
- `siteContent.metrics` for top impact numbers
- `siteContent.featuredWork` for your three most important projects
- `siteContent.focusAreas` for your core strengths

## Run locally

You can open `index.html` directly, or run a local server:

```bash
cd /Users/arjunghumman/Downloads/VS Code Stuff/Web Dev/Web Dev/Website2
python3 -m http.server 8080
```

Then visit: http://localhost:8080

## Deploy options

### Option 1: Netlify (fastest)

1. Create a new GitHub repository and push this folder.
2. In Netlify, choose **Add new site** -> **Import an existing project**.
3. Select your repo.
4. Build command: *(leave empty)*
5. Publish directory: `.`
6. Deploy.

### Option 2: Vercel

1. Push this folder to GitHub.
2. In Vercel, click **Add New...** -> **Project**.
3. Import the repository.
4. Framework preset: **Other**.
5. Build command: *(empty)*
6. Output directory: `.`
7. Deploy.

### Option 3: GitHub Pages (automated)

This project already includes a GitHub Actions workflow at `.github/workflows/deploy.yml`.

1. Create a new GitHub repository.
2. Run:

```bash
cd /Users/arjunghumman/Downloads/VS Code Stuff/Web Dev/Web Dev/Website2
git init
git add .
git commit -m "Initial website"
git branch -M main
git remote add origin <your-repo-url>
git push -u origin main
```

3. In GitHub: **Settings** -> **Pages** -> set **Source** to **GitHub Actions**.
4. The workflow deploys automatically on each push to `main`.
