#!/usr/bin/env python
#
# This script shows how to use the update_alert() call to modify the
# details of an existing alert.
#
#

import getopt
import json
from pickle import NONE
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
#     sdc_token = PROD_TOKEN
#     json_dumpfilename="backups/prod_alert_backup.json"
# elif (team_name == "prod_pvc"):
#     sdc_token = PROD_PVC_TOKEN
#     json_dumpfilename="backups/prod_pvc_alert_backup.json"
# elif (team_name == "sandbox"):
#     sdc_token = SANDBOX_TOKEN
#     json_dumpfilename="backups/sandbox_alert_backup.json"
elif (team_name == "sandbox_pvc"):
    sdc_token = SANDBOX_PVC_TOKEN
    json_dumpfilename="backups/sandbox_pvc_alert_backup.json"
else:
    print('Invalid Team name, please enter prod, prod_pvc, sandbox, or sandbox_pvc')
    sys.exit(1)







# # This is the old will be deleted
# # Parse arguments
# #
# def usage():
#     print(('usage: %s [-a|--alert <name>] <sysdig-token>' % sys.argv[0]))
#     print('-a|--alert: Set name of alert to update')
#     print('You can find your token at https://app.sysdigcloud.com/#/settings/user')
#     sys.exit(1)


# try:
#     opts, args = getopt.getopt(sys.argv[1:], "a:", ["alert="])
# except getopt.GetoptError:
#     usage()

# alert_name = "tomcat cpu > 80% on any host"
# for opt, arg in opts:
#     if opt in ("-a", "--alert"):
#         alert_name = arg

# if len(args) != 1:
#     usage()

# sdc_token = args[0]

#
# Instantiate the SDC client
#
sdclient = SdcClient(sdc_token)

# ok, res = sdclient.get_alerts()
# if not ok:
#     print(res)
#     sys.exit(1)

##DONE
# 1) pull in the alerts to restore

##TODO
# 2) for each alert in the list check that it exist remotely
# 3) if yes update
# 4) if no create a new alert
# 5) check if



alert =json.loads('''{
            "autoCreated": false,
            "createdOn": 1646369170603,
            "customNotification": {
                "titleTemplate": "{{__alert_name__}} is {{__alert_status__}}",
                "useNewTemplate": true
            },
            "customerId": 23935,
            "enabled": true,
            "groupName": "default",
            "id": 8137970,
            "invalidMetrics": [],
            "modifiedOn": 1646369170603,
            "monitor": [
                {
                    "metric": "cpu.cores.used",
                    "stdDevFactor": 2.0
                },
                {
                    "metric": "cpu.cores.used.percent",
                    "stdDevFactor": 2.0
                },
                {
                    "metric": "cpu.stolen.percent",
                    "stdDevFactor": 2.0
                },
                {
                    "metric": "cpu.used.percent",
                    "stdDevFactor": 2.0
                },
                {
                    "metric": "file.bytes.total",
                    "stdDevFactor": 2.0
                },
                {
                    "metric": "fs.used.percent",
                    "stdDevFactor": 2.0
                },
                {
                    "metric": "memory.bytes.used",
                    "stdDevFactor": 2.0
                },
                {
                    "metric": "memory.swap.bytes.used",
                    "stdDevFactor": 2.0
                },
                {
                    "metric": "metricCount.appCheck",
                    "stdDevFactor": 2.0
                },
                {
                    "metric": "metricCount.jmx",
                    "stdDevFactor": 2.0
                },
                {
                    "metric": "metricCount.prometheus",
                    "stdDevFactor": 2.0
                },
                {
                    "metric": "metricCount.statsd",
                    "stdDevFactor": 2.0
                },
                {
                    "metric": "net.bytes.total",
                    "stdDevFactor": 2.0
                },
                {
                    "metric": "net.tcp.queue.len",
                    "stdDevFactor": 2.0
                },
                {
                    "metric": "syscall.count",
                    "stdDevFactor": 2.0
                },
                {
                    "metric": "thread.count",
                    "stdDevFactor": 2.0
                }
            ],
            "name": "Test alert 5",
            "notificationCount": 0,
            "rateOfChange": false,
            "reNotify": false,
            "reNotifyMinutes": 30,
            "segmentBy": [
                "container.id"
            ],
            "segmentCondition": {
                "type": "ANY"
            },
            "severity": 4,
            "severityLabel": "LOW",
            "teamId": 36251,
            "timespan": 600000000,
            "type": "BASELINE",
            "valid": true,
            "version": 1
        }''')

updatedAlert= json.loads('''{
            "autoCreated": false,
            "condition": "avg(kubelet_volume_stats_used_bytes/kubelet_volume_stats_capacity_bytes) by (persistentvolumeclaim) > 0.2",
            "createdOn": 1633556569521,
            "customNotification": {
                "titleTemplate": "{{__alert_name__}} is {{__alert_status__}}",
                "useNewTemplate": true
            },
            "customerId": 23935,
            "description": "A new promQL Alert 2",
            "enabled": false,
            "groupName": "default",
            "id": 4613716,
            "invalidMetrics": [],
            "modifiedOn": 1646369213785,
            "name": "New PromQL Alert",
            "notificationCount": 0,
            "rateOfChange": false,
            "reNotify": false,
            "reNotifyMinutes": 30,
            "severity": 4,
            "severityLabel": "LOW",
            "teamId": 36251,
            "timespan": 60000000,
            "type": "PROMETHEUS",
            "valid": true,
            "version": 12
        }''')

# if "description" not in alert:
#     print('there was no description')
#     alert['description']=""

# if "name" not in alert:
#     print('there was no name')
#     alert['name']=""

# if "severity" not in alert:
#     print('there was no severity')
#     alert['severity']=""

# if "for_atleast_s" not in alert:
#     print('there was no for_atleast_s')
#     alert['for_atleast_s']=""

# if "condition" not in alert:
#     print('there was no condition')
#     alert['condition']=""



# ok, res = sdclient.update_alert(updatedAlert)
ok, res = sdclient.create_alert(alert_obj=alert)

if not ok:
    print(res)
    sys.exit(1)
print(res)
