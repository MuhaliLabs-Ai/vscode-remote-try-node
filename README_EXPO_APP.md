# Applebee Expo Companion

The Expo app is a mobile companion for manually submitting interview questions to the web server. It is separate from the React web cockpit.

## Current capabilities

- Submit a typed question to `POST /api/interview/answer` and display its answer, talking points, trade-offs, and a follow-up.
- Record audio locally after requesting microphone permission.
- Share the current answer through the native share sheet.
- Browse typed question history and view the architecture demo.
- Run a clearly labeled voice-to-visual demo; it does not use microphone transcription or Gemini Live.

## Limitations

- Recorded audio is not transcribed, streamed, or sent to the server by this Expo app.
- The mobile client does not currently load or edit the candidate profile.
- The floating widget and visual sync are local UI features; they do not run over other apps.
- The root `npm run lint` command excludes `expo/`. No Expo-specific build or device test has been verified as part of the root checks.

## Run

From the repository root, run the launcher:

```bash
./run-expo.sh
```

The script enters `expo/`, installs dependencies if `expo/node_modules` is missing, and starts the Expo development server. Pass Expo CLI options after the script name, for example `./run-expo.sh --tunnel`.

Set the web server URL in the Copilot tab. For a physical device, use the development machine's LAN address, for example `http://192.168.1.20:3000`; `localhost` on the phone points to the phone itself. The web server must be reachable from the device. Configure `GEMINI_API_KEY` on the web server to enable AI answers; a limited local polymorphism reference is available without a key.

## Verification

The Expo source is not part of the root TypeScript project. Validate it with the installed Expo toolchain and test microphone permissions and backend connectivity on a physical device before relying on it.