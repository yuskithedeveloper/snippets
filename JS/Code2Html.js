if (!window.Code2Html) {
    window.Code2Html = {
        create: function (lang, options) {
            const _options = _initOptions(lang, options);

            const _lang = _getLang(lang);

            function convert(code) {
                let result = '';
                result += '<code class="' + _options.codeCss + '">\n';

                const lines = code.split('\n');
                const codeInfo = _getCodeInfo(lines);

                let prevLexeme = '';
                let blockComment = false;
                for (let l = codeInfo.contentStartLine; l <= codeInfo.contentEndLine; l++) {
                    const line = lines[l];

                    result += _getOpeningTag(_options.lineCss);

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
                                if ((i % _options.inputIndentSize) == 0) {
                                    for (let i = 0; i < _options.outputIndentSize; i++) {
                                        resultLine += '&nbsp;';
                                    }
                                }
                                continue;
                            }
                            else {
                                lineContentStarted = true;
                                if (blockComment) {
                                    resultLine += _getOpeningTag(_options.commentCss);
                                }
                            }
                        }

                        if ((!stringLiteral) && (!lineComment) && (!blockComment) && (ch === _lang.commentStarter1) && (i < line.length - 1)) {
                            const nextCh = line[i + 1];
                            if (nextCh == _lang.commentStarter1) {
                                lineComment = true;
                                resultLine += _getOpeningTag(_options.commentCss);
                                resultLine += _getContentTag(_options.specialCharCss, ch + nextCh);
                                i++;
                                continue;
                            }
                            else if (nextCh == _lang.commentStarter2) {
                                blockComment = true;
                                resultLine += _getOpeningTag(_options.commentCss);
                                resultLine += _getContentTag(_options.specialCharCss, ch + nextCh);
                                i++;
                                continue;
                            }
                        }

                        if (lineComment || blockComment) {
                            if ((blockComment) && (ch === _lang.commentStarter2) && (i < line.length - 1)) {
                                const nextCh = line[i + 1];
                                if (nextCh == _lang.commentStarter1) {
                                    blockComment = false;
                                    resultLine += _getContentTag(_options.specialCharCss, ch + nextCh);
                                    resultLine += _getClosingTag();
                                    i++;
                                    continue;
                                }
                            }

                            resultLine += _escapeChar(ch);
                            continue;
                        }

                        if ((stringLiteral) && (_lang.esc.indexOf(ch) >= 0)) {
                            const nextCh = line[i + 1];
                            resultLine += _getOpeningTag(_options.stringEscCss);
                            resultLine += _getContentTag(_options.specialCharCss, ch + nextCh);
                            resultLine += _getClosingTag();
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
                                        resultLine += _getOpeningTag(_options.stringCss);
                                        resultLine += _getContentTag(_options.specialCharCss, ch + nextCh);
                                        i++;
                                    }
                                }
                                else if (_lang.quotes.indexOf(ch) >= 0) {
                                    stringLiteral = true;
                                    stringLiteralQuote = ch;
                                    resultLine += _getOpeningTag(_options.stringCss);
                                    resultLine += _getContentTag(_options.specialCharCss, ch);
                                }
                            }
                            else if (stringLiteralQuote === ch) {
                                stringLiteral = false;
                                stringInterpolation = false;

                                resultLine += _getContentTag(_options.specialCharCss, ch);
                                resultLine += _getClosingTag();
                            }
                            else {
                                resultLine += _getContentTag(_options.specialCharCss, ch);
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
                                    resultLine += _getContentTag(_options.specialCharCss, _escapeChar(ch));
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
                                resultLine += _getOpeningTag(_options.stringCss);
                                stringLiteral = true;

                                prevLexeme = '';
                            }
                            else if (_lang.braces.indexOf(ch) >= 0) {
                                prevLexeme = '';
                            }
                        }
                        else if (stringLiteral) {
                            if (stringInterpolation && (_lang.interpolationBraces.indexOf(ch) >= 0)) {
                                resultLine += _getClosingTag();
                                resultLine += _getContentTag(_options.specialCharCss, ch);
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
                        resultLine += _getClosingTag();
                    }

                    for (let i = 0; i < _options.initialIndent * _options.outputIndentSize; i++) {
                        resultLine = '&nbsp;' + resultLine;
                    }

                    result += resultLine;
                    result += _getClosingTag();
                    if (l < lines.length - 1) {
                        result += '\n<br />';
                    }
                }

                result += '\n</code>';
                return result;
            };

            function _initOptions(lang, options) {
                let result = {
                    codeCss: 'code-block ' + lang,
                    tagCss: 'tag',
                    tagBraceCss: 'tag-brace',
                    declarationCss: 'decl',
                    statementCss: 'stmnt',
                    classCss: 'class',
                    methodCss: 'method',
                    stringCss: 'string',
                    stringEscCss: 'escape',
                    commentCss: 'comment',
                    normalCss: 'normal',
                    specialCharCss: 'special-char',
                    lineCss: 'line',

                    initialIndent: 0,
                    inputIndentSize: 4,
                    outputIndentSize: 2,
                };
                if (!options)
                    return result;

                if ((options.codeCss) || (options.codeCss === '')) {
                    result.codeCss = options.codeCss;
                }
                if ((options.tagCss) || (options.tagCss === '')) {
                    result.tagCss = options.tagCss;
                }
                if ((options.tagBraceCss) || (options.tagBraceCss === '')) {
                    result.tagBraceCss = options.tagBraceCss;
                }
                if ((options.declarationCss) || (options.declarationCss === '')) {
                    result.declarationCss = options.declarationCss;
                }
                if ((options.statementCss) || (options.statementCss === '')) {
                    result.statementCss = options.statementCss;
                }
                if ((options.classCss) || (options.classCss === '')) {
                    result.classCss = options.classCss;
                }
                if ((options.methodCss) || (options.methodCss === '')) {
                    result.methodCss = options.methodCss;
                }
                if ((options.stringCss) || (options.stringCss === '')) {
                    result.stringCss = options.stringCss;
                }
                if ((options.stringEscCss) || (options.stringEscCss === '')) {
                    result.stringEscCss = options.stringEscCss;
                }
                if ((options.commentCss) || (options.commentCss === '')) {
                    result.commentCss = options.commentCss;
                }
                if ((options.normalCss) || (options.normalCss === '')) {
                    result.normalCss = options.normalCss;
                }
                if ((options.specialCharCss) || (options.specialCharCss === '')) {
                    result.specialCharCss = options.specialCharCss;
                }
                if ((options.lineCss) || (options.lineCss === '')) {
                    result.lineCss = options.lineCss;
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
                        knownClasses: ['String', 'Int16', 'Int32', 'Int64', 'Boolean', 'Char', 'Byte', 'Single', 'Double', 'Object',
                            'List', 'IList', 'Dictionary', 'IDictionary', 'HashSet', 'ICollection', 'IEnumerable', 'Enumerable', 'Array',
                            'Exception', 'ArgumentException', 'ArgumentNullException', 'ArgumentOutOfRangeException',
                            'StringBuilder', 'StringSplitOptions', 'StringComparer', 'StringComparison', 'IEqualityComparer', 'EqualityComparer',
                            'Task', 'Thread', 'Program', 'Console', 'GC', 'Stopwatch', 'DBNull', 'IDisposable'],
                        declarations: ['new', 'var', 'const', 'function', 'class', 'true', 'false', 'null', 'namespace', 'using', 'public', 'private', 'internal', 'protected', 'static', 'void', 'bool', 'string', 'int', 'double', 'float', 'byte', 'long', 'char', 'object'],
                        statements: ['for', 'while', 'break', 'foreach', 'continue', 'if', 'else', 'switch', 'case', 'default', 'try', 'catch', 'finally', 'return'],
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

            function _getOpeningTag(cssClass) {
                return '<span class="' + cssClass + '">';
            }

            function _getClosingTag() {
                return '</span>';
            }

            function _getContentTag(cssClass, content) {
                return _getOpeningTag(cssClass) + content + _getClosingTag();
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

                const lexemeCss = _getLexemeCss(lexeme, prevLexeme, prevCh, nextCh);
                return _getContentTag(lexemeCss, lexeme);
            }

            function _getLexemeCss(lexeme, prevLexeme, prevCh, nextCh) {
                if (_lang.declarations.indexOf(lexeme) >= 0)
                    return _options.declarationCss;
                if (_lang.statements.indexOf(lexeme) >= 0)
                    return _options.statementCss;
                if (_lang.knownClasses.indexOf(lexeme) >= 0)
                    return _options.classCss;
                if (_lang.classPrecedings.indexOf(prevLexeme) >= 0)
                    return _options.classCss;
                if ((prevCh == _lang.inheritanceChar) && (_lang.declarations.indexOf(prevLexeme) < 0) && (_lang.statements.indexOf(prevLexeme) < 0) && (_lang.classPrecedings.indexOf(prevLexeme) < 0))
                    return _options.classCss;

                if ((nextCh === _lang.callOpeningBrace) && (lexeme !== ''))
                    return _options.methodCss;

                return _options.normalCss;
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
        tagCss: '',
        tagBraceCss: '',
        declarationCss: '',
        statementCss: '',
        classCss: '',
        methodCss: '',
        stringCss: '',
        stringEscCss: '',
        commentCss: '',
        normalCss: '',
        specialCharCss: '',
        lineCss: '',

        initialIndent: 0,
        inputIndentSize: 0,
        outputIndentSize: 0
    };

    const code = 'if (myVar == 1) return true; else return false;';
    const html = Code2Html.create('js' /*js | csharp*/, options).convert(code);
}