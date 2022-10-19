# Overview

This folder contains load tests for our sso application

## Using

- Copy `env.example.js` to `env.js`. Provide credentials for a service account with permissions to create realms and users
- Run tests with `make <testname>` or `k6 run <js file>`

## Tests

The tests are configured to abort if more than 1% of http requests are failing, and will
print out the maximum sessions (vus) it could handle.

### Multi Realm Active Sessions

This test is designed to create a given number of active sessions spread evenly across realms. To configure,
set the following variables at the top of `multiRealmActiveSessions.js`:

- **TOTAL_ACTIVE_SESSIONS**: The approximate total sessions across all realms
- **TOTAL_REALMS**: The total realms to spread sessions across
- **RAMP_UP_TIME_SECONDS**: The time to ramp up to the total number of sessions
- **HOLD_TIME_SECONDS**: The time to hold those sessions before ending the test

### Single Realm Active Sessions

This test is designed to create a given number of active sessions in a single realm, and an additional
number of empty realms. To configure, set the following variables at the top of `singleRealmActiveSessions.js`:

- **TOTAL_ACTIVE_SESSIONS**: The approximate total sessions across the primary realm
- **TOTAL_REALMS**: The total realms to create (any additional realms will be left empty)
- **RAMP_UP_TIME_SECONDS**: The time to ramp up to the total number of sessions
- **HOLD_TIME_SECONDS**: The time to hold those sessions before ending the test

## K6 issues

A recurrent issue with Linus users is that the bash terminal has a low default on the number of files the terminal can open.

`ulimit -Sa` and   `ulimit -Ha` shows the soft and hard limits on the number of files. Running the command `ulimit -n 5000` ups the limit to `5000` allowing the tests to run in that bash session.
