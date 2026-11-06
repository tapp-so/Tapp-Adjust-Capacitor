#!/usr/bin/env bash
# Negative test: a Capacitor 8 host that installs BOTH tapp-capacitor-sdk and
# tapp-adjust-capacitor-sdk must fail the Android build with the exclusive-install guard.
# The script SUCCEEDS only if the Gradle build fails AND prints the guard message.
#
# Usage: CORE_DIR=<path to a tapp-capacitor-sdk checkout> bash build-exclusive-install-host.sh
# CORE_DIR is only read: it is copied to a temp dir, and the copy is built and packed.
set -euo pipefail

cd "$(dirname "${BASH_SOURCE[0]}")/../.."
repo_root="$(pwd)"
major=8
guard="Install exactly one of tapp-capacitor-sdk or tapp-adjust-capacitor-sdk."

if [[ -z ${CORE_DIR:-} || ! -f ${CORE_DIR}/package.json ]]; then
  echo "Usage: CORE_DIR=<tapp-capacitor-sdk checkout> $0 (CORE_DIR is required)" >&2
  exit 1
fi
core_src="$(cd "$CORE_DIR" && pwd)"

work="${RUNNER_TEMP:-/tmp}/capacitor-exclusive-install-host"
rm -rf "$work"
mkdir -p "$work/core"

# Pack a COPY of the core plugin: its build writes dist/, and CORE_DIR must stay untouched.
tar -C "$core_src" --exclude=./node_modules --exclude=./.git --exclude=./dist --exclude='./example-app/node_modules' -cf - . | tar -C "$work/core" -xf -
(
  cd "$work/core"
  npm ci --no-audit --no-fund
  npm run build
  npm pack --pack-destination "$work"
)

cd "$repo_root"
npm run build
npm pack --pack-destination "$work"

core_tarballs=("$work"/tapp-capacitor-sdk-*.tgz)
adjust_tarballs=("$work"/tapp-adjust-capacitor-sdk-*.tgz)
if [[ ${#core_tarballs[@]} -ne 1 || ! -f ${core_tarballs[0]} ]]; then
  echo "Expected one tapp-capacitor-sdk tarball in $work" >&2
  exit 1
fi
if [[ ${#adjust_tarballs[@]} -ne 1 || ! -f ${adjust_tarballs[0]} ]]; then
  echo "Expected one tapp-adjust-capacitor-sdk tarball in $work" >&2
  exit 1
fi

mkdir "$work/app"
cd "$work/app"
npm init -y
npm install --no-audit --no-fund "@capacitor/core@^$major" "@capacitor/cli@^$major" "@capacitor/android@^$major" "${core_tarballs[0]}" "${adjust_tarballs[0]}"

mkdir www
cat > www/index.html <<'HTML'
<!doctype html>
<html lang="en"><head><meta charset="utf-8"><title>Tapp Exclusive Install Host</title></head><body>Tapp Exclusive Install Host</body></html>
HTML
cat > capacitor.config.json <<'JSON'
{"appId":"so.tapp.ci.exclusive.host","appName":"TappExclusiveHost","webDir":"www"}
JSON

npx cap add android
CAPACITOR_ROOT_DIR="$PWD" node "$repo_root/example-app/scripts/ensure-jitpack.mjs"
sed -E -i 's/minSdkVersion[[:space:]]*=[[:space:]]*[0-9]+/minSdkVersion = 24/' android/variables.gradle
npx cap sync android
for project in tapp-capacitor-sdk tapp-adjust-capacitor-sdk; do
  if ! grep -q "':$project'" android/capacitor.settings.gradle; then
    echo "$project not included in host capacitor.settings.gradle" >&2
    exit 1
  fi
done

cd android
java -version
set +e
./gradlew assembleDebug --console=plain --stacktrace > "$work/exclusive-build.txt" 2>&1
status=$?
set -e
cat "$work/exclusive-build.txt"

if [[ $status -eq 0 ]]; then
  echo "FAIL: the Android build succeeded although both plugins are installed." >&2
  exit 1
fi
if ! grep -qF "$guard" "$work/exclusive-build.txt"; then
  echo "FAIL: the Android build failed, but without the expected guard message: $guard" >&2
  exit 1
fi
echo "PASS: the Android build failed with the exclusive-install guard message."
grep -F -m1 "$guard" "$work/exclusive-build.txt"
