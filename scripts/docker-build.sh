#!/bin/bash

# Docker build script
# Usage: ./scripts/docker-build.sh [slim|alpine|both]

set -e

BUILD_TYPE=${1:-alpine}
IMAGE_NAME="tse-id"

echo "🐳 Building Docker image..."

case $BUILD_TYPE in
  "slim")
    echo "📦 Building slim-based image..."
    docker build -f Dockerfile.slim -t ${IMAGE_NAME}:slim .
    echo "✅ Slim image built successfully"
    ;;
  
  "alpine")
    echo "📦 Building Alpine-based image (smaller size)..."
    docker build -f Dockerfile.alpine -t ${IMAGE_NAME}:alpine .
    docker tag ${IMAGE_NAME}:alpine ${IMAGE_NAME}:latest
    echo "✅ Alpine image built successfully"
    ;;
  
  "both")
    echo "📦 Building both Slim and Alpine images..."
    
    echo "Building Slim image..."
    docker build -f Dockerfile.slim -t ${IMAGE_NAME}:slim .
    
    echo "Building Alpine image..."
    docker build -f Dockerfile.alpine -t ${IMAGE_NAME}:alpine .
    
    # Tag Apline image as latest
    docker tag ${IMAGE_NAME}:alpine ${IMAGE_NAME}:latest
    
    echo "✅ Both images built successfully"
    ;;
  
  *)
    echo "❌ Invalid build type. Use: slim, alpine, or both"
    exit 1
    ;;
esac

echo ""
echo "🚀 Available images:"
docker images | grep ${IMAGE_NAME} || echo "No images found"

echo ""
echo "🧪 Test the image:"
echo "docker run --rm ${IMAGE_NAME}:latest --help"
