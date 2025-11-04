// BasicInfoScreen.js (الكود الكامل والمعدل)

import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, SafeAreaView,
  Platform, StatusBar, ActivityIndicator, Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome5';
import DateTimePicker from '@react-native-community/datetimepicker';
import AsyncStorage from '@react-native-async-storage/async-storage';
// لا نحتاج لاستيراد supabase هنا لأننا لا نقوم بتحديث البيانات في هذه الشاشة
// import { supabase } from './supabaseclient'; 

// ... (الثيمات والترجمات كما هي، لا تغيير) ...
const lightTheme = { primary: '#388E3C', textAndIcons: '#2E7D32', background: '#F7FDF9', white: '#FFFFFF', cardBorder: '#EFF2F1', grayText: '#888888', disabled: '#A5D6A7', progressBarBg: '#E8F5E9', statusBar: 'dark-content' };
const darkTheme = { primary: '#66BB6A', textAndIcons: '#AED581', background: '#121212', white: '#1E1E1E', cardBorder: '#272727', grayText: '#B0B0B0', disabled: '#4CAF50', progressBarBg: '#333333', statusBar: 'light-content' };
const translations = { en: { title: "Let's Start with the Basics", subtitle: "We need some basic information to calculate your plan accurately.", genderLabel: "Gender", male: "Male", female: "Female", birthDateLabel: "Date of Birth", nextButton: "Next" }, ar: { title: "لنبدأ بالأساسيات", subtitle: "نحتاج لبعض المعلومات البسيطة لحساب خطتك بدقة.", genderLabel: "الجنس", male: "ذكر", female: "أنثى", birthDateLabel: "تاريخ الميلاد", nextButton: "التالي" } };

// ... (المكونات المساعدة كما هي) ...
const ProgressBar = ({ step, totalSteps, theme }) => (<View style={styles.progressBarContainer(theme)}><View style={[styles.progressBar(theme), { width: `${(step / totalSteps) * 100}%` }]} /></View>);
const PrimaryButton = ({ title, onPress, disabled = false, theme, loading = false }) => (<TouchableOpacity style={[styles.button(theme), (disabled || loading) ? styles.buttonDisabled(theme) : styles.buttonEnabled(theme)]} onPress={onPress} disabled={disabled || loading} activeOpacity={0.7}>{loading ? <ActivityIndicator color={theme.background === '#121212' ? '#000' : '#FFF'} /> : <Text style={styles.buttonText(theme)}>{title}</Text>}</TouchableOpacity>);


const BasicInfoScreen = ({ navigation }) => {
  const [gender, setGender] = useState(null);
  const [date, setDate] = useState(new Date(2000, 0, 1));
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [language, setLanguage] = useState('ar');
  
  // لا نحتاج حالة تحميل هنا
  // const [isLoading, setIsLoading] = useState(false);

  const theme = isDarkMode ? darkTheme : lightTheme;
  const isRTL = language === 'ar';
  const t = (key) => translations[language]?.[key] || translations['en'][key];
  
  useEffect(() => {
    const loadSettings = async () => {
      const darkMode = await AsyncStorage.getItem('isDarkMode');
      setIsDarkMode(darkMode === 'true');
      const lang = await AsyncStorage.getItem('appLanguage');
      if (lang) setLanguage(lang);
    };
    loadSettings();
  }, []);

  const onDateChange = (event, selectedDate) => {
    const currentDate = selectedDate || date;
    setShowDatePicker(Platform.OS === 'ios');
    setDate(currentDate);
  };
  
  // ✅ --- التعديل الرئيسي هنا --- ✅
  const handleNextPress = () => {
    if (!gender) return;
    
    // سنقوم فقط بنقل المستخدم إلى الشاشة التالية مع تمرير البيانات التي أدخلها
    navigation.navigate('Measurements', {
      gender: gender,
      birthDate: date.toISOString(),
    });
  };

  /*
    🔥🔥🔥 تذكير هام جداً 🔥🔥🔥
    في آخر شاشة من شاشات الإعداد (مثلاً ResultsScreen.js)، يجب أن تضع دالة مشابهة لهذه:
    
    import { supabase } from './supabaseclient'; // تأكد من استيراد supabase
    
    const handleFinishOnboarding = async () => {
        // isLoading state لتشغيل مؤشر التحميل
        setIsLoading(true);
        try {
            // بيانات مجمعة من الشاشات السابقة (ستكون في route.params)
            // بالإضافة إلى البيانات من الشاشة الحالية
            const finalUserData = {
                gender: route.params.gender,
                birthDate: route.params.birthDate,
                weight: route.params.weight,
                height: route.params.height,
                goal: currentGoal, // من الشاشة الحالية
                activityLevel: currentActivityLevel, // من الشاشة الحالية
                onboarding_complete: true, // الأهم على الإطلاق!
            };

            // تحديث بيانات المستخدم في Supabase
            const { error } = await supabase.auth.updateUser({ data: finalUserData });
            
            if (error) throw error;
            
            // لا تحتاج إلى navigation.replace('MainUI') هنا!
            // App.js سيقوم بذلك تلقائيًا عند تحديث بيانات المستخدم.

        } catch(error) {
            Alert.alert("خطأ", "لم نتمكن من حفظ بياناتك. الرجاء المحاولة مرة أخرى.");
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    }

    واستدعِ هذه الدالة عند الضغط على زر "إنهاء" أو "ابدأ رحلتك".
  */

  const isNextButtonDisabled = !gender;
  const formattedDate = date.toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US', {
    day: '2-digit', month: 'long', year: 'numeric'
  });

  return (
    <SafeAreaView style={styles.safeArea(theme)}>
      <StatusBar barStyle={theme.statusBar} backgroundColor={theme.background} />
      <View style={styles.container}>
        <ProgressBar step={1} totalSteps={4} theme={theme} />

        <View style={styles.headerContainer}>
          <Text style={styles.title(theme)}>{t('title')}</Text>
          <Text style={styles.subtitle(theme)}>{t('subtitle')}</Text>
        </View>

        <View style={styles.formContainer}>
          <Text style={styles.label(theme, isRTL)}>{t('genderLabel')}</Text>
          <View style={styles.genderSelector}>
            <TouchableOpacity
              style={[styles.genderBox(theme), gender === 'male' && styles.genderBoxSelected(theme)]}
              onPress={() => setGender('male')}>
              <Icon name="mars" size={40} color={gender === 'male' ? (isDarkMode ? theme.background : theme.white) : theme.textAndIcons} />
              <Text style={[styles.genderText(theme), gender === 'male' && styles.genderTextSelected(theme, isDarkMode)]}>{t('male')}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.genderBox(theme), gender === 'female' && styles.genderBoxSelected(theme)]}
              onPress={() => setGender('female')}>
              <Icon name="venus" size={40} color={gender === 'female' ? (isDarkMode ? theme.background : theme.white) : theme.textAndIcons} />
              <Text style={[styles.genderText(theme), gender === 'female' && styles.genderTextSelected(theme, isDarkMode)]}>{t('female')}</Text>
            </TouchableOpacity>
          </View>

          <Text style={[styles.label(theme, isRTL), { marginTop: 30 }]}>{t('birthDateLabel')}</Text>
          <TouchableOpacity style={styles.dateInput(theme, isRTL)} onPress={() => setShowDatePicker(true)}>
            <Text style={styles.dateText(theme)}>{formattedDate}</Text>
            <Icon name="calendar-alt" size={20} color={theme.grayText} />
          </TouchableOpacity>

          {showDatePicker && (
            <DateTimePicker
              value={date} mode="date" display={Platform.OS === 'ios' ? "spinner" : "default"}
              onChange={onDateChange}
              maximumDate={new Date(new Date().setFullYear(new Date().getFullYear() - 12))}
              locale={language}
            />
          )}
        </View>

        <View style={styles.footer}>
          <PrimaryButton
            title={t('nextButton')} onPress={handleNextPress}
            disabled={isNextButtonDisabled} theme={theme}
          />
        </View>
      </View>
    </SafeAreaView>
  );
};

