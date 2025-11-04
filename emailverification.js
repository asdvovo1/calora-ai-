// File: emailverification.js (تمت إعادة هيكلته ليعمل بشكل صحيح مع لوحة المفاتيح)

import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, TextInput,
  TouchableOpacity, StatusBar, Dimensions, Image, Animated, Alert, ActivityIndicator,
  // === تمت إضافة المكونات الضرورية ===
  KeyboardAvoidingView,
  ScrollView,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import Svg, { Path, Defs, LinearGradient, Stop } from 'react-native-svg';
import { useFocusEffect, useRoute } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabaseclient'; // تأكد من المسار الصحيح

const { width, height } = Dimensions.get('window');

// --- الثيمات والترجمات (بدون تغيير) ---
const lightTheme = {
    primary: '#4CAF50', secondary: '#2ECC71', background: '#FFFFFF', textPrimary: '#212529',
    textSecondary: '#6C757D', borderColor: '#E9ECEF', headerText: '#FFFFFF', statusBar: 'light-content', otpBoxBackground: '#F7F8F9',
};
const darkTheme = {
    primary: '#66BB6A', secondary: '#81C784', background: '#121212', textPrimary: '#FFFFFF',
    textSecondary: '#B0B0B0', borderColor: '#2C2C2C', headerText: '#FFFFFF', statusBar: 'light-content', otpBoxBackground: '#1E1E1E',
};
const translations = {
    ar: {
        headerTitle: 'التحقق من الرمز', title: 'أدخل الرمز',
        subtitle: 'الرجاء إدخال الرمز المكون من 6 أرقام الذي تم إرساله إلى بريدك الإلكتروني.',
        resendPrompt: 'لم تستلم الرمز؟ ', resendButton: 'إعادة الإرسال',
        verifyButton: 'تأكيد ومتابعة', alertTitle: 'خطأ',
        otpError: 'الرجاء إدخال الرمز كاملاً.',
        invalidOtp: 'الرمز الذي أدخلته غير صحيح. حاول مرة أخرى.',
    },
    en: {
        headerTitle: 'Email Verification', title: 'Get Your Code',
        subtitle: 'Please enter the 6 digit code that was sent to your email address.',
        resendPrompt: "If you didn't receive a code? ", resendButton: 'Resend',
        verifyButton: 'Verify and Proceed', alertTitle: 'Error',
        otpError: 'Please enter the complete code.',
        invalidOtp: 'The code you entered is incorrect. Please try again.',
    }
};

// مكون الهيدر المدمج ليتم وضعه داخل ScrollView
const HeaderComponent = ({ theme, isRTL, navigation, title }) => (
    <View style={styles.headerContainer}>
        <Svg height={height * 0.18} width={width} style={{ position: 'absolute', top: 0 }}>
            <Defs>
                <LinearGradient id="grad-verify" x1="0" y1="0" x2="1" y2="0">
                    <Stop offset="0" stopColor={theme.primary} />
                    <Stop offset="1" stopColor={theme.secondary} />
                </LinearGradient>
            </Defs>
            <Path d={`M0,0 L${width},0 L${width},${height * 0.12} Q${width / 2},${height * 0.18} 0,${height * 0.12} Z`} fill="url(#grad-verify)" />
        </Svg>
        <View style={styles.headerContent}>
            <TouchableOpacity style={styles.backButton(isRTL)} onPress={() => navigation.goBack()}>
                <Icon name={isRTL ? "arrow-right" : "arrow-left"} size={24} color={theme.headerText} />
            </TouchableOpacity>
            <Text style={styles.headerTitle(theme)}>{title}</Text>
        </View>
    </View>
);

