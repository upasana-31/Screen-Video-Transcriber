export interface SampleClip {
  id: string;
  title: string;
  language: "Hindi" | "English" | "Hinglish";
  description: string;
  transcript: string;
  englishTranslation?: string;
  duration: number; // approximate seconds
}

export const SAMPLE_CLIPS: SampleClip[] = [
  {
    id: "hindi-ai",
    title: "AI & Web Tech (Hindi / हिन्दी)",
    language: "Hindi",
    description: "Educational speech on Artificial Intelligence and software coding in Hindi.",
    transcript:
      "नमस्ते दोस्तों! आज के इस विशेष वीडियो में हम आर्टिफिशियल इंटेलिजेंस और मशीन लर्निंग के बुनियादी नियमों को समझेंगे। डेटा प्रोसेसिंग कैसे काम करता है और हमारे रोज़मर्रा के जीवन में इसका क्या महत्व है, इस पर हम विस्तार से चर्चा करेंगे।",
    englishTranslation:
      "Hello friends! In this special video today, we will understand the fundamental rules of Artificial Intelligence and Machine Learning. We will discuss in detail how data processing works and its importance in our daily lives.",
    duration: 12,
  },
  {
    id: "english-science",
    title: "Quantum Computing (English)",
    language: "English",
    description: "Tech lecture explaining modern computing paradigms and algorithms.",
    transcript:
      "Welcome to this lecture on modern computing paradigms. Today we examine quantum superposition, cloud distributed networks, and how real-time audio streams are processed with sub-second latency.",
    englishTranslation:
      "Welcome to this lecture on modern computing paradigms. Today we examine quantum superposition, cloud distributed networks, and how real-time audio streams are processed with sub-second latency.",
    duration: 10,
  },
  {
    id: "hinglish-tutorial",
    title: "React Full-Stack Setup (Hinglish / मिश्रित)",
    language: "Hinglish",
    description: "Coding tutorial in mixed Hindi-English commonly used in Indian tech tutorials.",
    transcript:
      "Hey everyone, aaj ke is tutorial me hum full-stack application setup karenge. Screen share karke laptop audio ko kaise transcribe kiya jata hai aur notes export kaise banate hain, step-by-step dekhte hain.",
    englishTranslation:
      "Hey everyone, in today's tutorial we will set up a full-stack application. Let's see step-by-step how to transcribe laptop audio via screen sharing and create notes exports.",
    duration: 11,
  },
];
