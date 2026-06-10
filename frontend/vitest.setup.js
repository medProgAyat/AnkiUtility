// vitest.setup.js
// Provide a simple in-memory localStorage/sessionStorage for jsdom test environment
(function(){
  if (typeof window === 'undefined') return

  function makeStorage(){
    let store = Object.create(null)
    return {
      getItem(key){ return Object.prototype.hasOwnProperty.call(store, key) ? store[key] : null },
      setItem(key, val){ store[key] = String(val) },
      removeItem(key){ delete store[key] },
      clear(){ store = Object.create(null) },
      key(i){ const keys = Object.keys(store); return keys[i] || null },
      get length(){ return Object.keys(store).length }
    }
  }

  try{
    if (!('localStorage' in window) || typeof window.localStorage === 'undefined' || window.localStorage === null) {
      Object.defineProperty(window, 'localStorage', { value: makeStorage(), configurable: true, writable: true })
    }
  }catch(e){ /* ignore in restricted env */ }

  try{
    if (!('sessionStorage' in window) || typeof window.sessionStorage === 'undefined' || window.sessionStorage === null) {
      Object.defineProperty(window, 'sessionStorage', { value: makeStorage(), configurable: true, writable: true })
    }
  }catch(e){ /* ignore */ }

  // Ensure CustomEvent exists (jsdom provides it, but guard just in case)
  if (typeof window.CustomEvent === 'undefined') {
    function CustomEvent(event, params){ params = params || { bubbles: false, cancelable: false, detail: null };
      var evt = document.createEvent('CustomEvent');
      evt.initCustomEvent(event, params.bubbles, params.cancelable, params.detail);
      return evt;
    }
    window.CustomEvent = CustomEvent
  }
})()
