# OSSC Exam Preparation Platform

A comprehensive, AI-powered exam preparation platform for OSSC (Odisha Staff Selection Commission) Revenue Inspector (RI) and Assistant Inspector (AI) exams.

![OSSC Exam Prep](https://img.shields.io/badge/OSSC-Exam%20Prep-blue)
![React](https://img.shields.io/badge/React-18.2.0-61dafb)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.3.6-38bdf8)
![Firebase](https://img.shields.io/badge/Firebase-10.7.0-ffca28)

## 🌟 Features

### Core Features
- **AI-Generated Questions**: Unlimited practice with AI-generated MCQs following OSSC pattern
- **Mock Tests**: Full-length 100-question tests simulating actual exam conditions
- **Daily Tests**: Quick 10-question daily tests focusing on weak areas
- **Smart Analytics**: Track progress with detailed performance insights
- **Wrong Question Revision**: Review and master your mistakes
- **AI Chatbot Tutor**: Get instant help with concepts and doubts

### Language Support
- **English**: Full support for all features
- **Odia (ଓଡ଼ିଆ)**: Native Odia language support for questions and explanations

### Exam Coverage
- **Revenue Inspector (RI)**: Complete syllabus coverage
- **Assistant Inspector (AI)**: Coming soon

## 📚 Syllabus Covered

| Subject | Topics | Questions |
|---------|--------|-----------|
| Reasoning & Mental Ability | 10+ topics | 15 per test |
| Quantitative Aptitude | 10+ topics | 20 per test |
| English Language | 8+ topics | 15 per test |
| Odia Language | 8+ topics | 15 per test |
| General Knowledge | 10+ topics | 15 per test |
| Odisha GK | 10+ topics | 20 per test |

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Firebase account
- OpenRouter API key (free tier available)

### Installation

1. **Clone the repository**
```bash
cd ossc-exam-prep
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure environment variables**

Create a `.env` file based on `.env.example`:
```env
# Firebase Configuration
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id

# OpenRouter API (for AI features)
VITE_OPENROUTER_API_KEY=your_openrouter_api_key
```

4. **Start the development server**
```bash
npm run dev
```

5. **Open in browser**
```
http://localhost:3000
```

## 🔧 Configuration

### Firebase Setup

1. Create a new Firebase project at [console.firebase.google.com](https://console.firebase.google.com)
2. Enable Firestore Database
3. Enable Anonymous Authentication (optional)
4. Copy your config to `.env` file
5. Deploy Firestore rules:
```bash
firebase deploy --only firestore:rules
```

### OpenRouter API Setup

1. Sign up at [openrouter.ai](https://openrouter.ai)
2. Get your API key (free tier includes free models)
3. Add to `.env` file

### Free AI Models Used
- `mistralai/mistral-7b-instruct:free` (Primary)
- `google/gemma-7b-it:free` (Fallback)
- `huggingfaceh4/zephyr-7b-beta:free` (Fallback)

## 📱 Mobile Responsive

The platform is fully responsive and works seamlessly on:
- 📱 Mobile phones
- 📱 Tablets
- 💻 Laptops
- 🖥️ Desktops

## 🛠️ Tech Stack

| Technology | Purpose |
|------------|---------|
| React 18 | Frontend framework |
| Vite | Build tool |
| Tailwind CSS | Styling |
| Firebase | Backend & Database |
| OpenRouter | AI API Gateway |
| Zustand | State management |
| Framer Motion | Animations |
| Recharts | Analytics charts |
| Lucide React | Icons |

## 📁 Project Structure

```
ossc-exam-prep/
├── public/
│   └── favicon.svg
├── src/
│   ├── components/       # Reusable UI components
│   ├── config/          # Firebase & API configuration
│   ├── data/            # Syllabus and static data
│   ├── pages/           # Page components
│   ├── services/        # AI and analytics services
│   ├── store/           # Zustand stores
│   ├── App.jsx          # Main app with routing
│   ├── main.jsx         # Entry point
│   └── index.css        # Global styles
├── .env.example         # Environment template
├── firebase.json        # Firebase config
├── firestore.rules      # Security rules
├── package.json
├── tailwind.config.js
└── vite.config.js
```

## 🔐 Security

- Firebase Security Rules protect user data
- API keys are environment variables (not committed)
- User data is isolated by userId
- No sensitive data stored client-side

## 🚀 Deployment

### Firebase Hosting

```bash
# Build the project
npm run build

# Deploy to Firebase
firebase deploy
```

### Vercel/Netlify

Simply connect your repository and deploy!

## 📊 Features Roadmap

- [x] User authentication (Name + Phone)
- [x] Exam selection (RI/AI)
- [x] Complete syllabus display
- [x] AI-powered practice mode
- [x] Mock tests (100 questions)
- [x] Daily tests (10 questions)
- [x] Results & analysis
- [x] Analytics dashboard
- [x] Wrong question revision
- [x] AI chatbot tutor
- [x] User profile
- [x] Odia language support
- [ ] Dark mode
- [ ] Push notifications
- [ ] Offline support
- [ ] PDF notes
- [ ] Video lessons

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- OSSC for the exam pattern reference
- OpenRouter for free AI API access
- Firebase for backend services
- All OSSC aspirants for inspiration

---

Made with ❤️ for OSSC Aspirants

**Best of luck for your exams! 🎯**
