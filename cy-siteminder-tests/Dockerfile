FROM cypress/base:16.18.0

WORKDIR /e2e

COPY . /e2e/

RUN npm install

ENTRYPOINT ["npm", "run"]

CMD ["cy:run"]
