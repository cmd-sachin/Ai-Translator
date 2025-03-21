"use client";

import React, { useState, useRef } from "react";
import {
  Mic,
  MicOff,
  Volume2,
  Pause,
  Globe,
  Settings,
  Info,
  ChevronDown,
} from "lucide-react";

export default function TranslatorPage() {
  const [isRecording, setIsRecording] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [inputText, setInputText] = useState("");
  const [translatedText, setTranslatedText] = useState("");
  const [destLanguage, setDestLanguage] = useState("English");
  const [error, setError] = useState("");
  const [audioUrl, setAudioUrl] = useState(null);
  const [languageDropdown, setLanguageDropdown] = useState(false);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const audioElementRef = useRef(null);

  const languages = [
    { code: "en", name: "English" },
    { code: "hi", name: "Hindi" },
    { code: "es", name: "Spanish" },
    { code: "fr", name: "French" },
    { code: "de", name: "German" },
    { code: "zh", name: "Chinese" },
    { code: "ja", name: "Japanese" },
    { code: "ko", name: "Korean" },
    { code: "ta", name: "Tamil" },
  ];
  // Helper function to convert a Blob to base64
  const blobToBase64 = (blob) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result.split(",")[1]);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });

  // Start recording audio
  const startRecording = async () => {
    setError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = handleAudioData;
      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Error accessing microphone:", err);
      setError("Microphone access is required.");
    }
  };

  // Handle audio data when recording stops
  const handleAudioData = async () => {
    const audioBlob = new Blob(audioChunksRef.current, { type: "audio/wav" });
    try {
      const audioBase64 = await blobToBase64(audioBlob);
      postAudio(audioBase64);
    } catch (err) {
      console.error("Error converting audio:", err);
      setError("Error processing audio.");
      setIsTranslating(false);
    }
  };

  // Post base64 audio to the transcription backend route
  const postAudio = async (audioBase64) => {
    setIsTranslating(true);
    setError("");
    try {
      const response = await fetch("/api/transcription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ audioFileBase64: audioBase64, destLanguage }),
      });

      if (!response.ok) {
        throw new Error("Transcription failed.");
      }

      const data = await response.json();
      setInputText(data.inputText || "Audio received.");
      const transcript = data.destinationTranscript;
      setTranslatedText(transcript);

      if (transcript) {
        await playVoiceResponse(transcript);
      }
    } catch (err) {
      console.error(err);
      setError("Error during transcription.");
    } finally {
      setIsTranslating(false);
    }
  };

  // Fixed audio playback implementation
  const playVoiceResponse = async (text) => {
    if (!text) return;

    setIsPlaying(true);
    setError("");

    try {
      // Clean up previous audio URL if it exists
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }

      const response = await fetch("/api/voice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript: text }),
      });

      if (!response.ok) {
        throw new Error("Voice synthesis failed.");
      }

      // Get the audio blob from the response
      const audioBlob = await response.blob();

      if (audioBlob.size === 0 || !audioBlob.type.includes("audio")) {
        throw new Error("Received empty or invalid audio blob");
      }

      // Create an object URL from the blob
      const url = URL.createObjectURL(audioBlob);
      setAudioUrl(url);

      // Use a simple approach with a new Audio object
      const audio = new Audio(url);

      audio.onended = () => {
        setIsPlaying(false);
      };

      audio.onerror = (e) => {
        console.error("Audio playback error:", e);
        setError("Audio playback failed");
        setIsPlaying(false);
      };

      // Play the audio
      await audio.play();
    } catch (err) {
      console.error("Error playing audio:", err);
      setError(
        "Error during voice playback: " + (err.message || "Unknown error")
      );
      setIsPlaying(false);
    }
  };

  // Stop audio playback
  const stopAudioPlayback = () => {
    setIsPlaying(false);
    if (audioElementRef.current) {
      audioElementRef.current.pause();
    }
  };

  // Stop recording audio
  const stopRecording = () => {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== "inactive"
    ) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      mediaRecorderRef.current.stream
        .getTracks()
        .forEach((track) => track.stop());
    }
  };

  // Handle language selection
  const selectLanguage = (lang) => {
    setDestLanguage(lang);
    setLanguageDropdown(false);
  };

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Modern Navbar */}
      <nav className="bg-white border-b border-blue-100 shadow-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Globe className="h-8 w-8 text-blue-600 mr-2" />
              <h1 className="text-blue-900 text-xl font-bold">
                VoiceTranslate AI
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <button className="text-slate-600 hover:text-blue-700 px-3 py-2 rounded-md text-sm font-medium flex items-center">
                <Info className="h-4 w-4 mr-1" />
                <span className="hidden sm:inline">About</span>
              </button>
              <button className="text-slate-600 hover:text-blue-700 px-3 py-2 rounded-md text-sm font-medium flex items-center">
                <Settings className="h-4 w-4 mr-1" />
                <span className="hidden sm:inline">Settings</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-grow container mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Panel: Input Card */}
          <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-blue-100 transition-all hover:shadow-xl">
            <div className="bg-gradient-to-r from-blue-600 to-blue-500 px-6 py-4">
              <h2 className="text-white text-lg font-semibold">Speech Input</h2>
            </div>

            <div className="p-6">
              <div className="flex flex-col space-y-5">
                {/* Language Selector Dropdown */}
                <div className="relative">
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Target Language:
                  </label>
                  <div className="relative">
                    <button
                      onClick={() => setLanguageDropdown(!languageDropdown)}
                      className="w-full flex items-center justify-between bg-white border border-slate-300 rounded-md px-3 py-2 text-left focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <span>
                        {languages.find((l) => l.code === destLanguage)?.name ||
                          destLanguage}
                      </span>
                      <ChevronDown className="h-4 w-4 text-slate-500" />
                    </button>

                    {languageDropdown && (
                      <div className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 overflow-auto border border-slate-200">
                        {languages.map((lang) => (
                          <button
                            key={lang.code}
                            className={`w-full text-left px-4 py-2 text-sm hover:bg-blue-50 ${
                              destLanguage === lang.name
                                ? "bg-blue-50 text-blue-600"
                                : "text-slate-700"
                            }`}
                            onClick={() => selectLanguage(lang.name)}
                          >
                            {lang.name}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Input Text Area */}
                <div className="min-h-[180px] border border-slate-200 rounded-lg bg-slate-50 p-5 transition-all">
                  {isRecording ? (
                    <div className="flex items-center justify-center h-full">
                      <div className="relative">
                        <div className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center">
                          <Mic className="w-10 h-10 text-blue-600 animate-pulse" />
                        </div>
                        <div className="absolute top-0 left-0 w-full h-full rounded-full border-4 border-blue-500 animate-ping opacity-30"></div>
                      </div>
                    </div>
                  ) : (
                    <div className="h-full flex items-center">
                      <p className="text-slate-700 whitespace-pre-wrap">
                        {inputText ||
                          "Your transcript will appear here after recording."}
                      </p>
                    </div>
                  )}
                </div>

                {/* Recording Controls */}
                <div className="flex justify-center">
                  {isRecording ? (
                    <button
                      onClick={stopRecording}
                      className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-full flex items-center justify-center transition-all shadow-md hover:shadow-lg"
                    >
                      <MicOff className="mr-2 h-5 w-5" />
                      Stop Recording
                    </button>
                  ) : (
                    <button
                      onClick={startRecording}
                      disabled={isTranslating || isPlaying}
                      className={`bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-full flex items-center justify-center transition-all shadow-md hover:shadow-lg ${
                        isTranslating || isPlaying
                          ? "opacity-50 cursor-not-allowed"
                          : ""
                      }`}
                    >
                      <Mic className="mr-2 h-5 w-5" />
                      Start Recording
                    </button>
                  )}
                </div>

                {/* Error Display */}
                {error && (
                  <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
                    <p className="text-red-700 text-sm">{error}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Panel: Output Card */}
          <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-blue-100 transition-all hover:shadow-xl">
            <div className="bg-gradient-to-r from-indigo-600 to-indigo-500 px-6 py-4">
              <h2 className="text-white text-lg font-semibold">
                Translation Output
              </h2>
            </div>

            <div className="p-6">
              <div className="flex flex-col space-y-5">
                {/* Output Text Area */}
                <div className="min-h-[180px] border border-slate-200 rounded-lg bg-slate-50 p-5">
                  {isTranslating ? (
                    <div className="flex flex-col items-center justify-center h-full">
                      <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-3"></div>
                      <p className="text-slate-700 font-medium">
                        Translating...
                      </p>
                    </div>
                  ) : (
                    <div className="h-full flex items-center">
                      <p className="text-slate-700 whitespace-pre-wrap">
                        {translatedText ||
                          "Your translation will appear here, and then be read aloud."}
                      </p>
                    </div>
                  )}
                </div>

                {/* Playback Controls */}
                <div className="flex justify-center">
                  {isPlaying ? (
                    <button
                      onClick={stopAudioPlayback}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-full flex items-center justify-center transition-all shadow-md hover:shadow-lg"
                    >
                      <Pause className="mr-2 h-5 w-5" />
                      Stop Audio
                    </button>
                  ) : (
                    <button
                      onClick={() => playVoiceResponse(translatedText)}
                      disabled={
                        isTranslating ||
                        isRecording ||
                        !translatedText ||
                        isPlaying
                      }
                      className={`bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-full flex items-center justify-center transition-all shadow-md hover:shadow-lg ${
                        isTranslating ||
                        isRecording ||
                        !translatedText ||
                        isPlaying
                          ? "opacity-50 cursor-not-allowed"
                          : ""
                      }`}
                    >
                      <Volume2 className="mr-2 h-5 w-5" />
                      Play Translation
                    </button>
                  )}
                </div>

                {/* Simple Audio Element (hidden but functional) */}
                {audioUrl && (
                  <div className="mt-4">
                    <audio
                      ref={audioElementRef}
                      controls
                      src={audioUrl}
                      className="w-full"
                      onEnded={() => setIsPlaying(false)}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="mt-12 bg-white rounded-xl shadow-md p-6 border border-blue-100">
          <h2 className="text-xl font-bold text-blue-900 mb-4">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex flex-col items-center p-4 bg-blue-50 rounded-lg">
              <div className="bg-blue-100 p-3 rounded-full mb-3">
                <Mic className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="font-medium text-blue-900 mb-2">
                1. Record Your Voice
              </h3>
              <p className="text-sm text-center text-slate-600">
                Speak clearly into your microphone and we&apos;ll capture your
                message.
              </p>
            </div>

            <div className="flex flex-col items-center p-4 bg-indigo-50 rounded-lg">
              <div className="bg-indigo-100 p-3 rounded-full mb-3">
                <Globe className="h-6 w-6 text-indigo-600" />
              </div>
              <h3 className="font-medium text-indigo-900 mb-2">
                2. AI Translation
              </h3>
              <p className="text-sm text-center text-slate-600">
                Our AI instantly translates your speech to your chosen language.
              </p>
            </div>

            <div className="flex flex-col items-center p-4 bg-purple-50 rounded-lg">
              <div className="bg-purple-100 p-3 rounded-full mb-3">
                <Volume2 className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="font-medium text-purple-900 mb-2">
                3. Natural Playback
              </h3>
              <p className="text-sm text-center text-slate-600">
                Hear your translation in a natural-sounding voice with proper
                accent.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Modern Footer */}
      <footer className="bg-white border-t border-blue-100 py-8 px-4">
        <div className="container mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
              <div className="flex items-center justify-center md:justify-start">
                <Globe className="h-5 w-5 text-blue-600 mr-2" />
                <span className="text-blue-900 font-semibold">
                  VoiceTranslate AI
                </span>
              </div>
              <p className="text-slate-500 text-sm mt-1">
                ©️ 2025 All rights reserved.
              </p>
            </div>

            <div className="flex space-x-6">
              <a
                href="#"
                className="text-slate-500 hover:text-blue-600 text-sm"
              >
                Privacy Policy
              </a>
              <a
                href="#"
                className="text-slate-500 hover:text-blue-600 text-sm"
              >
                Terms of Service
              </a>
              <a
                href="#"
                className="text-slate-500 hover:text-blue-600 text-sm"
              >
                Contact Us
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
