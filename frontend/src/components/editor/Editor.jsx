import React, { useState, useRef, useEffect } from 'react'
import 'codemirror/lib/codemirror.css'
import 'codemirror/theme/material.css'
import 'codemirror/mode/xml/xml'
import 'codemirror/mode/javascript/javascript'
import 'codemirror/mode/css/css'
import { Controlled as ControlledEditor } from 'react-codemirror2'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCompressAlt, faExpandAlt, faCopy, faDownload, faMagic, faBars } from '@fortawesome/free-solid-svg-icons'
import beautify from 'js-beautify'


export default function Editor(props) {
  const { language, displayName, value, onChange } = props
  const [open, setOpen] = useState(true)
  const [copied, setCopied] = useState(false)
  const [downloaded, setDownloaded] = useState(false)
  const [formatted, setFormatted] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [localValue, setLocalValue] = useState(value)
  const timeoutRef = useRef(null)
  const menuRef = useRef(null)
  const isLocalChange = useRef(false) // Track if change is from user typing

  // Update local value when prop changes from external source (other users)
  useEffect(() => {
    // Only update if it's different AND not from local typing
    if (value !== localValue && !isLocalChange.current) {
      setLocalValue(value)
    }
    // Reset the flag after a short delay
    if (isLocalChange.current) {
      const timer = setTimeout(() => {
        isLocalChange.current = false
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [value])

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

  function handleChange(editor, data, newValue) {
    // Mark this as a local change (user is typing)
    isLocalChange.current = true
    setLocalValue(newValue)
    
    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    
    // Debounce the onChange call to reduce network traffic
    timeoutRef.current = setTimeout(() => {
      onChange(newValue)
    }, 300) // Increased from 150ms to 300ms for better performance
  }

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(localValue)
      setCopied(true)
      setMenuOpen(false)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy:', error)
    }
  }

  const handleDownload = () => {
    if (!localValue.trim()) {
      alert(`Cannot download empty ${displayName} file`);
      return;
    }

    const fileExtensions = {
      'HTML': 'html',
      'CSS': 'css',
      'JS': 'js'
    };

    const mimeTypes = {
      'HTML': 'text/html',
      'CSS': 'text/css',
      'JS': 'text/javascript'
    };

    const extension = fileExtensions[displayName];
    const mimeType = mimeTypes[displayName];
    const filename = `code.${extension}`;

    const blob = new Blob([localValue], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setDownloaded(true);
    setMenuOpen(false);
    setTimeout(() => setDownloaded(false), 2000);
  }

  const handleFormat = () => {
    if (!localValue.trim()) {
      alert(`Cannot format empty ${displayName} code`);
      return;
    }

    try {
      let formattedCode;
      const options = {
        indent_size: 2,
        indent_char: ' ',
        max_preserve_newlines: 2,
        preserve_newlines: true,
        keep_array_indentation: false,
        break_chained_methods: false,
        indent_scripts: 'normal',
        brace_style: 'collapse',
        space_before_conditional: true,
        unescape_strings: false,
        jslint_happy: false,
        end_with_newline: false,
        wrap_line_length: 0,
        indent_inner_html: true,
        comma_first: false,
        e4x: false,
        indent_empty_lines: false
      };

      if (displayName === 'HTML') {
        formattedCode = beautify.html(localValue, options);
      } else if (displayName === 'CSS') {
        formattedCode = beautify.css(localValue, options);
      } else if (displayName === 'JS') {
        formattedCode = beautify.js(localValue, options);
      }

      isLocalChange.current = true
      setLocalValue(formattedCode);
      onChange(formattedCode);
      setFormatted(true);
      setMenuOpen(false);
      setTimeout(() => setFormatted(false), 2000);
    } catch (error) {
      alert(`Error formatting ${displayName}: ${error.message}`);
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
      <ControlledEditor
        onBeforeChange={handleChange}
        value={localValue}
        className="grow overflow-hidden rounded-br-lg rounded-bl-lg"
        options={{
          lineWrapping: true,
          lint: true,
          mode: language,
          theme: 'material',
          lineNumbers: true,
          viewportMargin: Infinity
        }}
      />
    </div>
  )
}