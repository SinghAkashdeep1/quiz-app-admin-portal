"use client";

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import api from './api';

// Initialize only on client side
if (typeof window !== 'undefined') {
  i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
      fallbackLng: 'en',
      supportedLngs: ['en', 'hi', 'es', 'fr', 'de', 'it'],
      interpolation: {
        escapeValue: false,
      },
      detection: {
        order: ['localStorage', 'navigator'],
        caches: ['localStorage'],
      },
      resources: {
        en: {
          translation: {
            "onboarding.welcome.title": "Welcome to Quiz Admin!",
            "onboarding.welcome.desc": "Your enterprise-grade platform for managing MCQ content and user analytics.",
            "onboarding.dashboard.title": "Production Overview",
            "onboarding.dashboard.desc": "Monitor real-time metrics, user activity, and category performance at a glance.",
            "onboarding.categories.title": "Category Management",
            "onboarding.categories.desc": "Create, edit, and organize your quiz categories. Keep your content fresh!",
            "onboarding.questions.title": "Question Bank",
            "onboarding.questions.desc": "Add diverse questions with images, multiple correct answers, and more.",
            "onboarding.questions.types.title": "Diverse Question Types",
            "onboarding.questions.types.desc": "You can create Multiple Choice, True/False, Image-based questions, and more!",
            "onboarding.next": "Next",
            "onboarding.back": "Back",
            "onboarding.skip": "Skip",
            "onboarding.finish": "Get Started"
          }
        },
        hi: {
          translation: {
            "onboarding.welcome.title": "क्विज़ एडमिन में आपका स्वागत है!",
            "onboarding.welcome.desc": "MCQ सामग्री और उपयोगकर्ता विश्लेषण के प्रबंधन के लिए आपका एंटरप्राइज-ग्रेड प्लेटफॉर्म।",
            "onboarding.dashboard.title": "उत्पादन अवलोकन",
            "onboarding.dashboard.desc": "वास्तविक समय के मेट्रिक्स, उपयोगकर्ता गतिविधि और श्रेणी प्रदर्शन की एक नज़र में निगरानी करें।",
            "onboarding.categories.title": "श्रेणी प्रबंधन",
            "onboarding.categories.desc": "अपनी क्विज़ श्रेणियां बनाएं, संपादित करें और व्यवस्थित करें। अपनी सामग्री को ताज़ा रखें!",
            "onboarding.questions.title": "प्रश्न बैंक",
            "onboarding.questions.desc": "छवियों, कई सही उत्तरों और बहुत कुछ के साथ विविध प्रश्न जोड़ें।",
            "onboarding.questions.types.title": "विविध प्रश्न प्रकार",
            "onboarding.questions.types.desc": "आप बहुविकल्पीय, सही/गलत, छवि-आधारित प्रश्न और बहुत कुछ बना सकते हैं!",
            "onboarding.next": "अगला",
            "onboarding.back": "पीछे",
            "onboarding.skip": "छोड़ें",
            "onboarding.finish": "शुरू करें"
          }
        }
      }
    });
}

export default i18n;
