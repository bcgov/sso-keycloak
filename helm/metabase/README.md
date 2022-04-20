# Metabase config docs

## Installing metabase

The two helm commands are run through the make file in this folder, `make install` and `make upgrade`.  This will install and upgrade metabase in the Gold Production Tools namespace.  If we need to install it somewhere else the script will need to be generalized.  Note this helm chart has not been used to deploy the Silver cluster metabase instance.

## Adding a databse to metabase:

The Gold Metabase deployment can query any db in the gold cluster if the credentials are set up properly.  In future it may extend to silver as well. The gold configuration requires two steps:

### Set Network policies

Metabase needs to access other namespaces.  To allow access we must create a network policy in the namespace holding the target database.  For the sso-patroni databases, this network policy is:

```
kind: NetworkPolicy
apiVersion: networking.k8s.io/v1
metadata:
  name: sso-dev-production-gold-metabase-access
  namespace: eb75ad-dev
spec:
  podSelector:
    matchLabels:
      app: sso-patroni
  ingress:
    - from:
        - namespaceSelector:
            matchLabels:
              environment: tools
              name: eb75ad
        - podSelector:
            matchLabels:
              app: metabase
  policyTypes:
    - Ingress
```

### Connect to the database

Metabase has a built in workflow for adding new databases.  These will require the credentials for the target database.
The one complicated part of adding a db to the metabase account is the host.  This follows the patern:

```
<openshift_service_name>.<target_namespace_name>.svc.cluster.local
```

It is important to connect to the read only service if one is available.  If the connection attempt times out, it is possible the network policy you created is not set up properly.