// ... (الـ Styles كما هي، لا تغيير) ...
const styles = {
  safeArea: (theme) => ({ flex: 1, backgroundColor: theme.background }),
  container: { flex: 1, padding: 24 },
  progressBarContainer: (theme) => ({ height: 8, width: '100%', backgroundColor: theme.progressBarBg, borderRadius: 4, marginBottom: 20 }),
  progressBar: (theme) => ({ height: '100%', backgroundColor: theme.primary, borderRadius: 4 }),
  headerContainer: { alignItems: 'center', marginVertical: 20 },
  title: (theme) => ({ fontSize: 28, fontWeight: 'bold', color: theme.textAndIcons, marginBottom: 10 }),
  subtitle: (theme) => ({ fontSize: 16, color: theme.grayText, textAlign: 'center', paddingHorizontal: 20 }),
  formContainer: { flex: 1, justifyContent: 'center' },
  label: (theme, isRTL) => ({ fontSize: 18, color: theme.textAndIcons, marginBottom: 12, fontWeight: '600', textAlign: isRTL ? 'right' : 'left' }),
  genderSelector: { flexDirection: 'row', justifyContent: 'space-around' },
  genderBox: (theme) => ({ flex: 1, height: 140, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.white, borderRadius: 16, borderWidth: 1, borderColor: theme.cardBorder, marginHorizontal: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 4 }),
  genderBoxSelected: (theme) => ({ backgroundColor: theme.primary, borderColor: theme.primary, shadowColor: theme.primary, shadowOpacity: 0.3, elevation: 8 }),
  genderText: (theme) => ({ marginTop: 12, fontSize: 16, color: theme.textAndIcons, fontWeight: 'bold' }),
  genderTextSelected: (theme, isDarkMode) => ({ color: isDarkMode ? theme.background : theme.white }),
  dateInput: (theme, isRTL) => ({ flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: theme.white, borderRadius: 16, padding: 18, borderWidth: 1, borderColor: theme.cardBorder }),
  dateText: (theme) => ({ fontSize: 16, color: theme.textAndIcons, fontWeight: '500' }),
  footer: { paddingBottom: 20, paddingTop: 10 },
  button: (theme) => ({ paddingVertical: 18, borderRadius: 16, alignItems: 'center', justifyContent: 'center', width: '100%' }),
  buttonEnabled: (theme) => ({ backgroundColor: theme.primary, shadowColor: theme.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 5, elevation: 6 }),
  buttonDisabled: (theme) => ({ backgroundColor: theme.disabled }),
  buttonText: (theme) => ({ color: theme.background === '#121212' ? '#000' : '#FFF', fontSize: 18, fontWeight: 'bold' }),
};

export default BasicInfoScreen;