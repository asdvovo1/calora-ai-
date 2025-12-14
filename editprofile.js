import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, SafeAreaView, ScrollView, TouchableOpacity, Image, TextInput, Alert, Platform, Keyboard, ActivityIndicator } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons'; 
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { supabase } from './supabaseclient';

const translations = {
  en: { 
    editProfile: 'EDIT PROFILE', publicInfo: 'PUBLIC INFORMATION', firstName: 'First name', lastName: 'Last name', mail: 'Mail', physicalMetrics: 'PHYSICAL METRICS', gender: 'Gender', male: 'Male', female: 'Female', dob: 'Date of Birth', height: 'Height (cm)', currentWeight: 'Current Weight (kg)', goals: 'GOALS', mainGoal: 'Main Goal', lose: 'Lose', maintain: 'Maintain', gain: 'Gain', targetWeight: 'Target Weight (kg)', activityLevel: 'Activity Level', sedentary: 'Sedentary', light: 'Light', active: 'Active', very_active: 'Very Active', profilePic: 'Profile Picture', chooseNewPic: 'Choose your new picture', takePhoto: 'Take Photo', chooseFromGallery: 'Choose from Gallery', cancel: 'Cancel', success: 'Success', saveSuccess: 'Changes saved successfully!', error: 'Error', saveError: 'An error occurred while saving data.', 
  },
  ar: { 
    editProfile: 'تعديل الملف الشخصي', publicInfo: 'المعلومات العامة', firstName: 'الاسم الأول', lastName: 'الاسم الأخير', mail: 'البريد الإلكتروني', physicalMetrics: 'المقاييس البدنية', gender: 'الجنس', male: 'ذكر', female: 'أنثى', dob: 'تاريخ الميلاد', height: 'الطول (سم)', currentWeight: 'الوزن الحالي (كغ)', goals: 'الأهداف', mainGoal: 'الهدف الرئيسي', lose: 'خسارة وزن', maintain: 'الحفاظ على الوزن', gain: 'زيادة وزن', targetWeight: 'الوزن المستهدف (كغ)', activityLevel: 'مستوى النشاط', sedentary: 'خامل', light: 'خفيف', active: 'نشيط', very_active: 'نشيط جداً', profilePic: 'صورة الملف الشخصي', chooseNewPic: 'اختر صورتك الجديدة', takePhoto: 'التقاط صورة', chooseFromGallery: 'اختيار من المعرض', cancel: 'إلغاء', success: 'نجاح', saveSuccess: 'تم حفظ التغييرات بنجاح!', error: 'خطأ', saveError: 'حدث خطأ أثناء حفظ البيانات.', 
  },
};

const lightTheme = { background: '#F7FDF9', surface: '#FFFFFF', textDark: '#1D1D1D', textGray: '#888888', primary: '#388E3C', border: '#EFEFEF', disabledBackground: '#F7F7F7', icon: '#1D1D1D' };
const darkTheme = { background: '#121212', surface: '#1E1E1E', textDark: '#FFFFFF', textGray: '#A5A5A5', primary: '#66BB6A', border: '#38383A', disabledBackground: '#3A3A3C', icon: '#FFFFFF' };

const calculateCalories = (userData) => { if (!userData || !userData.birthDate || !userData.weight || !userData.height || !userData.gender || !userData.activityLevel || !userData.goal) return 2000; const { birthDate, gender, weight, height, activityLevel, goal } = userData; const age = new Date().getFullYear() - new Date(birthDate).getFullYear(); let bmr = (gender === 'male') ? (10 * weight + 6.25 * height - 5 * age + 5) : (10 * weight + 6.25 * height - 5 * age - 161); const activityMultipliers = { sedentary: 1.2, light: 1.375, active: 1.55, very_active: 1.725 }; const tdee = bmr * (activityMultipliers[activityLevel] || 1.2); let finalCalories; switch (goal) { case 'lose': finalCalories = tdee - 500; break; case 'gain': finalCalories = tdee + 500; break; default: finalCalories = tdee; break; } return Math.max(1200, Math.round(finalCalories)); };

const InfoInput = React.memo(({ label, value, onChangeText, keyboardType = 'default', theme }) => { 
  return ( 
    <View style={styles.inputContainer(theme)}>
        <View style={{flex: 1}}>
            <Text style={styles.inputLabel(theme)}>{label}</Text>
            <TextInput style={styles.textInput(theme)} value={value} onChangeText={onChangeText} keyboardType={keyboardType} placeholderTextColor={theme.textGray} />
        </View>
        {value && String(value).trim().length > 0 && <Ionicons name="checkmark-circle-outline" size={24} color={theme.primary} />}
    </View> 
  ); 
});

