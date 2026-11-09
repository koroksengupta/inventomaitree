// All English text shown in the app. To add German later, create de.ts with
// the same keys and switch the language in i18n/index.ts.
export const en = {
  'nav.home': 'Home',
  'nav.connection': 'Connection test',

  'home.welcome': 'Welcome to {app}',
  'home.subtitle': 'The shared inventory of {org}.',
  'home.underConstruction':
    'The app is being built step by step. Login and items come next. For now you can check that the app can reach the database.',
  'home.checkConnection': 'Check database connection',

  'conn.title': 'Connection test',
  'conn.checking': 'Checking… (this can take a few seconds on a slow connection)',
  'conn.connected': 'Connected',
  'conn.notConnected': 'Not connected',
  'conn.categories': 'Categories visible to you: {count}',
  'conn.zeroExplained':
    'Seeing 0 is expected while you are not logged in. The database only shows data to invited members (this is called Row Level Security). After you log in, you will see all categories.',
  'conn.loggedInAs': 'Logged in as {email}',
  'conn.notLoggedIn': 'Not logged in',
  'conn.retry': 'Check again',
  'conn.hintNetwork':
    'Tip: "Failed to fetch" usually means no internet, a typo in the Project URL, or the Supabase project is paused (open the Supabase dashboard to wake it).',
  'conn.hintKey': 'Tip: an "Invalid API key" message means the publishable key is wrong (in .env.local on your computer, or in the GitHub secret for the live site).',
} as const
