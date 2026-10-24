import { afterEach, describe, expect, it, vi } from "vitest";
import { UPLOAD_SLOW_MS, UPLOAD_TIMEOUT_MS, watchUpload } from "./upload-deadline";
afterEach(() => vi.useRealTimers());
describe("long-running upload lifecycle", () => {
    it("keeps waiting past the previous 90-second cutoff and explains the delay", () => {
        vi.useFakeTimers();
        const controller = new AbortController();
        const onSlow = vi.fn();
        const dispose = watchUpload(controller, onSlow);
        vi.advanceTimersByTime(UPLOAD_SLOW_MS - 1);
        expect(onSlow).not.toHaveBeenCalled();
        vi.advanceTimersByTime(95000 - UPLOAD_SLOW_MS + 1);
        expect(onSlow).toHaveBeenCalledOnce();
        expect(controller.signal.aborted).toBe(false);
        dispose();
    });
    it("still bounds stalled uploads to five minutes", () => {
        vi.useFakeTimers();
        const controller = new AbortController();
        watchUpload(controller, vi.fn());
        vi.advanceTimersByTime(UPLOAD_TIMEOUT_MS - 1);
        expect(controller.signal.aborted).toBe(false);
        vi.advanceTimersByTime(1);
        expect(controller.signal.aborted).toBe(true);
        expect(controller.signal.reason).toBe("timeout");
        expect(vi.getTimerCount()).toBe(0);
    });
    it("cleans up after a successful request without a late timeout or status update", () => {
        vi.useFakeTimers();
        const controller = new AbortController();
        const onSlow = vi.fn();
        const dispose = watchUpload(controller, onSlow);
        dispose();
        vi.advanceTimersByTime(UPLOAD_TIMEOUT_MS);
        expect(controller.signal.aborted).toBe(false);
        expect(onSlow).not.toHaveBeenCalled();
    });
    it("cancels timers when the user stops waiting, resets, or leaves the page", () => {
        vi.useFakeTimers();
        const controller = new AbortController();
        const onSlow = vi.fn();
        watchUpload(controller, onSlow);
        controller.abort();
        expect(vi.getTimerCount()).toBe(0);
        vi.advanceTimersByTime(UPLOAD_TIMEOUT_MS);
        expect(onSlow).not.toHaveBeenCalled();
        expect(controller.signal.reason).not.toBe("timeout");
    });
});
