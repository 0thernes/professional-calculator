// @ts-check
/**
 * `CustomEvent` compatibility shim.
 *
 * `CustomEvent` only became a Node.js global in v19. The `EventTarget`-based
 * modules (`state.js`, `history.js`) are exercised under Jest's `node`
 * environment and may be imported by any non-DOM host, so on Node 18 a bare
 * `new CustomEvent(...)` throws `ReferenceError`. `Event` and `EventTarget`
 * have been Node globals since v15, so we fall back to a minimal subclass that
 * carries `detail` — behaviourally identical for our dispatch needs.
 *
 * @module events
 */

/** @type {{ new (type: string, params?: { detail?: any }): Event & { detail: any } }} */
export const CEvent =
    typeof CustomEvent !== 'undefined'
        ? /** @type {any} */ (CustomEvent)
        : /** @type {any} */ (
              class CustomEventShim extends Event {
                  /**
                   * @param {string} type
                   * @param {{ detail?: any }} [params]
                   */
                  constructor(type, params = {}) {
                      super(type);
                      this.detail = params.detail ?? null;
                  }
              }
          );
