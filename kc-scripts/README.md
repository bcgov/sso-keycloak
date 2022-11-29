# Keycloak Scripts

## Developer Guide

### Installation

```sh
yarn install
```

### Run target script

please use one of the `yarn` scripts `script` in terms of its simple usage.
in the script path, `src` is prefixed by default so it must be omitted.

```sh
yarn script <script-path> [...args]
yarn script migrations/custom --base-env dev --target-env alpha
```
