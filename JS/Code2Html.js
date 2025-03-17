if (!window.Code2Html) {
    window.Code2Html = {
        create: function (lang, options) {
            const _options = _initOptions(lang, options);

            const _lang = _getLang(lang);

            for (let i = 0; i < _options.knownClasses.length; i++) {
                _lang.knownClasses.push(_options.knownClasses[i]);
            }

            function convert(code) {
                let result = '';
                if (!_options.disableCodeTag) {
                    result += '<code class="' + _options.codeCss + '">\n';
                }

                const lines = code.split('\n');
                const codeInfo = _getCodeInfo(lines);

                let prevLexeme = '';
                let blockComment = false;
                for (let l = codeInfo.contentStartLine; l <= codeInfo.contentEndLine; l++) {
                    const line = lines[l];

                    result += _getOpeningTag(_options.lineTag, _options.lineCss);

                    let resultLine = '';

                    let lineContentStarted = false;
                    let stringLiteralQuote = '';
                    let stringLiteral = false;
                    let stringInterpolation = false;
                    let lineComment = false;
                    let lexeme = '';
                    for (let i = 0; i < line.length; i++) {
                        if (i < codeInfo.minIndent)
                            continue;

                        const ch = line[i];

                        if (!lineContentStarted) {
                            if (_lang.spaces.indexOf(ch) >= 0) {
                                let indent = '';
                                if ((i % _options.inputIndentSize) == 0) {
                                    for (let i = 0; i < _options.outputIndentSize; i++) {
                                        indent += ' ';
                                    }
                                }
                                if (indent) {
                                    resultLine += _getContentTag(_options.indentTag, _options.indentCss, indent);
                                }
                                continue;
                            }
                            else {
                                lineContentStarted = true;
                                if (blockComment) {
                                    resultLine += _getOpeningTag(_options.commentTag, _options.commentCss);
                                }
                            }
                        }

                        if ((!stringLiteral) && (!lineComment) && (!blockComment) && (ch === _lang.commentStarter1) && (i < line.length - 1)) {
                            const nextCh = line[i + 1];
                            if (nextCh == _lang.commentStarter1) {
                                lineComment = true;
                                resultLine += _getOpeningTag(_options.commentTag, _options.commentCss);
                                resultLine += _getContentTag(_options.specialCharTag, _options.specialCharCss, ch + nextCh);
                                i++;
                                continue;
                            }
                            else if (nextCh == _lang.commentStarter2) {
                                blockComment = true;
                                resultLine += _getOpeningTag(_options.commentTag, _options.commentCss);
                                resultLine += _getContentTag(_options.specialCharTag, _options.specialCharCss, ch + nextCh);
                                i++;
                                continue;
                            }
                        }

                        if (lineComment || blockComment) {
                            if ((blockComment) && (ch === _lang.commentStarter2) && (i < line.length - 1)) {
                                const nextCh = line[i + 1];
                                if (nextCh == _lang.commentStarter1) {
                                    blockComment = false;
                                    resultLine += _getContentTag(_options.specialCharTag, _options.specialCharCss, ch + nextCh);
                                    resultLine += _getClosingTag(_options.commentTag);
                                    i++;
                                    continue;
                                }
                            }

                            resultLine += _escapeChar(ch);
                            continue;
                        }

                        if ((stringLiteral) && (_lang.esc.indexOf(ch) >= 0)) {
                            const nextCh = line[i + 1];
                            resultLine += _getOpeningTag(_options.stringEscTag, _options.stringEscCss);
                            resultLine += _getContentTag(_options.specialCharTag, _options.specialCharCss, ch + nextCh);
                            resultLine += _getClosingTag(_options.stringEscTag);
                            i++;
                            continue;
                        }

                        if ((_lang.quotes.indexOf(ch) >= 0) || (ch === _lang.interpolation)) {
                            if (!stringLiteral) {
                                if ((ch === _lang.interpolation) && (i < line.length - 1)) {
                                    const nextCh = line[i + 1];
                                    if (_lang.quotes.indexOf(nextCh) >= 0) {
                                        stringLiteral = true;
                                        stringInterpolation = true;
                                        stringLiteralQuote = nextCh;
                                        resultLine += _getOpeningTag(_options.stringTag, _options.stringCss);
                                        resultLine += _getContentTag(_options.specialCharTag, _options.specialCharCss, ch + nextCh);
                                        i++;
                                    }
                                }
                                else if (_lang.quotes.indexOf(ch) >= 0) {
                                    stringLiteral = true;
                                    stringLiteralQuote = ch;
                                    resultLine += _getOpeningTag(_options.stringTag, _options.stringCss);
                                    resultLine += _getContentTag(_options.specialCharTag, _options.specialCharCss, ch);
                                }
                            }
                            else if (stringLiteralQuote === ch) {
                                stringLiteral = false;
                                stringInterpolation = false;

                                resultLine += _getContentTag(_options.specialCharTag, _options.specialCharCss, ch);
                                resultLine += _getClosingTag(_options.stringTag);
                            }
                            else {
                                resultLine += _getContentTag(_options.specialCharTag, _options.specialCharCss, ch);
                            }
                        }
                        else if (!stringLiteral) {
                            if ((_lang.separators.indexOf(ch) >= 0) || (_lang.spaces.indexOf(ch) >= 0)) {
                                const nextNonSpaceCh = _getNextNonSpace(line, i);
                                const prevNonSpaceCh = _getPrevNonSpace(line, i - lexeme.length);
                                resultLine += _getLexemeTag(lexeme, prevLexeme, prevNonSpaceCh, nextNonSpaceCh);

                                if (_lang.spaces.indexOf(ch) >= 0) {
                                    resultLine += _escapeChar(ch);
                                }
                                else {
                                    resultLine += _getContentTag(_options.specialCharTag, _options.specialCharCss, _escapeChar(ch));
                                }

                                if (lexeme) {
                                    prevLexeme = lexeme;
                                    lexeme = '';
                                }
                            }
                            else {
                                lexeme += ch;
                            }

                            if (stringInterpolation && (_lang.interpolationBraces.indexOf(ch) >= 0)) {
                                resultLine += _getOpeningTag(_options.stringTag, _options.stringCss);
                                stringLiteral = true;

                                prevLexeme = '';
                            }
                            else if (_lang.braces.indexOf(ch) >= 0) {
                                prevLexeme = '';
                            }
                        }
                        else if (stringLiteral) {
                            if (stringInterpolation && (_lang.interpolationBraces.indexOf(ch) >= 0)) {
                                resultLine += _getClosingTag(_options.stringTag);
                                resultLine += _getContentTag(_options.specialCharTag, _options.specialCharCss, ch);
                                stringLiteral = false;
                            }
                            else {
                                resultLine += _escapeChar(ch);
                            }
                        }
                    }

                    if (lexeme) {
                        const prevNonSpaceCh = _getPrevNonSpace(line, line.length - lexeme.length - 1);
                        resultLine += _getLexemeTag(lexeme, prevLexeme, prevNonSpaceCh);
                        if (lexeme) {
                            prevLexeme = lexeme;
                            lexeme = '';
                        }
                    }

                    if (lineComment || blockComment) {
                        lineComment = false;
                        resultLine += _getClosingTag(_options.commentTag);
                    }

                    let indent = '';
                    for (let i = 0; i < _options.initialIndent * _options.outputIndentSize; i++) {
                        indent += ' ';
                    }
                    if (indent) {
                        resultLine = _getContentTag(_options.indentTag, _options.indentCss, indent) + resultLine;
                    }

                    result += resultLine;
                    result += _getClosingTag(_options.lineTag);
                    if (l < lines.length - 1) {
                        result += '\n<br />';
                    }
                }

                if (!_options.disableCodeTag) {
                    result += '\n</code>';
                }
                return result;
            };

            function _initOptions(lang, options) {
                let result = {
                    codeCss: 'code-block ' + lang,
                    defaultTag: 'span',

                    declarationCss: 'decl',
                    declarationTag: '',
                    statementCss: 'stmnt',
                    statementTag: '',
                    classCss: 'class',
                    classTag: '',
                    methodCss: 'method',
                    methodTag: '',
                    stringCss: 'string',
                    stringTag: '',
                    stringEscCss: 'escape',
                    stringEscTag: '',
                    commentCss: 'comment',
                    commentTag: '',
                    normalCss: 'normal',
                    normalTag: '',
                    specialCharCss: 'special-char',
                    specialCharTag: '',
                    lineCss: 'line',
                    lineTag: '',
                    indentCss: 'indent',
                    indentTag: '',

                    initialIndent: 0,
                    inputIndentSize: 4,
                    outputIndentSize: 4,

                    knownClasses: [],

                    disableCodeTag: false,

                };
                if (!options)
                    return result;

                if ((options.codeCss) || (options.codeCss === '')) {
                    result.codeCss = options.codeCss;
                }
                if (options.defaultTag) {
                    result.defaultTag = options.defaultTag;
                }

                if ((options.declarationCss) || (options.declarationCss === '')) {
                    result.declarationCss = options.declarationCss;
                }
                if ((options.declarationTag) || (options.declarationTag === '')) {
                    result.declarationTag = options.declarationTag;
                }
                if ((options.statementCss) || (options.statementCss === '')) {
                    result.statementCss = options.statementCss;
                }
                if ((options.statementTag) || (options.statementTag === '')) {
                    result.statementTag = options.statementTag;
                }
                if ((options.classCss) || (options.classCss === '')) {
                    result.classCss = options.classCss;
                }
                if ((options.classTag) || (options.classTag === '')) {
                    result.classTag = options.classTag;
                }
                if ((options.methodCss) || (options.methodCss === '')) {
                    result.methodCss = options.methodCss;
                }
                if ((options.methodTag) || (options.methodTag === '')) {
                    result.methodTag = options.methodTag;
                }
                if ((options.stringCss) || (options.stringCss === '')) {
                    result.stringCss = options.stringCss;
                }
                if ((options.stringTag) || (options.stringTag === '')) {
                    result.stringTag = options.stringTag;
                }
                if ((options.stringEscCss) || (options.stringEscCss === '')) {
                    result.stringEscCss = options.stringEscCss;
                }
                if ((options.stringEscTag) || (options.stringEscTag === '')) {
                    result.stringEscTag = options.stringEscTag;
                }
                if ((options.commentCss) || (options.commentCss === '')) {
                    result.commentCss = options.commentCss;
                }
                if ((options.commentTag) || (options.commentTag === '')) {
                    result.commentTag = options.commentTag;
                }
                if ((options.normalCss) || (options.normalCss === '')) {
                    result.normalCss = options.normalCss;
                }
                if ((options.normalTag) || (options.normalTag === '')) {
                    result.normalTag = options.normalTag;
                }
                if ((options.specialCharCss) || (options.specialCharCss === '')) {
                    result.specialCharCss = options.specialCharCss;
                }
                if ((options.specialCharTag) || (options.specialCharTag === '')) {
                    result.specialCharTag = options.specialCharTag;
                }
                if ((options.lineCss) || (options.lineCss === '')) {
                    result.lineCss = options.lineCss;
                }
                if ((options.lineTag) || (options.lineTag === '')) {
                    result.lineTag = options.lineTag;
                }
                if ((options.indentCss) || (options.indentCss === '')) {
                    result.indentCss = options.indentCss;
                }
                if ((options.indentTag) || (options.indentTag === '')) {
                    result.indentTag = options.indentTag;
                }

                if (options.initialIndent) {
                    result.initialIndent = options.initialIndent;
                }
                if (options.inputIndentSize) {
                    result.inputIndentSize = options.inputIndentSize;
                }
                if (options.outputIndentSize) {
                    result.outputIndentSize = options.outputIndentSize;
                }

                if (options.knownClasses) {
                    result.knownClasses = options.knownClasses;
                }

                if ((options.disableCodeTag === true) || (options.disableCodeTag === false)) {
                    result.disableCodeTag = options.disableCodeTag;
                }
                return result;
            }

            function _getLang(lang) {
                if (lang === 'js')
                    return {
                        separators: ['.', ',', ';', ':', '!', '&', '|', '-', '+', '*', '/', '%', '=', '>', '<', '{', '}', '(', ')', '[', ']'],
                        quotes: ['\'', '"'],
                        spaces: [' ', '\t'],
                        esc: ['\\'],
                        braces: ['{', '}'],
                        callOpeningBrace: '(',
                        classPrecedings: ['new'],
                        inheritanceChar: ':',
                        knownClasses: [],
                        declarations: ['new', 'var', 'const', 'let', 'function', 'class', 'true', 'false', 'null', 'undefined'],
                        statements: ['for', 'while', 'break', 'continue', 'if', 'else', 'switch', 'case', 'default', 'try', 'catch', 'finally', 'return'],
                        commentStarter1: '/',
                        commentStarter2: '*',
                    };
                if (lang == 'csharp') {
                    return {
                        separators: ['.', ',', ';', ':', '!', '&', '$', '|', '-', '+', '*', '/', '%', '=', '>', '<', '{', '}', '(', ')', '[', ']'],
                        quotes: ['\'', '"'],
                        interpolation: '$',
                        interpolationBraces: ['{', '}'],
                        spaces: [' ', '\t'],
                        esc: ['\\'],
                        braces: ['{', '}'],
                        callOpeningBrace: '(',
                        classPrecedings: ['new', 'class'],
                        inheritanceChar: ':',
                        knownClasses: ['String', 'Int16', 'Int32', 'Int64', 'Boolean', 'Char', 'Byte', 'Single', 'Double', 'Decimal', 'Object',
                            'List', 'IList', 'Dictionary', 'IDictionary', 'HashSet', 'ICollection', 'IEnumerable', 'Enumerable', 'Array',
                            'Exception', 'ArgumentException', 'ArgumentNullException', 'ArgumentOutOfRangeException',
                            'StringBuilder', 'StringSplitOptions', 'StringComparer', 'StringComparison', 'IEqualityComparer', 'EqualityComparer',
                            'Task', 'Thread', 'Program', 'Console', 'GC', 'Stopwatch', 'DBNull', 'IDisposable'],
                        declarations: ['new', 'var', 'const', 'function', 'class', 'true', 'false', 'null', 'namespace', 'using', 'public', 'private', 'internal', 'protected', 'static', 'readonly', 'get', 'set', 'void', 'bool', 'string', 'int', 'double', 'float', 'byte', 'long', 'decimal', 'char', 'object'],
                        statements: ['for', 'while', 'break', 'foreach', 'in', 'continue', 'if', 'else', 'switch', 'case', 'default', 'try', 'catch', 'finally', 'throw', 'return'],
                        commentStarter1: '/',
                        commentStarter2: '*',
                    };
                }

                return {
                    separators: ['.', ',', ';', ':', '!', '&', '|', '-', '+', '*', '/', '%', '=', '>', '<', '{', '}', '(', ')', '[', ']'],
                    quotes: ['\'', '"'],
                    spaces: [' ', '\t'],
                    esc: ['\\'],
                    braces: ['{', '}'],
                    callOpeningBrace: '(',
                    classPrecedings: ['new'],
                    inheritanceChar: ':',
                    knownClasses: [],
                    declarations: ['new', 'var', 'const', 'let', 'function', 'class', 'true', 'false', 'null', 'undefined'],
                    statements: ['for', 'while', 'break', 'continue', 'if', 'else', 'switch', 'case', 'default', 'try', 'catch', 'finally', 'return'],
                    commentStarter1: '/',
                    commentStarter2: '*',
                };
            }

            function _getCodeInfo(lines) {
                const result = {
                    minIndent: undefined,
                    contentStartLine: undefined,
                    contentEndLine: undefined,
                }
                for (let l = 0; l < lines.length; l++) {
                    const line = lines[l];

                    let lineHasContent = false;
                    let lineIndent = 0;
                    for (let i = 0; i < line.length; i++) {
                        const ch = line[i];
                        if (_lang.spaces.indexOf(ch) >= 0) {
                            lineIndent++;
                        }
                        else {
                            lineHasContent = true;
                            break;
                        }
                    }

                    if (lineHasContent) {
                        if (isNaN(result.contentStartLine)) {
                            result.contentStartLine = l;
                        }
                        if (isNaN(result.contentEndLine) || (l > result.contentEndLine)) {
                            result.contentEndLine = l;
                        }
                        if (isNaN(result.minIndent) || (lineIndent < result.minIndent)) {
                            result.minIndent = lineIndent;
                        }
                    }
                }
                return result;
            }

            function _getOpeningTag(tag, cssClass) {
                if (!tag) {
                    tag = _options.defaultTag;
                }

                if (cssClass)
                    return '<' + tag + ' class="' + cssClass + '">';
                else
                    return '<' + tag + '>';
            }

            function _getClosingTag(tag) {
                if (!tag) {
                    tag = _options.defaultTag;
                }
                return '</' + tag + '>';
            }

            function _getContentTag(tag, cssClass, content) {
                return _getOpeningTag(tag, cssClass) + content + _getClosingTag(tag);
            }

            function _escapeChar(ch) {
                if (ch == '<')
                    return '&lt;';
                else if (ch == '>')
                    return '&gt;';
                else if (ch == '&')
                    return '&amp;';
                return ch;
            }

            function _getLexemeTag(lexeme, prevLexeme, prevCh, nextCh) {
                if (!lexeme)
                    return '';

                const lexemeTagAndCss = _getLexemeTagAndCss(lexeme, prevLexeme, prevCh, nextCh);
                return _getContentTag(lexemeTagAndCss.tag, lexemeTagAndCss.css, lexeme);
            }

            function _getLexemeTagAndCss(lexeme, prevLexeme, prevCh, nextCh) {
                if (_lang.declarations.indexOf(lexeme) >= 0)
                    return { tag: _options.declarationTag, css: _options.declarationCss };
                if (_lang.statements.indexOf(lexeme) >= 0)
                    return { tag: _options.statementTag, css: _options.statementCss };
                if (_lang.knownClasses.indexOf(lexeme) >= 0)
                    return { tag: _options.classTag, css: _options.classCss };
                if (_lang.classPrecedings.indexOf(prevLexeme) >= 0)
                    return { tag: _options.classTag, css: _options.classCss };
                if ((prevCh == _lang.inheritanceChar) && (_lang.declarations.indexOf(prevLexeme) < 0) && (_lang.statements.indexOf(prevLexeme) < 0) && (_lang.classPrecedings.indexOf(prevLexeme) < 0))
                    return { tag: _options.classTag, css: _options.classCss };

                if ((nextCh === _lang.callOpeningBrace) && (lexeme !== ''))
                    return { tag: _options.methodTag, css: _options.methodCss };

                return { tag: _options.normalTag, css: _options.normalCss };
            };

            function _getNextNonSpace(str, from) {
                for (let i = from; i < str.length; i++) {
                    if (_lang.spaces.indexOf(str[i]) < 0)
                        return str[i]
                }
            }

            function _getPrevNonSpace(str, from) {
                for (let i = from; i >= 0; i--) {
                    if (_lang.spaces.indexOf(str[i]) < 0) {
                        return str[i];
                    }
                }
            }

            return { convert: convert };
        }
    }
}

function Code2HtmlSample() {
    const options = {
        codeCss: '',
        defaultTag: '',

        declarationCss: '',
        declarationTag: '',
        statementCss: '',
        statementTag: '',
        classCss: '',
        classTag: '',
        methodCss: '',
        methodTag: '',
        stringCss: '',
        stringTag: '',
        stringEscCss: '',
        stringEscTag: '',
        commentCss: '',
        commentTag: '',
        normalCss: '',
        normalTag: '',
        specialCharCss: '',
        specialCharTag: '',
        lineCss: '',
        lineTag: '',
        indentCss: '',
        indentTag: '',

        initialIndent: 0,
        inputIndentSize: 0,
        outputIndentSize: 0,

        disableCodeTag: false,
        knownClasses: []
    };

    const code = 'if (myVar == 1) return true; else return false;';
    const html = Code2Html.create('js' /*js | csharp*/, options).convert(code);
}