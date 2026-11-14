import { createHash } from 'node:crypto';
const digest = text => createHash('sha256').update(text.trim()).digest('hex');

// Correlation evidence, not a Tupperbox-signed ownership attestation.
// Store hashes and IDs only, never roleplay text.
export class ProxyTracker {
  constructor(brackets = [], windowMs = 15000) {
    this.brackets = brackets;
    this.windowMs = windowMs;
    this.originals = new Map();
    this.proxies = new Map();
  }
  original({ id, playerId, channelId, content, time }) {
    if (this.originals.has(id)) return;
    const hashes = new Set([digest(content)]); // Autoproxy leaves content unchanged.
    for (const b of this.brackets.filter(b => b.playerId === playerId)) {
      if (content.startsWith(b.prefix) && (!b.suffix || content.endsWith(b.suffix))) {
        hashes.add(digest(content.slice(b.prefix.length, b.suffix ? -b.suffix.length : undefined)));
      }
    }
    this.originals.set(id, { id, playerId, channelId, time, hashes, deleted: false, claimed: false });
  }
  deleted(id) { const original = this.originals.get(id); if (original) original.deleted = true; }
  addBrackets(id, content, brackets) {
    const original = this.originals.get(id);
    if (!original) return;
    for (const b of brackets) {
      if (content.startsWith(b.prefix) && (!b.suffix || content.endsWith(b.suffix))) {
        original.hashes.add(digest(content.slice(b.prefix.length, b.suffix ? -b.suffix.length : undefined)));
      }
    }
  }
  proxy({ id, channelId, content, time, trusted }) {
    if (!this.proxies.has(id)) this.proxies.set(id, { id, channelId, hash: digest(content), time, trusted, resolved: false });
  }
  resolve(id) {
    const p = this.proxies.get(id);
    if (!p || p.resolved) return { status: 'duplicate' };
    p.resolved = true;
    if (!p.trusted) return { status: 'untrusted-webhook' };
    const candidates = [...this.originals.values()].filter(o => o.channelId === p.channelId && o.time <= p.time && p.time - o.time <= this.windowMs && o.hashes.has(p.hash));
    if (candidates.length !== 1) return { status: candidates.length ? 'ambiguous' : 'original-missing' };
    const o = candidates[0];
    if (!o.deleted) return { status: 'deletion-missing' };
    if (o.claimed) return { status: 'already-matched' };
    o.claimed = true;
    return { status: 'matched', playerId: o.playerId, originalId: o.id, proxyId: p.id };
  }
  expire(now) {
    for (const [id, o] of this.originals) if (now - o.time > 120000) this.originals.delete(id);
    for (const [id, p] of this.proxies) if (now - p.time > 120000) this.proxies.delete(id);
  }
}

// Slash-command replies from other apps are webhook messages owned by that
// application, not Tupper posts.
export const isAppReply = message => Boolean(message.webhookId && (message.interactionMetadata || message.interaction || (message.applicationId && message.webhookId === message.applicationId)));
