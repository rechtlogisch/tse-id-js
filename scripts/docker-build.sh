#!/bin/bash

# Docker build script
# Usage: ./scripts/docker-build.sh [ubuntu|alpine|both]

set -e

BUILD_TYPE=${1:-ubuntu}
IMAGE_NAME="tse-id"

echo "🐳 Building Docker image..."

case $BUILD_TYPE in
  "ubuntu")
    echo "📦 Building Ubuntu-based image (recommended for CI/CD)..."
    docker build -f Dockerfile -t ${IMAGE_NAME}:ubuntu .
    docker tag ${IMAGE_NAME}:ubuntu ${IMAGE_NAME}:latest
    echo "✅ Ubuntu image built successfully"
    ;;
  
  "alpine")
    echo "📦 Building Alpine-based image (smaller size)..."
    docker build -f Dockerfile.alpine -t ${IMAGE_NAME}:alpine .
    docker tag ${IMAGE_NAME}:alpine ${IMAGE_NAME}:latest
    echo "✅ Alpine image built successfully"
    ;;
  
  "both")
    echo "📦 Building both Ubuntu and Alpine images..."
    
    echo "Building Ubuntu image..."
    docker build -f Dockerfile -t ${IMAGE_NAME}:ubuntu .
    
    echo "Building Alpine image..."
    docker build -f Dockerfile.alpine -t ${IMAGE_NAME}:alpine .
    
    # Tag Ubuntu as latest (more reliable)
    docker tag ${IMAGE_NAME}:ubuntu ${IMAGE_NAME}:latest
    
    echo "✅ Both images built successfully"
    ;;
  
  *)
    echo "❌ Invalid build type. Use: ubuntu, alpine, or both"
    exit 1
    ;;
esac

echo ""
echo "🚀 Available images:"
docker images | grep ${IMAGE_NAME} || echo "No images found"

echo ""
echo "🧪 Test the image:"
echo "docker run --rm ${IMAGE_NAME}:latest --help"
