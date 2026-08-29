# Run WishWe mobile locally

This guide launches the Django API first, then opens the Expo mobile app in an
iOS Simulator or Android Emulator. Run the commands from the repository root
unless a step says otherwise.

The mobile app needs a reachable PostgreSQL database through the backend; the
repository's Docker Compose file is for production deployment and does not
start a local database.

## 1. Install the prerequisites

- Git and a current Node.js LTS release (npm is included).
- Python 3.12 or newer.
- Access to a non-production PostgreSQL database that you are allowed to use.
- For Android: Android Studio, an Android Virtual Device (AVD), and its SDK
  tools. Follow Expo's [Android emulator setup](https://docs.expo.dev/workflow/android-studio-emulator/).
- For iOS: a Mac with Xcode and an installed iOS Simulator. The iOS Simulator
  is not available on Windows or Linux; see Expo's [iOS Simulator setup](https://docs.expo.dev/workflow/ios-simulator/).

On Windows, run the Bash commands below in **Git Bash**. On macOS and Linux,
use your normal terminal.

## 2. Configure and start the backend

Open the first terminal and prepare the Django environment

```bash
cd backend
cp .env.sample .env
```

Edit `backend/.env` and set at least the following values for your local or
dedicated development database:

```dotenv
SECRET_KEY=a-long-random-local-secret
DB_HOST=your-database-host
DB_NAME=your-database-name
DB_USER=your-database-user
DB_PASSWORD=your-database-password
DB_PORT=5432
DJANGO_SETTINGS_MODULE=wishwe_api.settings
```

Create the virtual environment and install the backend dependencies.

### Windows (Git Bash)

```bash
py -3 -m venv .venv
source .venv/Scripts/activate
python -m pip install --upgrade pip
python -m pip install -r requirements.txt
```

### macOS, Linux, or WSL

```bash
python3 -m venv .venv
source .venv/bin/activate
python -m pip install --upgrade pip
python -m pip install -r requirements.txt
```

If the selected database is a development database that you are explicitly
allowed to change, apply migrations once:

```bash
python manage.py migrate
```

Never migrate a shared or production database without explicit authorization.

Start Django so the emulators can reach it:

```bash
python manage.py runserver 0.0.0.0:8000 --noreload
```

Leave this terminal running. In another terminal, confirm the API is available:

```bash
curl http://localhost:8000/api/health/
```

It should return:

```json
{"status":"ok"}
```

## 3. Install and configure the mobile app

Open a second terminal:

```bash
cd mobile
npm ci
cp .env.example .env
```

Set `EXPO_PUBLIC_API_URL` in `mobile/.env` **before** starting Expo. The value
depends on the target you will open:

| Target | `EXPO_PUBLIC_API_URL` |
| --- | --- |
| iOS Simulator | `http://localhost:8000` |
| Android Emulator | `http://10.0.2.2:8000` |
| Hosted preview/production build | `https://wishwe.online` |

`10.0.2.2` is Android Emulator's special address for the development machine;
using `localhost` there points at the emulator itself, not Django. Restart Expo
after changing `.env` so it picks up the new public environment variable.

Google sign-in also needs the public Web OAuth client ID:

```dotenv
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=904699722219-hsmhbcc5gd17lu710mff0m26bvauiur3.apps.googleusercontent.com
```

The backend's `GOOGLE_OAUTH_CLIENT_ID` must contain this same value because it
checks that each Google ID token was created for WishWe. This is a public app
identifier, not a client secret.

For Android, the Google Cloud project must also have an Android OAuth client for
package `online.wishwe.app`. Add the SHA-1 fingerprint of every certificate that
can sign the app: the local debug key, the EAS build key, and the Google Play app
signing key where applicable. A missing package/SHA-1 pair normally appears as a
Google `DEVELOPER_ERROR` before the backend is contacted.

## 4. Launch on iOS

iOS simulator support requires macOS. After Xcode and at least one iOS
Simulator runtime are installed, set the API URL to `http://localhost:8000` and
run:

```bash
cd mobile
npx expo start --go --ios
```

Expo starts Metro and opens the app in the available simulator. Google sign-in
is currently enabled only on Android; iOS continues through the email flow.
Native Google sign-in is technically possible on iOS, but it also needs an iOS
OAuth client ID and its reversed URL scheme in the Expo native configuration.

## 5. Launch on Android

Google sign-in contains native code and therefore does not run in Expo Go. Start
an AVD from Android Studio's Device Manager, set the API URL to
`http://10.0.2.2:8000`, and create/install the development build once:

```bash
cd mobile
npx expo run:android
```

After that first native build, start Metro for the installed development client:

```bash
npx expo start --dev-client
```

Alternatively, create an installable EAS development build with
`npx eas-cli build --platform android --profile development`.

## Using both platforms

The app reads one `EXPO_PUBLIC_API_URL` from `mobile/.env`, so use one of these
targets at a time. To switch platforms, stop Expo with `Ctrl+C`, change the URL
in `.env`, and run the appropriate launch command again. Keep the Django
terminal running throughout.


## Useful commands

From `mobile/`:

```bash
npm run lint
npm test
npx tsc --noEmit
```
