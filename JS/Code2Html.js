if (!window.Code2Html) {
    window.Code2Html = {
        create: function (options) {
            const _options = _initOptions(options);

            const _separators = ['.', ',', ';', ':', '!', '&', '|', '-', '+', '*', '/', '=', '>', '<', '{', '}', '(', ')', '[', ']'];
            const _quotes = ['\'', '"'];
            const _spaces = [' ', '\t'];
            const _esc = ['\\'];
            const _braces = ['{', '}'];
            const _commentStarter1 = '/';
            const _commentStarter2 = '*';

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
                    let lineComment = false;
                    let escape = false;
                    let lexeme = '';
                    for (let i = 0; i < line.length; i++) {
                        if (i < codeInfo.minIndent)
                            continue;

                        const ch = line[i];

                        if (!lineContentStarted) {
                            if (_spaces.indexOf(ch) >= 0) {
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

                        if ((!stringLiteral) && (!lineComment) && (!blockComment) && (ch === _commentStarter1) && (i < line.length - 1)) {
                            const nextCh = line[i + 1];
                            if (nextCh == _commentStarter1) {
                                lineComment = true;
                                resultLine += _getOpeningTag(_options.commentCss);
                                resultLine += _getContentTag(_options.specialCharCss, ch + nextCh);
                                i++;
                                continue;
                            }
                            else if (nextCh == _commentStarter2) {
                                blockComment = true;
                                resultLine += _getOpeningTag(_options.commentCss);
                                resultLine += _getContentTag(_options.specialCharCss, ch + nextCh);
                                i++;
                                continue;
                            }
                        }

                        if (lineComment || blockComment) {
                            if ((blockComment) && (ch === _commentStarter2) && (i < line.length - 1)) {
                                const nextCh = line[i + 1];
                                if (nextCh == _commentStarter1) {
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

                        let escSet = false;
                        if ((!escape) && (_esc.indexOf(ch) >= 0)) {
                            escape = true;
                            escSet = true;
                            if (stringLiteral) {
                                resultLine += _getOpeningTag(_options.stringEscCss);
                            }
                        }

                        if ((_quotes.indexOf(ch) >= 0) && (!escape)) {
                            if (!stringLiteral) {
                                stringLiteral = true;
                                stringLiteralQuote = ch;

                                resultLine += _getOpeningTag(_options.stringCss);
                                resultLine += _getContentTag(_options.specialCharCss, ch);
                            }
                            else if (stringLiteralQuote === ch) {
                                stringLiteral = false;

                                resultLine += _getContentTag(_options.specialCharCss, ch);
                                resultLine += _getClosingTag();
                            }
                            else {
                                resultLine += _getContentTag(_options.specialCharCss, ch);
                            }
                        }
                        else if (!stringLiteral) {
                            if ((_separators.indexOf(ch) >= 0) || (_spaces.indexOf(ch) >= 0)) {
                                let nextNonSpaceCh = _getNextNonSpace(line, i);
                                resultLine += _getLexemeTag(lexeme, prevLexeme, nextNonSpaceCh);

                                if (_spaces.indexOf(ch) >= 0) {
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

                            if (_braces.indexOf(ch) >= 0) {
                                prevLexeme = '';
                            }
                        }
                        else if (stringLiteral) {
                            resultLine += _escapeChar(ch);
                        }

                        if (escape && !escSet) {
                            escape = false;
                            if (stringLiteral) {
                                resultLine += _getClosingTag();
                            }
                        }
                    }

                    if (lexeme) {
                        resultLine += _getLexemeTag(lexeme, prevLexeme);
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

            function _initOptions(options) {
                let result = {
                    codeCss: 'code-block html js',
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
                        if (_spaces.indexOf(ch) >= 0) {
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

            function _getLexemeTag(lexeme, prevLexeme, nextCh) {
                if (!lexeme)
                    return '';

                const lexemeType = _getLexemeType(lexeme, prevLexeme, nextCh);
                const lexemeCss = _getLexemeCss(lexemeType);
                return _getContentTag(lexemeCss, lexeme);
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

            function _getLexemeType(lexeme, prevLexeme, nextCh) {
                if (lexeme === 'new' || lexeme === 'var' || lexeme === 'const' || lexeme === 'let' || lexeme === 'function' || lexeme === 'class' || lexeme === 'true' || lexeme === 'false')
                    return 'declaration';
                if (lexeme === 'for' || lexeme === 'while' || lexeme === 'break' || lexeme === 'continue' || lexeme === 'if' || lexeme === 'else' || lexeme === 'switch' || lexeme === 'case' || lexeme === 'default' || lexeme === 'return')
                    return 'statement';
                if (nextCh === '(') {
                    if (prevLexeme === 'new')
                        return 'class';
                    else if (lexeme !== '')
                        return 'method';
                }
            };

            function _getLexemeCss(lexemeType) {
                if (lexemeType === 'tag')
                    return _options.tagCss;
                if (lexemeType === 'brace')
                    return _options.tagBraceCss;
                if (lexemeType === 'declaration')
                    return _options.declarationCss;
                if (lexemeType === 'statement')
                    return _options.statementCss;
                if (lexemeType === 'class')
                    return _options.classCss;
                if (lexemeType === 'method')
                    return _options.methodCss;
                if (lexemeType === 'string')
                    return _options.stringCss;

                return _options.normalCss;
            };

            function _getNextNonSpace(str, from) {
                for (let i = from; i < str.length; i++) {
                    if (_spaces.indexOf(str[i]) < 0)
                        return str[i]
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
    const html = Code2Html.create(options).convert(code);
}