const EmailVerificationScreen = ({ navigation }) => {
    const [theme, setTheme] = useState(lightTheme);
    const [language, setLanguage] = useState('en');
    const [isRTL, setIsRTL] = useState(false);
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState('');
    const inputs = useRef([]);
    const scaleAnim = useRef(otp.map(() => new Animated.Value(1))).current;
    const route = useRoute();

    const t = (key) => translations[language]?.[key] || key;

    useEffect(() => {
        if (route.params?.email) setEmail(route.params.email);
    }, [route.params?.email]);

    useFocusEffect(
        useCallback(() => {
            const loadSettings = async () => {
                try {
                    const savedTheme = await AsyncStorage.getItem('isDarkMode');
                    setTheme(savedTheme === 'true' ? darkTheme : lightTheme);
                    const savedLang = await AsyncStorage.getItem('appLanguage');
                    const currentLang = savedLang || 'en';
                    setLanguage(currentLang);
                    setIsRTL(currentLang === 'ar');
                } catch (e) { console.error('Failed to load settings.', e); }
            };
            loadSettings();
        }, [])
    );

    const animateBox = (index) => { Animated.sequence([Animated.timing(scaleAnim[index], { toValue: 1.1, duration: 100, useNativeDriver: true }), Animated.timing(scaleAnim[index], { toValue: 1, duration: 100, useNativeDriver: true })]).start(); };
    const handleOtpChange = (text, index) => {
        const newOtp = [...otp];
        newOtp[index] = text;
        setOtp(newOtp);
        animateBox(index);
        if (text && index < 5) inputs.current[index + 1]?.focus();
    };
    const handleBackspace = ({ nativeEvent }, index) => { if (nativeEvent.key === 'Backspace' && !otp[index] && index > 0) inputs.current[index - 1]?.focus(); };
    
    const handleVerify = async () => {
        const token = otp.join('');
        if (token.length !== 6) { Alert.alert(t('alertTitle'), t('otpError')); return; }
        setLoading(true);
        try {
            const { error } = await supabase.auth.verifyOtp({ email: email, token: token, type: 'recovery' });
            if (error) {
                Alert.alert(t('alertTitle'), t('invalidOtp'));
            } else {
                navigation.navigate('ResetPassword');
            }
        } catch (error) {
            Alert.alert(t('alertTitle'), 'An unexpected error occurred.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.safeArea(theme)}>
            <StatusBar barStyle={theme.statusBar} backgroundColor={theme.primary} />
            <KeyboardAvoidingView 
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={{flex: 1}}
            >
                <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                    
                    <HeaderComponent 
                        theme={theme} 
                        isRTL={isRTL} 
                        navigation={navigation} 
                        title={t('headerTitle')}
                    />

                    <View style={styles.formContainer}>
                        <Text style={styles.title(theme)}>{t('title')}</Text>
                        <Text style={styles.subtitle(theme)}>{t('subtitle')}</Text>
                        <View style={styles.otpContainer(isRTL)}>
                            {otp.map((digit, index) => (
                                <Animated.View key={index} style={{ transform: [{ scale: scaleAnim[index] }] }}>
                                    <TextInput
                                        ref={(input) => (inputs.current[index] = input)}
                                        style={styles.otpBox(theme)}
                                        keyboardType="number-pad"
                                        maxLength={1}
                                        onChangeText={(text) => handleOtpChange(text, index)}
                                        onKeyPress={(e) => handleBackspace(e, index)}
                                        value={digit}
                                    />
                                </Animated.View>
                            ))}
                        </View>
                        <View style={styles.resendContainer(isRTL)}>
                            <Text style={styles.resendText(theme)}>{t('resendPrompt')}</Text>
                            <TouchableOpacity><Text style={styles.resendButtonText(theme)}>{t('resendButton')}</Text></TouchableOpacity>
                        </View>
                        <TouchableOpacity style={styles.verifyButton(theme)} onPress={handleVerify} disabled={loading}>
                            {loading ? <ActivityIndicator color={theme.headerText} /> : <Text style={styles.verifyButtonText(theme)}>{t('verifyButton')}</Text>}
                        </TouchableOpacity>
                    </View>
                    
                    <View>
                        <Image source={require('./assets/leavesdecoration.png')} style={styles.footerImage} />
                    </View>

                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

// ==========================================================
// ===== ✅ الأنماط النهائية التي تطابق سلوك شاشة تسجيل الدخول ✅ =====
// ==========================================================
const styles = {
    safeArea: (theme) => ({ flex: 1, backgroundColor: theme.background }),
    
    headerContainer: { height: height * 0.22 },
    headerContent: { marginTop: (StatusBar.currentHeight || 40) + 10, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, height: 60 },
    backButton: (isRTL) => ({ padding: 10, position: 'absolute', [isRTL ? 'right' : 'left']: 15, zIndex: 1 }),
    headerTitle: (theme) => ({ fontSize: 20, fontWeight: 'bold', color: theme.headerText, textAlign: 'center', flex: 1 }),
    
    formContainer: { 
        flex: 1, 
        justifyContent: 'center', 
        paddingHorizontal: 30, 
        paddingBottom: 20 
    },
    title: (theme) => ({ fontSize: 26, fontWeight: 'bold', color: theme.textPrimary, textAlign: 'center', marginBottom: 15 }),
    subtitle: (theme) => ({ fontSize: 15, color: theme.textSecondary, textAlign: 'center', marginBottom: 40, lineHeight: 22, maxWidth: '90%', alignSelf: 'center' }),
    otpContainer: (isRTL) => ({ flexDirection: isRTL ? 'row-reverse' : 'row', justifyContent: 'space-between', width: '100%', marginBottom: 20 }),
    otpBox: (theme) => ({ width: 50, height: 60, borderRadius: 12, borderWidth: 1, borderColor: theme.borderColor, backgroundColor: theme.otpBoxBackground, textAlign: 'center', fontSize: 24, fontWeight: 'bold', color: theme.textPrimary }),
    resendContainer: (isRTL) => ({ flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', justifyContent: 'center', marginTop: 10, marginBottom: 40 }),
    resendText: (theme) => ({ fontSize: 14, color: theme.textSecondary }),
    resendButtonText: (theme) => ({ fontSize: 14, color: theme.primary, fontWeight: 'bold' }),
    verifyButton: (theme) => ({ backgroundColor: theme.primary, paddingVertical: 18, borderRadius: 12, alignItems: 'center', width: '100%', shadowColor: theme.primary, shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 8 }),
    verifyButtonText: (theme) => ({ color: theme.headerText, fontSize: 18, fontWeight: 'bold' }),
    
    footerImage: { width: width, height: 80, resizeMode: 'cover' },
};

export default EmailVerificationScreen;