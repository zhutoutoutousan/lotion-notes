# 🧴 Lotion Notes

```
 _      ____   ___  _   _ ____  _____ ____  
| |    / ___| / _ \\| \\ | / ___||_   _/ ___| 
| |    \\___ \\| |_| |  \\| \\___ \\  | | \\___ \\ 
| |___  ___) |  _  | |\\  |___) | | |  ___) |
|_____|____/|_| |_|_| \\_|____/  |_| |____/ 
```

A modern, AI-powered self-management application with calendar integration.

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

### 🌍 Language Learning
- Support for 10+ languages including English, Spanish, Portuguese, German, French, Japanese, Russian, Hindi, and Korean
- Interactive vocabulary flashcards with spaced repetition
- Grammar exercises and quizzes
- Pronunciation practice with AI feedback
- Progress tracking and personalized learning paths
- Cultural context and usage examples

### 📰 News Explorer
- Browse news articles from multiple sources
- AI-powered translation of articles to multiple languages
- Location detection for news articles
- Interactive map visualization of article locations
- Batch location detection for multiple articles
- Vocabulary extraction for language learning

### 🤖 AI Integration
- Smart task scheduling based on priority and available time
- Content generation and summarization
- Intelligent time management
- AI-powered language learning assistance
- Location detection from text content
- Multi-language translation

### 🎨 Modern UI
- Clean, intuitive interface
- Dark and light mode support
- Responsive design for all devices

## 🚀 Getting Started

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn
- Supabase account (for database)
- DeepSeek API key (for location detection and translation)

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
DEEPSEEK_API_KEY=your_deepseek_api_key
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

### Learning Languages
1. Navigate to the Language Learning tab
2. Select your target language from the available options
3. Choose your proficiency level (beginner, intermediate, advanced)
4. Explore different learning modules:
   - Vocabulary flashcards
   - Grammar exercises
   - Pronunciation practice
   - Cultural context lessons
5. Track your progress in the dashboard
6. Set learning goals and receive personalized recommendations

### Exploring News
1. Navigate to the News tab
2. Browse articles from different sources
3. Use the search bar to find specific topics
4. Filter by category or language
5. Click on an article to view details
6. Use the "Detect Location" button to identify geographic locations mentioned in the article
7. Use the "Detect All Locations" button to process multiple articles at once
8. View article locations on the interactive map
9. Translate articles to your preferred language
10. Extract vocabulary for language learning

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
- **AI**: OpenAI API, DeepSeek API
- **Calendar**: Custom implementation with drag-and-drop support
- **Language Learning**: Custom implementation with spaced repetition algorithm
- **Maps**: Leaflet.js for interactive map visualization

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/)
- [Supabase](https://supabase.io/)
- [OpenAI](https://openai.com/)
- [DeepSeek](https://deepseek.com/)
- [Shadcn UI](https://ui.shadcn.com/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Leaflet.js](https://leafletjs.com/)

---

```
 ____  _   _ ____  _____ ____  
|  _ \\| | | / ___||_   _/ ___| 
| |_) | | | \\___ \\  | | \\___ \\ 
|  _ <| |_| |___) | | |  ___) |
|_| \\_\\___/|____/  |_| |____/ 
```

Made with ❤️ by [Your Name] 