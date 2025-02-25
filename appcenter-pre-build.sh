#!/usr/bin/env bash

# add required app center environment variables into a .env file for use with react-native-config
echo ONBOARDING_BASE_URL=$ONBOARDING_BASE_URL >> .env
echo MAPBOX_ACCESS_TOKEN=$MAPBOX_ACCESS_TOKEN >> .env
echo MAPBOX_DOWNLOAD_TOKEN=$MAPBOX_DOWNLOAD_TOKEN >> .env
echo MAPBOX_STYLE_URL=$MAPBOX_STYLE_URL >> .env
echo MAKER_ADDRESS=$MAKER_ADDRESS >> .env
echo SOLANA_RPC_ENDPOINT=$SOLANA_RPC_ENDPOINT >> .env
echo DEVNET_SOLANA_RPC_ENDPOINT=$DEVNET_SOLANA_RPC_ENDPOINT >> .env
echo TEST_ONBOARDING_BASE_URL=$TEST_ONBOARDING_BASE_URL >> .env
echo GOOGLE_MAPS_API_KEY=$GOOGLE_MAPS_API_KEY >> .env

# set .netrc for mapbox download https://docs.mapbox.com/ios/maps/guides/install/#configure-credentials
cd ~
echo "machine api.mapbox.com
login mapbox
password $MAPBOX_DOWNLOAD_TOKEN" > .netrc

chmod 0600 .netrc