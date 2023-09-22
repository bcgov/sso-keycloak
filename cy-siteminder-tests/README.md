# SSO Siteminder Tests

- This repository consists of automated tests that are run using puppeteer headless browser against consumer URLs. These tests are used to validate the payload attributes returned by the identity provider SAML
- The identity provider has hosted the service on two data centers. In order to validate the data returned from two different data centers, the tests are being run twice, i.e. by adding one host record targetting a data center at a time
- The tests will generate results report for each run against the data center

## Requirements

### Secrets

**Note**: The below secrets are used by `siteminder-tests.yml` workflow to run the tests. Make sure these secrets are available as github action secrets before running the github action. These secrets are also stored in secret `siteminder-tests` under `6d70e7-tools` namespace of silver cluster

- `SITEMINDER_TESTS_DATACENTERS_HOST_ENTRY` stores datacenter specific hostname and ip address
- `SITEMINDER_TESTS_ENV` stores all the key-value pairs from `.env.example`

### Tools

- The required tools can be installed using [asdf](https://asdf-vm.com/guide/getting-started.html)

- After installation, just follow below steps to setup or update the `shims`

  ```sh
  cat .tool-versions | cut -f 1 -d ' ' | xargs -n 1 asdf plugin-add || true
  asdf plugin-update --all
  asdf install
  asdf reshim
  ```

  ```sh
  sudo apt-get update

  sudo apt-get install libgtk2.0-0 libgtk-3-0 libgbm-dev libnotify-dev libgconf-2-4 libnss3 libxss1 libasound2 libxtst6 xauth xvfb
  ```

**Note**: Below steps is only for developers and contributors

- Install [pre-commit](https://pre-commit.com/#install) to validate the source code using pre-commit hooks

- Install [gitlint](https://jorisroovers.com/gitlint/) to lint git commit messages

- Both tools can be installed using `requirements.txt` as shown below

  ```sh
  pip install -r requirements.txt

  # setup up git hook scripts
  pre-commit install

  # run against all the files
  pre-commit run --all-files
  ```

- Install [gitlint](https://jorisroovers.com/gitlint/) to validate

## Installation

### Locally

#### `yarn install`

Install the dependencies

#### `yarn cy:run`

Executes all the tests and generates screenshots under `screenshots` folder upon errors. The test suite generates HTML report under `results` folder

#### `yarn cy:open`

Opens the Cypress application, where tests can be run visually

### Docker

- Create `.env`

  - from `.env.example` and fill all the values or
  - from a secret [`siteminder-tests`](https://console.apps.gold.devops.gov.bc.ca/k8s/ns/eb75ad-tools/secrets/siteminder-tests/)

- Run the docker container from `cy-siteminder-tests` directory

  ```sh
  export ENVIRONMENT=<dev/test/prod>
  export CLUSTER=<silver/gold>

  docker run --rm -e ENVIRONMENT=$ENVIRONMENT -e CLUSTER=$CLUSTER -v $(pwd)/results:/e2e/results $(docker build -q .)
  ```
