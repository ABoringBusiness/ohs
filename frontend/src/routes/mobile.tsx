import React, { useState } from "react";
import QR from "#/icons/qr.svg?react";

function SnackPreview({ snackId = "" }) {
  console.log(snackId);
  const [platform, setPlatform] = useState("ios");

  return (
    <div className="flex w-full h-full justify-center items-center max-w-7xl mx-auto p-5 gap-10 bg-black text-white">
      <div className="flex-1 flex justify-center">
        <div className="w-[266px] h-[564px] max-w-[300px] max-h-[652px] bg-white rounded-[40px] overflow-hidden flex flex-col text-black shadow-lg">
          <iframe
            src="https://homefinder-j3uuk.rork.app/"
            title="Snack Preview"
            className="w-full h-full border-0"
            allow="accelerometer; ambient-light-sensor; camera; encrypted-media; geolocation; gyroscope; hid; microphone; midi; payment; usb; vr; xr-spatial-tracking"
            sandbox="allow-forms allow-modals allow-popups allow-presentation allow-same-origin allow-scripts"
            style={{ zoom: 0.8 }}
          />
        </div>
      </div>

      <div className="flex-1 p-5">
        <h2 className="text-2xl font-bold">Test on your phone</h2>

        <div className="flex mt-5 mb-5 bg-gray-800 rounded-lg overflow-hidden w-fit">
          <button
            type="button"
            className={`px-5 py-2.5 border-none ${platform === "ios" ? "bg-gray-700" : "bg-transparent"} text-white cursor-pointer`}
            onClick={() => setPlatform("ios")}
          >
            iOS
          </button>
          <button
            type="button"
            className={`px-5 py-2.5 border-none ${platform === "android" ? "bg-gray-700" : "bg-transparent"} text-white cursor-pointer`}
            onClick={() => setPlatform("android")}
          >
            Android
          </button>
        </div>

        <div className="bg-white rounded-lg w-fit my-5">
          <QR width={150} height={150} />
        </div>

        <div className="mt-5">
          <h3 className="text-xl font-medium">Install Expo Go app</h3>
          <p className="text-gray-400 my-4">
            <strong>Important:</strong> browser preview (left) lacks native
            functions &amp; may look different.
          </p>

          <p>To test on your device:</p>
          <ol className="pl-5">
            <li className="my-2.5">1. Scan QR code with your phone camera</li>
            <li className="my-2.5">2. Install Expo Go from the App Store</li>
            <li className="my-2.5">3. Click &quot;Done&quot;</li>
          </ol>

          <button
            type="button"
            className="bg-gray-700 text-white border-none py-3 px-5 rounded-lg mt-5 cursor-pointer"
          >
            Done, I have Expo Go app
          </button>
        </div>
      </div>
    </div>
  );
}

export default SnackPreview;
