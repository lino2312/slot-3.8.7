(function () {
  const g: any = globalThis as any;
  if (!g.TextEncoder) return;
  const proto: any = g.TextEncoder.prototype;
  if (typeof proto.encodeInto !== 'function') {
    proto.encodeInto = function (src: string, dest: Uint8Array) {
      const bytes = this.encode(src);
      const written = Math.min(bytes.length, dest.length);
      dest.set(bytes.subarray(0, written), 0);
      return { read: src.length, written };
    };
    console.log('[Polyfill] TextEncoder.encodeInto installed');
  }
})();