#!/bin/bash
set -e

echo "=== Manual Authentication Testing ==="
echo ""

# Kill any existing node processes
pkill -9 node 2>/dev/null || true
sleep 2

# Start dev server
echo "Starting dev server..."
cd /home/ubuntu/homming_vidaro/nextjs_space
NODE_OPTIONS="--max-old-space-size=6144" PORT=3000 __NEXT_TEST_MODE=1 yarn dev > /tmp/dev_test.log 2>&1 &
DEV_PID=$!
echo "Dev server PID: $DEV_PID"

# Wait for server to start
echo "Waiting for server to be ready..."
for i in {1..20}; do
  if curl -s http://localhost:3000 > /dev/null 2>&1; then
    echo "✅ Server is ready!"
    break
  fi
  sleep 2
done

sleep 5

# Test signup
echo ""
echo "Testing signup..."
TIMESTAMP=$(date +%s)
SIGNUP_RESULT=$(curl -s -X POST http://localhost:3000/api/signup \
  -H "Content-Type: application/json" \
  -d "{
    \"email\":\"testuser${TIMESTAMP}@example.com\",
    \"password\":\"Test123!\",
    \"name\":\"Test User\",
    \"companyName\":\"Test Company\",
    \"role\":\"gestor\"
  }")

if echo "$SIGNUP_RESULT" | grep -q '"id"'; then
  echo "✅ Signup successful"
  echo "Response: $SIGNUP_RESULT"
else
  echo "❌ Signup failed"
  echo "Response: $SIGNUP_RESULT"
  echo "Dev server errors:"
  tail -20 /tmp/dev_test.log
fi

# Cleanup
echo ""
echo "Stopping dev server..."
kill $DEV_PID 2>/dev/null || true
sleep 2
pkill -9 node 2>/dev/null || true

echo ""
echo "=== Test Complete ==="
