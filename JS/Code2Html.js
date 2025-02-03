if (!window.Code2Html) {
    window.Code2Html = {
        create: function (options) {
            let _codeCss = 'code-block html js';
            let _tagCss = 'tag';
            let _tagBraceCss = 'tag-brace';
            let _declarationCss = 'decl';
            let _statementCss = 'stmnt';
            let _classCss = 'class';
            let _methodCss = 'method';
            let _stringCss = 'string';
            let _stringEscCss = 'escape';
            let _normalCss = 'normal';
            let _specialCharCss = 'special-char';
            let _lineCss = 'line';

            let _initialIndent = 0;
            let _inputIndentSize = 4;
            let _outputIndentSize = 2;

            _initOptions(options);

            const _separators = ['.', ',', ';', ':', '!', '&', '|', '-', '+', '*', '/', '=', '>', '<', '{', '}', '(', ')', '[', ']'];
            const _quotes = ['\'', '"'];
            const _spaces = [' ', '\t'];
            const _esc = ['\\'];

            function convert(code) {
                let result = '';
                result += '<code class="' + _codeCss + '">\n';

                const lines = code.split('\n');

                let minIndent;

                let contentStartLine;
                let contentEndLine;
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
                        if (isNaN(contentStartLine)) {
                            contentStartLine = l;
                        }
                        if (isNaN(contentEndLine) || (l > contentEndLine)) {
                            contentEndLine = l;
                        }
                        if (isNaN(minIndent) || (lineIndent < minIndent)) {
                            minIndent = lineIndent;
                        }
                    }
                }

                let prevLexeme = '';
                for (let l = contentStartLine; l <= contentEndLine; l++) {
                    const line = lines[l];

                    result += '<span class="' + _lineCss + '">';

                    let resultLine = '';

                    let lineContentStarted = false;
                    let stringLiteralQuote = '';
                    let stringLiteral = false;
                    let escape = false;
                    let lexeme = '';
                    for (let i = 0; i < line.length; i++) {
                        if (i < minIndent)
                            continue;

                        const ch = line[i];

                        if (!lineContentStarted) {
                            if (_spaces.indexOf(ch) >= 0) {
                                if ((i % _inputIndentSize) == 0) {
                                    for (let i = 0; i < _outputIndentSize; i++) {
                                        resultLine += '&nbsp;';
                                    }
                                }
                                continue;
                            }
                            else {
                                lineContentStarted = true;
                            }
                        }

                        let escSet = false;
                        if ((!escape) && (_esc.indexOf(ch) >= 0)) {
                            escape = true;
                            escSet = true;
                            if (stringLiteral) {
                                resultLine += '<span class="' + _stringEscCss + '">';
                            }
                        }

                        if ((_quotes.indexOf(ch) >= 0) && (!escape)) {
                            if (!stringLiteral) {
                                stringLiteral = true;
                                stringLiteralQuote = ch;

                                resultLine += '<span class="' + _stringCss + '">';
                                resultLine += '<span class="' + _specialCharCss + '">' + ch + '</span>';
                            }
                            else if (stringLiteralQuote === ch) {
                                stringLiteral = false;

                                resultLine += '<span class="' + _specialCharCss + '">' + ch + '</span>';
                                resultLine += '</span>';
                            }
                            else {
                                resultLine += '<span class="' + _specialCharCss + '">' + ch + '</span>';
                            }
                        }
                        else if (!stringLiteral) {
                            if ((_separators.indexOf(ch) >= 0) || (_spaces.indexOf(ch) >= 0)) {
                                const lexemeType = _getLexemeType(lexeme, prevLexeme, ch);
                                const lexemeCss = _getLexemeCss(lexemeType);

                                if (lexeme) {
                                    resultLine += '<span class="' + lexemeCss + '">' + lexeme + '</span>';
                                }

                                if (_spaces.indexOf(ch) >= 0) {
                                    resultLine += ch;
                                }
                                else {
                                    resultLine += '<span class="' + _specialCharCss + '">' + ch + '</span>';
                                }

                                if (lexemeType == 'declaration' || lexemeType == 'statement' || lexemeType == 'class' || lexemeType == 'method') {
                                    prevLexeme = lexeme;
                                }
                                lexeme = '';
                            }
                            else {
                                lexeme += ch;
                            }

                            if ((ch === '{') || (ch === '}')) {
                                prevLexeme = '';
                            }
                        }
                        else if (stringLiteral) {
                            if (ch == '<') {
                                resultLine += '&lt;';
                            }
                            else if (ch == '>') {
                                resultLine += '&gt;';
                            }
                            else {
                                resultLine += ch;
                            }
                        }

                        if (escape && !escSet) {
                            escape = false;
                            if (stringLiteral) {
                                resultLine += '</span>';
                            }
                        }
                    }

                    if (lexeme) {
                        const lexemeType = _getLexemeType(lexeme, prevLexeme);
                        const lexemeCss = _getLexemeCss(lexemeType);
                        resultLine += '<span class="' + lexemeCss + '">' + lexeme + '</span>';

                        if (lexemeType == 'declaration' || lexemeType == 'statement' || lexemeType == 'class' || lexemeType == 'method') {
                            prevLexeme = lexeme;
                        }
                        lexeme = '';
                    }

                    for (let i = 0; i < _initialIndent * _outputIndentSize; i++) {
                        resultLine = '&nbsp;' + resultLine;
                    }

                    result += resultLine;
                    result += '</span>';
                    result += '\n<br />';
                }

                result += '\n</code>';
                return result;
            };


            function _initOptions(options) {
                if (!options)
                    return;

                if ((options.codeCss) || (options.codeCss === '')) {
                    _codeCss = options.codeCss;
                }

                if ((options.tagCss) || (options.tagCss === '')) {
                    _tagCss = options.tagCss;
                }
                if ((options.tagBraceCss) || (options.tagBraceCss === '')) {
                    _tagBraceCss = options.tagBraceCss;
                }
                if ((options.declarationCss) || (options.declarationCss === '')) {
                    _declarationCss = options.declarationCss;
                }
                if ((options.statementCss) || (options.statementCss === '')) {
                    _statementCss = options.statementCss;
                }
                if ((options.classCss) || (options.classCss === '')) {
                    _classCss = options.classCss;
                }
                if ((options.methodCss) || (options.methodCss === '')) {
                    _methodCss = options.methodCss;
                }
                if ((options.stringCss) || (options.stringCss === '')) {
                    _stringCss = options.stringCss;
                }
                if ((options.stringEscCss) || (options.stringEscCss === '')) {
                    _stringEscCss = options.stringEscCss;
                }
                if ((options.normalCss) || (options.normalCss === '')) {
                    _normalCss = options.normalCss;
                }
                if ((options.specialCharCss) || (options.specialCharCss === '')) {
                    _specialCharCss = options.specialCharCss;
                }
                if ((options.lineCss) || (options.lineCss === '')) {
                    _lineCss = options.lineCss;
                }

                if (options.initialIndent) {
                    _initialIndent = options.initialIndent;
                }
                if (options.inputIndentSize) {
                    _inputIndentSize = options.inputIndentSize;
                }
                if (options.outputIndentSize) {
                    _outputIndentSize = options.outputIndentSize;
                }
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
                    return _tagCss;
                if (lexemeType === 'brace')
                    return _tagBraceCss;
                if (lexemeType === 'declaration')
                    return _declarationCss;
                if (lexemeType === 'statement')
                    return _statementCss;
                if (lexemeType === 'class')
                    return _classCss;
                if (lexemeType === 'method')
                    return _methodCss;
                if (lexemeType === 'string')
                    return _stringCss;

                return _normalCss;
            };

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