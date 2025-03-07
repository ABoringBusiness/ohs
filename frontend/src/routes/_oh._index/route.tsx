import React from "react";
import { HeroHeading } from "#/components/shared/hero-heading";
import { TaskForm } from "#/components/shared/task-form";

function Home() {
  const formRef = React.useRef<HTMLFormElement>(null);

  return (
    <div className="bg-[#09090b] h-full rounded-xl flex flex-col items-center justify-center relative overflow-y-auto px-2">
      <HeroHeading />
      <div className="flex flex-col gap-8 w-full md:w-[600px] items-center">
        <div className="flex flex-col gap-2 w-full">
          <TaskForm ref={formRef} />
        </div>
      </div>
    </div>
  );
}

export default Home;
