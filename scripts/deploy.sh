#!/bin/bash
set -e
echo "Deploying IPK..."
git pull
docker-compose down
docker-compose build
docker-compose up -d
echo "Deployed successfully!"
