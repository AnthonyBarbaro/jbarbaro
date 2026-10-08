"use client";

import { useEffect, useId, useRef, useState, type ReactElement } from "react";
import { createPortal } from "react-dom";

import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

type ClearBagButtonProps = {
  disabled: boolean;
  pending: boolean;
  onConfirm: () => Promise<void>;
  focusTargetId?: string;
  className?: string;
};

export function ClearBagButton({
  disabled,
  pending,
  onConfirm,
  focusTargetId,
  className,
}: ClearBagButtonProps): ReactElement {
  const [isConfirming, setIsConfirming] = useState(false);
  const dialogRef = useRef<HTMLDialogElement | null>(null);
  const cancelRef = useRef<HTMLButtonElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const confirmingRef = useRef(false);
  const requestPendingRef = useRef(false);
  const titleId = useId();
  const descriptionId = useId();

  function restoreFocus(): void {
    const trigger = triggerRef.current;
    const target =
      trigger?.isConnected && !trigger.disabled
        ? trigger
        : focusTargetId
          ? document.getElementById(focusTargetId)
          : document.querySelector<HTMLElement>("#main-content h1");
    if (target) {
      target.tabIndex = target === trigger ? 0 : -1;
      target.focus({ preventScroll: true });
    }
  }

  function closeConfirmation(): void {
    confirmingRef.current = false;
    setIsConfirming(false);
    window.requestAnimationFrame(restoreFocus);
  }

  useEffect(() => {
    if (isConfirming) {
      dialogRef.current?.showModal();
      cancelRef.current?.focus();
    }
  }, [isConfirming]);

  useEffect(() => {
    if (isConfirming && pending) {
      dialogRef.current?.focus({ preventScroll: true });
    }
  }, [isConfirming, pending]);

  useEffect(() => {
    return () => {
      if (confirmingRef.current) {
        const target = focusTargetId
          ? document.getElementById(focusTargetId)
          : document.querySelector<HTMLElement>("#main-content h1");
        if (target) {
          target.tabIndex = -1;
          target.focus({ preventScroll: true });
        }
      }
    };
  }, [focusTargetId]);

  async function confirmClear(): Promise<void> {
    if (requestPendingRef.current || disabled) {
      return;
    }
    requestPendingRef.current = true;
    try {
      await onConfirm();
    } finally {
      requestPendingRef.current = false;
      closeConfirmation();
    }
  }

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        onClick={() => {
          confirmingRef.current = true;
          setIsConfirming(true);
        }}
        className={cn(
          "inline-flex min-h-11 items-center rounded-sm px-2 text-xs font-semibold text-deep-teal underline underline-offset-4 transition-colors hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-deep-teal focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60",
          className,
        )}
      >
        {pending ? "Clearing Bag..." : "Clear Bag"}
      </button>
      {isConfirming
        ? createPortal(
            <dialog
              ref={dialogRef}
              role="alertdialog"
              aria-labelledby={titleId}
              aria-describedby={descriptionId}
              aria-busy={pending}
              tabIndex={-1}
              onCancel={(event) => {
                event.preventDefault();
                if (!requestPendingRef.current) {
                  closeConfirmation();
                }
              }}
              onKeyDown={(event) => {
                event.stopPropagation();
                if (event.key !== "Tab") {
                  return;
                }
                const buttons = Array.from(
                  event.currentTarget.querySelectorAll<HTMLButtonElement>("button:not([disabled])"),
                );
                const first = buttons[0];
                const last = buttons.at(-1);
                if (!first || !last) {
                  event.preventDefault();
                  event.currentTarget.focus({ preventScroll: true });
                } else if (event.shiftKey && document.activeElement === first) {
                  event.preventDefault();
                  last.focus();
                } else if (!event.shiftKey && document.activeElement === last) {
                  event.preventDefault();
                  first.focus();
                }
              }}
              className="fixed inset-0 m-auto w-[calc(100%_-_2rem)] max-w-sm rounded-lg border border-ink/10 bg-white p-5 text-ink shadow-[0_24px_70px_-24px_rgba(11,15,20,0.5)] backdrop:bg-ink/60 sm:p-6"
            >
              <h2 id={titleId} className="font-heading text-3xl text-ink">
                Clear your bag?
              </h2>
              <p id={descriptionId} className="mt-3 text-sm leading-6 text-smoke">
                This removes all items and their gift wrap from your bag.
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <button
                  ref={cancelRef}
                  type="button"
                  disabled={pending}
                  onClick={() => {
                    if (!requestPendingRef.current) {
                      closeConfirmation();
                    }
                  }}
                  className="inline-flex min-h-11 items-center justify-center rounded-md border border-ink/18 bg-white px-5 py-2.5 text-xs font-semibold tracking-[0.16em] text-ink uppercase transition-colors hover:border-ink/35 hover:bg-stone/55 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-deep-teal focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Cancel
                </button>
                <Button
                  disabled={pending}
                  onClick={() => void confirmClear()}
                  className="border-sale bg-sale !text-white hover:border-sale hover:bg-sale/90"
                >
                  {pending ? "Clearing Bag..." : "Clear Bag"}
                </Button>
              </div>
            </dialog>,
            document.body,
          )
        : null}
    </>
  );
}
