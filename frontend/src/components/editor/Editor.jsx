import React, { useState, useRef, useEffect } from 'react'
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
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCompressAlt, faExpandAlt, faCopy, faDownload, faMagic, faBars } from '@fortawesome/free-solid-svg-icons'
import beautify from 'js-beautify'

const LANGUAGE_EXTENSIONS = {
  html: html(),
  css: css(),
  js: javascript()
}

export default function Editor(props) {
  const { language, displayName, ytext, awareness } = props
  const [open, setOpen] = useState(true)
  const [copied, setCopied] = useState(false)
  const [downloaded, setDownloaded] = useState(false)
  const [formatted, setFormatted] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const containerRef = useRef(null)
  const viewRef = useRef(null)
  const menuRef = useRef(null)

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

    viewRef.current = view

    return () => {
      undoManager.destroy()
      view.destroy()
      viewRef.current = null
    }
  }, [ytext, awareness, language])

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false)
      }
    }

    if (menuOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [menuOpen])

  const getValue = () => (ytext ? ytext.toString() : '')

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(getValue())
      setCopied(true)
      setMenuOpen(false)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy:', error)
    }
  }

  const handleDownload = () => {
    const value = getValue()
    if (!value.trim()) {
      alert(`Cannot download empty ${displayName} file`)
      return
    }

    const fileExtensions = {
      'HTML': 'html',
      'CSS': 'css',
      'JS': 'js'
    }

    const mimeTypes = {
      'HTML': 'text/html',
      'CSS': 'text/css',
      'JS': 'text/javascript'
    }

    const extension = fileExtensions[displayName]
    const mimeType = mimeTypes[displayName]
    const filename = `code.${extension}`

    const blob = new Blob([value], { type: mimeType })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    setDownloaded(true)
    setMenuOpen(false)
    setTimeout(() => setDownloaded(false), 2000)
  }

  const handleFormat = () => {
    const value = getValue()
    if (!value.trim()) {
      alert(`Cannot format empty ${displayName} code`)
      return
    }

    try {
      let formattedCode
      const options = {
        indent_size: 2,
        indent_char: ' ',
        max_preserve_newlines: 2,
        preserve_newlines: true,
        indent_inner_html: true,
        end_with_newline: false,
        wrap_line_length: 0
      }

      if (displayName === 'HTML') {
        formattedCode = beautify.html(value, options)
      } else if (displayName === 'CSS') {
        formattedCode = beautify.css(value, options)
      } else if (displayName === 'JS') {
        formattedCode = beautify.js(value, options)
      }

      // Replace the shared text in one transaction so it syncs as a single edit
      ytext.doc.transact(() => {
        ytext.delete(0, ytext.length)
        ytext.insert(0, formattedCode)
      })

      setFormatted(true)
      setMenuOpen(false)
      setTimeout(() => setFormatted(false), 2000)
    } catch (error) {
      alert(`Error formatting ${displayName}: ${error.message}`)
    }
  }

  return (
    <div className={`grow basis-0 flex flex-col bg-blue-50/30 p-2 min-w-60 ${open ? '' : 'grow-0'}`}>
      <div className="flex justify-between items-center bg-gradient-to-r from-blue-600 to-purple-600 text-white pl-4 pr-2 py-2 rounded-t-lg shadow-md">
        <span className="font-semibold">{displayName}</span>

        {open ? (
          <div className="flex items-center gap-2">
            <button
              type="button"
              className={`text-white cursor-pointer bg-none border-none px-2 py-1 rounded transition-colors ${
                formatted ? 'bg-green-500' : 'hover:bg-white/20'
              }`}
              onClick={handleFormat}
              title={`Format ${displayName}`}
            >
              <FontAwesomeIcon icon={faMagic} />
            </button>
            <button
              type="button"
              className={`text-white cursor-pointer bg-none border-none px-2 py-1 rounded transition-colors ${
                copied ? 'bg-green-500' : 'hover:bg-white/20'
              }`}
              onClick={handleCopy}
              title={`Copy ${displayName}`}
            >
              <FontAwesomeIcon icon={faCopy} className="mr-1" />
              {copied ? 'Copied!' : 'Copy'}
            </button>
            <button
              type="button"
              className={`text-white cursor-pointer bg-none border-none px-2 py-1 rounded transition-colors ${
                downloaded ? 'bg-green-500' : 'hover:bg-white/20'
              }`}
              onClick={handleDownload}
              title={`Download ${displayName}`}
            >
              <FontAwesomeIcon icon={faDownload} />
            </button>
            <button
              type="button"
              className="text-white cursor-pointer bg-none border-none hover:bg-white/20 px-2 py-1 rounded transition-colors"
              onClick={() => setOpen(prevOpen => !prevOpen)}
              title={open ? 'Collapse' : 'Expand'}
            >
              <FontAwesomeIcon icon={open ? faCompressAlt : faExpandAlt} />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <div className="relative" ref={menuRef}>
              <button
                type="button"
                className="text-white cursor-pointer bg-none border-none hover:bg-white/20 px-2 py-1 rounded transition-colors"
                onClick={() => setMenuOpen(!menuOpen)}
                title="Options"
              >
                <FontAwesomeIcon icon={faBars} />
              </button>

              {menuOpen && (
                <div className="absolute right-0 top-full mt-1 bg-white text-gray-800 rounded-lg shadow-xl border border-gray-200 py-2 z-50 min-w-[150px]">
                  <button
                    onClick={handleFormat}
                    className="w-full text-left px-4 py-2 hover:bg-blue-50 transition-colors cursor-pointer flex items-center gap-2"
                  >
                    <FontAwesomeIcon icon={faMagic} className="text-blue-600" />
                    <span>Format</span>
                  </button>
                  <button
                    onClick={handleCopy}
                    className="w-full text-left px-4 py-2 hover:bg-blue-50 transition-colors cursor-pointer flex items-center gap-2"
                  >
                    <FontAwesomeIcon icon={faCopy} className="text-blue-600" />
                    <span>Copy</span>
                  </button>
                  <button
                    onClick={handleDownload}
                    className="w-full text-left px-4 py-2 hover:bg-blue-50 transition-colors cursor-pointer flex items-center gap-2"
                  >
                    <FontAwesomeIcon icon={faDownload} className="text-blue-600" />
                    <span>Download</span>
                  </button>
                </div>
              )}
            </div>
            <button
              type="button"
              className="text-white cursor-pointer bg-none border-none hover:bg-white/20 px-2 py-1 rounded transition-colors"
              onClick={() => setOpen(true)}
              title="Expand"
            >
              <FontAwesomeIcon icon={faExpandAlt} />
            </button>
          </div>
        )}
      </div>
      <div
        ref={containerRef}
        className="editor-container grow overflow-hidden rounded-br-lg rounded-bl-lg"
      />
    </div>
  )
}
