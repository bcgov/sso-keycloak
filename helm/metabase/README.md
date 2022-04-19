TO DO

Figute out how metabase is configured in silver
Q: what namespace is it in?
A:tools

Q: how does metabase connect to the

Q: There are some TODO comments in the values file... how do I reference them?

helm install "${NAME}" . -n "${NAMESPACE}" -f values.yaml -f "values-${NAMESPACE}-${NAME}.yaml"
Add a make file to build the metabase instance

helm install metabase . -n c6af30-tools -f values.yaml -f "values-c6af30-tools.yaml"
helm uninstall metabase . -n c6af30-tools -f values.yaml -f "values-c6af30-tools.yaml"
A gold route:
https://sso-keycloak-eb75ad-dev.apps.gold.devops.gov.bc.ca/

cannot trigger a deployment for "metabase" because it contains unresolved images
--changed the image to match server

New error on creating pods!!
(combined from similar events):
Error creating:
pods "metabase-1-nhhqp" is forbidden:
exceeded quota: compute-long-running-quota,
requested: limits.memory=4Gi,requests.cpu=500m, requests.memory=2Gi, used: limits.memory=1Gi,requests.cpu=50m,requests.memory=256Mi, limited: limits.memory=4Gi,requests.cpu=500m,requests.memory=2Gi

Connection error to the db.
Create a network policy that allows communication between pods!

Next problem:  Route not working?

Name:			metabase
Namespace:		c6af30-tools
Created:		21 hours ago
Labels:			app=metabase
			app.kubernetes.io/managed-by=Helm
			service=metabase
			template=metabase-postgresql-template
Annotations:		meta.helm.sh/release-name=metabase
			meta.helm.sh/release-namespace=c6af30-tools
			openshift.io/host.generated=true
Requested Host:		metabase-c6af30-tools.apps.gold.devops.gov.bc.ca
			   exposed on router default (host router-default.apps.gold.devops.gov.bc.ca) 21 hours ago
Path:			<none>
TLS Termination:	edge
Insecure Policy:	Redirect
Endpoint Port:		<all endpoint ports>

Service:	metabase
Weight:		100 (100%)
Endpoints:	10.97.20.140:3000

Name:			metabase
Namespace:		6d70e7-tools
Created:		7 months ago
Labels:			app=metabase
			service=metabase
			template=metabase-postgresql-template
Annotations:		openshift.io/host.generated=true
Requested Host:		metabase-6d70e7-tools.apps.silver.devops.gov.bc.ca
			   exposed on router default (host router-default.apps.silver.devops.gov.bc.ca) 2 months ago
Path:			<none>
TLS Termination:	edge
Insecure Policy:	Redirect
Endpoint Port:		<all endpoint ports>

Service:	metabase
Weight:		100 (100%)
Endpoints:	10.97.50.98:3000



- add the two network policies to the helm charts
- get the passwords loading properly done
