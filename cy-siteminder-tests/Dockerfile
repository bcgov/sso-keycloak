FROM cypress/base:16.18.0

WORKDIR /e2e

COPY *.json /e2e/
COPY cypress.config.ts /e2e/

RUN npm install

ADD cypress /e2e/cypress

ENTRYPOINT ["npm", "run", "cy:run"]
