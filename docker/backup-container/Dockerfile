# This image provides a postgres installation from which to run backups
FROM --platform=linux/amd64 postgres:15.6-bullseye
# FROM --platform=linux/amd64 rhel9/postgresql-15:latest
# Change timezone to PST for convenience
ENV TZ=PST8PDT

# Set the workdir to be root
WORKDIR /

# Load the backup scripts into the container (must be executable).
COPY backup.* /

# ========================================================================================================
# Install go-crond (from https://github.com/webdevops/go-crond)
#
# CRON Jobs in OpenShift:
#  - https://blog.danman.eu/cron-jobs-in-openshift/
# --------------------------------------------------------------------------------------------------------
ARG SOURCE_REPO=webdevops
ARG GOCROND_VERSION=23.2.0
ADD https://github.com/$SOURCE_REPO/go-crond/releases/download/$GOCROND_VERSION/go-crond.linux.amd64 /usr/bin/go-crond

USER root

# Install cURL
RUN apt-get update && apt-get install -y curl

RUN curl https://dl.min.io/client/mc/release/linux-amd64/mc -o /usr/bin/mc
RUN chmod +x /usr/bin/mc
RUN chmod +x /usr/bin/go-crond
# ========================================================================================================

# ========================================================================================================
# Perform operations that require root privilages here ...
# --------------------------------------------------------------------------------------------------------
RUN echo $TZ > /etc/timezone
# ========================================================================================================

# # The column command is missing from quay.io/fedora/postgresql-14:14
# RUN dnf install -y util-linux

# RUN dnf install -y postgresql-contrib
# RUN dnf install -y pg_stat_kcache


# see if this runs
# Important - Reset to the base image's user account.
USER 26

# Set the default CMD.
CMD sh /backup.sh
