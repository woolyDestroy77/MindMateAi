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
                  currentLanguage === 'de' ? 'Anmelden' : 
                  currentLanguage === 'zh' ? '登录' :
                  currentLanguage === 'ar' ? 'تسجيل الدخول' :
                  currentLanguage === 'hi' ? 'साइन इन करें' :
                  currentLanguage === 'pt' ? 'Entrar' :
                  currentLanguage === 'ru' ? 'Войти' :
                  currentLanguage === 'ja' ? 'サインイン' : 'Sign In',
        'Sign Up': currentLanguage === 'es' ? 'Registrarse' : 
                  currentLanguage === 'fr' ? 'S\'inscrire' : 
                  currentLanguage === 'de' ? 'Registrieren' : 
                  currentLanguage === 'zh' ? '注册' :
                  currentLanguage === 'ar' ? 'التسجيل' :
                  currentLanguage === 'hi' ? 'साइन अप करें' :
                  currentLanguage === 'pt' ? 'Cadastrar' :
                  currentLanguage === 'ru' ? 'Зарегистрироваться' :
                  currentLanguage === 'ja' ? 'サインアップ' : 'Sign Up',
        'Sign Out': currentLanguage === 'es' ? 'Cerrar sesión' : 
                   currentLanguage === 'fr' ? 'Se déconnecter' : 
                   currentLanguage === 'de' ? 'Abmelden' : 
                   currentLanguage === 'zh' ? '退出登录' :
                   currentLanguage === 'ar' ? 'تسجيل الخروج' :
                   currentLanguage === 'hi' ? 'साइन आउट करें' :
                   currentLanguage === 'pt' ? 'Sair' :
                   currentLanguage === 'ru' ? 'Выйти' :
                   currentLanguage === 'ja' ? 'サインアウト' : 'Sign Out',
        'Dashboard': currentLanguage === 'es' ? 'Panel' : 
                    currentLanguage === 'fr' ? 'Tableau de bord' : 
                    currentLanguage === 'de' ? 'Dashboard' : 
                    currentLanguage === 'zh' ? '仪表板' :
                    currentLanguage === 'ar' ? 'لوحة التحكم' :
                    currentLanguage === 'hi' ? 'डैशबोर्ड' :
                    currentLanguage === 'pt' ? 'Painel' :
                    currentLanguage === 'ru' ? 'Панель управления' :
                    currentLanguage === 'ja' ? 'ダッシュボード' : 'Dashboard',
        'Journal': currentLanguage === 'es' ? 'Diario' : 
                  currentLanguage === 'fr' ? 'Journal' : 
                  currentLanguage === 'de' ? 'Tagebuch' : 
                  currentLanguage === 'zh' ? '日记' :
                  currentLanguage === 'ar' ? 'مذكرات' :
                  currentLanguage === 'hi' ? 'जर्नल' :
                  currentLanguage === 'pt' ? 'Diário' :
                  currentLanguage === 'ru' ? 'Дневник' :
                  currentLanguage === 'ja' ? '日記' : 'Journal',
        'AI Chat': currentLanguage === 'es' ? 'Chat IA' : 
                  currentLanguage === 'fr' ? 'Chat IA' : 
                  currentLanguage === 'de' ? 'KI-Chat' : 
                  currentLanguage === 'zh' ? 'AI聊天' :
                  currentLanguage === 'ar' ? 'دردشة الذكاء الاصطناعي' :
                  currentLanguage === 'hi' ? 'AI चैट' :
                  currentLanguage === 'pt' ? 'Chat de IA' :
                  currentLanguage === 'ru' ? 'ИИ чат' :
                  currentLanguage === 'ja' ? 'AIチャット' : 'AI Chat',
        'Recovery': currentLanguage === 'es' ? 'Recuperación' : 
                   currentLanguage === 'fr' ? 'Rétablissement' : 
                   currentLanguage === 'de' ? 'Genesung' : 
                   currentLanguage === 'zh' ? '康复' :
                   currentLanguage === 'ar' ? 'التعافي' :
                   currentLanguage === 'hi' ? 'रिकवरी' :
                   currentLanguage === 'pt' ? 'Recuperação' :
                   currentLanguage === 'ru' ? 'Восстановление' :
                   currentLanguage === 'ja' ? '回復' : 'Recovery',
        'Anxiety': currentLanguage === 'es' ? 'Ansiedad' : 
                  currentLanguage === 'fr' ? 'Anxiété' : 
                  currentLanguage === 'de' ? 'Angst' : 
                  currentLanguage === 'zh' ? '焦虑' :
                  currentLanguage === 'ar' ? 'القلق' :
                  currentLanguage === 'hi' ? 'चिंता' :
                  currentLanguage === 'pt' ? 'Ansiedade' :
                  currentLanguage === 'ru' ? 'Тревожность' :
                  currentLanguage === 'ja' ? '不安' : 'Anxiety',
        'Settings': currentLanguage === 'es' ? 'Configuración' : 
                   currentLanguage === 'fr' ? 'Paramètres' : 
                   currentLanguage === 'de' ? 'Einstellungen' : 
                   currentLanguage === 'zh' ? '设置' :
                   currentLanguage === 'ar' ? 'الإعدادات' :
                   currentLanguage === 'hi' ? 'सेटिंग्स' :
                   currentLanguage === 'pt' ? 'Configurações' :
                   currentLanguage === 'ru' ? 'Настройки' :
                   currentLanguage === 'ja' ? '設定' : 'Settings',
        'Save': currentLanguage === 'es' ? 'Guardar' : 
               currentLanguage === 'fr' ? 'Enregistrer' : 
               currentLanguage === 'de' ? 'Speichern' : 
               currentLanguage === 'zh' ? '保存' :
               currentLanguage === 'ar' ? 'حفظ' :
               currentLanguage === 'hi' ? 'सहेजें' :
               currentLanguage === 'pt' ? 'Salvar' :
               currentLanguage === 'ru' ? 'Сохранить' :
               currentLanguage === 'ja' ? '保存' : 'Save',
        'Cancel': currentLanguage === 'es' ? 'Cancelar' : 
                 currentLanguage === 'fr' ? 'Annuler' : 
                 currentLanguage === 'de' ? 'Abbrechen' : 
                 currentLanguage === 'zh' ? '取消' :
                 currentLanguage === 'ar' ? 'إلغاء' :
                 currentLanguage === 'hi' ? 'रद्द करें' :
                 currentLanguage === 'pt' ? 'Cancelar' :
                 currentLanguage === 'ru' ? 'Отмена' :
                 currentLanguage === 'ja' ? 'キャンセル' : 'Cancel',
        'Delete': currentLanguage === 'es' ? 'Eliminar' : 
                 currentLanguage === 'fr' ? 'Supprimer' : 
                 currentLanguage === 'de' ? 'Löschen' : 
                 currentLanguage === 'zh' ? '删除' :
                 currentLanguage === 'ar' ? 'حذف' :
                 currentLanguage === 'hi' ? 'हटाएं' :
                 currentLanguage === 'pt' ? 'Excluir' :
                 currentLanguage === 'ru' ? 'Удалить' :
                 currentLanguage === 'ja' ? '削除' : 'Delete',
        'Edit': currentLanguage === 'es' ? 'Editar' : 
               currentLanguage === 'fr' ? 'Modifier' : 
               currentLanguage === 'de' ? 'Bearbeiten' : 
               currentLanguage === 'zh' ? '编辑' :
               currentLanguage === 'ar' ? 'تعديل' :
               currentLanguage === 'hi' ? 'संपादित करें' :
               currentLanguage === 'pt' ? 'Editar' :
               currentLanguage === 'ru' ? 'Редактировать' :
               currentLanguage === 'ja' ? '編集' : 'Edit',
        'Close': currentLanguage === 'es' ? 'Cerrar' : 
                currentLanguage === 'fr' ? 'Fermer' : 
                currentLanguage === 'de' ? 'Schließen' : 
                currentLanguage === 'zh' ? '关闭' :
                currentLanguage === 'ar' ? 'إغلاق' :
                currentLanguage === 'hi' ? 'बंद करें' :
                currentLanguage === 'pt' ? 'Fechar' :
                currentLanguage === 'ru' ? 'Закрыть' :
                currentLanguage === 'ja' ? '閉じる' : 'Close',
        'Submit': currentLanguage === 'es' ? 'Enviar' : 
                 currentLanguage === 'fr' ? 'Soumettre' : 
                 currentLanguage === 'de' ? 'Absenden' : 
                 currentLanguage === 'zh' ? '提交' :
                 currentLanguage === 'ar' ? 'إرسال' :
                 currentLanguage === 'hi' ? 'सबमिट करें' :
                 currentLanguage === 'pt' ? 'Enviar' :
                 currentLanguage === 'ru' ? 'Отправить' :
                 currentLanguage === 'ja' ? '送信' : 'Submit',
        
        // Dashboard
        'Your Wellness Dashboard': currentLanguage === 'es' ? 'Tu Panel de Bienestar' : 
                                  currentLanguage === 'fr' ? 'Votre Tableau de Bord de Bien-être' : 
                                  currentLanguage === 'de' ? 'Ihr Wellness-Dashboard' : 
                                  currentLanguage === 'zh' ? '您的健康仪表板' :
                                  currentLanguage === 'ar' ? 'لوحة العافية الخاصة بك' :
                                  currentLanguage === 'hi' ? 'आपका वेलनेस डैशबोर्ड' :
                                  currentLanguage === 'pt' ? 'Seu Painel de Bem-estar' :
                                  currentLanguage === 'ru' ? 'Ваша панель благополучия' :
                                  currentLanguage === 'ja' ? 'あなたのウェルネスダッシュボード' : 'Your Wellness Dashboard',
        'Track your daily emotional wellness journey': currentLanguage === 'es' ? 'Sigue tu viaje diario de bienestar emocional' : 
                                                      currentLanguage === 'fr' ? 'Suivez votre parcours quotidien de bien-être émotionnel' : 
                                                      currentLanguage === 'de' ? 'Verfolgen Sie Ihre tägliche emotionale Wellness-Reise' : 
                                                      currentLanguage === 'zh' ? '追踪您的日常情绪健康之旅' :
                                                      currentLanguage === 'ar' ? 'تتبع رحلة العافية العاطفية اليومية' :
                                                      currentLanguage === 'hi' ? 'अपनी दैनिक भावनात्मक कल्याण यात्रा को ट्रैक करें' :
                                                      currentLanguage === 'pt' ? 'Acompanhe sua jornada diária de bem-estar emocional' :
                                                      currentLanguage === 'ru' ? 'Отслеживайте ваш ежедневный путь эмоционального благополучия' :
                                                      currentLanguage === 'ja' ? '毎日の感情的な健康の旅を追跡する' : 'Track your daily emotional wellness journey',
        'Wellness Score': currentLanguage === 'es' ? 'Puntuación de Bienestar' : 
                         currentLanguage === 'fr' ? 'Score de Bien-être' : 
                         currentLanguage === 'de' ? 'Wellness-Punktzahl' : 
                         currentLanguage === 'zh' ? '健康评分' :
                         currentLanguage === 'ar' ? 'درجة العافية' :
                         currentLanguage === 'hi' ? 'वेलनेस स्कोर' :
                         currentLanguage === 'pt' ? 'Pontuação de Bem-estar' :
                         currentLanguage === 'ru' ? 'Оценка благополучия' :
                         currentLanguage === 'ja' ? 'ウェルネススコア' : 'Wellness Score',
        'Current Mood': currentLanguage === 'es' ? 'Estado de Ánimo Actual' : 
                       currentLanguage === 'fr' ? 'Humeur Actuelle' : 
                       currentLanguage === 'de' ? 'Aktuelle Stimmung' : 
                       currentLanguage === 'zh' ? '当前情绪' :
                       currentLanguage === 'ar' ? 'المزاج الحالي' :
                       currentLanguage === 'hi' ? 'वर्तमान मूड' :
                       currentLanguage === 'pt' ? 'Humor Atual' :
                       currentLanguage === 'ru' ? 'Текущее настроение' :
                       currentLanguage === 'ja' ? '現在の気分' : 'Current Mood',
        'Daily Goals': currentLanguage === 'es' ? 'Objetivos Diarios' : 
                      currentLanguage === 'fr' ? 'Objectifs Quotidiens' : 
                      currentLanguage === 'de' ? 'Tagesziele' : 
                      currentLanguage === 'zh' ? '每日目标' :
                      currentLanguage === 'ar' ? 'الأهداف اليومية' :
                      currentLanguage === 'hi' ? 'दैनिक लक्ष्य' :
                      currentLanguage === 'pt' ? 'Metas Diárias' :
                      currentLanguage === 'ru' ? 'Ежедневные цели' :
                      currentLanguage === 'ja' ? '毎日の目標' : 'Daily Goals',
        'Mood Trends & Progress': currentLanguage === 'es' ? 'Tendencias y Progreso del Estado de Ánimo' : 
                                 currentLanguage === 'fr' ? 'Tendances et Progrès de l\'Humeur' : 
                                 currentLanguage === 'de' ? 'Stimmungstrends & Fortschritte' : 
                                 currentLanguage === 'zh' ? '情绪趋势和进展' :
                                 currentLanguage === 'ar' ? 'اتجاهات المزاج والتقدم' :
                                 currentLanguage === 'hi' ? 'मूड ट्रेंड और प्रगति' :
                                 currentLanguage === 'pt' ? 'Tendências e Progresso de Humor' :
                                 currentLanguage === 'ru' ? 'Тенденции настроения и прогресс' :
                                 currentLanguage === 'ja' ? '気分の傾向と進捗' : 'Mood Trends & Progress',
        'Wellness Insights': currentLanguage === 'es' ? 'Perspectivas de Bienestar' : 
                            currentLanguage === 'fr' ? 'Aperçus de Bien-être' : 
                            currentLanguage === 'de' ? 'Wellness-Einblicke' : 
                            currentLanguage === 'zh' ? '健康洞察' :
                            currentLanguage === 'ar' ? 'رؤى العافية' :
                            currentLanguage === 'hi' ? 'वेलनेस इनसाइट्स' :
                            currentLanguage === 'pt' ? 'Insights de Bem-estar' :
                            currentLanguage === 'ru' ? 'Аналитика благополучия' :
                            currentLanguage === 'ja' ? 'ウェルネスの洞察' : 'Wellness Insights',
        'Quick Actions': currentLanguage === 'es' ? 'Acciones Rápidas' : 
                        currentLanguage === 'fr' ? 'Actions Rapides' : 
                        currentLanguage === 'de' ? 'Schnellaktionen' : 
                        currentLanguage === 'zh' ? '快速操作' :
                        currentLanguage === 'ar' ? 'إجراءات سريعة' :
                        currentLanguage === 'hi' ? 'त्वरित कार्य' :
                        currentLanguage === 'pt' ? 'Ações Rápidas' :
                        currentLanguage === 'ru' ? 'Быстрые действия' :
                        currentLanguage === 'ja' ? 'クイックアクション' : 'Quick Actions',
        'Daily Chat': currentLanguage === 'es' ? 'Chat Diario' : 
                     currentLanguage === 'fr' ? 'Chat Quotidien' : 
                     currentLanguage === 'de' ? 'Täglicher Chat' : 
                     currentLanguage === 'zh' ? '每日聊天' :
                     currentLanguage === 'ar' ? 'الدردشة اليومية' :
                     currentLanguage === 'hi' ? 'दैनिक चैट' :
                     currentLanguage === 'pt' ? 'Chat Diário' :
                     currentLanguage === 'ru' ? 'Ежедневный чат' :
                     currentLanguage === 'ja' ? '毎日のチャット' : 'Daily Chat',
        'Add Goals': currentLanguage === 'es' ? 'Añadir Objetivos' : 
                    currentLanguage === 'fr' ? 'Ajouter des Objectifs' : 
                    currentLanguage === 'de' ? 'Ziele Hinzufügen' : 
                    currentLanguage === 'zh' ? '添加目标' :
                    currentLanguage === 'ar' ? 'إضافة أهداف' :
                    currentLanguage === 'hi' ? 'लक्ष्य जोड़ें' :
                    currentLanguage === 'pt' ? 'Adicionar Metas' :
                    currentLanguage === 'ru' ? 'Добавить цели' :
                    currentLanguage === 'ja' ? '目標を追加' : 'Add Goals',
        'Write Journal': currentLanguage === 'es' ? 'Escribir Diario' : 
                        currentLanguage === 'fr' ? 'Écrire Journal' : 
                        currentLanguage === 'de' ? 'Tagebuch Schreiben' : 
                        currentLanguage === 'zh' ? '写日记' :
                        currentLanguage === 'ar' ? 'كتابة المذكرات' :
                        currentLanguage === 'hi' ? 'जर्नल लिखें' :
                        currentLanguage === 'pt' ? 'Escrever Diário' :
                        currentLanguage === 'ru' ? 'Написать в дневник' :
                        currentLanguage === 'ja' ? '日記を書く' : 'Write Journal',
        'Recovery Support': currentLanguage === 'es' ? 'Apoyo para Recuperación' : 
                           currentLanguage === 'fr' ? 'Soutien au Rétablissement' : 
                           currentLanguage === 'de' ? 'Genesungsunterstützung' : 
                           currentLanguage === 'zh' ? '康复支持' :
                           currentLanguage === 'ar' ? 'دعم التعافي' :
                           currentLanguage === 'hi' ? 'रिकवरी सपोर्ट' :
                           currentLanguage === 'pt' ? 'Suporte à Recuperação' :
                           currentLanguage === 'ru' ? 'Поддержка восстановления' :
                           currentLanguage === 'ja' ? '回復サポート' : 'Recovery Support',
        
        // Addiction Support
        'Addiction Support': currentLanguage === 'es' ? 'Apoyo para Adicciones' : 
                            currentLanguage === 'fr' ? 'Soutien aux Dépendances' : 
                            currentLanguage === 'de' ? 'Suchtunterstützung' : 
                            currentLanguage === 'zh' ? '成瘾支持' :
                            currentLanguage === 'ar' ? 'دعم الإدمان' :
                            currentLanguage === 'hi' ? 'लत सहायता' :
                            currentLanguage === 'pt' ? 'Suporte para Dependência' :
                            currentLanguage === 'ru' ? 'Поддержка при зависимости' :
                            currentLanguage === 'ja' ? '依存症サポート' : 'Addiction Support',
        'Your journey to recovery is unique and brave': currentLanguage === 'es' ? 'Tu viaje hacia la recuperación es único y valiente' : 
                                                       currentLanguage === 'fr' ? 'Votre parcours vers le rétablissement est unique et courageux' : 
                                                       currentLanguage === 'de' ? 'Ihr Weg zur Genesung ist einzigartig und mutig' : 
                                                       currentLanguage === 'zh' ? '您的康复之旅是独特而勇敢的' :
                                                       currentLanguage === 'ar' ? 'رحلتك نحو التعافي فريدة وشجاعة' :
                                                       currentLanguage === 'hi' ? 'रिकवरी की आपकी यात्रा अद्वितीय और साहसिक है' :
                                                       currentLanguage === 'pt' ? 'Sua jornada para recuperação é única e corajosa' :
                                                       currentLanguage === 'ru' ? 'Ваш путь к восстановлению уникален и смел' :
                                                       currentLanguage === 'ja' ? 'あなたの回復への旅は独自で勇敢なものです' : 'Your journey to recovery is unique and brave',
        'Need Immediate Help?': currentLanguage === 'es' ? '¿Necesitas Ayuda Inmediata?' : 
                               currentLanguage === 'fr' ? 'Besoin d\'Aide Immédiate ?' : 
                               currentLanguage === 'de' ? 'Brauchen Sie Sofortige Hilfe?' : 
                               currentLanguage === 'zh' ? '需要立即帮助？' :
                               currentLanguage === 'ar' ? 'هل تحتاج مساعدة فورية؟' :
                               currentLanguage === 'hi' ? 'तत्काल मदद चाहिए?' :
                               currentLanguage === 'pt' ? 'Precisa de Ajuda Imediata?' :
                               currentLanguage === 'ru' ? 'Нужна немедленная помощь?' :
                               currentLanguage === 'ja' ? '今すぐ助けが必要ですか？' : 'Need Immediate Help?',
        'Get Help Now': currentLanguage === 'es' ? 'Obtener Ayuda Ahora' : 
                       currentLanguage === 'fr' ? 'Obtenir de l\'Aide Maintenant' : 
                       currentLanguage === 'de' ? 'Jetzt Hilfe Bekommen' : 
                       currentLanguage === 'zh' ? '立即获取帮助' :
                       currentLanguage === 'ar' ? 'الحصول على المساعدة الآن' :
                       currentLanguage === 'hi' ? 'अभी मदद प्राप्त करें' :
                       currentLanguage === 'pt' ? 'Obter Ajuda Agora' :
                       currentLanguage === 'ru' ? 'Получить помощь сейчас' :
                       currentLanguage === 'ja' ? '今すぐ助けを得る' : 'Get Help Now',
        'Track New Addiction': currentLanguage === 'es' ? 'Seguir Nueva Adicción' : 
                              currentLanguage === 'fr' ? 'Suivre Nouvelle Dépendance' : 
                              currentLanguage === 'de' ? 'Neue Sucht Verfolgen' : 
                              currentLanguage === 'zh' ? '追踪新的成瘾' :
                              currentLanguage === 'ar' ? 'تتبع إدمان جديد' :
                              currentLanguage === 'hi' ? 'नई लत को ट्रैक करें' :
                              currentLanguage === 'pt' ? 'Rastrear Nova Dependência' :
                              currentLanguage === 'ru' ? 'Отслеживать новую зависимость' :
                              currentLanguage === 'ja' ? '新しい依存症を追跡' : 'Track New Addiction',
        
        // Anxiety Support
        'Anxiety Support Center': currentLanguage === 'es' ? 'Centro de Apoyo para la Ansiedad' : 
                                 currentLanguage === 'fr' ? 'Centre de Soutien à l\'Anxiété' : 
                                 currentLanguage === 'de' ? 'Angsthilfe-Zentrum' : 
                                 currentLanguage === 'zh' ? '焦虑支持中心' :
                                 currentLanguage === 'ar' ? 'مركز دعم القلق' :
                                 currentLanguage === 'hi' ? 'चिंता सहायता केंद्र' :
                                 currentLanguage === 'pt' ? 'Centro de Suporte à Ansiedade' :
                                 currentLanguage === 'ru' ? 'Центр поддержки при тревожности' :
                                 currentLanguage === 'ja' ? '不安サポートセンター' : 'Anxiety Support Center',
        'Comprehensive tools for managing anxiety': currentLanguage === 'es' ? 'Herramientas completas para manejar la ansiedad' : 
                                                  currentLanguage === 'fr' ? 'Outils complets pour gérer l\'anxiété' : 
                                                  currentLanguage === 'de' ? 'Umfassende Werkzeuge zur Bewältigung von Angst' : 
                                                  currentLanguage === 'zh' ? '全面的焦虑管理工具' :
                                                  currentLanguage === 'ar' ? 'أدوات شاملة لإدارة القلق' :
                                                  currentLanguage === 'hi' ? 'चिंता प्रबंधन के लिए व्यापक उपकरण' :
                                                  currentLanguage === 'pt' ? 'Ferramentas abrangentes para gerenciar ansiedade' :
                                                  currentLanguage === 'ru' ? 'Комплексные инструменты для управления тревожностью' :
                                                  currentLanguage === 'ja' ? '不安を管理するための包括的なツール' : 'Comprehensive tools for managing anxiety',
        'Current Anxiety Level': currentLanguage === 'es' ? 'Nivel de Ansiedad Actual' : 
                                currentLanguage === 'fr' ? 'Niveau d\'Anxiété Actuel' : 
                                currentLanguage === 'de' ? 'Aktuelles Angstniveau' : 
                                currentLanguage === 'zh' ? '当前焦虑水平' :
                                currentLanguage === 'ar' ? 'مستوى القلق الحالي' :
                                currentLanguage === 'hi' ? 'वर्तमान चिंता स्तर' :
                                currentLanguage === 'pt' ? 'Nível de Ansiedade Atual' :
                                currentLanguage === 'ru' ? 'Текущий уровень тревожности' :
                                currentLanguage === 'ja' ? '現在の不安レベル' : 'Current Anxiety Level',
        'Update Level': currentLanguage === 'es' ? 'Actualizar Nivel' : 
                       currentLanguage === 'fr' ? 'Mettre à Jour le Niveau' : 
                       currentLanguage === 'de' ? 'Level Aktualisieren' : 
                       currentLanguage === 'zh' ? '更新水平' :
                       currentLanguage === 'ar' ? 'تحديث المستوى' :
                       currentLanguage === 'hi' ? 'स्तर अपडेट करें' :
                       currentLanguage === 'pt' ? 'Atualizar Nível' :
                       currentLanguage === 'ru' ? 'Обновить уровень' :
                       currentLanguage === 'ja' ? 'レベルを更新' : 'Update Level',
        'Quick Relief Tools': currentLanguage === 'es' ? 'Herramientas de Alivio Rápido' : 
                             currentLanguage === 'fr' ? 'Outils de Soulagement Rapide' : 
                             currentLanguage === 'de' ? 'Schnelle Entlastungswerkzeuge' : 
                             currentLanguage === 'zh' ? '快速缓解工具' :
                             currentLanguage === 'ar' ? 'أدوات الإغاثة السريعة' :
                             currentLanguage === 'hi' ? 'त्वरित राहत उपकरण' :
                             currentLanguage === 'pt' ? 'Ferramentas de Alívio Rápido' :
                             currentLanguage === 'ru' ? 'Инструменты быстрого облегчения' :
                             currentLanguage === 'ja' ? '即効性のある緩和ツール' : 'Quick Relief Tools',
        
        // Journal
        'New Entry': currentLanguage === 'es' ? 'Nueva Entrada' : 
                    currentLanguage === 'fr' ? 'Nouvelle Entrée' : 
                    currentLanguage === 'de' ? 'Neuer Eintrag' : 
                    currentLanguage === 'zh' ? '新条目' :
                    currentLanguage === 'ar' ? 'إدخال جديد' :
                    currentLanguage === 'hi' ? 'नई एंट्री' :
                    currentLanguage === 'pt' ? 'Nova Entrada' :
                    currentLanguage === 'ru' ? 'Новая запись' :
                    currentLanguage === 'ja' ? '新しいエントリー' : 'New Entry',
        'No entries yet': currentLanguage === 'es' ? 'Aún no hay entradas' : 
                         currentLanguage === 'fr' ? 'Pas encore d\'entrées' : 
                         currentLanguage === 'de' ? 'Noch keine Einträge' : 
                         currentLanguage === 'zh' ? '暂无条目' :
                         currentLanguage === 'ar' ? 'لا توجد إدخالات حتى الآن' :
                         currentLanguage === 'hi' ? 'अभी तक कोई प्रविष्टि नहीं' :
                         currentLanguage === 'pt' ? 'Nenhuma entrada ainda' :
                         currentLanguage === 'ru' ? 'Пока нет записей' :
                         currentLanguage === 'ja' ? 'まだエントリーがありません' : 'No entries yet',
        'Create Your First Entry': currentLanguage === 'es' ? 'Crea Tu Primera Entrada' : 
                                  currentLanguage === 'fr' ? 'Créez Votre Première Entrée' : 
                                  currentLanguage === 'de' ? 'Erstellen Sie Ihren Ersten Eintrag' : 
                                  currentLanguage === 'zh' ? '创建您的第一个条目' :
                                  currentLanguage === 'ar' ? 'إنشاء أول إدخال لك' :
                                  currentLanguage === 'hi' ? 'अपनी पहली एंट्री बनाएं' :
                                  currentLanguage === 'pt' ? 'Crie Sua Primeira Entrada' :
                                  currentLanguage === 'ru' ? 'Создайте свою первую запись' :
                                  currentLanguage === 'ja' ? '最初のエントリーを作成' : 'Create Your First Entry',
        'How are you feeling?': currentLanguage === 'es' ? '¿Cómo te sientes?' : 
                               currentLanguage === 'fr' ? 'Comment vous sentez-vous ?' : 
                               currentLanguage === 'de' ? 'Wie fühlen Sie sich?' : 
                               currentLanguage === 'zh' ? '你感觉如何？' :
                               currentLanguage === 'ar' ? 'كيف تشعر؟' :
                               currentLanguage === 'hi' ? 'आप कैसा महसूस कर रहे हैं?' :
                               currentLanguage === 'pt' ? 'Como você está se sentindo?' :
                               currentLanguage === 'ru' ? 'Как вы себя чувствуете?' :
                               currentLanguage === 'ja' ? 'どのように感じていますか？' : 'How are you feeling?',
        'Write your thoughts': currentLanguage === 'es' ? 'Escribe tus pensamientos' : 
                              currentLanguage === 'fr' ? 'Écrivez vos pensées' : 
                              currentLanguage === 'de' ? 'Schreiben Sie Ihre Gedanken' : 
                              currentLanguage === 'zh' ? '写下你的想法' :
                              currentLanguage === 'ar' ? 'اكتب أفكارك' :
                              currentLanguage === 'hi' ? 'अपने विचार लिखें' :
                              currentLanguage === 'pt' ? 'Escreva seus pensamentos' :
                              currentLanguage === 'ru' ? 'Напишите свои мысли' :
                              currentLanguage === 'ja' ? '考えを書き留める' : 'Write your thoughts',
        
        // Chat
        'Daily Wellness Chat': currentLanguage === 'es' ? 'Chat Diario de Bienestar' : 
                              currentLanguage === 'fr' ? 'Chat Quotidien de Bien-être' : 
                              currentLanguage === 'de' ? 'Täglicher Wellness-Chat' : 
                              currentLanguage === 'zh' ? '每日健康聊天' :
                              currentLanguage === 'ar' ? 'دردشة العافية اليومية' :
                              currentLanguage === 'hi' ? 'दैनिक वेलनेस चैट' :
                              currentLanguage === 'pt' ? 'Chat Diário de Bem-estar' :
                              currentLanguage === 'ru' ? 'Ежедневный чат о благополучии' :
                              currentLanguage === 'ja' ? '毎日のウェルネスチャット' : 'Daily Wellness Chat',
        'Type your message...': currentLanguage === 'es' ? 'Escribe tu mensaje...' : 
                               currentLanguage === 'fr' ? 'Tapez votre message...' : 
                               currentLanguage === 'de' ? 'Nachricht eingeben...' : 
                               currentLanguage === 'zh' ? '输入您的消息...' :
                               currentLanguage === 'ar' ? 'اكتب رسالتك...' :
                               currentLanguage === 'hi' ? 'अपना संदेश टाइप करें...' :
                               currentLanguage === 'pt' ? 'Digite sua mensagem...' :
                               currentLanguage === 'ru' ? 'Введите ваше сообщение...' :
                               currentLanguage === 'ja' ? 'メッセージを入力...' : 'Type your message...',
        'Start New Chat': currentLanguage === 'es' ? 'Iniciar Nuevo Chat' : 
                         currentLanguage === 'fr' ? 'Démarrer Nouveau Chat' : 
                         currentLanguage === 'de' ? 'Neuen Chat Starten' : 
                         currentLanguage === 'zh' ? '开始新聊天' :
                         currentLanguage === 'ar' ? 'بدء دردشة جديدة' :
                         currentLanguage === 'hi' ? 'नई चैट शुरू करें' :
                         currentLanguage === 'pt' ? 'Iniciar Novo Chat' :
                         currentLanguage === 'ru' ? 'Начать новый чат' :
                         currentLanguage === 'ja' ? '新しいチャットを開始' : 'Start New Chat',
        'Chat History': currentLanguage === 'es' ? 'Historial de Chat' : 
                       currentLanguage === 'fr' ? 'Historique de Chat' : 
                       currentLanguage === 'de' ? 'Chat-Verlauf' : 
                       currentLanguage === 'zh' ? '聊天历史' :
                       currentLanguage === 'ar' ? 'سجل الدردشة' :
                       currentLanguage === 'hi' ? 'चैट इतिहास' :
                       currentLanguage === 'pt' ? 'Histórico de Chat' :
                       currentLanguage === 'ru' ? 'История чата' :
                       currentLanguage === 'ja' ? 'チャット履歴' : 'Chat History',
        
        // Profile
        'Your Profile': currentLanguage === 'es' ? 'Tu Perfil' : 
                       currentLanguage === 'fr' ? 'Votre Profil' : 
                       currentLanguage === 'de' ? 'Ihr Profil' : 
                       currentLanguage === 'zh' ? '您的个人资料' :
                       currentLanguage === 'ar' ? 'ملفك الشخصي' :
                       currentLanguage === 'hi' ? 'आपका प्रोफ़ाइल' :
                       currentLanguage === 'pt' ? 'Seu Perfil' :
                       currentLanguage === 'ru' ? 'Ваш профиль' :
                       currentLanguage === 'ja' ? 'あなたのプロフィール' : 'Your Profile',
        'Full Name': currentLanguage === 'es' ? 'Nombre Completo' : 
                    currentLanguage === 'fr' ? 'Nom Complet' : 
                    currentLanguage === 'de' ? 'Vollständiger Name' : 
                    currentLanguage === 'zh' ? '全名' :
                    currentLanguage === 'ar' ? 'الاسم الكامل' :
                    currentLanguage === 'hi' ? 'पूरा नाम' :
                    currentLanguage === 'pt' ? 'Nome Completo' :
                    currentLanguage === 'ru' ? 'Полное имя' :
                    currentLanguage === 'ja' ? '氏名' : 'Full Name',
        'Date of Birth': currentLanguage === 'es' ? 'Fecha de Nacimiento' : 
                        currentLanguage === 'fr' ? 'Date de Naissance' : 
                        currentLanguage === 'de' ? 'Geburtsdatum' : 
                        currentLanguage === 'zh' ? '出生日期' :
                        currentLanguage === 'ar' ? 'تاريخ الميلاد' :
                        currentLanguage === 'hi' ? 'जन्म तिथि' :
                        currentLanguage === 'pt' ? 'Data de Nascimento' :
                        currentLanguage === 'ru' ? 'Дата рождения' :
                        currentLanguage === 'ja' ? '生年月日' : 'Date of Birth',
        'Location': currentLanguage === 'es' ? 'Ubicación' : 
                   currentLanguage === 'fr' ? 'Emplacement' : 
                   currentLanguage === 'de' ? 'Standort' : 
                   currentLanguage === 'zh' ? '位置' :
                   currentLanguage === 'ar' ? 'الموقع' :
                   currentLanguage === 'hi' ? 'स्थान' :
                   currentLanguage === 'pt' ? 'Localização' :
                   currentLanguage === 'ru' ? 'Местоположение' :
                   currentLanguage === 'ja' ? '場所' : 'Location',
        'About You': currentLanguage === 'es' ? 'Acerca de Ti' : 
                    currentLanguage === 'fr' ? 'À Propos de Vous' : 
                    currentLanguage === 'de' ? 'Über Sie' : 
                    currentLanguage === 'zh' ? '关于您' :
                    currentLanguage === 'ar' ? 'عنك' :
                    currentLanguage === 'hi' ? 'आपके बारे में' :
                    currentLanguage === 'pt' ? 'Sobre Você' :
                    currentLanguage === 'ru' ? 'О вас' :
                    currentLanguage === 'ja' ? 'あなたについて' : 'About You',
        'Save Changes': currentLanguage === 'es' ? 'Guardar Cambios' : 
                       currentLanguage === 'fr' ? 'Enregistrer les Modifications' : 
                       currentLanguage === 'de' ? 'Änderungen Speichern' : 
                       currentLanguage === 'zh' ? '保存更改' :
                       currentLanguage === 'ar' ? 'حفظ التغييرات' :
                       currentLanguage === 'hi' ? 'परिवर्तन सहेजें' :
                       currentLanguage === 'pt' ? 'Salvar Alterações' :
                       currentLanguage === 'ru' ? 'Сохранить изменения' :
                       currentLanguage === 'ja' ? '変更を保存' : 'Save Changes',
        'Profile Picture': currentLanguage === 'es' ? 'Foto de Perfil' : 
                          currentLanguage === 'fr' ? 'Photo de Profil' : 
                          currentLanguage === 'de' ? 'Profilbild' : 
                          currentLanguage === 'zh' ? '头像' :
                          currentLanguage === 'ar' ? 'صورة الملف الشخصي' :
                          currentLanguage === 'hi' ? 'प्रोफ़ाइल चित्र' :
                          currentLanguage === 'pt' ? 'Foto de Perfil' :
                          currentLanguage === 'ru' ? 'Фото профиля' :
                          currentLanguage === 'ja' ? 'プロフィール写真' : 'Profile Picture',
        'Upload Photo': currentLanguage === 'es' ? 'Subir Foto' : 
                       currentLanguage === 'fr' ? 'Télécharger Photo' : 
                       currentLanguage === 'de' ? 'Foto Hochladen' : 
                       currentLanguage === 'zh' ? '上传照片' :
                       currentLanguage === 'ar' ? 'تحميل صورة' :
                       currentLanguage === 'hi' ? 'फोटो अपलोड करें' :
                       currentLanguage === 'pt' ? 'Carregar Foto' :
                       currentLanguage === 'ru' ? 'Загрузить фото' :
                       currentLanguage === 'ja' ? '写真をアップロード' : 'Upload Photo',
        
        // Landing page
        'Your Digital': currentLanguage === 'es' ? 'Tu Compañero' : 
                       currentLanguage === 'fr' ? 'Votre Compagnon' : 
                       currentLanguage === 'de' ? 'Ihr Digitaler' : 
                       currentLanguage === 'zh' ? '您的数字' :
                       currentLanguage === 'ar' ? 'رفيقك الرقمي' :
                       currentLanguage === 'hi' ? 'आपका डिजिटल' :
                       currentLanguage === 'pt' ? 'Seu Companheiro' :
                       currentLanguage === 'ru' ? 'Ваш цифровой' :
                       currentLanguage === 'ja' ? 'あなたのデジタル' : 'Your Digital',
        'Mental Wellness Companion': currentLanguage === 'es' ? 'Digital de Bienestar Mental' : 
                                    currentLanguage === 'fr' ? 'Digital de Bien-être Mental' : 
                                    currentLanguage === 'de' ? 'Mentaler Wellness-Begleiter' : 
                                    currentLanguage === 'zh' ? '心理健康伴侣' :
                                    currentLanguage === 'ar' ? 'للصحة العقلية' :
                                    currentLanguage === 'hi' ? 'मानसिक स्वास्थ्य साथी' :
                                    currentLanguage === 'pt' ? 'Digital de Bem-estar Mental' :
                                    currentLanguage === 'ru' ? 'компаньон для психического благополучия' :
                                    currentLanguage === 'ja' ? 'メンタルウェルネスコンパニオン' : 'Mental Wellness Companion',
        'Start Your Journey': currentLanguage === 'es' ? 'Comienza Tu Viaje' : 
                             currentLanguage === 'fr' ? 'Commencez Votre Voyage' : 
                             currentLanguage === 'de' ? 'Starten Sie Ihre Reise' : 
                             currentLanguage === 'zh' ? '开始您的旅程' :
                             currentLanguage === 'ar' ? 'ابدأ رحلتك' :
                             currentLanguage === 'hi' ? 'अपनी यात्रा शुरू करें' :
                             currentLanguage === 'pt' ? 'Comece Sua Jornada' :
                             currentLanguage === 'ru' ? 'Начните свой путь' :
                             currentLanguage === 'ja' ? '旅を始める' : 'Start Your Journey',
        'Learn More': currentLanguage === 'es' ? 'Más Información' : 
                     currentLanguage === 'fr' ? 'En Savoir Plus' : 
                     currentLanguage === 'de' ? 'Mehr Erfahren' : 
                     currentLanguage === 'zh' ? '了解更多' :
                     currentLanguage === 'ar' ? 'معرفة المزيد' :
                     currentLanguage === 'hi' ? 'और जानें' :
                     currentLanguage === 'pt' ? 'Saiba Mais' :
                     currentLanguage === 'ru' ? 'Узнать больше' :
                     currentLanguage === 'ja' ? '詳細を見る' : 'Learn More',
        'Introducing PureMind AI': currentLanguage === 'es' ? 'Presentando PureMind AI' : 
                                  currentLanguage === 'fr' ? 'Présentation de PureMind AI' : 
                                  currentLanguage === 'de' ? 'Vorstellung von PureMind AI' : 
                                  currentLanguage === 'zh' ? '介绍 PureMind AI' :
                                  currentLanguage === 'ar' ? 'تقديم PureMind AI' :
                                  currentLanguage === 'hi' ? 'PureMind AI का परिचय' :
                                  currentLanguage === 'pt' ? 'Apresentando PureMind AI' :
                                  currentLanguage === 'ru' ? 'Представляем PureMind AI' :
                                  currentLanguage === 'ja' ? 'PureMind AI の紹介' : 'Introducing PureMind AI',
        'PureMind AI helps you track your emotional journey through intelligent journaling, mood analysis, and personalized wellness insights.': 
                                  currentLanguage === 'es' ? 'PureMind AI te ayuda a seguir tu viaje emocional a través de un diario inteligente, análisis de estado de ánimo y perspectivas personalizadas de bienestar.' : 
                                  currentLanguage === 'fr' ? 'PureMind AI vous aide à suivre votre parcours émotionnel grâce à la journalisation intelligente, l\'analyse de l\'humeur et des aperçus personnalisés sur le bien-être.' : 
                                  currentLanguage === 'de' ? 'PureMind AI hilft Ihnen, Ihre emotionale Reise durch intelligentes Journaling, Stimmungsanalyse und personalisierte Wellness-Einblicke zu verfolgen.' : 
                                  currentLanguage === 'zh' ? 'PureMind AI 通过智能日记、情绪分析和个性化健康洞察帮助您追踪情感之旅。' :
                                  currentLanguage === 'ar' ? 'يساعدك PureMind AI على تتبع رحلتك العاطفية من خلال التدوين الذكي وتحليل المزاج ورؤى العافية المخصصة.' :
                                  currentLanguage === 'hi' ? 'PureMind AI बुद्धिमान जर्नलिंग, मूड विश्लेषण और व्यक्तिगत वेलनेस इनसाइट्स के माध्यम से आपकी भावनात्मक यात्रा को ट्रैक करने में मदद करता है।' :
                                  currentLanguage === 'pt' ? 'PureMind AI ajuda você a acompanhar sua jornada emocional por meio de registro inteligente, análise de humor e insights personalizados de bem-estar.' :
                                  currentLanguage === 'ru' ? 'PureMind AI помогает отслеживать ваш эмоциональный путь с помощью интеллектуального ведения дневника, анализа настроения и персонализированных советов по благополучию.' :
                                  currentLanguage === 'ja' ? 'PureMind AI は、インテリジェントなジャーナリング、気分分析、パーソナライズされたウェルネスの洞察を通じて、あなたの感情の旅を追跡するのに役立ちます。' : 'PureMind AI helps you track your emotional journey through intelligent journaling, mood analysis, and personalized wellness insights.',
        
        // Features section
        'Features': currentLanguage === 'es' ? 'Características' : 
                   currentLanguage === 'fr' ? 'Fonctionnalités' : 
                   currentLanguage === 'de' ? 'Funktionen' : 
                   currentLanguage === 'zh' ? '功能' :
                   currentLanguage === 'ar' ? 'الميزات' :
                   currentLanguage === 'hi' ? 'विशेषताएँ' :
                   currentLanguage === 'pt' ? 'Recursos' :
                   currentLanguage === 'ru' ? 'Функции' :
                   currentLanguage === 'ja' ? '機能' : 'Features',
        'How It Works': currentLanguage === 'es' ? 'Cómo Funciona' : 
                       currentLanguage === 'fr' ? 'Comment Ça Marche' : 
                       currentLanguage === 'de' ? 'Wie Es Funktioniert' : 
                       currentLanguage === 'zh' ? '工作原理' :
                       currentLanguage === 'ar' ? 'كيف يعمل' :
                       currentLanguage === 'hi' ? 'यह कैसे काम करता है' :
                       currentLanguage === 'pt' ? 'Como Funciona' :
                       currentLanguage === 'ru' ? 'Как это работает' :
                       currentLanguage === 'ja' ? '仕組み' : 'How It Works',
        'Testimonials': currentLanguage === 'es' ? 'Testimonios' : 
                       currentLanguage === 'fr' ? 'Témoignages' : 
                       currentLanguage === 'de' ? 'Erfahrungsberichte' : 
                       currentLanguage === 'zh' ? '用户评价' :
                       currentLanguage === 'ar' ? 'الشهادات' :
                       currentLanguage === 'hi' ? 'प्रशंसापत्र' :
                       currentLanguage === 'pt' ? 'Depoimentos' :
                       currentLanguage === 'ru' ? 'Отзывы' :
                       currentLanguage === 'ja' ? '利用者の声' : 'Testimonials',
        'FAQ': currentLanguage === 'es' ? 'Preguntas Frecuentes' : 
              currentLanguage === 'fr' ? 'FAQ' : 
              currentLanguage === 'de' ? 'FAQ' : 
              currentLanguage === 'zh' ? '常见问题' :
              currentLanguage === 'ar' ? 'الأسئلة الشائعة' :
              currentLanguage === 'hi' ? 'अक्सर पूछे जाने वाले प्रश्न' :
              currentLanguage === 'pt' ? 'Perguntas Frequentes' :
              currentLanguage === 'ru' ? 'ЧЗВ' :
              currentLanguage === 'ja' ? 'よくある質問' : 'FAQ',
        'Features Designed for Your Wellbeing': currentLanguage === 'es' ? 'Características Diseñadas para Tu Bienestar' : 
                                               currentLanguage === 'fr' ? 'Fonctionnalités Conçues pour Votre Bien-être' : 
                                               currentLanguage === 'de' ? 'Funktionen für Ihr Wohlbefinden' : 
                                               currentLanguage === 'zh' ? '为您的健康设计的功能' :
                                               currentLanguage === 'ar' ? 'ميزات مصممة لرفاهيتك' :
                                               currentLanguage === 'hi' ? 'आपकी भलाई के लिए डिज़ाइन की गई विशेषताएँ' :
                                               currentLanguage === 'pt' ? 'Recursos Projetados para Seu Bem-estar' :
                                               currentLanguage === 'ru' ? 'Функции, разработанные для вашего благополучия' :
                                               currentLanguage === 'ja' ? 'あなたの健康のために設計された機能' : 'Features Designed for Your Wellbeing',
        
        // Select Language
        'Select Language': currentLanguage === 'es' ? 'Seleccionar Idioma' : 
                          currentLanguage === 'fr' ? 'Sélectionner la Langue' : 
                          currentLanguage === 'de' ? 'Sprache Auswählen' : 
                          currentLanguage === 'zh' ? '选择语言' :
                          currentLanguage === 'ar' ? 'اختر اللغة' :
                          currentLanguage === 'hi' ? 'भाषा चुनें' :
                          currentLanguage === 'pt' ? 'Selecionar Idioma' :
                          currentLanguage === 'ru' ? 'Выбрать язык' :
                          currentLanguage === 'ja' ? '言語を選択' : 'Select Language',
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