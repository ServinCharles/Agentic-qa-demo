#!/usr/bin/env bash
# Turns test errors in CI logs into GitHub annotations, so the failure shows on the run summary and in
# the CI failure triage comment (which only sees annotations, not the full log).
#   scripts/report-test-errors.sh logs/*.log
set -u
for log in "$@"; do
  [ -f "$log" ] || continue
  # Cucumber/WebdriverIO failures: error lines, expectation messages and failed steps
  grep -E "Error:|AssertionError|Expected|Received|✖|accessibility violation|\[(critical|serious)\]" "$log" \
    | sed -E 's/\x1b\[[0-9;]*m//g; s/^\[[^]]*\] *//' \
    | awk '!seen[$0]++' | head -15 \
    | while IFS= read -r line; do echo "::error title=$(basename "$log")::${line}"; done
done
exit 0
