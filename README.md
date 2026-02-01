# EduOS - File-Native Education Platform

A modern educational platform built with Convex + React that follows the principle: **Upload anything. Edit what makes sense. Never block access.**

## Features

### Core Philosophy
- **File-native, not file-hostile**: Any file type can be uploaded and accessed
- **Google-auth only**: Zero identity friction using existing school Google Workspace
- **Selective editing**: Only edit what makes sense (.docx, .pptx, .xlsx)
- **Never block access**: Students can always view and download files

### Key Capabilities
- **Universal file upload**: PDFs, images, videos, documents - everything is supported
- **Smart editing**: Automatic detection of editable formats (Office documents)
- **Assignment system**: Wrap files in assignments with optional timers
- **Role-based access**: Student, Teacher, Admin roles with appropriate permissions
- **Live timers**: Student-controlled, teacher-visible assignment timers
- **Clean interface**: OpenNote-inspired calm file shelf design

## Quick Start

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Set up environment**:
   - Copy `.env.local` and add your Google OAuth credentials
   - Get credentials from [Google Cloud Console](https://console.cloud.google.com/)

3. **Start development**:
   ```bash
   npm run dev
   ```

4. **First login**:
   - First user becomes admin automatically
   - Use your school Google account (recommended)

## Architecture

### Database Schema
- **users**: Email-based authentication with role assignment
- **files**: Universal file storage with editable flag
- **assignments**: File-wrapped assignments with timing options
- **timers**: Student-controlled assignment timers
- **studentFiles**: Forked copies for editable assignments

### File Handling
- **Editable formats**: .docx, .pptx, .xlsx (converted to structured blocks)
- **Non-editable formats**: PDFs, images, videos (preview + download)
- **Original preservation**: Editable files keep original format intact

### Authentication
- Google OAuth only (no passwords)
- Domain-based role detection
- First-teacher rule for initial setup

## Development

Built with:
- **Backend**: Convex (database + server functions)
- **Frontend**: React + Vite + Tailwind CSS
- **Auth**: Convex Auth with Google provider
- **File Storage**: Convex file storage

## Deployment

1. Deploy to Convex:
   ```bash
   npx convex deploy
   ```

2. Set production environment variables in Convex dashboard

3. Deploy frontend to your preferred hosting platform

## License

MIT License - see LICENSE file for details.
