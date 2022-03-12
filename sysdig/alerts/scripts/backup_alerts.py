#!/usr/bin/env python
#
# Print 'enabled' flag and name for all of the alerts created by the user
# Optionally dump the full Alerts list as a JSON object to a target file.

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

#
# Fire the request.
#
ok, res = sdclient.get_alerts()

#
# Show the list of alerts
#
if not ok:
    print(res)
    sys.exit(1)





print(len(res['alerts']))

if json_dumpfilename:
    with open(json_dumpfilename, "w") as f:
        json.dump(res, f, sort_keys=True, indent=4)
