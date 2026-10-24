// Long report extraction can legitimately outlast a short browser timeout.
export const UPLOAD_TIMEOUT_MS = 5 * 60 * 1000;
export const UPLOAD_SLOW_MS = 30 * 1000;
export function watchUpload(controller: AbortController, onSlow: () => void): () => void {
    const slowTimer = setTimeout(() => {
        if (!controller.signal.aborted)
            onSlow();
    }, UPLOAD_SLOW_MS);
    const deadline = setTimeout(() => controller.abort("timeout"), UPLOAD_TIMEOUT_MS);
    function dispose() {
        clearTimeout(slowTimer);
        clearTimeout(deadline);
        controller.signal.removeEventListener("abort", dispose);
    }
    controller.signal.addEventListener("abort", dispose, { once: true });
    if (controller.signal.aborted)
        dispose();
    return dispose;
}
