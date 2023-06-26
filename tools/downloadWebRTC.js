const fs = require('fs');
const path = require('path');
const process = require('process');

const AdmZip = require('adm-zip');
const tar = require('tar');

const pkg = require('../package.json');
const assets = pkg['download-assets'];

const { Octokit } = require('@octokit/rest');

function getAuthTokenFromNpmrc() {
  const npmrcPath = path.join(`${__dirname}/../../../.npmrc`);
  console.log({ npmrcPath });
  if (!fs.existsSync(npmrcPath)) return null;
  const lines = fs
    .readFileSync(npmrcPath, 'utf8')
    .split('\n')
    .map((line) => line.trim());

  const authLine = lines.find((line) => line.includes('authToken='));

  console.log({ lines, authLine });

  if (!authLine) return null;

  return authLine.split('authToken=')[1];
}

async function download(option, filePath) {
  return new Promise((resolve, reject) => {
    const token = getAuthTokenFromNpmrc();
    const octokit = new Octokit({ auth: token });
    octokit.repos.getReleaseAsset(option).then((response) => {
        if (response.status !== 200) {
          reject(new Error(`Failed to get '${option}' (${response.statusCode}) ${response.statusMessage}`));
          return;
        }
        console.log(response);
        const data = response.data;

        fs.writeFile(filePath, Buffer.from(data), (error) => {
          if (error) {
            console.error('Failed to save the file:', error);
            reject(error);
          } else {
            console.log('File saved successfully:', filePath);
            resolve();
          }
        });
      });
  });
}

(async () => {
  if (process.env.RN_WEBRTC_SKIP_DOWNLOAD) {
    console.log('Skipping WebRTC build downloads');
    return process.exit(0);
  }

  const items = [];

  // iOS
  //

  const builds = assets['webrtc-builds'];
  const libs =  assets['libs'];

  if (process.platform === 'darwin') {
    const iosBuild = builds['ios'];

    if (iosBuild && iosBuild['asset_id']) {
      items.push({
        assetId: iosBuild['asset_id'],
        dstFileName: iosBuild['file_name'],
        dstDir: `${__dirname}/../ios/`
      });
    }
    const iosLib = libs['ios'];
    if (iosLib && iosLib['asset_id']) {
      items.push({
        assetId: iosLib['asset_id'],
        dstFileName: iosLib['file_name'],
        dstDir: `${__dirname}/../ios/`
      });
    }
  }

  // Android
  //

  const androidBuild = builds['android'];
  if (androidBuild && androidBuild['asset_id']) {
    items.push({
      assetId: androidBuild['asset_id'],
      dstFileName: androidBuild['file_name'],
      dstDir: `${__dirname}/../android/`
    });
  }
  const androidLib = libs['android'];
  if (androidLib && androidLib['asset_id']) {
    items.push({
      assetId: androidLib['asset_id'],
      dstFileName: androidLib['file_name'],
      dstDir: `${__dirname}/../android/`
    });
  }

  const modelFiles = assets['model-files'];
  if (modelFiles) {
    items.push({
      assetId: modelFiles['asset_id'],
      dstFileName: modelFiles['file_name'],
      dstDir: `${__dirname}/../`
    })
  }

  // Download them all!
  //


  const option = {
    // asset_id: '113850516',
    owner: 'oviceinc',
    repo: 'krisp-noise-cancelling-library',
    mediaType: { format: 'zip' },
    headers: {
      Accept: 'application/octet-stream'
    }
  };

  console.log(items);

  for (const item of items) {
    const { dstFileName, dstDir, assetId } = item;
    const dstPath = path.join(dstDir, dstFileName);

    if (fs.existsSync(dstPath) && process.env.RN_WEBRTC_FORCE_DOWNLOAD) {
      console.log('Removing previously downloaded file');
      fs.rmSync(dstPath);
    }

    console.log(`Downloading ${dstFileName}...`);
    await download({...option, asset_id: assetId}, dstPath);
    console.log(item);
    if (path.extname(dstPath) === '.zip') {
      const zip = AdmZip(dstPath);

      zip.extractAllTo(dstDir, true);
    } else {
      tar.extract({
        file: dstPath,
        cwd: dstDir,
        sync: true,
        strict: true
      });
    }

    console.log('Done!');
  }
})();
