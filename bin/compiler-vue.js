const fs           = require('fs');
const path         = require('path');
const chalk        = require('chalk');
const Emitter      = require('events').EventEmitter;
const vueCompiler  = require('vue-template-compiler');
const compilers    = require('../node_modules/vueify/lib/compilers');
const transpile    = require('vue-template-es2015-compiler');
const compileUtils = require('@vue/component-compiler-utils')


let hasBabel = true;
try {
    require('babel-core')
} catch (e) {
    hasBabel = false
}

// expose compiler
let compiler = module.exports = new Emitter();
compiler.setMaxListeners(Infinity);

// options
let options = compiler.options = {};
options.sass = {
    outputStyle: 'compressed',
};

compiler.setSassOption = function (key, value) {
    options.sass[key] = value;
    return this;
};
compiler.setOption = function (key, value) {
    options[key] = value;
    return this;
};

// apply config
compiler.applyConfig = function (config) {
    // copy user options to default options
    Object.keys(config).forEach(function (key) {
        if (key !== 'customCompilers') {
            options[key] = config[key]
        } else {
            // register compilers
            Object.keys(config[key]).forEach(function (name) {
                compilers[name] = config[key][name]
            })
        }
    })
};

compiler.compile = function (content, filePath, cb) {
    // generate css scope id
    let id    = 'data-v-' + genId(filePath);
    // parse the component into parts
    let parts = vueCompiler.parseComponent(content, {pad: true});

    // check for scoped style nodes
    let hasScopedStyle = parts.styles.some(function (style) {
        return style.scoped
    });

    let resolvedParts = {
        template: null,
        script: null,
        styles: []
    };
    const mergeParts = () => {
        let output = '';
        // script
        let script = resolvedParts.script;
        if (script) {
            output += script;
        }
        // styles
        let style = resolvedParts.styles.join('\n');
        if (style.replace(/ |\r\n/g, '')) {
            // emit style
            compiler.emit('style', {
                file: filePath,
                style: style
            });
            if (!options.extractCSS) {
                style = JSON.stringify(style);
                output += 'exports["default"].style = ' + style.replace(/\\n/g, '\\\n') + ';\n';
            }
        }
        // template
        let template = resolvedParts.template;
        if (template) {
            output +=
                'exports["default"].render = ' + template.render + ';\n' +
                'exports["default"].staticRenderFns = ' + template.staticRenderFns + ';\n';
        }
        if ((/<title>(.*)<\/title>/.test(parts.template.content))) {
            output += 'exports["default"].haveTitle = true;\n';
        }
        // scoped CSS id
        if (hasScopedStyle) {
            output += 'exports["default"].scopedStyle = true;\n';
            output += 'exports["default"]._scopeId = "' + id + '";\n'
        }

        if (options.dev) {
            // 用于热更新的md5
            const blockHash = {
                style: style && !options.extractCSS ? genId(style).substr(0, 7) : '',
                template: template ? genId(Object.values(template).join(',')).substr(0, 7) : '',
                script: script ? genId(script).substr(0, 7) : '',
            };
            output += 'exports["default"].blockHash = ' + JSON.stringify(blockHash) + ';\n';
        }

        output += 'exports["default"].hash = "' + id + '";\n';
        output += 'exports["default"].uri = "' + filePath.replace(/^src\//, '') + '";\n';
        output += 'require("app").vueInit(exports, module);\n';

        cb(null, output)
    }

    Promise.all([
        processTemplate(parts.template, filePath, resolvedParts),
        processScript(parts.script, filePath, resolvedParts)
    ].concat(parts.styles.map(function (style) {
        if (!style.scoped) {
            style.scoped = false;
            // style.content = `[${id}]{${style.content}}`;
            // style.lang = 'scss';
        }
        return processStyle(style, filePath, id, resolvedParts)
    })))
        .then(mergeParts)
        .catch(cb);

};

function processTemplate(part, filePath, parts) {
    if (!part) return Promise.resolve();
    let template = getContent(part, filePath);
    return compileAsPromise('template', template, part.lang, filePath)
        .then(function (res) {
            parts.template = compileTemplate(res, compiler)
        })
}

function processScript(part, filePath, parts) {
    if (!part) return Promise.resolve();
    let lang   = part.lang || (hasBabel ? 'babel' : null);
    let script = getContent(part, filePath);
    return compileAsPromise('script', script, lang, filePath)
        .then(function (res) {
            if (typeof res === 'string') {
                parts.script = res
            } else {
                parts.script = res.code;
                parts.map    = res.map;
            }
        })
}

function processStyle(part, filePath, id, parts) {
    let style = getContent(part, filePath);
    return compileAsPromise('style', style, part.lang, filePath)
        .then(function (res) {
            res = res.trim();
            return compileUtils.compileStyleAsync({id: id, source: res, scoped: part.scoped, postcssOptions: options}).then(function (res) {
                parts.styles.push(res.code)
            })
        })
}

function getContent(part, filePath) {
    return part.src
        ? loadSrc(part.src, filePath)
        : part.content
}

function loadSrc(src, filePath) {
    let dir     = path.dirname(filePath);
    let srcPath = path.resolve(dir, src);
    compiler.emit('dependency', srcPath);
    try {
        return fs.readFileSync(srcPath, 'utf-8')
    } catch (e) {
        console.error(chalk.red(
            'Failed to load src: "' + src +
            '" from file: "' + filePath + '"'
        ))
    }
}

function compileAsPromise(type, source, lang, filePath) {
    let compile = compilers[lang];
    if (compile) {
        return new Promise(function (resolve, reject) {
            compile(source, function (err, res) {
                if (err) {
                    // report babel error codeframe
                    if (err.codeFrame) {
                        process.nextTick(function () {
                            console.error(err.codeFrame)
                        })
                    }
                    return reject(err)
                }
                resolve(res)
            }, compiler, filePath)
        })
    } else {
        return Promise.resolve(source)
    }
}


function compileTemplate(template, compiler) {
    let compiled = vueCompiler.compile(template, {
        preserveWhitespace: false,
        staticRenderFns: [
            'App',
            'window',
            'Vue',
            '$',
            'ELEMENT',
            'Element',
        ],
    });
    if (compiled.errors.length) {
        compiled.errors.forEach(function (msg) {
            console.error('\n' + chalk.red(msg) + '\n')
        });
        throw new Error('Vue template compilation failed')
    } else {
        return {
            render: toFunction(compiled.render),
            staticRenderFns: '[' + compiled.staticRenderFns.map(toFunction).join(',') + ']'
        }
    }
}
function toFunction(code) {
    return transpile('function render () {' + code + '}');
}

function genId(str) {
    return require('crypto').createHash('md5').update(str).digest('hex');
}