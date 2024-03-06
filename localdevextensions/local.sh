#!/bin/bash

# Define the directory to watch
DIRECTORY="../docker/keycloak/extensions-7.6/services"

# Define the Maven command to execute
MAVEN_COMMAND="mvn -B clean package --file ../docker/keycloak/extensions-7.6"

# Start an infinite loop to watch for file changes
while true; do
    # Wait for file changes in the specified directory
    inotifywait -r -e modify,move,create,delete --exclude '/target' "$DIRECTORY"

    # When a change is detected, execute the Maven command
    echo "Change detected. Running Maven build..."
    $MAVEN_COMMAND
    echo "HI"
    cp ../docker/keycloak/extensions-7.6/services/target/bcgov-services-1.0.0.jar .
done
