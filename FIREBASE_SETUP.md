# Firebase Setup Guide for FinanceApp

This guide will help you set up Firebase for the FinanceApp project to enable real-time data synchronization and user authentication.

## Prerequisites

- A Google account
- Node.js and npm installed
- Firebase CLI (optional, for deployment)

## Step 1: Create a Firebase Project

1. Go to the [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project" or "Add project"
3. Enter a project name (e.g., "financeapp-production")
4. Choose whether to enable Google Analytics (recommended)
5. Click "Create project"

## Step 2: Enable Authentication

1. In your Firebase project console, go to "Authentication" in the left sidebar
2. Click "Get started"
3. Go to the "Sign-in method" tab
4. Enable "Google" as a sign-in provider:
   - Click on "Google"
   - Toggle "Enable"
   - Add your authorized domain (localhost for development)
   - Click "Save"

## Step 3: Set up Firestore Database

1. In your Firebase project console, go to "Firestore Database" in the left sidebar
2. Click "Create database"
3. Choose "Start in test mode" for development (you can secure it later)
4. Select a location for your database (choose the closest to your users)
5. Click "Done"

## Step 4: Configure Security Rules

1. In the Firestore Database section, go to the "Rules" tab
2. Replace the default rules with the contents of `firestore.rules` in this project
3. Click "Publish"

## Step 5: Get Firebase Configuration

1. In your Firebase project console, click the gear icon next to "Project Overview"
2. Select "Project settings"
3. Scroll down to "Your apps" section
4. Click the web icon (</>) to add a web app
5. Enter an app nickname (e.g., "FinanceApp Web")
6. Click "Register app"
7. Copy the Firebase configuration object

## Step 6: Set Environment Variables

1. Create a `.env` file in the root of your project (if it doesn't exist)
2. Add your Firebase configuration:

```env
# Firebase Configuration
REACT_APP_FIREBASE_API_KEY=your-api-key-here
REACT_APP_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your-project-id
REACT_APP_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=123456789
REACT_APP_FIREBASE_APP_ID=your-app-id

# Optional: API Configuration
REACT_APP_API_BASE_URL=https://your-api-url.com
REACT_APP_API_KEY=your-api-key
```

## Step 7: Install Dependencies

The Firebase dependencies are already included in the project. If you need to reinstall:

```bash
npm install firebase @firebase/app @firebase/firestore @firebase/auth
```

## Step 8: Test the Setup

1. Start the development server:
   ```bash
   npm start
   ```

2. Navigate to the app in your browser
3. You should see the authentication page
4. Try signing in with Google
5. After successful authentication, you should see the data migration modal

## Step 9: Deploy Security Rules (Optional)

If you have Firebase CLI installed:

```bash
# Install Firebase CLI globally
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize Firebase in your project
firebase init

# Deploy security rules
firebase deploy --only firestore:rules
```

## Security Considerations

### Development vs Production

- **Development**: Use test mode for quick setup
- **Production**: Always use proper security rules

### Security Rules Best Practices

1. **User Isolation**: Each user can only access their own data
2. **Authentication Required**: All operations require authentication
3. **Data Validation**: Validate data structure and content
4. **Rate Limiting**: Consider implementing rate limiting for production

### Environment Variables

- Never commit `.env` files to version control
- Use different Firebase projects for development and production
- Rotate API keys regularly

## Troubleshooting

### Common Issues

1. **Authentication Errors**
   - Check if Google sign-in is enabled
   - Verify authorized domains
   - Check browser console for errors

2. **Firestore Permission Errors**
   - Verify security rules are deployed
   - Check if user is authenticated
   - Ensure user ID matches document path

3. **Configuration Errors**
   - Verify all environment variables are set
   - Check Firebase configuration object
   - Restart development server after changes

### Debug Mode

Enable Firebase debug mode by adding this to your browser console:

```javascript
localStorage.setItem('debug', 'firebase:*');
```

## Next Steps

After completing the setup:

1. **Data Migration**: Use the built-in migration tool to populate your database
2. **Real-time Features**: Test real-time data synchronization
3. **Production Deployment**: Set up production Firebase project
4. **Monitoring**: Enable Firebase Analytics and Crashlytics
5. **Backup**: Set up automated backups for your Firestore data

## Support

For additional help:

- [Firebase Documentation](https://firebase.google.com/docs)
- [Firebase Community](https://firebase.google.com/community)
- [Stack Overflow](https://stackoverflow.com/questions/tagged/firebase)

## Production Checklist

Before deploying to production:

- [ ] Set up production Firebase project
- [ ] Configure custom domain
- [ ] Set up SSL certificates
- [ ] Configure security rules
- [ ] Set up monitoring and alerts
- [ ] Test authentication flow
- [ ] Verify data migration
- [ ] Set up backup strategy
- [ ] Configure error tracking
- [ ] Test real-time features 