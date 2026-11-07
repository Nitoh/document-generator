#!/bin/sh
set -eu
if [ "${APPLY_MIGRATIONS:-false}" = "true" ]; then
  dotnet DocumentGenerator.Api.dll --migrate
fi
exec dotnet DocumentGenerator.Api.dll "$@"
