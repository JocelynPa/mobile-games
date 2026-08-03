# Expo HAS CHANGED

Read the exact versioned docs at https://docs.expo.dev/versions/v54.0.0/ before writing any code.

This project targets Expo SDK 54 deliberately (not the latest SDK) because, as of writing,
that is the SDK version supported by the Expo Go app published on the App Store. Do not bump
the `expo` package to a newer SDK without checking whether App Store Expo Go supports it —
otherwise `npx expo start` + scanning the QR code will fail with "Project is incompatible with
this version of Expo Go" on real devices.
