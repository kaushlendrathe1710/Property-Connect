# PropMarket Mobile App

A React Native mobile app for the PropMarket real estate platform, built with Expo.

## Features

- **Passwordless Authentication**: Login with email OTP verification
- **Property Browsing**: Search and filter properties by city, type, and listing type
- **Favorites**: Save properties you're interested in (buyers)
- **Inquiries**: Send and receive messages about properties
- **My Listings**: Manage your property listings (sellers/agents)
- **Profile**: View and manage your account

## Getting Started

### Prerequisites

- Node.js 18+
- Expo CLI (`npm install -g expo-cli`)
- Expo Go app on your phone (for testing)

### Installation

1. Navigate to the mobile directory:
```bash
cd mobile
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

4. Scan the QR code with Expo Go (Android) or Camera app (iOS)

## Configuration

The app connects to the PropMarket API at `https://property.lelekart.com`. 

To change the API URL, edit `lib/api.ts`:
```typescript
const API_BASE_URL = 'https://your-api-url.com';
```

## Building for Production

### Using EAS Build (Recommended)

1. Install EAS CLI:
```bash
npm install -g eas-cli
```

2. Configure your project:
```bash
eas build:configure
```

3. Build for Android:
```bash
eas build --platform android
```

4. Build for iOS:
```bash
eas build --platform ios
```

### Local Build

For local builds, you'll need:
- Android Studio (for Android)
- Xcode (for iOS, macOS only)

```bash
# Android
npx expo run:android

# iOS
npx expo run:ios
```

## Project Structure

```
mobile/
├── app/                    # Expo Router screens
│   ├── (tabs)/            # Tab navigation screens
│   │   ├── index.tsx      # Home screen
│   │   ├── search.tsx     # Search/browse properties
│   │   ├── favorites.tsx  # Saved properties
│   │   ├── listings.tsx   # My listings (seller/agent)
│   │   ├── inquiries.tsx  # Messages
│   │   └── profile.tsx    # User profile
│   ├── property/
│   │   └── [id].tsx       # Property detail screen
│   ├── login.tsx          # Login screen
│   ├── onboarding.tsx     # New user setup
│   └── _layout.tsx        # Root layout
├── components/            # Reusable components
│   ├── Button.tsx
│   ├── Input.tsx
│   └── PropertyCard.tsx
├── lib/                   # Utilities and context
│   ├── api.ts            # API client
│   ├── auth-context.tsx  # Auth state management
│   └── theme.ts          # Colors and styling
└── assets/               # Images and icons
```

## App Store Submission

### iOS
1. Create an Apple Developer account ($99/year)
2. Configure app in App Store Connect
3. Build with `eas build --platform ios`
4. Submit using `eas submit --platform ios`

### Android
1. Create a Google Play Developer account ($25 one-time)
2. Configure app in Google Play Console
3. Build with `eas build --platform android`
4. Submit using `eas submit --platform android`

## Customization

### Changing Colors
Edit `lib/theme.ts` to modify the color scheme.

### Adding New Screens
1. Create a new file in `app/` directory
2. Expo Router will automatically add routing

### Modifying API
Update `lib/api.ts` to add new API endpoints.

## Troubleshooting

### "Network request failed"
- Check your internet connection
- Verify the API URL is correct
- Ensure the backend server is running

### Build errors
- Clear cache: `npx expo start --clear`
- Delete node_modules and reinstall

### iOS build issues
- Ensure you have a valid Apple Developer certificate
- Check Xcode is up to date
