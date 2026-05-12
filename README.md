# TaskFlow

TaskFlow is a collaborative Kanban-style project management platform inspired by tools like Trello. Users can create shared boards, manage tasks with drag-and-drop interactions, track deadlines, and collaborate with teammates in a clean and responsive interface.

## Features

- User authentication with Supabase
- Shared collaborative boards
- Drag-and-drop task management using dnd-kit
- Persistent task ordering
- Deadline tracking sidebar
- Responsive and modern UI
- Board member invitation system
- Task details and assignee support

## Tech Stack

- Next.js
- React
- TypeScript
- Tailwind CSS
- Supabase
- dnd-kit

## Live Demo

https://taskflow-ten-sepia-82.vercel.app/

## Installation

```bash
git clone https://github.com/YOUR_USERNAME/taskflow-kanban.git
cd taskflow-kanban
npm install
npm run dev
```

## Environment Variables

Create a `.env.local` file and add:

```env
NEXT_PUBLIC_SUPABASE_URL=your_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key
```

## Project Goal

This project was developed as part of a technical assessment focused on drag-and-drop systems, collaborative workspace design, persistence logic, and modern frontend architecture.

## Author

Hevi Hebun Cicek
