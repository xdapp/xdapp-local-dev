const fs            = require('fs');
const path         = require('path');
const chalk        = require('chalk');
const Emitter      = require('events').EventEmitter;
const vueCompiler  = require('vue-template-compiler');
const compilers    = require('../node_modules/vueify/lib/compilers');
const rewriteStyle = require('../node_modules/vueify/lib/style-rewriter');
const transpile    = require('vue-template-es2015-compiler');


let hasBabel = true;
try {
    require('babel-core')
} catch (e) {
    hasBabel = false
}

let resolvedPartsCache = Object.create(null);

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

    Promise.all([
        processTemplate(parts.template, filePath, resolvedParts),
        processScript(parts.script, filePath, resolvedParts)
    ].concat(parts.styles.map(function (style) {
        if (style.scoped) {
            style.scoped = false;
            style.content = `[${id}]{${style.content}}`;
        }
        return processStyle(style, filePath, id, resolvedParts)
    })))
        .then(mergeParts)
        .catch(cb);

    function mergeParts() {
        resolvedPartsCache[id] = resolvedParts;
        let output = '';
        // script
        let script = resolvedParts.script;
        if (script) {
            output += script;
        }
        // styles
        let style = resolvedParts.styles.join('\n');
        if (style) {
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
        if (parts.template && (/<title>(.*)<\/title>/.test(parts.template.content))) {
            output += 'exports["default"].haveTitle = true;\n';
        }
        // scoped CSS id
        if (hasScopedStyle) {
            output += 'exports["default"].scopedStyle = true;\n';
        }
        output += 'exports["default"].hash = "' + id + '";\n';
        output += 'require("app").default.vueInit(exports["default"]);\n';
        cb(null, output)
    }
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
            return rewriteStyle(id, res, part.scoped, options).then(function (res) {
                parts.styles.push(res)
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