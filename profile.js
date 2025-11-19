import React, { useState, useCallback } from 'react';
import { StyleSheet, View, Text, Image, ScrollView, TouchableOpacity, SafeAreaView, StatusBar, RefreshControl, Alert } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabaseclient'; 

const translations = {
  en: { newUser: 'New User', editProfile: 'Edit Profile', settings: 'Settings', about: 'About', logout: 'Logout', logoutErrorTitle: 'Error', logoutErrorMessage: 'An error occurred while logging out.' },
  ar: { newUser: 'مستخدم جديد', editProfile: 'تعديل الملف الشخصي', settings: 'الإعدادات', about: 'حول التطبيق', logout: 'تسجيل الخروج', logoutErrorTitle: 'خطأ', logoutErrorMessage: 'حدث خطأ أثناء تسجيل الخروج.' },
};
const lightTheme = { background: '#F5FBF5', surface: '#FFFFFF', primaryText: '#1C1C1E', secondaryText: '#8A8A8E', separator: '#E5E5EA', logout: '#FF3B30', statusBar: 'dark-content', borderColor: '#FFFFFF' };
const darkTheme = { background: '#121212', surface: '#1E1E1E', primaryText: '#FFFFFF', secondaryText: '#A5A5A5', separator: '#38383A', logout: '#EF5350', statusBar: 'light-content', borderColor: '#1E1E1E' };

// ✅ مكون العنصر: يستقبل isRTL ويعكس الاتجاه يدوياً
const SettingsItem = ({ icon, name, onPress, color, theme, isRTL }) => (
    <TouchableOpacity style={styles.settingsItem(theme, isRTL)} onPress={onPress}>
      <View style={styles.settingsItemContent(isRTL)}>
        <View style={styles.settingsItemIcon(isRTL)}>{icon}</View>
        <Text style={[styles.settingsItemText(theme, isRTL), { color: color || theme.primaryText }]}>{name}</Text>
      </View>
      {/* عكس السهم */}
      <Icon name={isRTL ? "chevron-left" : "chevron-right"} size={22} color="#C7C7CC" />
    </TouchableOpacity>
);

const ProfileScreen = ({ appLanguage }) => {
  const [userData, setUserData] = useState({ firstName: '', lastName: '', profileImage: null });
  const [refreshing, setRefreshing] = useState(false);
  const navigation = useNavigation();
  const [isDarkMode, setIsDarkMode] = useState(false);
  
  // ✅ استخدام اللغة الممررة من App.js أو الافتراضية
  const language = appLanguage || 'en';
  const isRTL = language === 'ar';

  const theme = isDarkMode ? darkTheme : lightTheme;
  const t = (key) => translations[language]?.[key] || translations['en'][key];

  const loadScreenData = useCallback(async () => {
    try {
      const userJson = await AsyncStorage.getItem('userProfile');
      if (userJson) {
        const parsedData = JSON.parse(userJson);
        setUserData({
            firstName: parsedData.firstName || parsedData.first_name,
            lastName: parsedData.lastName || parsedData.last_name,
            profileImage: parsedData.profileImage || parsedData.profile_image_url
        });
      }

      const themeValue = await AsyncStorage.getItem('isDarkMode');
      setIsDarkMode(themeValue === 'true');
      
    } catch (e) {
      console.error("Failed to load data.", e);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadScreenData();
      return () => {};
    }, [loadScreenData])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadScreenData();
    setRefreshing(false);
  }, [loadScreenData]);
  
  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        Alert.alert(t('logoutErrorTitle'), error.message);
        return; 
      }
      await AsyncStorage.clear();
      navigation.reset({
        index: 0,
        routes: [{ name: 'Index' }],
      });
    } catch (e) {
      console.error("Logout failed", e);
      Alert.alert(t('logoutErrorTitle'), t('logoutErrorMessage'));
    }
  };

  const getDisplayName = () => {
    const { firstName, lastName } = userData;
    if (firstName && lastName) return `${firstName} ${lastName}`;
    if (firstName) return firstName;
    if (lastName) return lastName;
    return t('newUser');
  };

  return (
    <SafeAreaView style={styles.container(theme)}>
      <StatusBar barStyle={theme.statusBar} />
      <ScrollView 
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primaryText} />}
      >
        <View style={styles.header}>
            <Image
                source={require('./assets/profilebackground.png')}
                style={styles.headerImage}
                resizeMode="cover"
            />
        </View>

        <View style={styles.profileContainer}>
          <Image
            source={userData.profileImage ? { uri: userData.profileImage } : require('./assets/profile.png')} 
            style={styles.profileImage(theme)}
          />
          <Text style={styles.profileName(theme)}>
            {getDisplayName()}
          </Text>
        </View>
        <View style={styles.menuContainer}>
          <View style={styles.menuSection(theme)}>
            <SettingsItem isRTL={isRTL} icon={<Icon name="user" size={22} color={theme.secondaryText} />} name={t('editProfile')} onPress={() => navigation.navigate('EditProfile')} theme={theme} />
            <View style={styles.separator(theme)} />
            <SettingsItem isRTL={isRTL} icon={<Ionicons name="settings-outline" size={22} color={theme.secondaryText} />} name={t('settings')} onPress={() => navigation.navigate('Settings')} theme={theme} />
          </View>
          <View style={styles.menuSection(theme)}>
            <SettingsItem isRTL={isRTL} icon={<Icon name="info" size={22} color={theme.secondaryText} />} name={t('about')} onPress={() => navigation.navigate('About')} theme={theme} />
            <View style={styles.separator(theme)} />
            <SettingsItem isRTL={isRTL} icon={<Ionicons name="log-out-outline" size={24} color={theme.logout} />} name={t('logout')} onPress={handleLogout} color={theme.logout} theme={theme} />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = {
  container: (theme) => ({ flex: 1, backgroundColor: theme.background }),
  header: { height: 200, overflow: 'hidden', borderBottomLeftRadius: 30, borderBottomRightRadius: 30, },
  headerImage: { width: '100%', height: '150%', position: 'absolute', top: -50, },
  profileContainer: { alignItems: 'center', marginTop: -70 },
  profileImage: (theme) => ({ width: 100, height: 100, borderRadius: 50, borderWidth: 4, borderColor: theme.borderColor || theme.surface, backgroundColor: '#E0E0E0' }),
  profileName: (theme) => ({ fontSize: 22, fontWeight: 'bold', color: theme.primaryText, marginTop: 12 }),
  menuContainer: { paddingHorizontal: 20, marginTop: 40 },
  menuSection: (theme) => ({ backgroundColor: theme.surface, borderRadius: 12, marginBottom: 20, overflow: 'hidden' }),
  
  // ✅ التعديل السحري: التحكم في الاتجاه عبر Flexbox
  settingsItem: (theme, isRTL) => ({ 
    flexDirection: isRTL ? 'row-reverse' : 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    paddingHorizontal: 15, 
    paddingVertical: 15 
  }),
  
  settingsItemContent: (isRTL) => ({ 
    alignItems: 'center', 
    flex: 1, 
    flexDirection: isRTL ? 'row-reverse' : 'row' 
  }),
  
  settingsItemIcon: (isRTL) => ({ 
    [isRTL ? 'marginLeft' : 'marginRight']: 15 
  }), 
  
  settingsItemText: (theme, isRTL) => ({ 
    fontSize: 17, 
    color: theme.primaryText, 
    textAlign: isRTL ? 'right' : 'left' 
  }),
  
  separator: (theme) => ({ height: StyleSheet.hairlineWidth, backgroundColor: theme.separator, marginHorizontal: 15 }),
};

export default ProfileScreen;