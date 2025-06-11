# Publishing the patroni image to teams repo

## Pull the desired version from spilo


docker pull ghcr.io/zalando/spilo-17:4.0-p2


## Tag it for our repo use

docker tag ghcr.io/zalando/spilo-17:4.0-p2 ghcr.io/bcgov/sso-spilo-17:4.0-p2

## Push it to the bcgov repo

docker push ghcr.io/bcgov/sso-spilo-17:4.0-p2
