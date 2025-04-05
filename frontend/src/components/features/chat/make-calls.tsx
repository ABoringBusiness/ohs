import { useEffect, useRef, useState } from "react";
import { BsPhoneFill } from "react-icons/bs";
import { IoMdClose } from "react-icons/io";

export function MakeCalls() {
  const [messages, setMessages] = useState<
    Array<{ role: string; content: string }>
  >([]);
  const [isCallActive, setIsCallActive] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const popupRef = useRef<HTMLDivElement>(null);

  // Close popup when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        popupRef.current &&
        !popupRef.current.contains(event.target as Node)
      ) {
        setShowPopup(false);
        setIsCallActive(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleMakeCall = () => {
    setIsCallActive(true);
    setShowPopup(true); // Show popup when call starts
    setMessages([]); // Clear previous messages

    const call = async () => {
      return;
      try {
        // Add loading message
        setMessages([{ role: "system", content: "Initiating call..." }]);

        const response = await fetch("https://api.vapi.ai/call", {
          method: "POST",
          headers: {
            Authorization: `Bearer afc7bbdc-3477-43e7-b190-ff9a0396780a`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            assistantId: "ba23b8a6-1f5e-4b7a-8886-3e64a2f5a4e9",
            customer: {
              number: "+19173009305",
            },
            phoneNumberId: "74db6dd0-c97f-4518-98cf-52da201004fd",
          }),
        }).then((res) => {
          if (!res.ok) {
            throw new Error(`API request failed with status ${res.status}`);
          }
          return res.json();
        });

        console.log("Call API response:", response);
      } catch (error: any) {
        console.error("Error making call:", error);
        setMessages((prev) => [
          ...prev,
          {
            role: "system",
            content: `Failed to make call: ${error.toString()}`,
          },
        ]);
        setIsCallActive(false);
      }
    };
    call();
  };

  return (
    <div className="relative">
      {/* Call button */}
      <button
        onClick={handleMakeCall}
        type="submit"
        disabled={isCallActive}
        className={`flex items-center justify-center rounded-full`}
      >
        <BsPhoneFill className="size-5 dark:text-black text-white" />
      </button>

      {/* Popup Modal */}
      {showPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div
            ref={popupRef}
            className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg w-11/12 max-w-lg max-h-[80vh] flex flex-col"
          >
            {/* Modal header */}
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Vapi Call Conversation</h2>
              <button
                onClick={() => {
                  setShowPopup(false);
                  setIsCallActive(false);
                }}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <IoMdClose size={24} />
              </button>
            </div>

            <div className="mb-4">
              <span
                className={`inline-block h-3 w-3 rounded-full mr-2 ${isCallActive ? "bg-green-500" : "bg-red-500"}`}
              ></span>
              <span className="text-sm">
                {isCallActive ? "Call in progress" : "Call ended"}
              </span>
            </div>

            {/* Conversation display */}
            <div className="flex-1 overflow-y-auto mb-4 border rounded-lg p-4">
              {messages.length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  No messages yet. Waiting for conversation...
                </p>
              ) : (
                <div className="space-y-2">
                  {messages.map((msg, index) => (
                    <div
                      key={index}
                      className={`p-2 rounded-lg ${
                        msg.role === "user"
                          ? "bg-blue-100 dark:bg-blue-900 ml-auto max-w-[80%]"
                          : msg.role === "assistant"
                            ? "bg-gray-100 dark:bg-gray-700 max-w-[80%]"
                            : "bg-yellow-100 dark:bg-yellow-800 text-center text-sm italic w-full"
                      }`}
                    >
                      <p className="text-xs font-bold">
                        {msg.role.toUpperCase()}
                      </p>
                      <p>{msg.content}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Actions footer */}
            <div className="flex justify-between">
              <button
                onClick={() => {
                  setShowPopup(false);
                  setIsCallActive(false);
                }}
                className="bg-gray-300 hover:bg-gray-400 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-white py-2 px-4 rounded"
              >
                Close
              </button>

              <button
                onClick={() => {
                  setShowPopup(false);
                  setIsCallActive(false);
                }}
                className="bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded"
              >
                Proceed
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
