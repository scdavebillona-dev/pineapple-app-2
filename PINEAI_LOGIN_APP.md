# PineAi System - Login App

A modern, fully functional login application built with React Native and Expo. The PineAi System provides a complete authentication flow with dashboard and profile management.

## Features

✅ **Authentication System**
- Login screen with username and password validation
- Persistent authentication context across the app
- Logout functionality with redirect to login

✅ **Dashboard**
- Welcome screen with user greeting
- Quick stats display (Projects, Tasks, Completion rate)
- Navigation to profile page
- Logout button

✅ **User Profile**
- User avatar with initial
- Account information display
- Settings management
- Sign out option

✅ **Dark/Light Mode Support**
- Automatic theme detection
- Themed components throughout the app
- Consistent styling across all screens

## Project Structure

```
app/
├── _layout.tsx              # Root layout with auth context
├── (auth)/
│   ├── _layout.tsx         # Auth stack navigation
│   └── login.tsx           # Login screen
└── (app)/
    ├── _layout.tsx         # App stack navigation
    ├── home.tsx            # Dashboard/home screen
    └── profile.tsx         # User profile screen

context/
└── auth-context.tsx        # Authentication context and provider

components/
├── themed-text.tsx
├── themed-view.tsx
└── ... (other components)
```

## Getting Started

### Prerequisites
- Node.js and npm installed
- Expo CLI installed globally

### Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm start
```

3. Run on your preferred platform:
```bash
# iOS
npm run ios

# Android
npm run android

# Web
npm run web
```

## Demo Credentials

When you first run the app, use these credentials to log in:

- **Username**: `admin`
- **Password**: `password`

## Authentication Flow

The app uses a React Context API for state management:

1. **AuthContext** - Manages authentication state and user information
2. **RootLayout** - Conditionally renders login or app screens based on auth state
3. **Protected Routes** - App screens only accessible when authenticated

## Available Screens

### Login Screen (`(auth)/login`)
- Username and password input fields
- Form validation
- Demo credentials information
- Error handling with alerts

### Home/Dashboard (`(app)/home`)
- Personalized welcome message
- Quick statistics display
- Navigation shortcuts
- Profile and logout buttons

### Profile (`(app)/profile`)
- User avatar and account summary
- Account information display
- Settings panel
- Logout option

## Customization

### Modify Demo Credentials
Edit `context/auth-context.tsx`:
```typescript
const signIn = useCallback(async (username: string, password: string) => {
  // Add your authentication logic here
  if (username === 'your_username' && password === 'your_password') {
    setIsSignedIn(true);
    setUser({ username });
  }
}, []);
```

### Connect to a Real Backend
Replace the simple validation in `auth-context.tsx` with:
```typescript
const signIn = useCallback(async (username: string, password: string) => {
  const response = await fetch('https://your-api.com/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  });
  const data = await response.json();
  if (data.success) {
    setIsSignedIn(true);
    setUser({ username: data.user.username });
  }
}, []);
```

### Styling
All screens use themed components that automatically adapt to light/dark mode. Modify `constants/theme.ts` to customize colors.

## Technologies Used

- **React Native** - Cross-platform mobile development
- **Expo** - React Native development platform
- **Expo Router** - File-based routing
- **React Context** - State management
- **TypeScript** - Type-safe development

## License

MIT

## Support

For issues or questions, check the [Expo documentation](https://docs.expo.dev/) or [React Native docs](https://reactnative.dev/).
