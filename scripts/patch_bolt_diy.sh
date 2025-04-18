#!/bin/bash

# This script patches the bolt.diy frontend to work with OpenHands

set -e

BOLT_DIY_DIR="./bolt_diy"

if [ ! -d "$BOLT_DIY_DIR" ]; then
    echo "Error: bolt.diy directory not found. Please run 'make build-bolt-diy' first."
    exit 1
fi

echo "Patching bolt.diy frontend to work with OpenHands..."

# Create a patch file for the vite.config.ts to ensure it works with OpenHands API
cat > /tmp/vite_config_patch.diff << 'EOL'
--- vite.config.ts.orig	2023-01-01 00:00:00.000000000 +0000
+++ vite.config.ts	2023-01-01 00:00:00.000000000 +0000
@@ -33,6 +33,7 @@
       port: FE_PORT,
       proxy: {
         "/api": {
+          rewrite: (path) => path.replace(/^\/api/, ''),
           target: API_URL,
           changeOrigin: true,
           secure: !INSECURE_SKIP_VERIFY,
EOL

# Apply the patch
cd "$BOLT_DIY_DIR"
cp vite.config.ts vite.config.ts.orig
patch -p0 < /tmp/vite_config_patch.diff

# Create a patch for the API client to work with OpenHands
cat > /tmp/api_client_patch.diff << 'EOL'
--- app/lib/.server/api/client.ts.orig	2023-01-01 00:00:00.000000000 +0000
+++ app/lib/.server/api/client.ts	2023-01-01 00:00:00.000000000 +0000
@@ -1,6 +1,6 @@
 import { json } from '@remix-run/server-runtime';
 
-const API_URL = 'http://localhost:3000';
+const API_URL = '';
 
 export async function apiClient(
   path: string,
EOL

# Find the API client file and apply the patch
API_CLIENT_FILE=$(find app -name "client.ts" -path "*/api/*" | head -n 1)
if [ -n "$API_CLIENT_FILE" ]; then
    cp "$API_CLIENT_FILE" "$API_CLIENT_FILE.orig"
    patch -p0 "$API_CLIENT_FILE" < /tmp/api_client_patch.diff
    echo "Patched API client file: $API_CLIENT_FILE"
else
    echo "Warning: Could not find API client file to patch"
fi

# Create a patch for the git integration to work with OpenHands
cat > /tmp/git_integration_patch.diff << 'EOL'
--- app/lib/.server/git/integration.ts.orig	2023-01-01 00:00:00.000000000 +0000
+++ app/lib/.server/git/integration.ts	2023-01-01 00:00:00.000000000 +0000
@@ -1,6 +1,6 @@
 import { json } from '@remix-run/server-runtime';
 
-const API_URL = 'http://localhost:3000';
+const API_URL = '';
 
 export async function gitClient(
   path: string,
EOL

# Find the git integration file and apply the patch
GIT_INTEGRATION_FILE=$(find app -name "integration.ts" -path "*/git/*" | head -n 1)
if [ -n "$GIT_INTEGRATION_FILE" ]; then
    cp "$GIT_INTEGRATION_FILE" "$GIT_INTEGRATION_FILE.orig"
    patch -p0 "$GIT_INTEGRATION_FILE" < /tmp/git_integration_patch.diff
    echo "Patched git integration file: $GIT_INTEGRATION_FILE"
else
    echo "Warning: Could not find git integration file to patch"
fi

# Return to the original directory
cd - > /dev/null

echo "Patching completed successfully."