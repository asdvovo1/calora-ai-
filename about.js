// File: about.js

import React, { useState, useCallback, useMemo } from 'react';
import {
  View, Text, SafeAreaView, ScrollView,
  TouchableOpacity, Linking, StatusBar, StyleSheet, I18nManager
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';

// --- الترجمات والثيمات ---

const lightTheme = {
    background: '#f0f7f0', card: '#FFFFFF', textPrimary: '#212121',
    textSecondary: '#555555', primary: '#2e7d32', contactBg: '#e8f5e9',
    contactText: '#1b5e20', statusBar: 'dark-content',
};

const darkTheme = {
    background: '#121212', card: '#1E1E1E', textPrimary: '#FFFFFF',
    textSecondary: '#B0B0B0', primary: '#66BB6A', contactBg: '#2C2C2C',
    contactText: '#66BB6A', statusBar: 'light-content',
};

const translations = {
    ar: {
        headerTitle: 'حول',
        appName: 'Calora AI', slogan: 'رفيقك الصحي الذكي', aboutUsTitle: 'من نحن؟',
        aboutUsText: '"Calora AI" هو أكثر من مجرد تطبيق لتتبع السعرات الحرارية؛ إنه مساعدك الشخصي للوصول إلى أهدافك الصحية. نحن نؤمن بأن الحفاظ على نمط حياة صحي يجب أن يكون سهلاً ومتاحاً للجميع، وخاصة عند التعامل مع الأطباق المحلية التي نحبها.',
        featuresTitle: 'أهم الميزات', visionTitle: 'رؤيتنا',
        visionText: 'رؤيتنا هي تمكين كل شخص في منطقتنا من السيطرة على صحته من خلال تكنولوجيا بسيطة وذكية ومصممة خصيصاً لتناسب ثقافته وأسلوب حياته.',
        contactTitle: 'تواصل معنا',
        contactIntro: 'نحن هنا لنستمع إليك. إذا كان لديك أي أسئلة، اقتراحات، أو تحتاج إلى مساعدة، لا تتردد في التواصل معنا.',
        version: 'الإصدار 1.0.0', feature1Title: 'حاسبة سعرات بالذكاء الاصطناعي',
        feature1Desc: 'وجّه كاميرتك نحو وجبتك، وسيقوم تطبيقنا بتحليلها فوراً وتقديم معلومات غذائية دقيقة.',
        feature2Title: 'فهم عميق للمطبخ المحلي',
        feature2Desc: 'تم تدريب الذكاء الاصطناعي لدينا خصيصاً على الأطباق المصرية والشرق أوسطية لضمان أعلى دقة.',
        feature3Title: 'تتبع شامل للتقدم',
        feature3Desc: 'سجل وجباتك، تمارينك، شرب الماء، ووزنك في مكان واحد مع رسوم بيانية وتقارير واضحة.',
        feature4Title: 'تذكيرات ذكية ومخصصة',
        feature4Desc: 'لا تفوّت وجبة أو تمرين بعد الآن. قم بتفعيل التذكيرات لتبقى على المسار الصحيح نحو هدفك.',
    },
    en: {
        headerTitle: 'About',
        appName: 'Calora AI', slogan: 'Your Smart Health Companion', aboutUsTitle: 'About Us',
        aboutUsText: '"Calora AI" is more than just a calorie tracking app; it\'s your personal assistant for achieving your health goals. We believe that maintaining a healthy lifestyle should be easy and accessible for everyone, especially when dealing with the local dishes we love.',
        featuresTitle: 'Key Features', visionTitle: 'Our Vision',
        visionText: 'Our vision is to empower everyone in our region to take control of their health through simple, smart technology tailored to their culture and lifestyle.',
        contactTitle: 'Contact Us',
        contactIntro: 'We are here to listen. If you have any questions, suggestions, or need assistance, feel free to contact us.',
        version: 'Version 1.0.0', feature1Title: 'AI-Powered Calorie Counter',
        feature1Desc: 'Just point your camera at your meal, and our app will instantly analyze it, providing accurate nutritional information.',
        feature2Title: 'Deep Understanding of Local Cuisine',
        feature2Desc: 'Our AI is specially trained on Egyptian and Middle Eastern dishes to ensure the highest accuracy.',
        feature3Title: 'Comprehensive Progress Tracking',
        feature3Desc: 'Log your meals, workouts, water intake, and weight in one place with clear charts and reports.',
        feature4Title: 'Smart & Personalized Reminders',
        feature4Desc: 'Never miss a meal or workout again. Enable reminders to stay on track towards your goal.',
    }
};

const AboutScreen = () => {
    const [theme, setTheme] = useState(lightTheme);
    const [language, setLanguage] = useState('ar');
    const navigation = useNavigation();

    const t = (key) => translations[language]?.[key] || key;
    
    useFocusEffect(
        useCallback(() => {
            const loadSettings = async () => {
                try {
                    const savedTheme = await AsyncStorage.getItem('isDarkMode');
                    setTheme(savedTheme === 'true' ? darkTheme : lightTheme);
                    const savedLang = await AsyncStorage.getItem('appLanguage');
                    setLanguage(savedLang || 'ar');
                } catch (error) { console.error("Failed to load settings from storage", error); }
            };
            loadSettings();
        }, [])
    );

    const features = useMemo(() => [
        { icon: 'camera-outline', title: t('feature1Title'), description: t('feature1Desc') },
        { icon: 'food-croissant', title: t('feature2Title'), description: t('feature2Desc') },
        { icon: 'chart-line', title: t('feature3Title'), description: t('feature3Desc') },
        { icon: 'bell-ring-outline', title: t('feature4Title'), description: t('feature4Desc') },
    ], [language, t]);

    const contactEmail = 'optifitstudio0@gmail.com';
    const handleEmailPress = () => { Linking.openURL(`mailto:${contactEmail}`); };

    return (
        <SafeAreaView style={styles.rootContainer(theme)}>
            <StatusBar barStyle={theme.statusBar} backgroundColor={theme.background} />
            
            {/* ✅ تم الإصلاح: Header يعتمد على Flexbox التلقائي */}
            <View style={styles.customHeader(theme)}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    {/* السهم يشير لليمين في العربي ولليسار في الإنجليزي */}
                    <Icon name={I18nManager.isRTL ? "arrow-right" : "arrow-left"} size={28} color={theme.textPrimary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle(theme)}>{t('headerTitle')}</Text>
                <View style={{ width: 40 }} /> 
            </View>

            <ScrollView contentContainerStyle={styles.container}>
                <View style={styles.header}>
                    <Text style={styles.appName(theme)}>{t('appName')}</Text>
                    <Text style={styles.slogan(theme)}>{t('slogan')}</Text>
                </View>

                <View style={styles.card(theme)}>
                    <Text style={styles.sectionTitle(theme)}>{t('aboutUsTitle')}</Text>
                    <Text style={styles.sectionText(theme)}>{t('aboutUsText')}</Text>
                </View>
                <View style={styles.card(theme)}>
                    <Text style={styles.sectionTitle(theme)}>{t('featuresTitle')}</Text>
                    {features.map((feature, index) => (
                        <View key={index} style={styles.featureItem}>
                            <Icon name={feature.icon} size={35} color={theme.primary} style={styles.featureIcon} />
                            <View style={styles.featureTextContainer}>
                                <Text style={styles.featureTitle(theme)}>{feature.title}</Text>
                                <Text style={styles.featureDescription(theme)}>{feature.description}</Text>
                            </View>
                        </View>
                    ))}
                </View>
                <View style={styles.card(theme)}>
                    <Text style={styles.sectionTitle(theme)}>{t('visionTitle')}</Text>
                    <Text style={styles.sectionText(theme)}>{t('visionText')}</Text>
                </View>
                <View style={styles.card(theme)}>
                    <Text style={styles.sectionTitle(theme)}>{t('contactTitle')}</Text>
                    <Text style={styles.sectionText(theme)}>{t('contactIntro')}</Text>
                    <TouchableOpacity style={styles.contactItem(theme)} onPress={handleEmailPress}>
                        <Icon name="email-outline" size={24} color={theme.primary} />
                        <Text style={styles.contactText(theme)}>{contactEmail}</Text>
                    </TouchableOpacity>
                </View>
                <Text style={styles.footerText(theme)}>{t('version')}</Text>
            </ScrollView>
        </SafeAreaView>
    );
};

// ✅ تم تحديث الـ Styles لتكون متوافقة مع العربي والإنجليزي تلقائياً
const styles = {
    rootContainer: (theme) => ({ flex: 1, backgroundColor: theme.background }),
    container: { paddingHorizontal: 20, paddingBottom: 40 },
    // flexDirection: row سيقلب تلقائياً لليمين في العربي
    customHeader: (theme) => ({
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 15,
        paddingTop: 10,
        paddingBottom: 10,
        backgroundColor: theme.background,
    }),
    backButton: { padding: 5, width: 40, alignItems: 'center' },
    headerTitle: (theme) => ({ fontSize: 20, fontWeight: 'bold', color: theme.textPrimary }),
    header: { alignItems: 'center', marginBottom: 30, marginTop: 10 },
    appName: (theme) => ({ fontSize: 32, fontWeight: 'bold', color: theme.textPrimary }),
    slogan: (theme) => ({ fontSize: 16, color: theme.textSecondary, marginTop: 4 }),
    card: (theme) => ({ backgroundColor: theme.card, borderRadius: 12, padding: 20, marginBottom: 20, elevation: 3 }),
    // textAlign: 'left' تعني "بداية السطر" (يمين في العربي)
    sectionTitle: (theme) => ({ fontSize: 22, fontWeight: 'bold', color: theme.primary, marginBottom: 15, textAlign: 'left' }),
    sectionText: (theme) => ({ fontSize: 16, lineHeight: 24, color: theme.textSecondary, textAlign: 'left' }),
    featureItem: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 20 },
    // استخدام MarginEnd للمسافة بين الأيقونة والنص
    featureIcon: { marginEnd: 15 },
    featureTextContainer: { flex: 1 },
    featureTitle: (theme) => ({ fontSize: 17, fontWeight: 'bold', color: theme.textPrimary, textAlign: 'left' }),
    featureDescription: (theme) => ({ fontSize: 14, color: theme.textSecondary, marginTop: 4, lineHeight: 20, textAlign: 'left' }),
    contactItem: (theme) => ({ flexDirection: 'row', alignItems: 'center', marginTop: 20, backgroundColor: theme.contactBg, paddingVertical: 10, paddingHorizontal: 15, borderRadius: 8, alignSelf: 'flex-start' }),
    contactText: (theme) => ({ fontSize: 16, color: theme.contactText, fontWeight: '500', marginHorizontal: 10 }),
    footerText: (theme) => ({ textAlign: 'center', color: theme.textSecondary, marginTop: 20, fontSize: 12 }),
};

export default AboutScreen;