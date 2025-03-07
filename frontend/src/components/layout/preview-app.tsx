function AppPreview() {
  return (
    <div className="grid h-screen grid-cols-2 min-w-max  gap-x-11 justify-center items-center text-white">
      <div className=" w-full flex justify-end">
        <div className="h-[60vh] w-[300px] border-5 border-[#272729]  rounded-[50px] py-2 flex flex-col justify-between items-center">
          <div className="h-[20px] w-[60px] bg-[#272729] rounded-[30px]" />
          <div className="flex flex-col items-center justify-center">
            <div className="h-[20px] w-[20px] rounded-full bg-white" />
            <p className="text-white "> Building...</p>
          </div>
          <div className="h-[10px] w-[60px] bg-[#272729] rounded-[30px]" />
        </div>
      </div>
      <div className="flex flex-col ">
        <div className="flex flex-col">
          <h3>Test on your phone</h3>

          <div className="h-[230px] w-[230px] border-4 border-[#272729] flex justify-center items-center border-dashed rounded-[20px] my-3">
            <div className="h-[20px] w-[20px] rounded-full bg-white" />
          </div>
        </div>
        <div className="flex flex-col max-w-[230px] gap-3">
          <h3>Scan QR code to test</h3>

          <p>
            <strong>Important:</strong> browser preview (left) lacks native
            functions &amp; may look different
          </p>

          <div>
            <p>To test on your device:</p>
            <p>1.Open Camera app</p>
            <p>2.Scan the QR code above</p>
          </div>

          <strong>Don&apos;t have Expo Go app?</strong>
        </div>
      </div>
    </div>
  );
}

export default AppPreview;
