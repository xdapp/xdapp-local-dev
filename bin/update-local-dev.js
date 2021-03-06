const fs    = require('fs');
const path  = require('path');
const https = require('https');
const tar = require('tar');
const zlib = require('zlib');
const BASE_DIR  = path.resolve(__dirname + '/../') + '/';
const tmpDir = BASE_DIR;
// const tmpDir = fs.existsSync('/tmp/') ? '/tmp/' : BASE_DIR;
const tmpName = 'tmp-for-update';
const spawn = require('child_process').spawn;
const crypto = require('crypto');

if (process.argv[1] === __filename && process.argv.length === 3) {
    // 安装到指定目录
    setup(process.argv[2]);
    return;
}

// 安装到指定目录
function setup(SETUP_PATH) {
    if (!fs.existsSync(SETUP_PATH)) {
        console.log('安装目录不存在: ' + SETUP_PATH);
        return;
    }
    function copyFile(file, backup = false) {
        let backupFile;
        if (backup) {
            if (fileMd5(BASE_DIR + file) !== fileMd5(SETUP_PATH + file)) {
                const ext = path.extname(file);
                backupFile = file.substr(0, file.length - ext.length) + '.bak' + ext;
                fs.renameSync(SETUP_PATH + file, SETUP_PATH + backupFile);
            }
        }
        fs.copyFileSync(BASE_DIR + file, SETUP_PATH + file);
        console.log('copy ' + file + (backup && backupFile ? ', backup file: ' + backupFile : ''));
    }
    function copyDir(dirName) {
        dirName = dirName.replace(/[\/|\\]+$/, '');
        const dir = BASE_DIR + dirName;
        outDir = SETUP_PATH + dirName;
        if (!fs.existsSync(outDir)) {
            fs.mkdirSync(outDir);
        }
        fs.readdirSync(dir).forEach((fileName) => {
            const path = dir + '/' + fileName;
            if (fs.lstatSync(path).isDirectory()) {
                copyDir(dirName + '/' + fileName);
            }
            else {
                copyFile(dirName + '/' + fileName);
            }
        });
    }

    const filePackage = SETUP_PATH + 'package.json';
    if (fs.existsSync(filePackage)) {
        try {
            let packOld = JSON.parse(fs.readFileSync(filePackage, 'utf8'));
            let packNew = JSON.parse(fs.readFileSync(BASE_DIR + 'package.json', 'utf8'));
            packNew.dependencies = Object.assign(packNew.dependencies, packOld.dependencies, packNew.dependencies);
            packNew.devDependencies = Object.assign(packNew.devDependencies, packOld.devDependencies, packNew.devDependencies);
            packNew.scripts = Object.assign(packNew.scripts, packOld.scripts, packNew.scripts);
            fs.writeFileSync(filePackage, JSON.stringify(packNew, null, 2));
        }
        catch (e) {
            console.log(e);
            return;
        }
    }
    else {
        copyFile('package.json');
    }

    copyFile('README.md', true);
    copyFile('setting.json', true);
    copyDir('bin');

    if (!fs.existsSync(SETUP_PATH + 'src')) {
        copyDir('src');
    }

    let cmd
    if (fs.existsSync(SETUP_PATH + 'yarn.lock')) {
        cmd = 'yarn';
    }
    else if (fs.existsSync(SETUP_PATH + 'package-lock.json')) {
        cmd = 'npm';
    }
    else {
        cmd = 'npm';
    }

    console.log('Copy done. now run '+ cmd +' install, please wait a moment');
    const exec = spawn(cmd, ['install'], {cwd: SETUP_PATH});
    exec.stdout.on('data', (data) => {
        console.log(data.toString().replace(/\n$/, ''));
    });
    exec.stderr.on('error', (err) => {
        console.log(err);
    });
    exec.on('error', (err) => {
        console.log(err);
    });
    exec.on('close', (code) => {
        console.log('setup done');
    });
}



let version;
try {
    let setting = fs.readFileSync(BASE_DIR + 'setting.json');
    setting = JSON.parse(setting);
    version = setting.version;
    console.log('    Current version: v' + version);
}
catch (e) {
    console.log('    读取当前版本失败：', e);
}

function getLastVersion(done, error = null) {
    https.get('https://dev-assets.xdapp.com/local-dev-last-version.json', (res) => {
        if (res.statusCode !== 200) {
            console.log('检查版本失败');
            if (error)error(res);
        }


        let data = '';
        res.on('data', (d) => {
            data += d;
        });
        res.on('end', () => {
            const rs = JSON.parse(data);
            done('v' + rs.version);
        });

    }).on('error', (e) => {
        console.error(e);
        if (error)error(res);
    });
}


function getFile(url, done, error = null) {
    https.get(url, (res) => {
        if (res.statusCode === 302 || res.statusCode === 301) {
            getFile(res.headers.location, done, error);
            return;
        }
        if (res.statusCode !== 200) {
            if (error)error(new Error('Download ' + url + ' error'), res);
            return;
        }
        res.setEncoding('binary');

        const file = tmpDir + tmpName + '.tar.gz';
        if (fs.existsSync(file)) {
            // 移除旧文件
            fs.unlinkSync(file);
        }
        if (fs.existsSync(tmpDir + tmpName)) {
            // 移除旧文件
            rmDir(tmpDir + tmpName)
        }

        res.on('data', (d) => {
            fs.writeFileSync(file, d, {
                encoding: 'binary',
                flag: 'as',
            });
        });
        res.on('end', () => {
            done(file);
        });
    }).on('error', (e) => {
        console.error(e);
        if (error)error(e, res);
    });
}

