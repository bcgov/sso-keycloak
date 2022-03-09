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

ok, res = sdclient.get_alerts()
if not ok:
    print(res)
    sys.exit(1)

##DONE
# 1) pull in the alerts to restore

##TODO
# 2) for each alert in the list check that it exist remotely
# 3) if yes update
# 4) if no create a new alert
# 5) check if


backedup_alerts= json.loads(open(json_dumpfilename, "r").read())['alerts']
current_alerts = res['alerts']

# print(backedup_alerts)
# Update or create alerts in sysdig for every saved alert.
for backup_alert in backedup_alerts:
    alert_exists_in_sysdig= False
    for alert in current_alerts:
        if alert['name'] == backup_alert['name']:
            print(f"Attempting to update alert '{alert['name']}'.")
            ok, res_update = sdclient.update_alert(backup_alert)
            if not ok:
                print(res_update)
                sys.exit(1)
            print(f"Updated alert '{alert['name']}'.")
            alert_exists_in_sysdig = True
            break
    if not alert_exists_in_sysdig:
        print(f"Attempting to create alert.")
        backedup_alerts.pop('createdOn')
        print(backedup_alerts)
        # ok, res = sdclient.update_alert(backedup_alerts)
        # # ok, res = sdclient.create_alert(backedup_alerts)
        # if not ok:
        #     print(res_update)
        #     sys.exit(1)
        print(f"The alert '{backedup_alerts['name']}' was created.")


        '''
        Create a threshold-based alert.

        Args:
            name (str): the alert name. This will appear in the Sysdig Monitor UI and in notification emails
            description (str): the alert description. This will appear in the Sysdig Monitor UI and in notification emails
            severity (int): syslog-encoded alert severity. This is a number from 0 to 7 where 0 means 'emergency' and 7 is 'debug'
            for_atleast_s (int): the number of consecutive seconds the condition must be satisfied for the alert to fire
            condition (int): the alert condition, as described here https://app.sysdigcloud.com/apidocs/#!/Alerts/post_api_alerts
            segmentby (List(str)): a list of Sysdig Monitor segmentation criteria that can be used to apply the alert to multiple entities. For example, segmenting a CPU alert by ``['host.mac', 'proc.name']`` allows to apply it to any process in any machine.
            segment_condition (str): When :param:`segmentby` is specified (and therefore the alert will cover multiple entities) this field is used to determine when it will fire. In particular, you have two options for *segment_condition*: **ANY** (the alert will fire when at least one of the monitored entities satisfies the condition) and **ALL** (the alert will fire when all of the monitored entities satisfy the condition).
            user_filter (str): a boolean expression combining Sysdig Monitor segmentation criteria that makes it possible to reduce the scope of the alert. For example: ``kubernetes.namespace.name='production' and container.image='nginx'``.
            notify (str): the type of notification you want this alert to generate. Options are ``EMAIL``, ``SNS``, ``PAGER_DUTY``, ``SYSDIG_DUMP``
            enabled (bool): if True, the alert will be enabled when created.
            annotations (dict): an optional dictionary of custom properties that you can associate to this alert for automation or management reasons.
            alert_obj (object): an optional fully-formed Alert object of the format returned in an "alerts" list by :func:`~SdcClient.get_alerts` This is an alternative to creating the Alert using the individual parameters listed above.
            type (str): the type of the alert, ``MANUAL`` if the alert uses a normal query, ``PROMETHEUS``  if it's PromQL

        Returns:
            A tuple where the first parameter indicates if the call was successful,
            and the second parameter holds either the error as string, or the
            response object.
        '''
# Update
# for alert in current_alerts:
#     alert_in_backup= False
#     for backup_alert in backedup_alerts:
#         if alert['name'] == backup_alert['name']:
#             ok, res_update = sdclient.update_alert(backup_alert)
#             if not ok:
#                 print(res_update)
#                 sys.exit(1)
#             alert_in_backup = True
#             break
#     if not alert_in_backup:
#         print(f"The alert '{alert['name']}' was not found in the backup.  Consider running the backup script to save it")





# alert_found = False
# for alert in res['alerts']:
#     if alert['name'] == alert_name:
#         alert_found = True
#         print('Updating alert. Configuration before changing timespan, description, and notification channels:')
#         print((json.dumps(alert, sort_keys=True, indent=4)))
#         if 'notificationChannelIds' in alert:
#             alert['notificationChannelIds'] = alert['notificationChannelIds'][0:-1]
#         update_txt = ' (changed by update_alert)'
#         if alert['description'][-len(update_txt):] != update_txt:
#             alert['description'] = alert['description'] + update_txt
#         alert['timespan'] = alert['timespan'] * 2  # Note: Expressed in seconds * 1000000
#         ok, res_update = sdclient.update_alert(alert)

#         if not ok:
#             print(res_update)
#             sys.exit(1)

#         # Validate and print the results
#         print('\nAlert after modification:')
#         print((json.dumps(res_update, sort_keys=True, indent=4)))

# if not alert_found:
#     print('Alert to be updated not found')
#     sys.exit(1)
