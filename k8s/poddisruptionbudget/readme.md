# pod disruption budgets for silver cluster

In gold these will be managed through help templates, however that's not a critical feature for silver

## patroni pdb

We require a minimum of 2 patroni pods up at all times.

To add a pdb to a project run:

```
 oc process -f ./patroni-pdb.yaml -p STATEFULSET=<stateful set label> | oc apply -f -
```

The namespaces and stateful sets this will be applied to are:

 - 3d5c3f-dev - sso-pgsql-dev
 - 3d5c3f-test - sso-pgsql-test
 - 3d5c3f-prod - sso-pgsql-prod
 - 6d70e7-dev - sso-pgsql-dev
 - 6d70e7-test - sso-pgsql-test
 - 6d70e7-prod - sso-pgsql-prod


## SSO pdb
