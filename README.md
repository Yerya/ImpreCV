# CVify - AI-Powered Resume Builder

CVify is a modern, AI-powered resume builder application built with Next.js, featuring intelligent resume analysis, job matching, and PDF export capabilities.

## Features

- 🤖 AI-powered resume optimization with Google Gemini
- 📄 Multiple resume templates
- 📊 Skill mapping and job matching
- 📝 Cover letter generation
- 📤 PDF export with Puppeteer
- 🔐 User authentication with Supabase

## Tech Stack

- **Framework**: Next.js 16
- **Styling**: Tailwind CSS
- **State Management**: Redux Toolkit
- **Database & Auth**: Supabase
- **AI**: Google Gemini API
- **PDF Export**: Puppeteer
- **Package Manager**: pnpm

---

## 🐳 Docker Deployment

### Prerequisites

- Docker Engine 20.10+
- Docker Compose v2.0+ (optional, for easier management)
- At least 2GB of available RAM

### Quick Start

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd cvify-app
   ```

2. **Create environment file**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and fill in your credentials:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   GEMINI_API_KEY=your-gemini-api-key
   ```

3. **Build and run with Docker Compose**
   ```bash
   docker compose up -d --build
   ```

4. **Access the application**
   
   Open [http://localhost:3000](http://localhost:3000) in your browser.

### Docker Commands

#### Using Docker Compose (Recommended)

```bash
# Build and start
docker compose up -d --build

# View logs
docker compose logs -f

# Stop the application
docker compose down

# Rebuild without cache
docker compose build --no-cache
```

#### Using Docker directly

```bash
# Build the image
docker build -t cvify-app .

# Run the container
docker run -d \
  --name cvify-app \
  -p 3000:3000 \
  -e NEXT_PUBLIC_SUPABASE_URL=your-url \
  -e NEXT_PUBLIC_SUPABASE_ANON_KEY=your-key \
  -e GEMINI_API_KEY=your-key \
  --cap-add=SYS_ADMIN \
  cvify-app

# View logs
docker logs -f cvify-app

# Stop and remove
docker stop cvify-app && docker rm cvify-app
```

### Verification

1. **Check container is running**
   ```bash
   docker ps
   ```

2. **Check health status**
   ```bash
   curl http://localhost:3000/api/health
   ```
   
   Expected response:
   ```json
   {"status":"healthy","timestamp":"...","uptime":...}
   ```

3. **Verify non-root user execution**
   ```bash
   docker exec cvify-app id
   # Expected: uid=1001(nextjs) gid=1001(nodejs) groups=1001(nodejs)
   ```

4. **Test PDF export**
   - Navigate to `/resume-editor`
   - Create or load a resume
   - Click the PDF export button
   - Verify the PDF downloads correctly

### Image Size

The Docker image is approximately **800MB-1GB** due to Chromium dependencies required for PDF export. This is expected and necessary for the Puppeteer functionality.

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     Docker Container                         │
│  ┌────────────────────────────────────────────────────────┐ │
│  │              Next.js Application (Node.js)              │ │
│  │                      Port 3000                          │ │
│  │  ┌─────────────────┐  ┌─────────────────────────────┐  │ │
│  │  │   API Routes    │  │     PDF Export (Puppeteer)   │  │ │
│  │  │   /api/*        │  │      + System Chromium       │  │ │
│  │  └─────────────────┘  └─────────────────────────────┘  │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┼───────────────┐
              ▼               ▼               ▼
        ┌──────────┐   ┌──────────┐   ┌──────────────┐
        │ Supabase │   │  Gemini  │   │  Tailwind    │
        │   Auth   │   │   API    │   │     CDN      │
        │   + DB   │   │          │   │              │
        └──────────┘   └──────────┘   └──────────────┘
```

### Production Deployment

For production deployments:

1. **Use a reverse proxy** (nginx, Traefik) for SSL termination
2. **Set proper environment variables** via your orchestration platform
3. **Configure resource limits** based on your traffic
4. **Enable logging** to your preferred logging solution

Example with custom port:
```bash
docker run -d \
  --name cvify-app \
  -p 8080:3000 \
  --env-file .env.production \
  --restart unless-stopped \
  cvify-app
```

### Troubleshooting

#### PDF Export fails
- Ensure the container has `SYS_ADMIN` capability or use `--cap-add=SYS_ADMIN`
- Check logs: `docker logs cvify-app`
- Verify Chromium is accessible: `docker exec cvify-app which chromium`

#### Container won't start
- Check if port 3000 is available
- Verify environment variables are set
- Review Docker logs for errors

#### Out of Memory
- Increase Docker memory limit to at least 2GB
- PDF export with Puppeteer requires significant memory

---

## Local Development

### Prerequisites

- Node.js 20+
- pnpm 8+

### Setup

```bash
# Install dependencies
pnpm install

# Create environment file
cp .env.example .env
# Edit .env with your credentials

# Run development server
pnpm dev
```

### Scripts

```bash
pnpm dev          # Start development server
pnpm build        # Build for production
pnpm start        # Start production server
pnpm lint         # Run ESLint
pnpm test         # Run tests
pnpm test:watch   # Run tests in watch mode
```

---

## License

Private - All rights reserved.
