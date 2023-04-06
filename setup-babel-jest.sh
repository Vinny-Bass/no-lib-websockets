#!/bin/bash

# Install required dependencies
npm install --save-dev babel-jest @babel/core @babel/preset-env

# Create a Babel configuration file
echo '{
  "presets": ["@babel/preset-env"]
}' > babel.config.json

# Add Jest configuration to package.json, or create jest.config.js if package.json does not exist
if [ -e package.json ]; then
  jq '. * {
    "jest": {
      "transform": {
        "^.+\\.js$": "babel-jest"
      }
    }
  }' package.json > package.json.tmp && mv package.json.tmp package.json
else
  echo 'module.exports = {
    transform: {
      "^.+\\.js$": "babel-jest",
    },
  };' > jest.config.js
fi

echo "Babel and Jest configuration complete!"
