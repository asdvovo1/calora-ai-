import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Pressable,
  Image,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';

// --- الثيمات (مظهر فاتح وداكن) ---
const lightTheme = {
  primary: '#388E3C',
  textAndIcons: '#2E7D32',
  background: '#F9FBFA',
  white: '#FFFFFF',
  cardBorder: '#EFF2F1',
  grayText: '#888888',
  disabled: '#A5D6A7',
  progressBarBg: '#E8F5E9',
  statusBar: 'dark-content',
};

const darkTheme = {
  primary: '#66BB6A',
  textAndIcons: '#AED581',
  background: '#121212',
  white: '#1E1E1E',
  cardBorder: '#272727',
  grayText: '#B0B0B0',
  disabled: '#424242',
  progressBarBg: '#333333',
  statusBar: 'light-content',
};

// --- ملف الترجمة ---
const translations = {
  en: {
    title: 'How Active Are You?',
    subtitle: 'This helps us calculate your daily calorie burn.',
    sedentaryTitle: 'Sedentary',
    sedentaryDescription: 'Desk job, mostly sitting, no exercise.',
    lightTitle: 'Lightly Active',
    lightDescription: 'Light movement or exercise 1-2 times/week.',
    activeTitle: 'Active',
    activeDescription: 'Moderate exercise 3-5 times/week.',
    veryActiveTitle: 'Very Active',
    veryActiveDescription: 'Daily intense exercise or a physical job.',
    buttonTitle: 'Calculate My Plan',
  },
  ar: {
    title: 'كيف تصف مستوى نشاطك؟',
    subtitle: 'هذا يساعدنا على حساب عدد السعرات التي يحرقها جسمك يومياً.',
    sedentaryTitle: 'خامل',
    sedentaryDescription: 'عمل مكتبي، معظم اليوم جلوس، بدون تمارين.',
    lightTitle: 'خفيف النشاط',
    lightDescription: 'حركة خفيفة أو تمارين 1-2 مرة أسبوعياً.',
    activeTitle: 'نشيط',
    activeDescription: 'تمارين متوسطة الشدة 3-5 مرات أسبوعياً.',
    veryActiveTitle: 'نشيط جداً',
    veryActiveDescription: 'تمارين يومية عنيفة أو عمل يتطلب مجهوداً بدنياً.',
    buttonTitle: 'احسب خطتي',
  },
};

// --- المكونات المساعدة ---

const ProgressBar = ({ step, totalSteps, theme }) => (
  <View style={styles.progressBarContainer(theme)}>
    <View style={[styles.progressBar(theme), { width: `${(step / totalSteps) * 100}%` }]} />
  </View>
);

const PrimaryButton = ({ title, onPress, disabled = false, theme }) => (
  <Pressable
    style={({ pressed }) => [
      styles.button(theme),
      disabled ? styles.buttonDisabled(theme) : styles.buttonEnabled(theme),
      pressed && !disabled && styles.buttonPressed,
    ]}
    onPress={() => {
      if (!disabled) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        onPress();
      }
    }}
    disabled={disabled}>
    <Text style={styles.buttonText(theme)}>{title}</Text>
  </Pressable>
);

const ScreenHeader = ({ title, subtitle, theme }) => (
  <View style={styles.headerContainer}>
    <Text style={styles.title(theme)}>{title}</Text>
    <Text style={styles.subtitle(theme)}>{subtitle}</Text>
  </View>
);

const ActivityCard = ({ title, description, icon, isSelected, onPress, theme, isRTL }) => {
  const iconColor = isSelected ? (theme.background === '#121212' ? '#121212' : theme.white) : theme.primary;

  const renderIcon = () => (
    <View style={styles.iconContainer}>
      {icon.type === 'image' ? (
        <Image source={icon.source} style={[styles.activityCardImage, icon.style, { tintColor: iconColor }]} />
      ) : (
        <Icon name={icon.name} size={28} color={iconColor} />
      )}
    </View>
  );

  return (
    <Pressable
      style={({ pressed }) => [
        styles.activityCard(theme, isRTL),
        isSelected && styles.activityCardSelected(theme),
        pressed && styles.cardPressed,
      ]}
      onPress={onPress}>
      {renderIcon()}
      <View style={styles.activityTextContainer(isRTL)}>
        <Text style={[styles.activityCardTitle(theme, isRTL), isSelected && styles.activityCardTextSelected(theme)]}>
          {title}
        </Text>
        <Text style={[styles.activityCardDescription(theme, isRTL), isSelected && styles.activityCardTextSelected(theme)]}>
          {description}
        </Text>
      </View>
    </Pressable>
  );
};

// --- شاشة مستوى النشاط (المكون الرئيسي) ---

