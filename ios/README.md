# Dead Man's Run — iPhone app

The game packed into a native app. Plays fully offline; saves stay on the phone.

## Put it on your iPhone
1. On a Mac, install **Xcode** (free, Mac App Store).
2. Download this repo (green **Code** button → Download ZIP) and unzip it.
3. Open `ios/DeadMansRun.xcodeproj`.
4. Xcode → Settings → Accounts → add your Apple ID.
5. Click **DeadMansRun** in the left bar → **Signing & Capabilities** → Team: pick your name.
   If it says the bundle ID is taken, change it to something like `com.yourname.deadmansrun`.
6. Plug in your iPhone, pick it at the top of the window, press **▶ Run**.
7. First time only, on the phone: Settings → General → VPN & Device Management → trust your Apple ID.
   Settings → Privacy & Security → Developer Mode → on (phone restarts).

With a free Apple ID the app works for 7 days, then press Run again.
With the paid Apple Developer Program ($99/year) it lasts a year, and you can use TestFlight.

## Updating
Game changes are built into `ios/DeadMansRun/www` by `build.py`. Pull the latest repo and press Run again.
