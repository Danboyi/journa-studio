"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// Web Speech API — not in TypeScript's built-in DOM types
type SpeechRecognitionInstance = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
};

type SpeechRecognitionEvent = {
  resultIndex: number;
  results: SpeechRecognitionResultList;
};

type SpeechRecognitionErrorEvent = {
  error: string;
};

type SpeechRecognitionResultList = {
  length: number;
  [index: number]: SpeechRecognitionResult;
};

type SpeechRecognitionResult = {
  isFinal: boolean;
  [index: number]: { transcript: string };
};

type SpeechRecognitionConstructor = new () => SpeechRecognitionInstance;

type VoiceInputState = "idle" | "listening" | "unsupported";

type UseVoiceInputOptions = {
  onTranscript: (text: string) => void;
  lang?: string;
};

export function useVoiceInput({ onTranscript, lang = "en-US" }: UseVoiceInputOptions) {
  const [state, setState] = useState<VoiceInputState>("idle");
  const [interim, setInterim] = useState("");
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);

  useEffect(() => {
    const w = window as typeof window & {
      SpeechRecognition?: SpeechRecognitionConstructor;
      webkitSpeechRecognition?: SpeechRecognitionConstructor;
    };
    const SpeechRecognition = w.SpeechRecognition ?? w.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setState("unsupported");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = lang;

    recognition.onresult = (event) => {
      let interimTranscript = "";
      let finalTranscript = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalTranscript += result[0].transcript;
        } else {
          interimTranscript += result[0].transcript;
        }
      }

      setInterim(interimTranscript);

      if (finalTranscript) {
        onTranscript(finalTranscript);
        setInterim("");
      }
    };

    recognition.onerror = (event) => {
      if (event.error === "not-allowed" || event.error === "no-speech") {
        setState("idle");
        setInterim("");
      }
    };

    recognition.onend = () => {
      setState((prev) => (prev === "listening" ? "idle" : prev));
      setInterim("");
    };

    recognitionRef.current = recognition;

    return () => {
      recognition.abort();
    };
  }, [lang, onTranscript]);

  const start = useCallback(() => {
    if (!recognitionRef.current || state !== "idle") return;
    recognitionRef.current.start();
    setState("listening");
  }, [state]);

  const stop = useCallback(() => {
    if (!recognitionRef.current || state !== "listening") return;
    recognitionRef.current.stop();
    setState("idle");
    setInterim("");
  }, [state]);

  const toggle = useCallback(() => {
    if (state === "listening") {
      stop();
    } else {
      start();
    }
  }, [state, start, stop]);

  return { state, interim, toggle };
}
