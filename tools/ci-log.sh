#!/usr/bin/env bash
# Sube el final del log de compilación a la rama ci-logs-<job>, para poder revisarlo con git.
set +e
JOB="$1"; STATUS="$2"; DIR="${RUNNER_TEMP:-/tmp}/cilog-$JOB"
rm -rf "$DIR"; mkdir -p "$DIR"
{ echo "job=$JOB status=$STATUS run=$GITHUB_RUN_ID ref=$GITHUB_REF_NAME sha=$GITHUB_SHA"; echo; tail -c 250000 build.log 2>/dev/null; } > "$DIR/$JOB.log"
cd "$DIR" && git init -q && git config user.name "ikigai-ci" && git config user.email "ikigai-ci@users.noreply.github.com" \
  && git add . && git commit -qm "log $JOB $STATUS $GITHUB_RUN_ID" \
  && git push -qf "https://x-access-token:${GH_TOKEN}@github.com/${GITHUB_REPOSITORY}.git" HEAD:refs/heads/ci-logs-$JOB
exit 0
