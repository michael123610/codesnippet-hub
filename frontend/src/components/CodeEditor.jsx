import CodeMirror from '@uiw/react-codemirror'
import { javascript } from '@codemirror/lang-javascript'
import { python } from '@codemirror/lang-python'
import { java } from '@codemirror/lang-java'
import { cpp } from '@codemirror/lang-cpp'
import { html } from '@codemirror/lang-html'
import { css } from '@codemirror/lang-css'
import { oneDark } from '@codemirror/theme-one-dark'
import { useEffect, useState } from 'react'

const languageExtensions = {
  javascript: javascript({ jsx: true, typescript: false }),
  typescript: javascript({ jsx: true, typescript: true }),
  python: python(),
  java: java(),
  cpp: cpp(),
  'c++': cpp(),
  html: html(),
  css: css()
}

function CodeEditor({ value, onChange, language = 'javascript', readOnly = false, height = '400px' }) {
  const [extensions, setExtensions] = useState([javascript()])

  useEffect(() => {
    const ext = languageExtensions[language.toLowerCase()] || javascript()
    setExtensions([ext])
  }, [language])

  return (
    <div className="border border-gray-300 rounded-lg overflow-hidden">
      <CodeMirror
        value={value}
        height={height}
        theme={oneDark}
        extensions={extensions}
        onChange={onChange}
        readOnly={readOnly}
        basicSetup={{
          lineNumbers: true,
          highlightActiveLineGutter: true,
          highlightSpecialChars: true,
          foldGutter: true,
          drawSelection: true,
          dropCursor: true,
          allowMultipleSelections: true,
          indentOnInput: true,
          bracketMatching: true,
          closeBrackets: true,
          autocompletion: true,
          rectangularSelection: true,
          crosshairCursor: true,
          highlightActiveLine: true,
          highlightSelectionMatches: true,
          closeBracketsKeymap: true,
          searchKeymap: true,
          foldKeymap: true,
          completionKeymap: true,
          lintKeymap: true
        }}
      />
    </div>
  )
}

export default CodeEditor