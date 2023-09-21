# Metabase config docs

## Upgrading the image

The deployed metabase image is stored in the [sso-keycloak](https://github.com/orgs/bcgov/packages?repo_name=sso-keycloak).

Updating this image is done as follows:
1) Pulling down the metabase image from dockerhub to the developers local machine.
2) Retagging the image `docker tag metabase/metabase ghcr.io/bcgov/sso-keycloak/metabase:<TAG NAME>`
3) Pushing the image up to the ghcr: `docker push ghcr.io/bcgov/sso-keycloak/metabase:<TAG NAME>`
4) Updating the tag in the helm values files.
5) Run `make upgrade NAMESPACE=<<tools namespace>>`
6) Running this command will change the database creds which means the database pod must be scaled down to zero and back to one. The same must be done with the metabase pod for the new credentials to take effect.

## Installing metabase

### Confirm network policies

In order for metabase to deploy successfully, pods within the namespace must have access to each other.  Ensure the the following two network policies are in place:

```
kind: NetworkPolicy
apiVersion: networking.k8s.io/v1
metadata:
  name: allow-same-namespace
  namespace: <NAMESPACE>
spec:
  podSelector: {}
  ingress:
    - from:
        - podSelector: {}
  policyTypes:
    - Ingress
```
and

```
kind: NetworkPolicy
apiVersion: networking.k8s.io/v1
metadata:
  name: allow-from-openshift-ingress
  namespace: <NAMESPACE>
spec:
  podSelector: {}
  ingress:
    - from:
        - namespaceSelector:
            matchLabels:
              network.openshift.io/policy-group: ingress
  policyTypes:
    - Ingress
```

These network policies are fairly generic and may or may not already be configured in the namespace where Metabase is being deployed.

### Install the helm charts

The two helm commands are run through the make file in this folder:

 `make install NAMESPACE=eb75ad-tools`

and

 `make upgrade NAMESPACE=eb75ad-tools`

This will install and upgrade metabase in the Gold Production Tools namespace.  The sandbox namespace is `c6af30-tools`.  Note this helm chart has not been used to deploy the Silver cluster metabase instance. Note running the upgrade command generates new db creds and the pods (both db and metabase must be cycled)

## Adding a databse to metabase:

The Gold Metabase deployment can query any db in the gold cluster if the credentials are set up properly.  In future it may extend to silver as well. The gold configuration requires two steps:

### Set Network policies

Metabase needs to access other namespaces.  To allow access we must create a network policy in the namespace holding the target database.  For the sso-patroni databases, this network policy is:

```
kind: NetworkPolicy
apiVersion: networking.k8s.io/v1
metadata:
  name: <NAMESPACE DESCRIPTION>-metabase-access
  namespace: <TARGET NAMESPACE>
spec:
  podSelector:
    matchLabels:
      app: <DATABASE CLUSTER TAG>
  ingress:
    - from:
        - namespaceSelector:
            matchLabels:
              environment: <METABASE NAMESPACE ENVIRONMENT>
              name: <METABASE NAMESPACE LICENCE PLATE>
        - podSelector:
            matchLabels:
              app: metabase
  policyTypes:
    - Ingress
```

The config for Gold Metabase are:

```
  DATABASE CLUSTER TAG: sso-patroni
  METABASE NAMESPACE ENVIRONMENT: tools
  METABASE NAMESPACE LICENCE PLATE (production): eb75ad
  METABASE NAMESPACE LICENCE PLATE (sandbox): c6af30
```


### Connect to the database

Metabase has a built in workflow for adding new databases.  These will require the credentials for the target database.
The one complicated part of adding a db to the metabase account is the host.  This follows the patern:

```
<openshift_service_name>.<target_namespace_name>.svc.cluster.local
```

It is important to connect to the read only service if one is available.  If the connection attempt times out, it is possible the network policy you created is not set up properly.
