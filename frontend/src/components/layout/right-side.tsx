import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import AppPreview from "./preview-app";

function RightSideView() {
  return (
    <Tabs defaultValue="preview" className="">
      <div className="flex w-full justify-between border-b-2 p-2  border-[#18181a]">
        <TabsList className="grid  grid-cols-2 w-[150px] bg-[#272729]">
          <TabsTrigger
            value="code"
            className="text-white data-[state=active]:bg-black data-[state=active]:text-white"
          >
            Code
          </TabsTrigger>
          <TabsTrigger
            value="preview"
            className="text-white data-[state=active]:bg-black data-[state=active]:text-white"
          >
            Preview
          </TabsTrigger>
        </TabsList>

        <div className="flex justify-center items-center gap-x-2">
          <div className="text-white flex gap-x-2  justify-center items-center">
            <div className="h-2 w-2 rounded-full bg-[#5db687] " />
            <p>Live</p>
          </div>
          <TabsList className="grid  grid-cols-4 gap-x-2 w-[200px] bg-[#272729]">
            <TabsTrigger
              value="refresh"
              className="text-white data-[state=active]:bg-black data-[state=active]:text-white"
            >
              <img
                src="/test/refresh.png"
                className="filter invert brightness-200 h-4 w-4"
                alt="image-icon"
              />
            </TabsTrigger>
            <TabsTrigger
              value="apple"
              className="text-white data-[state=active]:bg-black data-[state=active]:text-white"
            >
              <img
                src="/test/apple.png"
                className="filter invert brightness-200 h-4 w-4"
                alt="image-icon"
              />
            </TabsTrigger>
            <TabsTrigger
              value="android"
              className="text-white data-[state=active]:bg-black data-[state=active]:text-white"
            >
              <img
                src="/test/android.png"
                className="filter invert brightness-200 h-4 w-4"
                alt="image-icon"
              />
            </TabsTrigger>
            <TabsTrigger
              value="browser"
              className="text-white data-[state=active]:bg-black data-[state=active]:text-white"
            >
              <img
                src="/test/browser.png"
                className="filter invert brightness-200 h-4 w-4"
                alt="image-icon"
              />
            </TabsTrigger>
          </TabsList>
        </div>
      </div>
      <TabsContent value="code">
        <p>Code part</p>
      </TabsContent>
      <TabsContent value="preview">
        <AppPreview />
      </TabsContent>
    </Tabs>
  );
}

export default RightSideView;
