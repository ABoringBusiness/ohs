import React, { JSX, useEffect, useRef, useState } from "react";

import { twMerge } from "tailwind-merge";

export enum Orientation {
  HORIZONTAL = "horizontal",
  VERTICAL = "vertical",
}

type ResizablePanelProps = {
  firstChild: React.ReactNode;
  firstClassName: string | undefined;
  secondChild: React.ReactNode;
  secondClassName: string | undefined;
  orientation: Orientation;
  initialSize: number;
};

export function ResizablePanel({
  firstChild,
  firstClassName,
  secondChild,
  secondClassName,
  orientation,
  initialSize,
}: ResizablePanelProps): JSX.Element {
  const [firstSize, setFirstSize] = useState<number>(initialSize);
  const [dividerPosition, setDividerPosition] = useState<number | null>(null);
  const firstRef = useRef<HTMLDivElement>(null);
  const secondRef = useRef<HTMLDivElement>(null);
  const isHorizontal = orientation === Orientation.HORIZONTAL;

  useEffect(() => {
    if (dividerPosition == null || !firstRef.current) {
      return undefined;
    }
    const getFirstSizeFromEvent = (e: MouseEvent) => {
      const position = isHorizontal ? e.clientX : e.clientY;
      return firstSize + position - dividerPosition;
    };
    const onMouseMove = (e: MouseEvent) => {
      e.preventDefault();
      const newFirstSize = `${getFirstSizeFromEvent(e)}px`;
      const { current } = firstRef;
      if (current) {
        if (isHorizontal) {
          current.style.width = newFirstSize;
          current.style.minWidth = newFirstSize;
        } else {
          current.style.height = newFirstSize;
          current.style.minHeight = newFirstSize;
        }
      }
    };
    const onMouseUp = (e: MouseEvent) => {
      e.preventDefault();
      if (firstRef.current) {
        firstRef.current.style.transition = "";
      }
      if (secondRef.current) {
        secondRef.current.style.transition = "";
      }
      setFirstSize(getFirstSizeFromEvent(e));
      setDividerPosition(null);
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
    };
    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
    return () => {
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
    };
  }, [dividerPosition, firstSize, orientation]);

  return (
    <div className="flex flex-col w-full ">
      <div className="flex justify-between items-center  border-b-2 border-[#18181a]">
        <div className="text-white px-3">
          <strong>HomeStay</strong>
        </div>
        <div className="flex gap-x-2 p-2  ">
          <button
            type="button"
            className="bg-[#272729] p-2 h-[35px]  flex text-center items-center rounded-[10px] text-white"
          >
            {" "}
            Upgrade
          </button>
          <button
            type="button"
            className="bg-[#272729] p-2 h-[35px] flex text-center items-center rounded-[10px] text-white"
          >
            Code
          </button>
          <button
            type="button"
            className="bg-white p-2 h-[35px] flex text-center items-center rounded-[10px]"
          >
            Share
          </button>
        </div>
      </div>
      <div className="grid grid-cols-2  ">
        <div
          ref={firstRef}
          className={twMerge(
            firstClassName,
            "transition-all ease-soft-spring  ",
          )}
        >
          {firstChild}
        </div>

        <div
          ref={secondRef}
          className={twMerge(
            secondClassName,
            "transition-all ease-soft-spring border-l-2 border-[#18181a]",
          )}
        >
          {secondChild}
        </div>
      </div>
    </div>
  );
}
