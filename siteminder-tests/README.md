# SSO Siteminder Tests



## Required Tools and Dependencies

- The required tools can be installed using [asdf](https://asdf-vm.com/guide/getting-started.html)

- After installation, just follow below steps to setup or update the `shims`

  ```sh
  cat .tool-versions | cut -f 1 -d ' ' | xargs -n 1 asdf plugin-add || true
  asdf plugin-update --all
  asdf install
  asdf reshim
  ```

- `puppeteer`: To run it in linux, the following dependencies need to be installed

  ```sh
  sudo apt-get update

  sudo apt-get install gconf-service libasound2 libatk1.0-0 libatk-bridge2.0-0 libc6 libcairo2 \
  libcups2 libdbus-1-3 libexpat1 libfontconfig1 libgcc1 libgconf-2-4 libgdk-pixbuf2.0-0 \
  libglib2.0-0 libgtk-3-0 libnspr4 libpango-1.0-0 libpangocairo-1.0-0 libstdc++6 libx11-6 \
  libx11-xcb1 libxcb1 libxcomposite1 libxcursor1 libxdamage1 libxext6 libxfixes3 libxi6 \
  libxrandr2 libxrender1 libxss1 libxtst6 ca-certificates fonts-liberation \
  libappindicator1 libnss3 lsb-release xdg-utils wget
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

#### `yarn test`

Executes all the tests and generates screenshots under `results/assets`

#### `yarn test:html`

Executes all the tests and generates screenshots and html report under `results` directory

### Docker

- Create `.env`
  - from `.env.example` and fill all the values or
  - from a secret [`siteminder-tests`](https://console.apps.gold.devops.gov.bc.ca/k8s/ns/eb75ad-tools/secrets/siteminder-tests/)

- Run the docker container from `siteminder-tests` directory

  ```sh
  export ENVIRONMENT=<dev/test/prod>
  export CLUSTER=<silver/gold>

  docker run --rm -e ENVIRONMENT=$ENVIRONMENT -e CLUSTER=$CLUSTER -v $(pwd)/results:/app/results $(docker build -q .)
  ```

### Docker Compose

- Create `.env`
  - from `.env.example` and fill all the values or
  - from a secret [`siteminder-tests`](https://console.apps.gold.devops.gov.bc.ca/k8s/ns/eb75ad-tools/secrets/siteminder-tests/)

#### `docker-compose up`

- Run the docker compose and optionally add flag `-d` to run it in the background

### `docker-compose down`

- Stop and remove the containers