const OptionSelector = React.memo(({ label, options, selectedValue, onSelect, theme }) => { 
  return ( 
    <View style={styles.optionContainer}>
        <Text style={styles.inputLabel(theme)}>{label}</Text>
        <View style={styles.optionsWrapper}>
            {options.map((option) => ( 
                <TouchableOpacity key={option.value} style={[styles.optionButton(theme), selectedValue === option.value && styles.optionButtonSelected(theme)]} onPress={() => onSelect(option.value)}>
                    <Text style={[styles.optionText(theme), selectedValue === option.value && styles.optionTextSelected]} numberOfLines={1} adjustsFontSizeToFit>{option.label}</Text>
                </TouchableOpacity> 
            ))}
        </View>
    </View> 
  ); 
});

const EditProfileScreen = ({ appLanguage }) => {
  const navigation = useNavigation();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [profileImage, setProfileImage] = useState(null);
  const [gender, setGender] = useState(null);
  const [birthDate, setBirthDate] = useState(new Date());
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [goal, setGoal] = useState(null);
  const [targetWeight, setTargetWeight] = useState('');
  const [activityLevel, setActivityLevel] = useState(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [keyboardPadding, setKeyboardPadding] = useState(50);
  const [isLoading, setIsLoading] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(false);
  
  const [activeLanguage, setActiveLanguage] = useState(appLanguage || 'en');
  const isRTL = activeLanguage === 'ar';

  const theme = isDarkMode ? darkTheme : lightTheme;
  const t = (key) => translations[activeLanguage]?.[key] || translations['en'][key];

  useFocusEffect(
    useCallback(() => {
      const loadSettingsAndData = async () => {
        setIsLoading(true);
        try {
          const savedLang = await AsyncStorage.getItem('appLanguage');
          const savedTheme = await AsyncStorage.getItem('isDarkMode');
          
          if (savedLang) setActiveLanguage(savedLang);
          else if (appLanguage) setActiveLanguage(appLanguage);

          setIsDarkMode(savedTheme === 'true');

          // 1. Load Local Data First (Backup)
          const jsonValue = await AsyncStorage.getItem('userProfile');
          if (jsonValue != null) {
            const data = JSON.parse(jsonValue);
            setFirstName(data.firstName || '');
            setLastName(data.lastName || '');
            // ✅ مهم: تحميل الإيميل من التخزين المحلي كبداية
            if (data.email) setEmail(data.email);
          }

          // 2. Load Auth Data (Source of Truth for Email)
          const { data: { user } } = await supabase.auth.getUser();
          
          if (user) {
             // ✅ مهم: تحديث الإيميل من Supabase Auth (ده الأهم)
             if (user.email) setEmail(user.email);

             // 3. Load Profile Data from Supabase Table
             const { data: supabaseProfile, error } = await supabase.from('profiles').select('*').eq('id', user.id).single();

             if (!error && supabaseProfile) {
                setFirstName(supabaseProfile.first_name || firstName);
                setLastName(supabaseProfile.last_name || lastName);
                setProfileImage(supabaseProfile.profile_image_url || null);
                setGender(supabaseProfile.gender || null);
                if (supabaseProfile.birth_date) setBirthDate(new Date(supabaseProfile.birth_date));
                setHeight(supabaseProfile.height ? String(supabaseProfile.height) : '');
                setWeight(supabaseProfile.weight ? String(supabaseProfile.weight) : '');
                setGoal(supabaseProfile.goal || null);
                setTargetWeight(supabaseProfile.target_weight ? String(supabaseProfile.target_weight) : '');
                setActivityLevel(supabaseProfile.activity_level || null);
             }
          }

        } catch(e) {
          console.error("Failed to load profile data", e);
        } finally {
          setIsLoading(false);
        }
      };
      loadSettingsAndData();
    }, [appLanguage])
  );

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', (e) => { setKeyboardPadding(e.endCoordinates.height); });
    const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => { setKeyboardPadding(50); });
    return () => { keyboardDidHideListener.remove(); keyboardDidShowListener.remove(); };
  }, []);
  
  const handleImagePicker = useCallback(() => { Alert.alert(t('profilePic'), t('chooseNewPic'), [ { text: t('takePhoto'), onPress: () => launchCamera({ mediaType: 'photo', quality: 0.5 }, (r) => { if (!r.didCancel && r.assets) setProfileImage(r.assets[0].uri); }) }, { text: t('chooseFromGallery'), onPress: () => launchImageLibrary({ mediaType: 'photo', quality: 0.5 }, (r) => { if (!r.didCancel && r.assets) setProfileImage(r.assets[0].uri); }) }, { text: t('cancel'), style: 'cancel' } ]); }, [t]);
  const onDateChange = useCallback((event, selectedDate) => { setShowDatePicker(Platform.OS === 'ios'); if (selectedDate) { setBirthDate(selectedDate); } }, []);

  const handleSave = useCallback(async () => {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("User not found");

        const userDataForCalories = { 
            firstName, lastName, email, profileImage, gender, 
            birthDate: birthDate.toISOString(), 
            height: parseFloat(height), 
            weight: parseFloat(weight), 
            goal, 
            targetWeight: goal === 'maintain' ? null : parseFloat(targetWeight), 
            activityLevel 
        };
        
        // حساب السعرات الجديد
        const newDailyGoal = calculateCalories(userDataForCalories);

        const profileDataForSupabase = {
            id: user.id,
            first_name: firstName,
            last_name: lastName,
            gender: gender,
            birth_date: birthDate.toISOString().split('T')[0],
            height: parseFloat(height) || null,
            weight: parseFloat(weight) || null,
            goal: goal,
            target_weight: goal === 'maintain' ? null : parseFloat(targetWeight) || null,
            activity_level: activityLevel,
            daily_goal: newDailyGoal, // ✅ حفظ السعرات في الداتا بيز
            profile_image_url: profileImage,
            updated_at: new Date().toISOString()
        };

        const { error } = await supabase.from('profiles').upsert(profileDataForSupabase);
        if (error) throw error;
        
        // ✅ حفظ السعرات والبيانات محلياً عشان MainUI تقراها
        const finalProfileDataForLocal = { ...userDataForCalories, dailyGoal: newDailyGoal };
        await AsyncStorage.setItem('userProfile', JSON.stringify(finalProfileDataForLocal));

        Alert.alert(t('success'), t('saveSuccess'));
        navigation.goBack();

    } catch (error) {
        console.error("Error saving profile:", error);
        Alert.alert(t('error'), t('saveError'));
    }
  }, [firstName, lastName, email, profileImage, gender, birthDate, height, weight, goal, targetWeight, activityLevel, navigation, t]);

  if (isLoading) { return <View style={[styles.container(theme), {justifyContent: 'center', alignItems: 'center'}]}><ActivityIndicator size="large" color={theme.primary} /></View>; }

  return (
    <SafeAreaView style={styles.container(theme)}>
      <View style={styles.header(theme)}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerButton}>
            <Icon name={isRTL ? "arrow-right" : "arrow-left"} size={28} color={theme.icon} />
        </TouchableOpacity>
        <Text style={styles.headerTitle(theme)}>{t('editProfile')}</Text>
        <TouchableOpacity onPress={handleSave} style={styles.headerButton}>
            <Ionicons name="checkmark-outline" size={30} color={theme.icon} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: keyboardPadding }} keyboardShouldPersistTaps="handled">
        <View style={styles.profileSection}>
            <View style={styles.profileImageContainer}>
                <Image source={profileImage ? { uri: profileImage } : require('./assets/profile.png')} style={styles.profileImage(theme)}/>
                <TouchableOpacity style={styles.cameraButton(theme)} onPress={handleImagePicker}>
                    <Ionicons name="camera" size={18} color={theme.textDark} />
                </TouchableOpacity>
            </View>
        </View>

        <View style={styles.formSection}>
            <Text style={styles.sectionTitle(theme)}>{t('publicInfo')}</Text>
            <InfoInput label={t('firstName')} value={firstName} onChangeText={setFirstName} theme={theme} />
            <InfoInput label={t('lastName')} value={lastName} onChangeText={setLastName} theme={theme} />
            <View style={[styles.inputContainer(theme), styles.disabledInputContainer(theme)]}>
                <View style={{flex: 1}}>
                    <Text style={styles.inputLabel(theme)}>{t('mail')}</Text>
                    {/* ✅ تم التأكد إن قيمة الإيميل مربوطة بالـ State */}
                    <TextInput style={[styles.textInput(theme), styles.disabledTextInput(theme)]} value={email} editable={false} />
                </View>
                <Ionicons name="lock-closed-outline" size={22} color={theme.textGray} />
            </View>
        </View>

        <View style={styles.formSection}>
            <Text style={styles.sectionTitle(theme)}>{t('physicalMetrics')}</Text>
            <OptionSelector label={t('gender')} options={[{ label: t('male'), value: 'male' }, { label: t('female'), value: 'female' }]} selectedValue={gender} onSelect={setGender} theme={theme} />
            
            <TouchableOpacity style={styles.inputContainer(theme)} onPress={() => setShowDatePicker(true)}>
                <View style={{flex: 1}}>
                    <Text style={styles.inputLabel(theme)}>{t('dob')}</Text>
                    <Text style={styles.textInput(theme)}>{birthDate.toLocaleDateString(activeLanguage === 'ar' ? 'ar-EG' : 'en-GB')}</Text>
                </View>
                <Ionicons name="calendar-outline" size={22} color={theme.textGray} />
            </TouchableOpacity>
            {showDatePicker && <DateTimePicker value={birthDate} mode="date" display="spinner" onChange={onDateChange} locale={activeLanguage} />}
            
            <InfoInput label={t('height')} value={height} onChangeText={setHeight} keyboardType="numeric" theme={theme} />
            <InfoInput label={t('currentWeight')} value={weight} onChangeText={setWeight} keyboardType="numeric" theme={theme} />
        </View>

        <View style={styles.formSection}>
            <Text style={styles.sectionTitle(theme)}>{t('goals')}</Text>
            <OptionSelector label={t('mainGoal')} options={[{ label: t('lose'), value: 'lose' }, { label: t('maintain'), value: 'maintain' }, { label: t('gain'), value: 'gain' }]} selectedValue={goal} onSelect={setGoal} theme={theme} />
            {goal !== 'maintain' && <InfoInput label={t('targetWeight')} value={targetWeight} onChangeText={setTargetWeight} keyboardType="numeric" theme={theme} />}
            <OptionSelector label={t('activityLevel')} options={[{ label: t('sedentary'), value: 'sedentary' }, { label: t('light'), value: 'light' }, { label: t('active'), value: 'active' }, { label: t('very_active'), value: 'very_active' }]} selectedValue={activityLevel} onSelect={setActivityLevel} theme={theme} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = {
  container: (theme) => ({ flex: 1, backgroundColor: theme.background }), 
  header: (theme) => ({ 
    flexDirection: 'row', 
    justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 15, paddingVertical: 10, backgroundColor: theme.background, borderBottomWidth: 1, borderBottomColor: theme.border 
  }), 
  headerButton: { padding: 5, width: 40, alignItems: 'center' },
  headerTitle: (theme) => ({ fontSize: 20, fontWeight: 'bold', color: theme.textDark }), 
  profileSection: { alignItems: 'center', marginVertical: 20 }, 
  profileImageContainer: { position: 'relative' }, 
  profileImage: (theme) => ({ width: 100, height: 100, borderRadius: 50, backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border }), 
  cameraButton: (theme) => ({ 
    position: 'absolute', bottom: 0, right: 0,
    backgroundColor: theme.surface, width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: theme.border, elevation: 3 
  }), 
  formSection: { paddingHorizontal: 20, marginBottom: 10, paddingTop: 10 }, 
  sectionTitle: (theme) => ({ 
    fontSize: 13, color: theme.textGray, fontWeight: '600', marginBottom: 15, textTransform: 'uppercase', 
    textAlign: 'left' 
  }), 
  inputContainer: (theme) => ({ 
    backgroundColor: theme.surface, borderRadius: 12, paddingVertical: 12, paddingHorizontal: 16, marginBottom: 15, 
    flexDirection: 'row', 
    justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: theme.border 
  }), 
  inputLabel: (theme) => ({ 
    fontSize: 12, color: theme.textGray, marginBottom: 4, 
    textAlign: 'left' 
  }), 
  textInput: (theme) => ({ 
    fontSize: 16, fontWeight: '600', color: theme.textDark, padding: 0, 
    textAlign: 'left' 
  }), 
  disabledInputContainer: (theme) => ({ backgroundColor: theme.disabledBackground }), 
  disabledTextInput: (theme) => ({ color: theme.textGray }), 
  optionContainer: { marginBottom: 15 }, 
  optionsWrapper: { 
    flexDirection: 'row', 
    gap: 8 
  }, 
  optionButton: (theme) => ({ flex: 1, paddingVertical: 12, paddingHorizontal: 5, borderRadius: 8, borderWidth: 1, borderColor: theme.border, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.surface }),
  optionButtonSelected: (theme) => ({ backgroundColor: theme.primary, borderColor: theme.primary }), 
  optionText: (theme) => ({ color: theme.textDark, fontWeight: '600', fontSize: 14 }), 
  optionTextSelected: { color: '#FFFFFF' },
};

export default EditProfileScreen;