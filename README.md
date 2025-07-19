
# 🚀 SRIOX - Fast Website Deployment Platform

**Live Demo**: 🌐 [https://sriox.com](https://sriox.com)

SRIOX is a developer-focused platform that allows anyone to deploy their personal or static websites in seconds — using only a ZIP or HTML file. It handles everything from storage to publishing via GitHub and custom subdomain management, so users can focus on content, not infrastructure.

---

## 📌 Features

- 🔥 Instant website deployment from ZIP or HTML upload
- 🧠 Auto GitHub integration (storage backend)
- 🌐 Subdomain assignment like `username.sriox.com`
- 🔒 Authentication via Google & Email
- 📁 File preview, status tracking, and history logs
- 🎨 Modern UI with intuitive flow (inspired by self.so)

---
<a href="https://ibb.co/zTkzzw9s">
  <img src="https://i.ibb.co/zTkzzw9s/Screenshot-20250720-001928.jpg" alt="Dashboard Screenshot" width="400" />
</a>

<a href="https://ibb.co/Q7ZGNM0L">
  <img src="https://i.ibb.co/Q7ZGNM0L/Screenshot-20250720-002011.jpg" alt="Upload Page Screenshot" width="400" />
</a>
## 🛠️ Tech Stack

- **Frontend**: Next.js, Tailwind CSS, shadcn/ui
- **Backend**: Node.js, Firebase, GitHub API
- **Storage**: GitHub Repositories
- **Auth**: Firebase Auth (Google & Email)
- **Domain Mapping**: Cloudflare DNS API
- **CI/CD**: GitHub Pages

---

## 🚧 How It Works

1. User signs in (Google or Email)
2. Uploads the web site files
3. App pushes files to GitHub
4. GitHub Pages + DNS auto-connects by cloud fare
5. Website is live at `username.sriox.com`

---

## 🧾 Setup Instructions

> If you want to run it locally or contribute, follow these steps:

### 1. Clone the Repository

```bash
git clone https://github.com/YOUR_USERNAME/sriox-deployer.git
cd sriox-deployer

2. Install Dependencies

npm install

3. Environment Variables

Create a .env.local file and add your credentials:

NEXT_PUBLIC_FIREBASE_API_KEY=your_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_domain
GITHUB_TOKEN=your_personal_token
CLOUDFLARE_API_KEY=your_key
...

4. Run the App

npm run dev

App will start at http://localhost:3000.


---

🧪 Test Deployment

Upload a ZIP or HTML on sriox.com to test the real-time flow and see your site live instantly!

---

👨‍💻 Authors

Sri Datta Sidhardha Kondeti (siddu-k  GitHub)



---

📢 Notes

This project was developed as part of the Vibe Code Hackathon. Judges can test the live functionality directly at https://sriox.com — no setup required!


---

📜 License

MIT License

---

## 📄 Optional `SETUP.md` (if separate file needed)

```markdown
# SRIOX - Local Setup Instructions

## Prerequisites

- Node.js 18+
- Git
- GitHub Token (with repo and admin rights)
- Firebase project (for Auth & Hosting)

## 1. Clone Repo

```bash
git clone https://github.com/YOUR_USERNAME/sriox-deployer.git
cd sriox-deployer

2. Install Dependencies

npm install

3. Set Up .env.local

NEXT_PUBLIC_FIREBASE_API_KEY=xxxx
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=xxxx
GITHUB_TOKEN=ghp_xxx
CLOUDFLARE_API_KEY=xxxx
...

4. Run the App

npm run dev

Visit http://localhost:3000 to get started.
