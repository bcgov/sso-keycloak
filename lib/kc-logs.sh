#!/bin/bash
set -e

namespaces=("eb75ad-dev" "eb75ad-prod" "eb75ad-test")

usage() {
    cat <<EOF

Extract sso-keycloak logs from target namespace;

Usages:
    $0 <namespace>

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

NAMESPACE=$1

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

PRV_DATE=$(date -v-1d +%F)

CURR_DATE=$(date +%F)

LIST_OF_FILES=$(oc -n "${NAMESPACE}" exec $POD_NAME  -- /bin/bash -c "find /var/log/eap -type f -name '*.log' -newerct $PRV_DATE ! -newerct $CURR_DATE -printf '%f\n'")

LIST_OF_BKP_FILES=$(oc -n "${NAMESPACE}" exec $POD_NAME  -- /bin/bash -c "find /var/log/eap -type f -name '*.log.$PRV_DATE' -printf '%f\n'")

# remove old log and csv files
echo "removing any existing log and csv files"
rm -rf *.log && rm -rf *.log.* && rm -rf *.csv

# create a csv file with all the logs
generate_csv(){
  echo "Processing $1 file...";
  oc -n "${NAMESPACE}" cp $POD_NAME:/var/log/eap/$1 $CURR_DIR/$1
  cat $1 | jq '{time: ."@timestamp", message: .message}' | jq '{data: ("time=" + .time + ", " + .message)} | .data' | awk -F"," -v OFS="|" '{gsub(/\,/,"",$4);gsub(/\"/,"");gsub(/^[[:space:]]+|[[:space:]]+$/,"",$4);gsub(/^[[:space:]]+|[[:space:]]+$/,"",$5);print $1, $2, $3, $4, $5, $6, $7, $8, $9}' >> $PRV_DATE.csv
}

LIST_OF_FILES="$LIST_OF_FILES $LIST_OF_BKP_FILES"

for f in $LIST_OF_FILES;
do
  generate_csv $f
done

remove_strs(){
  echo "removing occurrences of $1 from output file"
  sed -i '' -e "s/$1//g" $PRV_DATE.csv
}

# remove list of strings to use in excel for log analysis
LIST_OF_STRS=("time=" "operationType=" "type=" "realmId=" "clientId=" "ipAddress=")

for s in ${LIST_OF_STRS[@]}
do
  remove_strs $s
done
