#!/bin/bash

# Configuration
SENDER="bcgov.sso@gov.bc.ca"
SUBJECT="Keycloak Benchmark Results - $(date +'%Y-%m-%d %H:%M:%S')"
BODY="Please find the attached benchmark results.\nYou need to base64 decode the attached file (base64 -d -i results.tar.gz) before extracting it.\nRegards,\nBCGov SSO Team"
RESULTS_DIR="./results"
ATTACHMENT_NAME="results.tar.gz"

./bin/kcb.sh --scenario="$SCENARIO" --server-url="$SERVER_URL" --admin-username="$ADMIN_USERNAME" --admin-password="$ADMIN_PASSWORD" $ADDITIONAL_CONFIG

if [ -d "$RESULTS_DIR" ]; then

  if [ -f "$ATTACHMENT_NAME" ]; then
    rm "$ATTACHMENT_NAME"
  fi

  tar -czvf "$ATTACHMENT_NAME" "$RESULTS_DIR"

  if [ $? -eq 0 ]; then
    echo "Folder '$RESULTS_DIR' compressed successfully to '$ATTACHMENT_NAME'."

    echo "Getting access token from '$CHES_TOKEN_URL'."

    # Get the access token
    ACCESS_TOKEN=$(curl -X POST -H "Content-Type: application/x-www-form-urlencoded" -d "client_id=$CHES_CLIENT_ID" -d "client_secret=$CHES_CLIENT_SECRET" -d "grant_type=client_credentials" "$CHES_TOKEN_URL" | jq -r '.access_token')

    BASE64_DATA=$(base64 -i $ATTACHMENT_NAME)

    echo '{"from": "'"$SENDER"'", "to": ["'"$RECEPIENT"'"], "subject": "'"$SUBJECT"'", "body": "'"$BODY"'", "bodyType": "text", "attachments": [{"filename": "'"$ATTACHMENT_NAME"'", "content": "'"$BASE64_DATA"'"}]}' | curl -X POST -H "Content-Type: application/json" -H "Authorization: Bearer $ACCESS_TOKEN" --data-binary @- "$MAIL_SERVER"

  else
    echo "Error: Failed to compress folder '$RESULTS_DIR'."
  fi
else
  echo "Folder '$RESULTS_DIR' does not exist."
fi

exit 0