function update(done, error) {
    getLastVersion(function (ver) {
        if (versionCompare(ver, version, '<')) {
            console.log('服务器版本号低于当前版本，不可升级，若需要升级请指定版本: ' + ver);
            return;
        }
        updateToVersion(ver, done, error)
    }, error);
}

function updateToVersion (ver, done, error) {
    console.log('    Update to version: ' + ver);
    if (ver === version) {
        console.log('No need to update');
        return null;
    }
    const url = 'https://github.com/xdapp/xdapp-local-dev/archive/' + ver + '.tar.gz';
    console.log('Downloading: ' + url)
    getFile(url, function (file) {
        console.log('download file success');
        // 输出临时目录
        const dest = tmpDir + tmpName;
        let haveError = false;

        fs.createReadStream(file)
        .on("error", function (err) {
            haveError = true;
            console.log(err);
            if (error)error(err);
        })
        .pipe(zlib.Unzip())
        .pipe(tar.Extract({path: dest}))
        .on("end", () => {
            // 解压完毕
            console.log('unzip success');
            if (haveError) return;

            // 执行更新的脚本文件
            const sh = tmpDir + tmpName + '/xdapp-local-dev-' + ver.replace(/^v/, '') + '/bin/' + path.basename(__filename);
            // fs.copyFileSync(__filename, sh);
            console.log(sh);
            const exec = spawn('node', [sh, BASE_DIR], {cwd: tmpDir + tmpName + '/'});
            exec.stdout.on('data', (data) => {
                console.log(data.toString().replace(/\n$/, ''));
            });
            exec.stderr.on('error', (err) => {
                console.log(err);
            });
            exec.on('error', (err) => {
                console.log(err);
                if (error)error(err)
            });
            exec.on('close', (code) => {
                // 清除临时文件
                fs.unlink(tmpDir + tmpName + '.tar.gz', (err) => {
                    if (err) {
                        console.log(err);
                    }
                });
                rmDir(tmpDir + tmpName);

                if (done)done(code)
            });
        });
    }, function (err, req) {
        if (req.statusCode === 404) {
            console.log('Version ' + ver + ' not found, please check at https://github.com/xdapp/xdapp-local-dev/releases');
        }
        else if (req.statusCode !== 200) {
            console.log('Download file error, please retry it.' + req.statusCode);
        }
        if (error)error(err)
    });
}

function rmDir(dir) {
    const list = [];
    dir = dir.replace(/[\/|\\]+$/, '');
    fs.readdirSync(dir).forEach((fileName) => {
        const path = dir + '/' + fileName;
        if (fs.lstatSync(path).isDirectory()) {
            list.concat(rmDir(path));
        }
        else {
            fs.unlinkSync(path);
            list.push(path);
        }
    });
    fs.rmdirSync(dir);
    return list;
}

function md5(str) {
    return crypto.createHash('md5').update(str).digest('hex');
}
function fileMd5(file) {
    return md5(fs.readFileSync(file));
}


// see http://locutus.io/php/info/version_compare/
function versionCompare(v1, v2, operator) {
    var i
    var x
    var compare = 0

    var vm = {
        'dev': -6,
        'alpha': -5,
        'a': -5,
        'beta': -4,
        'b': -4,
        'RC': -3,
        'rc': -3,
        '#': -2,
        'p': 1,
        'pl': 1
    }

    var _prepVersion = function (v) {
        v = ('' + v).replace(/[_\-+]/g, '.')
        v = v.replace(/([^.\d]+)/g, '.$1.').replace(/\.{2,}/g, '.')
        return (!v.length ? [-8] : v.split('.'))
    }
    // This converts a version component to a number.
    // Empty component becomes 0.
    // Non-numerical component becomes a negative number.
    // Numerical component becomes itself as an integer.
    var _numVersion = function (v) {
        return !v ? 0 : (isNaN(v) ? vm[v] || -7 : parseInt(v, 10))
    }

    v1 = _prepVersion(v1)
    v2 = _prepVersion(v2)
    x = Math.max(v1.length, v2.length)
    for (i = 0; i < x; i++) {
        if (v1[i] === v2[i]) {
            continue
        }
        v1[i] = _numVersion(v1[i])
        v2[i] = _numVersion(v2[i])
        if (v1[i] < v2[i]) {
            compare = -1
            break
        } else if (v1[i] > v2[i]) {
            compare = 1
            break
        }
    }
    if (!operator) {
        return compare
    }

    // Important: operator is CASE-SENSITIVE.
    // "No operator" seems to be treated as "<."
    // Any other values seem to make the function return null.
    switch (operator) {
        case '>':
        case 'gt':
            return (compare > 0)
        case '>=':
        case 'ge':
            return (compare >= 0)
        case '<=':
        case 'le':
            return (compare <= 0)
        case '===':
        case '=':
        case 'eq':
            return (compare === 0)
        case '<>':
        case '!==':
        case 'ne':
            return (compare !== 0)
        case '':
        case '<':
        case 'lt':
            return (compare < 0)
        default:
            return null
    }
}

if (process.argv[1] !== __filename) {
    module.exports = {
        update,
        updateToVersion,
        setup,
        getLastVersion,
    }
}
else {
    setup(function () {

    })
}