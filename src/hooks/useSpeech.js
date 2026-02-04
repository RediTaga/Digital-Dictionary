import { useEffect, useState, useCallback } from 'react';
/**
 * Hook to manage the Web Speech API for text-to-speech functionality.
 */
export function useSpeech() {
    const [supported, setSupported] = useState(false);
    const [voices, setVoices] = useState([]);
    const [selectedVoice, setSelectedVoice] = useState(null);
    const [rate, setRate] = useState(1);
    const [pitch, setPitch] = useState(1);
    // Load voices when available
    useEffect(() => {
        if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
            setSupported(false);
            return;
        }
        setSupported(true);
        function handleVoicesChanged() {
            const allVoices = window.speechSynthesis.getVoices();
            const opts = allVoices.map((v) => ({ name: v.name, lang: v.lang, voice: v }));
            setVoices(opts);
            // Automatically select the best voice for Albanian (sq) or fallback to the first
            if (!selectedVoice && opts.length > 0) {
                const albanianVoice = opts.find((v) => v.lang && v.lang.toLowerCase().startsWith('sq'));
                if (albanianVoice) {
                    setSelectedVoice(albanianVoice.voice);
                }
                else {
                    setSelectedVoice(opts[0].voice);
                }
            }
        }
        // Some browsers load voices asynchronously
        handleVoicesChanged();
        window.speechSynthesis.onvoiceschanged = handleVoicesChanged;
        return () => {
            window.speechSynthesis.onvoiceschanged = null;
        };
    }, [selectedVoice]);
    const speak = useCallback((text) => {
        if (!supported || !text)
            return;
        // Cancel current speech
        window.speechSynthesis.cancel();
        const utter = new SpeechSynthesisUtterance(text);
        utter.rate = rate;
        utter.pitch = pitch;
        if (selectedVoice) {
            utter.voice = selectedVoice;
        }
        window.speechSynthesis.speak(utter);
    }, [supported, rate, pitch, selectedVoice]);
    const stop = useCallback(() => {
        if (!supported)
            return;
        window.speechSynthesis.cancel();
    }, [supported]);
    return {
        supported,
        voices,
        selectedVoice,
        setSelectedVoice: (v) => setSelectedVoice(v),
        rate,
        setRate,
        pitch,
        setPitch,
        speak,
        stop,
    };
}