const ActivityLevelScreen = ({ navigation, route }) => {
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [theme, setTheme] = useState(lightTheme);
  const [language, setLanguage] = useState('ar');

  const isRTL = language === 'ar';
  const t = (key) => translations[language]?.[key] || translations['en'][key];

  const ACTIVITY_LEVELS = [
    { key: 'sedentary', title: t('sedentaryTitle'), description: t('sedentaryDescription'), icon: { type: 'image', source: require('./assets/idleman.png'), style: { width: 34, height: 34 } } },
    { key: 'light', title: t('lightTitle'), description: t('lightDescription'), icon: { type: 'icon', name: 'walk' } },
    { key: 'active', title: t('activeTitle'), description: t('activeDescription'), icon: { type: 'icon', name: 'run' } },
    { key: 'very_active', title: t('veryActiveTitle'), description: t('veryActiveDescription'), icon: { type: 'image', source: require('./assets/veryactiveman.png'), style: { width: 42, height: 42 } } },
  ];

  // تحميل إعدادات اللغة والثيم عند الدخول للشاشة
  useFocusEffect(
    React.useCallback(() => {
      const loadSettings = async () => {
        try {
            const darkMode = await AsyncStorage.getItem('isDarkMode');
            setTheme(darkMode === 'true' ? darkTheme : lightTheme);
            const lang = await AsyncStorage.getItem('appLanguage');
            setLanguage(lang || 'ar');
        } catch (e) {
            console.error("Failed to load settings.", e);
        }
      };
      loadSettings();
    }, [])
  );

  const handleSelection = (activityKey) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedActivity(activityKey);
  };

  const handleCalculatePlan = () => {
    const finalUserData = {
      // <<< ✅✅✅ التصحيح هنا: نقرأ البيانات من route.params مباشرة
      ...(route.params || {}), 
      activityLevel: selectedActivity,
    };
    // الانتقال إلى شاشة النتائج مع إرسال كل بيانات المستخدم
    navigation.navigate('Results', { userData: finalUserData });
  };

  const isButtonDisabled = !selectedActivity;

  return (
    <SafeAreaView style={styles.safeArea(theme)}>
      <StatusBar barStyle={theme.statusBar} backgroundColor={theme.background} />
      <View style={styles.container}>
        <ProgressBar step={4} totalSteps={4} theme={theme} />
        <ScreenHeader title={t('title')} subtitle={t('subtitle')} theme={theme} />

        <View style={styles.cardsContainer}>
          {ACTIVITY_LEVELS.map((level) => (
            <ActivityCard
              key={level.key}
              title={level.title}
              description={level.description}
              icon={level.icon}
              isSelected={selectedActivity === level.key}
              onPress={() => handleSelection(level.key)}
              theme={theme}
              isRTL={isRTL}
            />
          ))}
        </View>

        <View style={styles.footer}>
          <PrimaryButton
            title={t('buttonTitle')}
            onPress={handleCalculatePlan}
            disabled={isButtonDisabled}
            theme={theme}
          />
        </View>
      </View>
    </SafeAreaView>
  );
};

// --- الأنماط (Styles) ---

const styles = StyleSheet.create({
  safeArea: (theme) => ({
    flex: 1,
    backgroundColor: theme.background,
  }),
  container: {
    flex: 1,
    padding: 24,
  },
  progressBarContainer: (theme) => ({
    height: 8,
    width: '100%',
    backgroundColor: theme.progressBarBg,
    borderRadius: 4,
    marginBottom: 20,
  }),
  progressBar: (theme) => ({
    height: '100%',
    backgroundColor: theme.primary,
    borderRadius: 4,
  }),
  headerContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  title: (theme) => ({
    fontSize: 26,
    fontWeight: 'bold',
    color: theme.textAndIcons,
    marginBottom: 10,
    textAlign: 'center',
  }),
  subtitle: (theme) => ({
    fontSize: 15,
    color: theme.grayText,
    textAlign: 'center',
    lineHeight: 22,
  }),
  cardsContainer: {
    flex: 1,
    justifyContent: 'space-around',
    paddingVertical: 10,
  },
  footer: {
    paddingBottom: 20,
    paddingTop: 10,
  },
  button: (theme) => ({
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  }),
  buttonEnabled: (theme) => ({
    backgroundColor: theme.primary,
    shadowColor: theme.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 6,
  }),
  buttonDisabled: (theme) => ({
    backgroundColor: theme.disabled,
    elevation: 0,
    shadowColor: 'transparent',
  }),
  buttonPressed: {
    transform: [{ scale: 0.98 }],
    shadowOpacity: 0.15,
  },
  buttonText: (theme) => ({
    color: theme.background === '#121212' ? '#121212' : '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  }),
  activityCard: (theme, isRTL) => ({
    backgroundColor: theme.white,
    paddingHorizontal: 20,
    paddingVertical: 9,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: theme.cardBorder,
    flexDirection: isRTL ? 'row-reverse' : 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
  }),
  activityCardSelected: (theme) => ({
    backgroundColor: theme.primary,
    borderColor: theme.primary,
    elevation: 6,
    shadowColor: theme.primary,
    shadowOpacity: 0.2,
  }),
  cardPressed: {
    transform: [{ scale: 0.99 }],
  },
  iconContainer: {
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activityCardImage: {
    resizeMode: 'contain',
  },
  activityTextContainer: (isRTL) => ({
    flex: 1,
    ...(isRTL ? { marginRight: 15 } : { marginLeft: 15 }),
  }),
  activityCardTitle: (theme, isRTL) => ({
    fontSize: 17,
    fontWeight: 'bold',
    color: theme.textAndIcons,
    textAlign: isRTL ? 'right' : 'left',
  }),
  activityCardDescription: (theme, isRTL) => ({
    fontSize: 13,
    color: theme.grayText,
    textAlign: isRTL ? 'right' : 'left',
    marginTop: 4,
    lineHeight: 18,
  }),
  activityCardTextSelected: (theme) => ({
    color: theme.background === '#121212' ? '#121212' : '#FFF',
  }),
});

export default ActivityLevelScreen;