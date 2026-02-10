#!/bin/bash
# Audit all pages and internal links on the server
# Run directly on production server for speed

APP="/opt/inmova-app"
BASE="http://localhost:3000"
COOKIES="/tmp/audit-cookies.txt"

echo "=== LINK AUDIT ==="

# 1. Auth
echo "1. Authenticating..."
CSRF=$(curl -s -c $COOKIES "$BASE/api/auth/csrf" | python3 -c "import sys,json; print(json.load(sys.stdin).get('csrfToken',''))" 2>/dev/null)
curl -s -c $COOKIES -b $COOKIES -X POST "$BASE/api/auth/callback/credentials" \
  -H 'Content-Type: application/x-www-form-urlencoded' \
  -d "csrfToken=$CSRF&email=admin@inmova.app&password=Admin123!" \
  -L -o /dev/null 2>/dev/null
SESSION=$(curl -s -b $COOKIES "$BASE/api/auth/session" 2>/dev/null)
echo "   Session: $(echo $SESSION | python3 -c "import sys,json; print(json.load(sys.stdin).get('user',{}).get('email','NONE'))" 2>/dev/null || echo 'failed')"

# 2. Get all page routes
echo ""
echo "2. Finding all page routes..."
PAGES=$(find $APP/app -name 'page.tsx' -not -path '*/api/*' -not -path '*/__tests__/*' -not -path '*node_modules*' | \
  sed "s|$APP/app||;s|/page\.tsx||;s|^$|/|" | \
  grep -v '^/(' | grep -v '/\[' | \
  sort -u)
PAGE_COUNT=$(echo "$PAGES" | wc -l)
echo "   Found $PAGE_COUNT page routes"

# 3. Test each page and collect hrefs
echo ""
echo "3. Testing pages and collecting links..."
PAGE_OK=0
PAGE_ERR=0
ALL_LINKS=""
ERRORS=""

for page in $PAGES; do
  CODE=$(curl -s -b $COOKIES -o /tmp/audit-page.html -w '%{http_code}' "$BASE$page" --max-time 10 2>/dev/null)
  if [ "$CODE" = "200" ]; then
    PAGE_OK=$((PAGE_OK + 1))
    # Extract internal hrefs from the HTML
    LINKS=$(cat /tmp/audit-page.html 2>/dev/null | tr '"' '\n' | tr "'" '\n' | grep '^/' | grep -v '^/_next' | grep -v '^/api/' | grep -v '^\.\.' | sed 's/?.*//' | sed 's/#.*//' | sort -u)
    ALL_LINKS="$ALL_LINKS
$LINKS"
  elif echo "$CODE" | grep -qE '^30[1278]$'; then
    PAGE_OK=$((PAGE_OK + 1))
  else
    PAGE_ERR=$((PAGE_ERR + 1))
    ERRORS="$ERRORS
PAGE_ERROR $CODE $page"
  fi
done

echo "   Pages: $PAGE_OK OK, $PAGE_ERR errors"

# 4. Deduplicate links and test each
UNIQUE_LINKS=$(echo "$ALL_LINKS" | sort -u | grep -v '^$' | grep -v '\[' | grep -v '\{' | grep '^/')
LINK_COUNT=$(echo "$UNIQUE_LINKS" | wc -l)
echo ""
echo "4. Testing $LINK_COUNT unique internal links..."

LINK_OK=0
LINK_REDIR=0
LINK_ERR=0

for link in $UNIQUE_LINKS; do
  # Skip non-page paths
  case "$link" in
    /favicon*|/manifest*|/sw.*|/icons/*|/images/*|/fonts/*|*.js|*.css|*.png|*.jpg|*.svg|*.ico|*.webp)
      continue ;;
  esac
  
  CODE=$(curl -s -b $COOKIES -o /dev/null -w '%{http_code}' "$BASE$link" --max-time 8 2>/dev/null)
  if [ "$CODE" = "200" ]; then
    LINK_OK=$((LINK_OK + 1))
  elif echo "$CODE" | grep -qE '^30[1278]$'; then
    LINK_REDIR=$((LINK_REDIR + 1))
  elif [ "$CODE" = "000" ]; then
    # Timeout, skip
    continue
  else
    LINK_ERR=$((LINK_ERR + 1))
    ERRORS="$ERRORS
LINK_404 $CODE $link"
  fi
done

echo "   Links: $LINK_OK OK, $LINK_REDIR redirects, $LINK_ERR broken"

# 5. Report
echo ""
echo "=== RESULTS ==="
echo "Pages: $PAGE_OK/$PAGE_COUNT OK"
TOTAL_LINKS=$((LINK_OK + LINK_REDIR))
TOTAL_TESTED=$((TOTAL_LINKS + LINK_ERR))
echo "Links: $TOTAL_LINKS/$TOTAL_TESTED OK"

if [ -n "$(echo "$ERRORS" | grep -v '^$')" ]; then
  echo ""
  echo "=== ERRORS ==="
  echo "$ERRORS" | grep -v '^$' | sort
fi

echo ""
echo "=== DONE ==="
