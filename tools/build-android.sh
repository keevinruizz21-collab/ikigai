#!/usr/bin/env bash
# Compila el APK de Android con Capacitor. Lo usa .github/workflows/release.yml.
set -euo pipefail
VERSION="${GITHUB_REF_NAME:-v1.0.0}"; [[ "$VERSION" == v* ]] || VERSION="v1.0.0"
VNAME="${VERSION#v}"; VCODE=$(echo "$VNAME" | awk -F. '{print ($1*10000)+($2*100)+$3}')
npm ci
# Capacitor inserta su puente como script en línea: en Android se permite (la app no carga contenido remoto).
sed -i "s/script-src 'self';/script-src 'self' 'unsafe-inline';/" web/index.html
npx cap add android
npx capacitor-assets generate --android --assetPath assets || echo "::warning::No se generaron los íconos; se usan los de Capacitor."
npx cap sync android
sed -i -E "s/versionCode [0-9]+/versionCode $VCODE/; s/versionName \"[^\"]*\"/versionName \"$VNAME\"/" android/app/build.gradle
(cd android && ./gradlew --no-daemon assembleRelease)
BT=$(ls -d "$ANDROID_HOME"/build-tools/* | sort -V | tail -1)
UNSIGNED=android/app/build/outputs/apk/release/app-release-unsigned.apk
mkdir -p dist
"$BT/zipalign" -f -p 4 "$UNSIGNED" /tmp/aligned.apk
if [ -n "${IKIGAI_ANDROID_KEY:-}" ]; then
  openssl enc -d -aes-256-cbc -pbkdf2 -iter 200000 -in android-signing/ikigai.jks.enc -out /tmp/ikigai.jks -pass env:IKIGAI_ANDROID_KEY
  "$BT/apksigner" sign --ks /tmp/ikigai.jks --ks-key-alias ikigai --ks-pass env:IKIGAI_ANDROID_KEY --key-pass env:IKIGAI_ANDROID_KEY --out "dist/Ikigai-$VERSION-android.apk" /tmp/aligned.apk
  rm -f /tmp/ikigai.jks
else
  echo "::warning::Falta el secreto IKIGAI_ANDROID_KEY: este APK va firmado con una llave temporal (para actualizarlo habrá que desinstalar)."
  keytool -genkeypair -keystore /tmp/temp.jks -alias temp -keyalg RSA -keysize 2048 -validity 3650 -storepass temporal -keypass temporal -dname "CN=Ikigai prueba"
  "$BT/apksigner" sign --ks /tmp/temp.jks --ks-pass pass:temporal --out "dist/Ikigai-$VERSION-android-prueba.apk" /tmp/aligned.apk
fi
"$BT/apksigner" verify dist/*.apk
ls -la dist
