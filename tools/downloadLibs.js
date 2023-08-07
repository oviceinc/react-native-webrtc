const fs = require('fs');
const fsWithPromise = require('fs').promises;
const path = require('path');
const process = require('process');

const AdmZip = require('adm-zip');
const tar = require('tar');

const pkg = require('../package.json');
const assets = pkg['download-assets'];

const {Octokit} = require('@octokit/rest');

function getAuthTokenFromNpmrc() {
    const currentPath = __dirname;
    const targetPath =
        currentPath.includes('node_modules') ? currentPath.replace(/\/node_modules.*/, '') : `${currentPath}/../`;
    const npmrcPath = path.join(`${targetPath}/.npmrc`);
//    console.log({currentPath, targetPath, npmrcPath})
    if (!fs.existsSync(npmrcPath)) return null;
    const lines = fs.readFileSync(npmrcPath, 'utf8').split('\n').map((line) => line.trim());

    const authLine = lines.find((line) => line.includes('authToken='));

    if (!authLine)
        return null;

    return authLine.split('authToken=')[1];
}

async function download(option, filePath) {
    const token = getAuthTokenFromNpmrc();
    const octokit = new Octokit({auth: token});
    const response = await octokit.repos.getReleaseAsset(option);
    if (response.status !== 200) {
        throw new Error(`Failed to get '${option}' (${response.statusCode}) ${response.statusMessage}`);
    }
    const data = response.data;

    try {
        await fsWithPromise.writeFile(filePath, Buffer.from(data));
//        console.log('File saved successfully:', filePath);
    } catch (error) {
        console.error('Failed to save the file:', error);
        throw new Error(error);
    }
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
    const libs = assets['libs'];

    if (process.platform === 'darwin') {
        const iosBuild = builds['ios'];

        if (iosBuild && iosBuild['asset_id']) {
            items.push(
                {assetId: iosBuild['asset_id'], dstFileName: iosBuild['file_name'], dstDir: `${__dirname}/../ios/`});
        }
        const iosLib = libs['ios'];
        if (iosLib && iosLib['asset_id']) {
            items.push({assetId: iosLib['asset_id'], dstFileName: iosLib['file_name'], dstDir: `${__dirname}/../ios/`});
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

    // Android Krisp library is included in the webrtc library, so this process is unnecessary
    // const androidLib = libs['android'];
    // if (androidLib && androidLib['asset_id']) {
    //     items.push({
    //         assetId: androidLib['asset_id'],
    //         dstFileName: androidLib['file_name'],
    //         dstDir: `${__dirname}/../android/`
    //     });
    // }

    const modelFiles = assets['model-files'];
    if (modelFiles) {
        items.push({assetId: modelFiles['asset_id'], dstFileName: modelFiles['file_name'], dstDir: `${__dirname}/../`})
    }

    // Download them all!
    //

    const option = {
        owner: assets['owner'],
        repo: assets['repo'],
        mediaType: {format: 'zip'},
        headers: {Accept: 'application/octet-stream'}
    };

    for (const item of items) {
        const {dstFileName, dstDir, assetId} = item;
        const dstPath = path.join(dstDir, dstFileName);

        if (fs.existsSync(dstPath) && process.env.RN_WEBRTC_FORCE_DOWNLOAD) {
            console.log('Removing previously downloaded file');
            fs.rmSync(dstPath);
        }

        console.log(`Downloading ${dstFileName}...`);
        try {

          await download({...option, asset_id: assetId}, dstPath);
          if (path.extname(dstPath) === '.zip') {
              const zip = AdmZip(dstPath);

              zip.extractAllTo(dstDir, true);
          } else {
              tar.extract({file: dstPath, cwd: dstDir, sync: true, strict: true});
          }

        if (dstFileName === 'model-files.zip') {
            // copy model files to android/src/main/assets
            const modelFilesDstDir = path.join(dstDir, 'android/src/main/assets');
            if (!fs.existsSync(modelFilesDstDir)) {
                fs.mkdirSync(modelFilesDstDir);
            }
            const modelFilesSrcDir = path.join(dstDir, 'dist/models');
            const modelFiles = fs.readdirSync(modelFilesSrcDir);
            for (const modelFile of modelFiles) {
                fs.copyFileSync(path.join(modelFilesSrcDir, modelFile), path.join(modelFilesDstDir, modelFile));
            }
        }

          console.log('Done!');
        } catch (e) {
          console.error(e, item);
        }
    }
})();
