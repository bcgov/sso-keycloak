FROM node:22-alpine

# install yarn
RUN apk add --no-cache yarn

# Set the working directory
WORKDIR /app

# Copy the rest of the application code
COPY . .

# Install dependencies
RUN yarn install

# Build the application
RUN yarn build

ENTRYPOINT [ "yarn", "start" ]
