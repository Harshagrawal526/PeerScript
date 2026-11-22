# Scratchpad & Authenticated Collaboration

**Branch:** `feature/authenticated-collaboration-local-anonymous`

## What we're building

- **Scratchpad** — local-only HTML/CSS/JS editor for everyone (anon + signed-in), persisted via `localStorage`. Not a room.
- **Shared rooms** — require auth to create or join. Existing Yjs/Socket.IO infra.
- **Save to room** — signed-in users can snapshot their Scratchpad into a new owned room. Local copy stays untouched.

---

## Phase 1 — Routes & Navigation

- [ ] Add a `/scratchpad` route (public, no auth required).
- [ ] Add Scratchpad entry point in nav/home, visually separate from room creation.
- [ ] Use an explicit route for Scratchpad — don't infer it from a missing room ID.
- [ ] Handle bad/missing room IDs gracefully with a redirect.

---

## Phase 2 — Local Scratchpad

- [ ] Wire up the existing editor (no collaboration lifecycle) on the Scratchpad route.
- [ ] Persist all three code fields to `localStorage`; restore on page load.
- [ ] Add a clear/reset button with confirmation.
- [ ] No Yjs/socket events, no backend calls, no dashboard entries.

---

## Phase 3 — Auth-Gate Shared Rooms

- [ ] Block unauthenticated users from creating or joining rooms (UI + HTTP + Socket.IO).
- [ ] On anonymous room-link access, redirect to login and return to the room after.
- [ ] Reject unauthenticated socket connections; recheck auth before accepting Yjs writes.
- [ ] Any logged-in user can join a public room.
- [ ] Remove any leftover anonymous room paths.

---

## Phase 4 — Save Scratchpad to Room

- [ ] Add a **Save to new room** button (signed-in users only; anon users get a login prompt).
- [ ] Backend endpoint: create room with current HTML/CSS/JS, return room ID. Reject payloads over **512KB** total.
- [ ] On success, open the new room. Scratchpad `localStorage` stays unchanged.
- [ ] New room shows up in dashboard with normal owner controls.

---

## Phase 5 — Cleanup

- [ ] Update README and any docs that mention anonymous collaboration.
- [ ] Remove stale UI copy about anonymous quick rooms.
