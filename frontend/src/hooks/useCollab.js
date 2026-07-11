import { useEffect, useState } from 'react';
import * as Y from 'yjs';
import {
  Awareness,
  applyAwarenessUpdate,
  encodeAwarenessUpdate
} from 'y-protocols/awareness';

const USER_COLORS = [
  { color: '#30bced', light: '#30bced33' },
  { color: '#6eeb83', light: '#6eeb8333' },
  { color: '#ffbc42', light: '#ffbc4233' },
  { color: '#ecd444', light: '#ecd44433' },
  { color: '#ee6352', light: '#ee635233' },
  { color: '#9ac2c9', light: '#9ac2c933' },
  { color: '#8acb88', light: '#8acb8833' },
  { color: '#1be7ff', light: '#1be7ff33' }
];

const colorFor = (name) => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) | 0;
  }
  return USER_COLORS[Math.abs(hash) % USER_COLORS.length];
};

// Shares a Y.Doc with everyone in the room over the existing Socket.io
// connection, plus an Awareness instance for remote cursors/selections.
// Returns { ydoc, awareness, ytexts: { html, css, js } } once created.
export const useCollab = (socket, roomId, displayName) => {
  const [collab, setCollab] = useState(null);

  useEffect(() => {
    if (!socket || !roomId) return;

    const ydoc = new Y.Doc();
    const awareness = new Awareness(ydoc);

    const onDocUpdate = (update, origin) => {
      if (origin !== 'remote') {
        socket.emit('yjs-update', { roomId, update });
      }
    };

    const onAwarenessUpdate = ({ added, updated, removed }, origin) => {
      if (origin === 'remote') return;
      const changed = added.concat(updated, removed);
      socket.emit('yjs-awareness', {
        roomId,
        update: encodeAwarenessUpdate(awareness, changed)
      });
    };

    const onRemoteUpdate = (update) => {
      Y.applyUpdate(ydoc, new Uint8Array(update), 'remote');
    };

    const onRemoteSync = (update) => {
      Y.applyUpdate(ydoc, new Uint8Array(update), 'remote');
      // Push our full state back so edits made while disconnected also merge
      socket.emit('yjs-update', { roomId, update: Y.encodeStateAsUpdate(ydoc) });
    };

    const onRemoteAwareness = (update) => {
      applyAwarenessUpdate(awareness, new Uint8Array(update), 'remote');
    };

    const requestSync = () => {
      socket.emit('yjs-request-sync', roomId);
    };

    ydoc.on('update', onDocUpdate);
    awareness.on('update', onAwarenessUpdate);
    socket.on('yjs-sync', onRemoteSync);
    socket.on('yjs-update', onRemoteUpdate);
    socket.on('yjs-awareness', onRemoteAwareness);
    socket.on('connect', requestSync); // recover after a reconnect

    const { color, light } = colorFor(displayName);
    awareness.setLocalStateField('user', {
      name: displayName,
      color,
      colorLight: light
    });

    requestSync();

    // eslint-disable-next-line react-hooks/set-state-in-effect -- doc/awareness must live in state so consumers re-render when (re)created
    setCollab({
      ydoc,
      awareness,
      ytexts: {
        html: ydoc.getText('html'),
        css: ydoc.getText('css'),
        js: ydoc.getText('js')
      }
    });

    return () => {
      socket.off('yjs-sync', onRemoteSync);
      socket.off('yjs-update', onRemoteUpdate);
      socket.off('yjs-awareness', onRemoteAwareness);
      socket.off('connect', requestSync);
      awareness.destroy(); // broadcasts our cursor removal while still connected
      ydoc.off('update', onDocUpdate);
      ydoc.destroy();
      setCollab(null);
    };
  }, [socket, roomId, displayName]);

  return collab;
};
