FROM node:22.18.0-alpine

# install yarn
RUN apk add --no-cache yarn

# Set the working directory
WORKDIR /app

# Copy the rest of the application code
COPY . .

# Install dependencies
RUN yarn install

RUN yarn tailwind:build

# Build the application
RUN yarn build

ENTRYPOINT [ "yarn", "start" ]
