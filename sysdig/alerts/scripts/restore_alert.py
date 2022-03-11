#!/usr/bin/env python
#
# This script shows how to use the update_alert() call to modify the
# details of an existing alert.
#
#

import getopt
import json
import sys
import os

from sdcclient import SdcClient
from dotenv import load_dotenv

load_dotenv()

PROD_PVC_TOKEN = os.getenv('PROD_PVC_TOKEN')
PROD_TOKEN = os.getenv('PROD_TOKEN')
SANDBOX_PVC_TOKEN = os.getenv('SANDBOX_PVC_TOKEN')
SANDBOX_TOKEN = os.getenv('SANDBOX_TOKEN')

#
# Parse arguments
#
json_dumpfilename = None
if len(sys.argv) != 2:
    print('The alert backup requires a valid team name for the backup')
    sys.exit(1)

team_name = sys.argv[1]

# Once we integrate with gold, we will add files to back up here, and add tokens to the .env file
if (team_name == "prod"):
    print("uncomment when restore is working")
    sdc_token = PROD_TOKEN
    json_dumpfilename="backups/prod_alert_backup.json"
elif (team_name == "prod_pvc"):
    sdc_token = PROD_PVC_TOKEN
    json_dumpfilename="backups/prod_pvc_alert_backup.json"
elif (team_name == "sandbox"):
    sdc_token = SANDBOX_TOKEN
    json_dumpfilename="backups/sandbox_alert_backup.json"
elif (team_name == "sandbox_pvc"):
    sdc_token = SANDBOX_PVC_TOKEN
    json_dumpfilename="backups/sandbox_pvc_alert_backup.json"
else:
    print('Invalid Team name, please enter prod, prod_pvc, sandbox, or sandbox_pvc')
    sys.exit(1)


#
# Instantiate the SDC client
#
sdclient = SdcClient(sdc_token)

ok, res = sdclient.get_alerts()
if not ok:
    print(res)
    sys.exit(1)

backedup_alerts= json.loads(open(json_dumpfilename, "r").read())['alerts']
current_alerts = res['alerts']

# Update or create alerts in sysdig for every saved alert.
for backup_alert in backedup_alerts:
    alert_exists_in_sysdig= False
    for alert in current_alerts:
        if alert['name'] == backup_alert['name']:
            ok, res_update = sdclient.update_alert(backup_alert)
            if not ok:
                print(res_update)
                sys.exit(1)
            print(f"Updated alert '{alert['name']}'.")
            alert_exists_in_sysdig = True
            break
    if not alert_exists_in_sysdig:
        ok, res = sdclient.create_alert(alert_obj=backup_alert)
        if not ok:
            print(res)
            sys.exit(1)
        print(f"The alert '{backup_alert['name']}' was created.")
