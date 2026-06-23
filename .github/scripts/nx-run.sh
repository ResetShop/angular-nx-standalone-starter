#!/usr/bin/env bash
# Runs an Nx task using Nx Cloud. If the cloud is disabled for lack of credit
# (workspace disabled / limit exceeded), Nx aborts with a non-zero exit code and
# NO fallback of its own. Here we detect that specific case and retry with
# NX_NO_CLOUD=true: the task runs without the cloud (against Nx's local cache)
# instead of failing the pipeline.
# Any other failure (a broken test, red lint, etc.) is propagated as-is.
set -o pipefail

log="$(mktemp)"

if npx "$@" 2>&1 | tee "$log"; then
	exit 0
fi

if grep -qiE "workspace is disabled|nx cloud.*(disabled|limit|quota|exceed)" "$log"; then
	echo "::warning title=Nx Cloud out of credit::Workspace disabled; retrying without the cloud (local cache)."
	NX_NO_CLOUD=true npx "$@"
else
	exit 1
fi
