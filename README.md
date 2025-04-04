# 🧴 Lotion Notes

```
 _      ____   ___  _   _ ____  _____ ____  
| |    / ___| / _ \\| \\ | / ___||_   _/ ___| 
| |    \\___ \\| |_| |  \\| \\___ \\  | | \\___ \\ 
| |___  ___) |  _  | |\\  |___) | | |  ___) |
|_____|____/|_| |_|_| \\_|____/  |_| |____/ 
```

A modern, AI-powered note-taking and task management application with calendar integration.

## 🌟 Features

### 📝 Note Taking
- Rich text editor with markdown support
- AI-powered content generation and summarization
- Organization with tags and categories
- Search functionality across all notes

### 📅 Calendar
- Multiple view options (month, week, day)
- Drag-and-drop event scheduling
- 15-minute interval grid for precise scheduling
- Export to ICS format for Google Calendar and other applications
- AI-powered task scheduling

### 🤖 AI Integration
- Smart task scheduling based on priority and available time
- Content generation and summarization
- Intelligent time management

### 🎨 Modern UI
- Clean, intuitive interface
- Dark and light mode support
- Responsive design for all devices

## 🚀 Getting Started

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn
- Supabase account (for database)

### Installation

1. Clone the repository
```bash
git clone https://github.com/yourusername/lotion-notes.git
cd lotion-notes
```

2. Install dependencies
```bash
npm install
# or
yarn install
```

3. Set up environment variables
Create a `.env.local` file in the root directory with the following variables:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. Run the development server
```bash
npm run dev
# or
yarn dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## 📚 Usage Guide

### Creating Notes
1. Click the "+" button in the sidebar
2. Enter your note title and content
3. Use the toolbar for formatting options
4. Add tags for better organization
5. Click "Save" to store your note

### Using the Calendar
1. Navigate to the Calendar tab
2. Choose your preferred view (month, week, day)
3. Click on a time slot to create a new event
4. Drag and drop events to reschedule
5. Resize events to adjust duration
6. Click the "Export" button to download your calendar as an ICS file

### AI Task Scheduling
1. Navigate to the Calendar tab
2. Click "AI Schedule" in the top right
3. Enter your tasks with priorities and durations
4. Click "Generate Schedule" to let AI create an optimal schedule
5. Review and apply the suggested schedule

## 🛠️ Tech Stack

- **Frontend**: Next.js, React, TypeScript
- **Styling**: Tailwind CSS, Shadcn UI
- **Database**: Supabase
- **AI**: OpenAI API
- **Calendar**: Custom implementation with drag-and-drop support

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/)
- [Supabase](https://supabase.io/)
- [OpenAI](https://openai.com/)
- [Shadcn UI](https://ui.shadcn.com/)
- [Tailwind CSS](https://tailwindcss.com/)

---

```
 ____  _   _ ____  _____ ____  
|  _ \\| | | / ___||_   _/ ___| 
| |_) | | | \\___ \\  | | \\___ \\ 
|  _ <| |_| |___) | | |  ___) |
|_| \\_\\___/|____/  |_| |____/ 
```

Made with ❤️ by [Your Name] 