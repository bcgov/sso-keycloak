FROM cypress/base:16.18.0

WORKDIR /e2e

COPY *.json /e2e/

ENV CI=1

RUN npm install

COPY cypress.config.ts /e2e/

COPY .env /e2e/

ADD cypress /e2e/cypress

ENTRYPOINT ["npm", "run"]

CMD ["cy:run"]
