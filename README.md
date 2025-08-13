# FinanceApp

A modern, intelligent financial management application built with React, TypeScript, and Firebase.

## 🚀 Demo Mode

FinanceApp includes a comprehensive demo mode that allows users to explore the application's features without creating an account or connecting real bank accounts.

### How to Access Demo Mode

1. **From the Login Screen**: Click the "Try Demo Mode" button on the login page
2. **Direct URL**: Add `?demo=true` to the URL (e.g., `http://localhost:3000/?demo=true`)

### Demo Features

- **Realistic Sample Data**: View sample accounts, transactions, and budgets
- **Full Functionality**: Explore all features including charts, analytics, and budget management
- **Interactive Elements**: Test the UI without affecting real data
- **Easy Exit**: Click "Exit Demo" in the header or "Sign In" in the demo banner

### Demo Data Includes

- Multiple bank accounts (checking, savings, credit cards)
- Historical transactions with realistic categories
- Sample budgets and spending patterns
- Interactive charts and analytics
- KPI dashboards with trend data

## 🛠️ Development

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd Finance-App

# Install dependencies
npm install

# Start the development server
npm start
```

### Available Scripts

- `npm start` - Start development server
- `npm test` - Run tests
- `npm run build` - Build for production
- `npm run eject` - Eject from Create React App

## 🏗️ Architecture

### Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS
- **State Management**: React Context API
- **Authentication**: Firebase Auth
- **Database**: Firebase Firestore
- **Charts**: Chart.js with React wrappers (ChartFactory Pattern)
- **Icons**: Lucide React
- **Performance**: Custom optimization framework

### Key Features

- **Real-time Data**: Live updates with Firebase
- **Responsive Design**: Mobile-first approach with vertical chart layout
- **Interactive Budgets**: Expandable budget cards with inline details
- **Advanced Analytics**: Professional-grade chart visualizations
- **Performance Optimized**: Lazy loading, code splitting, and memoization
- **Data Migration**: Seamless transition from mock to real data
- **Offline Support**: Service worker framework ready

## 📁 Project Structure

```
src/
├── components/          # React components
│   ├── auth/           # Authentication components
│   ├── dashboard/      # Dashboard components
│   ├── charts/         # Chart components
│   └── ui/             # Reusable UI components
├── contexts/           # React contexts
├── hooks/              # Custom React hooks
├── services/           # Data services
├── utils/              # Utility functions
├── types/              # TypeScript type definitions
└── constants/          # App constants and mock data
```

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the root directory:

```env
REACT_APP_FIREBASE_API_KEY=your-api-key
REACT_APP_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your-project-id
REACT_APP_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=123456789
REACT_APP_FIREBASE_APP_ID=your-app-id
```

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run tests with coverage
npm test -- --coverage
```

## 📦 Deployment

### Build for Production

```bash
npm run build
```

### Deploy to Firebase Hosting

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize Firebase (if not already done)
firebase init

# Deploy
firebase deploy
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions, please open an issue in the GitHub repository. 