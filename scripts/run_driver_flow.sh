#!/usr/bin/env bash
set -euo pipefail
EMAIL="test.driver+$(date +%s)@example.com"
PASSWORD="Password123!"
echo "EMAIL=$EMAIL"

# 1) Signup
SIGNUP=$(curl -s -X POST http://localhost:8000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d "{\"name\": \"Test Driver\", \"email\": \"${EMAIL}\", \"password\": \"${PASSWORD}\"}")

echo "\n--- SIGNUP RESPONSE ---"
echo "$SIGNUP"

# Extract token using python
TOKEN=$(echo "$SIGNUP" | python3 -c 'import sys, json
try:
  j=json.load(sys.stdin)
  print(j.get("data", {}).get("accessToken", ""))
except Exception:
  print("")')

echo "\nTOKEN: $TOKEN"
if [ -z "$TOKEN" ]; then
  echo "No token extracted; aborting authenticated steps."; exit 0;
fi

AUTH_HEADER="Authorization: Bearer $TOKEN"

# 2) Register driver
REG=$(curl -s -X POST http://localhost:8000/api/drivers/register \
  -H "Content-Type: application/json" \
  -H "$AUTH_HEADER" \
  -d "{\"vehicleNumber\": \"ABC123\", \"licenseNumber\": \"LIC123\"}")

echo "\n--- REGISTER RESPONSE ---"
echo "$REG"

# 3) GET /drivers/me
ME=$(curl -s -X GET http://localhost:8000/api/drivers/me -H "Content-Type: application/json" -H "$AUTH_HEADER")

echo "\n--- /drivers/me RESPONSE ---"
echo "$ME"

# 4) GET /drivers/documents
DOCS=$(curl -s -X GET http://localhost:8000/api/drivers/documents -H "Content-Type: application/json" -H "$AUTH_HEADER")

echo "\n--- /drivers/documents RESPONSE ---"
echo "$DOCS"

# 5) GET /rides/history
RIDES=$(curl -s -X GET "http://localhost:8000/api/rides/history?limit=5" -H "Content-Type: application/json" -H "$AUTH_HEADER")

echo "\n--- /rides/history RESPONSE ---"
echo "$RIDES"

# 6) Attempt document upload (multipart)
UPLOAD=$(curl -s -X POST http://localhost:8000/api/drivers/documents -H "$AUTH_HEADER" -F "document=@scripts/run_driver_flow.sh" -F "type=Driver License")

echo "\n--- DOCUMENT UPLOAD RESPONSE ---"
echo "$UPLOAD"

echo "\nDone"
