# If node_modules is included in the current path, get the path one level above node_modules. If not, the current path is obtained.
CURRENT_PATH=$(pwd)
TARGET_PATH="$CURRENT_PATH"
if [[ $CURRENT_PATH == *"node_modules"* ]]; then
  TARGET_PATH=$(echo "$CURRENT_PATH" | sed 's/\/node_modules.*//')
fi

NPM_TOKEN=$(cat $TARGET_PATH/.npmrc | grep authToken | sed 's/.*authToken=\(.*\)/\1/')
#echo $NPM_TOKEN


TMP_DIR='./downloads'
mkdir -p $TMP_DIR
IOS_DIR="./ios/"
ANDROID_DIR="./ios/"

DOWNLOAD_URLS=$(cat package.json | jq '."download-urls"')

WEBRTD_BUILDS=$(echo $DOWNLOAD_URLS | jq '."webrtc-builds"')
IOS_WEBRTC_URL=$(echo $WEBRTD_BUILDS | jq -r '.ios')
ANDROID_WEBRTC_URL=$(echo $WEBRTD_BUILDS | jq -r '.android')



if [[ -n $IOS_WEBRTC_URL ]]; then
  echo $IOS_WEBRTC_URL
  IOS_WEBRTC="$TMP_DIR/ios-Webrtc.zip"
  curl -L -H "Accept: application/octet-stream" -H "Authorization: Bearer $NPM_TOKEN" -H "X-GitHub-Api-Version: 2022-11-28" ${IOS_WEBRTC_URL} -o "$IOS_WEBRTC"
  unzip $IOS_WEBRTC -d $IOS_DIR
fi
if [[ -n $ANDROID_WEBRTC_URL ]]; then
  echo $ANDROID_WEBRTC_URL
  ANDROID_WEBRTC="$TMP_DIR/android-Webrtc.zip"
  curl -L -H "Accept: application/octet-stream" -H "Authorization: Bearer $NPM_TOKEN" -H "X-GitHub-Api-Version: 2022-11-28" ${ANDROID_WEBRTC_URL} -o "$ANDROID_WEBRTC"
  unzip $ANDROID_WEBRTC -d $ANDROID_DIR
fi


KRISP_SDKS=$(echo $DOWNLOAD_URLS | jq '."krisp-sdk"')
IOS_KRISP_URL=$(echo $KRISP_SDKS | jq -r '.ios')
ANDROID_KRISP_URL=$(echo $KRISP_SDKS | jq -r '.android')


if [[ -n $IOS_KRISP_URL ]]; then
  echo $IOS_KRISP_URL
  IOS_KRISP_SDK="$TMP_DIR/ios-krispSDK.zip"
  curl -L -H "Accept: application/octet-stream" -H "Authorization: Bearer $NPM_TOKEN" -H "X-GitHub-Api-Version: 2022-11-28" ${IOS_KRISP_URL} -o "$IOS_KRISP_SDK"
  unzip $IOS_KRISP_SDK -d $IOS_DIR
fi
if [[ -n $ANDROID_KRISP_URL ]]; then
  echo $ANDROID_KRISP_URL
  ANDROID_KRISP_SDK="$TMP_DIR/android-krispSDK.zip"
  curl -L -H "Accept: application/octet-stream" -H "Authorization: Bearer $NPM_TOKEN" -H "X-GitHub-Api-Version: 2022-11-28" ${ANDROID_KRISP_URL} -o "$ANDROID_KRISP_SDK"
fi

MODEL_FILES_URL=$(echo $DOWNLOAD_URLS | jq -r '."model-files"')

if [[ -n $MODEL_FILES_URL ]]; then
  echo $MODEL_FILES_URL
  MODEL_FILES="$TMP_DIR/model-files.zip"
  curl -L -H "Accept: application/octet-stream" -H "Authorization: Bearer $NPM_TOKEN" -H "X-GitHub-Api-Version: 2022-11-28" ${MODEL_FILES_URL} -o "$MODEL_FILES"
  unzip $MODEL_FILES -d ./
fi

rm -rf $TMP_DIR
