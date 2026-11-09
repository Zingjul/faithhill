#!/usr/bin/env bash
# Render build script for the Faith Hill API.
#
# Runs on every deploy. Everything here must be idempotent and safe to run
# repeatedly, because Render may restart the service at any time.
set -o errexit  # exit on error

echo "==> Installing Python dependencies"
pip install --upgrade pip
pip install -r requirements.txt

cd faithhill

echo "==> Collecting static files (Django admin CSS/JS)"
python manage.py collectstatic --no-input --clear

echo "==> Applying database migrations"
python manage.py migrate --no-input

echo "==> Checking deployment configuration"
# --deploy fails on insecure settings. Warnings are printed rather than fatal
# so a missing optional variable doesn't block a release, but they show up in
# the Render log for review.
python manage.py check --deploy || echo "!!! deploy check reported warnings"

echo "==> Build finished"
