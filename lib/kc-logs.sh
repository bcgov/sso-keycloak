#!/bin/bash
set -e

namespaces=("eb75ad-dev" "eb75ad-prod" "eb75ad-test")

usage() {
    cat <<EOF

Extract sso-keycloak logs from target namespace;

Usages:
    $0 <namespace> <days_old>

Available namespaces:
$(
    for s in "${namespaces[@]}"
    do
      echo "- $s"
    done
)

Examples:
    $ $0 eb75ad-dev
EOF
}

if [ "$#" -lt 1 ]; then
    usage
    exit 1
fi

if [ -z $2 ] || [ $2 -lt 2 ]; then
  PRV_DATE=$(date -v-1d +%F)
  CURR_DATE=$(date +%F)
else
  START_FROM="$(( $2-1 ))"
  CURR_DATE=$(date -v-"${START_FROM}"d +%F)
  PRV_DATE=$(date -v-"${2}"d +%F)
fi

NAMESPACE=$1

echo "extracting logs from $PRV_DATE to $CURR_DATE"

if [[ ! " ${namespaces[@]} " =~ " ${NAMESPACE} " ]]; then
    >&2 echo "$1 is not a valid namespace"
    usage
    exit 1
fi

CURR_DIR=$(pwd)

if ! command -v oc &> /dev/null
then
    echo "oc command could not be found"
    exit
else
    echo "oc client found - $(oc version)"
fi

if ! oc whoami &> /dev/null; then
    echo "please login to the cluster to continue..."
else
    echo "logged in as $(oc whoami)"
fi

POD_NAME=$(oc -n "${NAMESPACE}" get pods -o json -l app.kubernetes.io/name=sso-keycloak | jq -r '. | .items[0].metadata.name')

LIST_OF_FILES=$(oc -n "${NAMESPACE}" exec $POD_NAME  -- /bin/bash -c "find /var/log/eap -type f -name '*.log' -newerct $PRV_DATE ! -newerct $CURR_DATE -printf '%f\n'")

for file in $LIST_OF_FILES;
do
  oc -n "${NAMESPACE}" cp $POD_NAME:/var/log/eap/$file $CURR_DIR/$file
done

ZIP_FILE=$(oc -n "${NAMESPACE}" exec $POD_NAME  -- /bin/bash -c "find /var/log/eap -type f -name '$PRV_DATE.zip' -printf '%f\n'")

if [[ ! -z $ZIP_FILE ]]; then
    oc -n "${NAMESPACE}" cp $POD_NAME:/var/log/eap/$ZIP_FILE $CURR_DIR/$ZIP_FILE
    if ! unzip $ZIP_FILE; then
      echo "zip file may be corrupted so ignoring it"
    else
      unzip -uq $ZIP_FILE
      echo "successfully fetched and inflated the zip file"
    fi
else
  echo "$PRV_DATE.zip not found"
  exit 1
fi

FILES_FROM_ZIP=$(find . -maxdepth 1 -type f -name "*.log.$PRV_DATE")

ALL_FILES="$LIST_OF_FILES $FILES_FROM_ZIP"

# create a csv file with all the logs
generate_csv(){
  echo "Processing $1 file...";
  cat $1 | jq '{time: ."@timestamp", message: .message}' | jq '{data: ("time=" + .time + ", " + .message)} | .data' | awk -F"," -v OFS="|" '{gsub(/\,/,"",$4);gsub(/\"/,"");gsub(/^[[:space:]]+|[[:space:]]+$/,"",$4);gsub(/^[[:space:]]+|[[:space:]]+$/,"",$5);print $1, $2, $3, $4, $5, $6, $7, $8, $9}' >> $PRV_DATE.csv
}

for file in $ALL_FILES;
do
  generate_csv $file
done

remove_strs(){
  echo "removing occurrences of $1 from output file"
  sed -i '' -e "s/$1//g" $PRV_DATE.csv
}

if [[ ! -z $CURR_DIR/$PRV_DATE.csv ]]; then
  # remove list of strings to use in excel for log analysis
  LIST_OF_STRS=("time=" "ipAddress=")

  for s in ${LIST_OF_STRS[@]}
  do
    remove_strs $s
  done
fi
