import { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast';

// Define supported languages
export const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
  { code: 'zh', name: '中文', flag: '🇨🇳' },
  { code: 'ar', name: 'العربية', flag: '🇸🇦' },
  { code: 'hi', name: 'हिन्दी', flag: '🇮🇳' },
  { code: 'pt', name: 'Português', flag: '🇧🇷' },
  { code: 'ru', name: 'Русский', flag: '🇷🇺' },
  { code: 'ja', name: '日本語', flag: '🇯🇵' }
];

// Local storage key for saving language preference
const LANGUAGE_PREFERENCE_KEY = 'puremind_language_preference';

export interface TranslationOptions {
  cacheResults?: boolean;
  interpolation?: Record<string, string>;
}

export const useLanguage = () => {
  // Load saved language preference from localStorage
  const getSavedLanguage = (): string => {
    try {
      const saved = localStorage.getItem(LANGUAGE_PREFERENCE_KEY);
      if (saved && SUPPORTED_LANGUAGES.some(lang => lang.code === saved)) {
        return saved;
      }
    } catch (error) {
      console.error('Error loading language preference:', error);
    }
    
    // Default to browser language if supported, otherwise English
    const browserLang = navigator.language.split('-')[0];
    return SUPPORTED_LANGUAGES.some(lang => lang.code === browserLang) ? browserLang : 'en';
  };

  const [currentLanguage, setCurrentLanguage] = useState<string>(getSavedLanguage());
  const [translations, setTranslations] = useState<Record<string, Record<string, string>>>({});
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [translationCache, setTranslationCache] = useState<Record<string, Record<string, string>>>({});

  // Save language preference to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(LANGUAGE_PREFERENCE_KEY, currentLanguage);
      console.log('Language preference saved:', currentLanguage);
    } catch (error) {
      console.error('Error saving language preference:', error);
    }
  }, [currentLanguage]);

  // Load translations for current language
  const loadTranslations = useCallback(async () => {
    // Skip if language is English (default) or translations already loaded
    if (currentLanguage === 'en' || translations[currentLanguage]) {
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Check if we have cached translations
      if (translationCache[currentLanguage]) {
        console.log(`Using cached translations for ${currentLanguage}`);
        setTranslations(prev => ({
          ...prev,
          [currentLanguage]: translationCache[currentLanguage]
        }));
        setIsLoading(false);
        return;
      }

      // In a real app, you would fetch translations from your API
      // For this example, we'll simulate an API call with a timeout
      console.log(`Loading translations for ${currentLanguage}...`);
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 500));

      // Mock translation data for demonstration
      const mockTranslations: Record<string, string> = {
        // Common UI elements
        'Sign In': currentLanguage === 'es' ? 'Iniciar sesión' : 
                  currentLanguage === 'fr' ? 'Se connecter' : 
                  currentLanguage === 'de' ? 'Anmelden' : 'Sign In',
        'Sign Up': currentLanguage === 'es' ? 'Registrarse' : 
                  currentLanguage === 'fr' ? 'S\'inscrire' : 
                  currentLanguage === 'de' ? 'Registrieren' : 'Sign Up',
        'Dashboard': currentLanguage === 'es' ? 'Panel' : 
                    currentLanguage === 'fr' ? 'Tableau de bord' : 
                    currentLanguage === 'de' ? 'Dashboard' : 'Dashboard',
        'Journal': currentLanguage === 'es' ? 'Diario' : 
                  currentLanguage === 'fr' ? 'Journal' : 
                  currentLanguage === 'de' ? 'Tagebuch' : 'Journal',
        'AI Chat': currentLanguage === 'es' ? 'Chat IA' : 
                  currentLanguage === 'fr' ? 'Chat IA' : 
                  currentLanguage === 'de' ? 'KI-Chat' : 'AI Chat',
        'Recovery': currentLanguage === 'es' ? 'Recuperación' : 
                   currentLanguage === 'fr' ? 'Rétablissement' : 
                   currentLanguage === 'de' ? 'Genesung' : 'Recovery',
        'Anxiety': currentLanguage === 'es' ? 'Ansiedad' : 
                  currentLanguage === 'fr' ? 'Anxiété' : 
                  currentLanguage === 'de' ? 'Angst' : 'Anxiety',
        'Settings': currentLanguage === 'es' ? 'Configuración' : 
                   currentLanguage === 'fr' ? 'Paramètres' : 
                   currentLanguage === 'de' ? 'Einstellungen' : 'Settings',
        'Save': currentLanguage === 'es' ? 'Guardar' : 
               currentLanguage === 'fr' ? 'Enregistrer' : 
               currentLanguage === 'de' ? 'Speichern' : 'Save',
        'Cancel': currentLanguage === 'es' ? 'Cancelar' : 
                 currentLanguage === 'fr' ? 'Annuler' : 
                 currentLanguage === 'de' ? 'Abbrechen' : 'Cancel',
        'Delete': currentLanguage === 'es' ? 'Eliminar' : 
                 currentLanguage === 'fr' ? 'Supprimer' : 
                 currentLanguage === 'de' ? 'Löschen' : 'Delete',
        'Edit': currentLanguage === 'es' ? 'Editar' : 
               currentLanguage === 'fr' ? 'Modifier' : 
               currentLanguage === 'de' ? 'Bearbeiten' : 'Edit',
        
        // Dashboard
        'Your Wellness Dashboard': currentLanguage === 'es' ? 'Tu Panel de Bienestar' : 
                                  currentLanguage === 'fr' ? 'Votre Tableau de Bord de Bien-être' : 
                                  currentLanguage === 'de' ? 'Ihr Wellness-Dashboard' : 'Your Wellness Dashboard',
        'Track your daily emotional wellness journey': currentLanguage === 'es' ? 'Sigue tu viaje diario de bienestar emocional' : 
                                                      currentLanguage === 'fr' ? 'Suivez votre parcours quotidien de bien-être émotionnel' : 
                                                      currentLanguage === 'de' ? 'Verfolgen Sie Ihre tägliche emotionale Wellness-Reise' : 'Track your daily emotional wellness journey',
        'Wellness Score': currentLanguage === 'es' ? 'Puntuación de Bienestar' : 
                         currentLanguage === 'fr' ? 'Score de Bien-être' : 
                         currentLanguage === 'de' ? 'Wellness-Punktzahl' : 'Wellness Score',
        'Current Mood': currentLanguage === 'es' ? 'Estado de Ánimo Actual' : 
                       currentLanguage === 'fr' ? 'Humeur Actuelle' : 
                       currentLanguage === 'de' ? 'Aktuelle Stimmung' : 'Current Mood',
        'Daily Goals': currentLanguage === 'es' ? 'Objetivos Diarios' : 
                      currentLanguage === 'fr' ? 'Objectifs Quotidiens' : 
                      currentLanguage === 'de' ? 'Tagesziele' : 'Daily Goals',
        
        // Addiction Support
        'Addiction Support': currentLanguage === 'es' ? 'Apoyo para Adicciones' : 
                            currentLanguage === 'fr' ? 'Soutien aux Dépendances' : 
                            currentLanguage === 'de' ? 'Suchtunterstützung' : 'Addiction Support',
        'Your journey to recovery is unique and brave': currentLanguage === 'es' ? 'Tu viaje hacia la recuperación es único y valiente' : 
                                                       currentLanguage === 'fr' ? 'Votre parcours vers le rétablissement est unique et courageux' : 
                                                       currentLanguage === 'de' ? 'Ihr Weg zur Genesung ist einzigartig und mutig' : 'Your journey to recovery is unique and brave',
        'Need Immediate Help?': currentLanguage === 'es' ? '¿Necesitas Ayuda Inmediata?' : 
                               currentLanguage === 'fr' ? 'Besoin d\'Aide Immédiate ?' : 
                               currentLanguage === 'de' ? 'Brauchen Sie Sofortige Hilfe?' : 'Need Immediate Help?',
        
        // Anxiety Support
        'Anxiety Support Center': currentLanguage === 'es' ? 'Centro de Apoyo para la Ansiedad' : 
                                 currentLanguage === 'fr' ? 'Centre de Soutien à l\'Anxiété' : 
                                 currentLanguage === 'de' ? 'Angsthilfe-Zentrum' : 'Anxiety Support Center',
        'Comprehensive tools for managing anxiety': currentLanguage === 'es' ? 'Herramientas completas para manejar la ansiedad' : 
                                                  currentLanguage === 'fr' ? 'Outils complets pour gérer l\'anxiété' : 
                                                  currentLanguage === 'de' ? 'Umfassende Werkzeuge zur Bewältigung von Angst' : 'Comprehensive tools for managing anxiety',
        
        // Journal
        'New Entry': currentLanguage === 'es' ? 'Nueva Entrada' : 
                    currentLanguage === 'fr' ? 'Nouvelle Entrée' : 
                    currentLanguage === 'de' ? 'Neuer Eintrag' : 'New Entry',
        'No entries yet': currentLanguage === 'es' ? 'Aún no hay entradas' : 
                         currentLanguage === 'fr' ? 'Pas encore d\'entrées' : 
                         currentLanguage === 'de' ? 'Noch keine Einträge' : 'No entries yet',
        
        // Chat
        'Daily Wellness Chat': currentLanguage === 'es' ? 'Chat Diario de Bienestar' : 
                              currentLanguage === 'fr' ? 'Chat Quotidien de Bien-être' : 
                              currentLanguage === 'de' ? 'Täglicher Wellness-Chat' : 'Daily Wellness Chat',
        'Type your message...': currentLanguage === 'es' ? 'Escribe tu mensaje...' : 
                               currentLanguage === 'fr' ? 'Tapez votre message...' : 
                               currentLanguage === 'de' ? 'Nachricht eingeben...' : 'Type your message...',
        
        // Profile
        'Your Profile': currentLanguage === 'es' ? 'Tu Perfil' : 
                       currentLanguage === 'fr' ? 'Votre Profil' : 
                       currentLanguage === 'de' ? 'Ihr Profil' : 'Your Profile',
        'Full Name': currentLanguage === 'es' ? 'Nombre Completo' : 
                    currentLanguage === 'fr' ? 'Nom Complet' : 
                    currentLanguage === 'de' ? 'Vollständiger Name' : 'Full Name',
        'Date of Birth': currentLanguage === 'es' ? 'Fecha de Nacimiento' : 
                        currentLanguage === 'fr' ? 'Date de Naissance' : 
                        currentLanguage === 'de' ? 'Geburtsdatum' : 'Date of Birth',
        'Location': currentLanguage === 'es' ? 'Ubicación' : 
                   currentLanguage === 'fr' ? 'Emplacement' : 
                   currentLanguage === 'de' ? 'Standort' : 'Location',
        'About You': currentLanguage === 'es' ? 'Acerca de Ti' : 
                    currentLanguage === 'fr' ? 'À Propos de Vous' : 
                    currentLanguage === 'de' ? 'Über Sie' : 'About You',
        
        // Landing page
        'Your Digital': currentLanguage === 'es' ? 'Tu Compañero' : 
                       currentLanguage === 'fr' ? 'Votre Compagnon' : 
                       currentLanguage === 'de' ? 'Ihr Digitaler' : 'Your Digital',
        'Mental Wellness Companion': currentLanguage === 'es' ? 'Digital de Bienestar Mental' : 
                                    currentLanguage === 'fr' ? 'Digital de Bien-être Mental' : 
                                    currentLanguage === 'de' ? 'Mentaler Wellness-Begleiter' : 'Mental Wellness Companion',
        'Start Your Journey': currentLanguage === 'es' ? 'Comienza Tu Viaje' : 
                             currentLanguage === 'fr' ? 'Commencez Votre Voyage' : 
                             currentLanguage === 'de' ? 'Starten Sie Ihre Reise' : 'Start Your Journey',
        'Learn More': currentLanguage === 'es' ? 'Más Información' : 
                     currentLanguage === 'fr' ? 'En Savoir Plus' : 
                     currentLanguage === 'de' ? 'Mehr Erfahren' : 'Learn More',
      };

      // Update translations state
      setTranslations(prev => ({
        ...prev,
        [currentLanguage]: mockTranslations
      }));

      // Cache translations
      setTranslationCache(prev => ({
        ...prev,
        [currentLanguage]: mockTranslations
      }));

      console.log(`Translations loaded for ${currentLanguage}`);
    } catch (error) {
      console.error(`Error loading translations for ${currentLanguage}:`, error);
      setError(`Failed to load translations for ${currentLanguage}`);
    } finally {
      setIsLoading(false);
    }
  }, [currentLanguage, translations, translationCache]);

  // Load translations when language changes
  useEffect(() => {
    if (currentLanguage !== 'en') {
      loadTranslations();
    }
  }, [currentLanguage, loadTranslations]);

  // Change language
  const changeLanguage = useCallback((languageCode: string) => {
    if (SUPPORTED_LANGUAGES.some(lang => lang.code === languageCode)) {
      setCurrentLanguage(languageCode);
      
      const langName = SUPPORTED_LANGUAGES.find(lang => lang.code === languageCode)?.name || languageCode;
      toast.success(`Language changed to ${langName}`, {
        icon: SUPPORTED_LANGUAGES.find(lang => lang.code === languageCode)?.flag || '🌐',
      });
    } else {
      console.error(`Unsupported language: ${languageCode}`);
      toast.error(`Unsupported language: ${languageCode}`);
    }
  }, []);

  // Translate text
  const translate = useCallback((text: string, options?: TranslationOptions): string => {
    // Return original text if language is English or text is empty
    if (currentLanguage === 'en' || !text) {
      return text;
    }

    // Get translations for current language
    const langTranslations = translations[currentLanguage];
    if (!langTranslations) {
      return text;
    }

    // Check if we have a translation for this text
    let translated = langTranslations[text] || text;

    // Handle interpolation if provided
    if (options?.interpolation) {
      Object.entries(options.interpolation).forEach(([key, value]) => {
        translated = translated.replace(`{{${key}}}`, value);
      });
    }

    return translated;
  }, [currentLanguage, translations]);

  // Get language details
  const getLanguageDetails = useCallback((code: string) => {
    return SUPPORTED_LANGUAGES.find(lang => lang.code === code) || SUPPORTED_LANGUAGES[0];
  }, []);

  return {
    currentLanguage,
    isLoading,
    error,
    supportedLanguages: SUPPORTED_LANGUAGES,
    changeLanguage,
    translate,
    getLanguageDetails
  };
};