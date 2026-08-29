import { useState, useRef, useEffect } from 'react'
import * as Y from 'yjs'
import { EditorState } from '@codemirror/state'
import {
  EditorView,
  keymap,
  lineNumbers,
  highlightActiveLine,
  highlightActiveLineGutter,
  highlightSpecialChars,
  drawSelection
} from '@codemirror/view'
import { defaultKeymap, indentWithTab } from '@codemirror/commands'
import { indentOnInput, bracketMatching } from '@codemirror/language'
import { closeBrackets, closeBracketsKeymap } from '@codemirror/autocomplete'
import { html } from '@codemirror/lang-html'
import { css } from '@codemirror/lang-css'
import { javascript } from '@codemirror/lang-javascript'
import { oneDark } from '@codemirror/theme-one-dark'
import { yCollab, yUndoManagerKeymap } from 'y-codemirror.next'
import EditorToolbar from './EditorToolbar'
import { useEditorActions } from '../../hooks/useEditorActions'
import { LANGUAGES } from '../../utils/languages'

const LANGUAGE_EXTENSIONS = {
  html: html(),
  css: css(),
  js: javascript()
}

export default function Editor({ language, ytext, awareness }) {
  const [open, setOpen] = useState(true)
  const containerRef = useRef(null)

  const { label } = LANGUAGES[language]
  const { status, copy, download, format } = useEditorActions(ytext, language)

  // Mount a CodeMirror 6 view bound to the shared Y.Text; yCollab keeps the
  // view and the CRDT in sync in both directions, including remote cursors.
  useEffect(() => {
    if (!ytext || !awareness || !containerRef.current) return

    // Scope undo/redo to this user's own edits, not remote ones
    const undoManager = new Y.UndoManager(ytext)

    const view = new EditorView({
      state: EditorState.create({
        doc: ytext.toString(),
        extensions: [
          lineNumbers(),
          highlightActiveLineGutter(),
          highlightSpecialChars(),
          drawSelection(),
          indentOnInput(),
          bracketMatching(),
          closeBrackets(),
          highlightActiveLine(),
          EditorView.lineWrapping,
          oneDark,
          LANGUAGE_EXTENSIONS[language],
          keymap.of([...closeBracketsKeymap, ...defaultKeymap, ...yUndoManagerKeymap, indentWithTab]),
          yCollab(ytext, awareness, { undoManager })
        ]
      }),
      parent: containerRef.current
    })

    return () => {
      undoManager.destroy()
      view.destroy()
    }
  }, [ytext, awareness, language])

  return (
    <div className={`grow basis-0 flex flex-col bg-blue-50/30 p-2 min-w-60 ${open ? '' : 'grow-0'}`}>
      <EditorToolbar
        label={label}
        open={open}
        onToggleOpen={() => setOpen((previous) => !previous)}
        status={status}
        onFormat={format}
        onCopy={copy}
        onDownload={download}
      />
      <div
        ref={containerRef}
        className="editor-container grow overflow-hidden rounded-br-lg rounded-bl-lg"
      />
    </div>
  )
}
