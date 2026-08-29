import { useEffect, useRef, useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCompressAlt, faExpandAlt, faCopy, faDownload, faMagic, faBars } from '@fortawesome/free-solid-svg-icons'

const ACTION_BUTTON = 'text-white cursor-pointer bg-none border-none px-2 py-1 rounded transition-colors'
const MENU_ITEM = 'w-full text-left px-4 py-2 hover:bg-blue-50 transition-colors cursor-pointer flex items-center gap-2'

const confirmed = (active) => `${ACTION_BUTTON} ${active ? 'bg-green-500' : 'hover:bg-white/20'}`

export default function EditorToolbar({ label, open, onToggleOpen, status, onFormat, onCopy, onDownload }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef(null)

  useEffect(() => {
    if (!menuOpen) return

    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [menuOpen])

  const fromMenu = (action) => () => {
    setMenuOpen(false)
    action()
  }

  return (
    <div className="flex justify-between items-center bg-gradient-to-r from-blue-600 to-purple-600 text-white pl-4 pr-2 py-2 rounded-t-lg shadow-md">
      <span className="font-semibold">{label}</span>

      {open ? (
        <div className="flex items-center gap-2">
          <button
            type="button"
            className={confirmed(status === 'formatted')}
            onClick={onFormat}
            aria-label={`Format ${label}`}
            title={`Format ${label}`}
          >
            <FontAwesomeIcon icon={faMagic} />
          </button>
          <button
            type="button"
            className={confirmed(status === 'copied')}
            onClick={onCopy}
            title={`Copy ${label}`}
          >
            <FontAwesomeIcon icon={faCopy} className="mr-1" />
            {status === 'copied' ? 'Copied!' : 'Copy'}
          </button>
          <button
            type="button"
            className={confirmed(status === 'downloaded')}
            onClick={onDownload}
            aria-label={`Download ${label}`}
            title={`Download ${label}`}
          >
            <FontAwesomeIcon icon={faDownload} />
          </button>
          <button
            type="button"
            className={`${ACTION_BUTTON} hover:bg-white/20`}
            onClick={onToggleOpen}
            aria-label={`Collapse ${label} editor`}
            title="Collapse"
          >
            <FontAwesomeIcon icon={faCompressAlt} />
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              className={`${ACTION_BUTTON} hover:bg-white/20`}
              onClick={() => setMenuOpen((previous) => !previous)}
              aria-label={`${label} editor options`}
              aria-expanded={menuOpen}
              title="Options"
            >
              <FontAwesomeIcon icon={faBars} />
            </button>

            {menuOpen && (
              <div className="absolute right-0 top-full mt-1 bg-white text-gray-800 rounded-lg shadow-xl border border-gray-200 py-2 z-50 min-w-[150px]">
                <button type="button" onClick={fromMenu(onFormat)} className={MENU_ITEM}>
                  <FontAwesomeIcon icon={faMagic} className="text-blue-600" />
                  <span>Format</span>
                </button>
                <button type="button" onClick={fromMenu(onCopy)} className={MENU_ITEM}>
                  <FontAwesomeIcon icon={faCopy} className="text-blue-600" />
                  <span>Copy</span>
                </button>
                <button type="button" onClick={fromMenu(onDownload)} className={MENU_ITEM}>
                  <FontAwesomeIcon icon={faDownload} className="text-blue-600" />
                  <span>Download</span>
                </button>
              </div>
            )}
          </div>
          <button
            type="button"
            className={`${ACTION_BUTTON} hover:bg-white/20`}
            onClick={onToggleOpen}
            aria-label={`Expand ${label} editor`}
            title="Expand"
          >
            <FontAwesomeIcon icon={faExpandAlt} />
          </button>
        </div>
      )}
    </div>
  )
}
