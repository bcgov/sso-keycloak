# TO DO

1) go through the sample scripts and see what's there
1) pull down existing alerts
2) push up alerts
the list alerts script generates a list of alerts the user has access too. Each alert has the form:

{
   "id":2718443,
   "version":1,
   "createdOn":1614799299870,
   "modifiedOn":1614799299870,
   "type":"MANUAL",
   "name":"[Kubernetes] Deployment Stuck",
   "description":"When updated pods is not equal to the desired pods, deployment may get stuck",
   "enabled":false,
   "severity":4,
   "timespan":60000000,
   "customNotification":{
      "titleTemplate":"{{__alert_name__}} is {{__alert_status__}} on kubernetes.deployment.name = {{kubernetes.deployment.name}}",
      "useNewTemplate":true
   },
   "notificationCount":0,
   "teamId":34493,
   "autoCreated":true,
   "rateOfChange":false,
   "reNotifyMinutes":30,
   "reNotify":false,
   "invalidMetrics":[

   ],
   "groupName":"default",
   "valid":true,
   "severityLabel":"LOW",
   "segmentBy":[
      "kubernetes.deployment.name"
   ],
   "segmentCondition":{
      "type":"ANY"
   },
   "condition":"avg(timeAvg(kubernetes.deployment.replicas.desired)) != avg(timeAvg(kubernetes.deployment.replicas.updated))",
   "customerId":23935
}


If we pull and filter by teams we can store alerts for this team.

Recomend: experiment with the sandbox team. Pull down the alerts.  Delete them. Then restore them.  Create 3 python scripts:

script 1: pull down all alerts for a given team as a version controlled back up (use list alerts as the base)
-use 'teamID' and 'token' as a parameters,  and 'backupName' as an output()
script 2: create a script that restores from this list of JSON objects (use crea alerts as the base)
-param: token, backupName, output: status print statement
script 3: creat a script that restores a single alert based on some key value pair
-param: token, backupName, UID.
-maybe allow the delete_alert method to
