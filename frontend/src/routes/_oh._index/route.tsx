import { GitHubRepositoriesSuggestionBox } from "#/components/features/github/github-repositories-suggestion-box";
import HeaderBar from "#/components/layout/header-bar";
import HomeBackground from "#/components/shared/background";
import { TaskForm } from "#/components/shared/task-form";
import { useConfig } from "#/hooks/query/use-config";
import { useGitHubUser } from "#/hooks/query/use-github-user";
import { useGitHubAuthUrl } from "#/hooks/use-github-auth-url";
import { setImportedProjectZip } from "#/state/initial-query-slice";
import { convertZipToBase64 } from "#/utils/convert-zip-to-base64";
import posthog from "posthog-js";
import React from "react";
import { useDispatch } from "react-redux";
import { ImportProjectSuggestionBox } from "../../components/features/suggestions/import-project-suggestion-box";

function Home() {
  const dispatch = useDispatch();
  const formRef = React.useRef<HTMLFormElement>(null);

  const { data: config } = useConfig();
  const { data: user } = useGitHubUser();

  const gitHubAuthUrl = useGitHubAuthUrl({
    appMode: config?.APP_MODE || null,
    gitHubClientId: config?.GITHUB_CLIENT_ID || null,
  });

  return (
    <>
      <div>
        <HomeBackground />
      </div>
      <div className="bg-base-secondary dark:bg-base-secondary-dark h-full rounded-xl flex flex-col items-center justify-center relative overflow-y-auto px-2 opacity-90">
        <header className="w-full border-b border-b-tertiary dark:border-b-tertiary-dark flex items-center gap-2 justify-self-start absolute top-0 justify-between">
          <HeaderBar />
        </header>
        <div className="text-[38px] leading-[32px] -tracking-[0.02em] font-bold mb-[22px]">
          Prompting is all you need
        </div>
        {/* <HeroHeading /> */}
        <div className="flex flex-col gap-8 w-full md:w-[700px] items-center">
          <div className="flex flex-col gap-2 w-full">
            <TaskForm ref={formRef} />
          </div>

          <div className="flex gap-4 w-full flex-col">
            <GitHubRepositoriesSuggestionBox
              handleSubmit={() => formRef.current?.requestSubmit()}
              gitHubAuthUrl={gitHubAuthUrl}
              user={user || null}
            />
            <ImportProjectSuggestionBox
              onChange={async (event) => {
                if (event.target.files) {
                  const zip = event.target.files[0];
                  dispatch(
                    setImportedProjectZip(await convertZipToBase64(zip)),
                  );
                  posthog.capture("zip_file_uploaded");
                  formRef.current?.requestSubmit();
                } else {
                  // TODO: handle error
                }
              }}
            />
          </div>
        </div>
      </div>
    </>
  );
}

export default Home;
