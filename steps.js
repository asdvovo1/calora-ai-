import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
    StyleSheet, View, Text, ScrollView, SafeAreaView, TouchableOpacity, 
    ActivityIndicator, Alert, Modal, TextInput, StatusBar, Platform, AppState, Linking
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import GoogleFit, { Scopes, BucketUnit } from 'react-native-google-fit'; 
import Animated, { useAnimatedStyle, useSharedValue, withTiming, useAnimatedProps } from 'react-native-reanimated';
import Svg, { Circle, Path } from 'react-native-svg';

// --- الثوابت والإعدادات ---
const STEP_LENGTH_KM = 0.000762;
const CALORIES_PER_STEP = 0.04;
const MAX_STEPS_GOAL = 100000;

const lightTheme = { primary: '#388E3C', primaryDark: '#1B5E20', background: '#E8F5E9',  card: '#FFFFFF',  textPrimary: '#212121',  textSecondary: '#757575', progressUnfilled: '#D6EAD7', inputBackground: '#F5F5F5',  overlay: 'rgba(0,0,0,0.5)', accentOrange: '#FF7043', accentBlue: '#007BFF', white: '#FFFFFF', statusBar: 'dark-content', };
const darkTheme = { primary: '#66BB6A', primaryDark: '#81C784', background: '#121212',  card: '#1E1E1E',  textPrimary: '#FFFFFF',  textSecondary: '#B0B0B0', progressUnfilled: '#2C2C2C', inputBackground: '#2C2C2C',  overlay: 'rgba(0,0,0,0.7)', accentOrange: '#FF8A65', accentBlue: '#42A5F5', white: '#FFFFFF', statusBar: 'light-content', };

const translations = { 
    ar: { todaySteps: 'خطوات اليوم', kmUnit: ' كم', calUnit: ' سعرة', last7Days: 'آخر 7 أيام', last30Days: 'آخر 30 يوم', periodSummary: 'ملخص {period}', week: 'الأسبوع', month: 'الشهر', noData: 'لا توجد بيانات لعرضها.', periodStats: 'إحصائيات {period}', avgSteps: 'متوسط الخطوات اليومي:', totalSteps: 'إجمالي خطوات {period}:', bestDay: 'أفضل يوم في {period}:', changeGoalTitle: 'تغيير الهدف اليومي', changeGoalMsg: 'أدخل هدفك الجديد للخطوات:', goalPlaceholder: 'مثال: 8000', cancel: 'إلغاء', save: 'حفظ', goalTooLargeTitle: 'الهدف كبير جدًا', goalTooLargeMsg: 'الرجاء إدخال رقم أقل من {maxSteps}.', errorTitle: 'خطأ', invalidNumber: 'الرجاء إدخال رقم صحيح.', notAvailableTitle: 'Google Fit غير متصل', notAvailableMsg: 'يرجى ربط حساب Google Fit لعرض الخطوات.', connectBtn: 'ربط Google Fit', permissionDeniedTitle: 'صلاحية مرفوضة', permissionDeniedMsg: 'يرجى منح صلاحية النشاط البدني.', weekdays: ['ح', 'ن', 'ث', 'ر', 'خ', 'ج', 'س'] }, 
    en: { todaySteps: "Today's Steps", kmUnit: ' km', calUnit: ' kcal', last7Days: 'Last 7 Days', last30Days: 'Last 30 Days', periodSummary: '{period} Summary', week: 'Week', month: 'Month', noData: 'No data to display.', periodStats: '{period} Statistics', avgSteps: 'Daily Average:', totalSteps: 'Total {period} Steps:', bestDay: 'Best Day in {period}:', changeGoalTitle: 'Change Daily Goal', changeGoalMsg: 'Enter your new step goal:', goalPlaceholder: 'e.g., 8000', cancel: 'Cancel', save: 'Save', goalTooLargeTitle: 'Goal Too Large', goalTooLargeMsg: 'Please enter a number less than {maxSteps}.', errorTitle: 'Error', invalidNumber: 'Please enter a valid number.', notAvailableTitle: 'Google Fit Not Connected', notAvailableMsg: 'Please connect Google Fit to track steps.', connectBtn: 'Connect Google Fit', permissionDeniedTitle: 'Permission Denied', permissionDeniedMsg: 'Please enable Physical Activity permission.', weekdays: ['S', 'M', 'T', 'W', 'T', 'F', 'S'] } 
};

// --- دوال مساعدة للرسم ---
const describeArc = (x, y, radius, startAngle, endAngle) => { 
    const clampedEndAngle = Math.min(endAngle, 359.999); 
    const start = { x: x + radius * Math.cos((startAngle - 90) * Math.PI / 180.0), y: y + radius * Math.sin((startAngle - 90) * Math.PI / 180.0) }; 
    const end = { x: x + radius * Math.cos((clampedEndAngle - 90) * Math.PI / 180.0), y: y + radius * Math.sin((clampedEndAngle - 90) * Math.PI / 180.0) }; 
    const largeArcFlag = clampedEndAngle - startAngle <= 180 ? '0' : '1'; 
    const d = ['M', start.x, start.y, 'A', radius, radius, 0, largeArcFlag, 1, end.x, end.y].join(' '); 
    return d; 
};
const AnimatedPath = Animated.createAnimatedComponent(Path);

// --- مكون الدائرة المتحركة ---
const AnimatedStepsCircle = ({ progress, size, strokeWidth, currentStepCount, theme }) => { 
    const INDICATOR_SIZE = strokeWidth * 1.5; 
    const RADIUS = size / 2; 
    const CENTER_RADIUS = RADIUS - strokeWidth / 2; 
    
    const safeProgress = isNaN(progress) ? 0 : Math.min(Math.max(progress, 0), 1);
    const animatedProgress = useSharedValue(0); 
    
    useEffect(() => { 
        animatedProgress.value = withTiming(safeProgress, { duration: 1000 }); 
    }, [safeProgress]); 
    
    const animatedPathProps = useAnimatedProps(() => { 
        const angle = animatedProgress.value * 360; 
        if (angle <= 0) return { d: '' }; 
        return { d: describeArc(size / 2, size / 2, CENTER_RADIUS, 0, angle) }; 
    }); 
    
    const indicatorAnimatedStyle = useAnimatedStyle(() => { 
        const angleRad = (animatedProgress.value * 360 - 90) * (Math.PI / 180); 
        const xCenter = (size / 2) + CENTER_RADIUS * Math.cos(angleRad);
        const yCenter = (size / 2) + CENTER_RADIUS * Math.sin(angleRad);
        
        return { 
            transform: [
                { translateX: xCenter - INDICATOR_SIZE / 2 }, 
                { translateY: yCenter - INDICATOR_SIZE / 2 }
            ], 
            opacity: 1 
        };
    }); 

    return ( 
        <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
            <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
                <Circle cx={size / 2} cy={size / 2} r={CENTER_RADIUS} stroke={theme.progressUnfilled} strokeWidth={strokeWidth} fill="transparent" />
                <AnimatedPath animatedProps={animatedPathProps} stroke={theme.primary} strokeWidth={strokeWidth} fill="transparent" strokeLinecap="round" />
            </Svg>
            <Animated.View style={[ styles.progressIndicatorDot(theme), { width: INDICATOR_SIZE, height: INDICATOR_SIZE, borderRadius: INDICATOR_SIZE / 2, }, indicatorAnimatedStyle ]} />
            <View style={styles.summaryTextContainer}>
                <Text style={styles.progressCircleText(theme)}>{Math.round(currentStepCount || 0).toLocaleString()}</Text>
            </View>
        </View> 
    ); 
};

// --- نافذة تغيير الهدف ---
const GoalPromptModal = ({ visible, onClose, onSubmit, theme, t }) => { const [inputValue, setInputValue] = useState(''); const handleSubmit = () => { onSubmit(inputValue); setInputValue(''); onClose(); }; return ( <Modal visible={visible} transparent={true} animationType="fade" onRequestClose={onClose}><TouchableOpacity style={styles.modalOverlay(theme)} activeOpacity={1} onPress={onClose}><TouchableOpacity activeOpacity={1} style={styles.promptContainer(theme)}><Text style={styles.promptTitle(theme)}>{t('changeGoalTitle')}</Text><Text style={styles.promptMessage(theme)}>{t('changeGoalMsg')}</Text><TextInput style={styles.promptInput(theme)} keyboardType="numeric" placeholder={t('goalPlaceholder')} placeholderTextColor={theme.textSecondary} value={inputValue} onChangeText={setInputValue} autoFocus={true} /><View style={styles.promptButtons}><TouchableOpacity style={styles.promptButton} onPress={onClose}><Text style={styles.promptButtonText(theme)}>{t('cancel')}</Text></TouchableOpacity><TouchableOpacity style={[styles.promptButton, styles.promptButtonPrimary(theme)]} onPress={handleSubmit}><Text style={[styles.promptButtonText(theme), styles.promptButtonTextPrimary]}>{t('save')}</Text></TouchableOpacity></View></TouchableOpacity></TouchableOpacity></Modal> ); };


const StepsScreen = () => {
    const [theme, setTheme] = useState(lightTheme);
    const [language, setLanguage] = useState('en');
    
    const [currentStepCount, setCurrentStepCount] = useState(0);
    const [stepsGoal, setStepsGoal] = useState(10000);
    const [historicalData, setHistoricalData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isGoogleFitConnected, setIsGoogleFitConnected] = useState(false);
    const [isPromptVisible, setPromptVisible] = useState(false);
    const [selectedPeriod, setSelectedPeriod] = useState('week');
    
    const t = (key) => translations[language]?.[key] || translations['en'][key];

    const options = {
        scopes: [
            Scopes.FITNESS_ACTIVITY_READ,
            Scopes.FITNESS_BODY_READ,
        ],
    };

    const connectGoogleFit = async () => {
        try {
            const res = await GoogleFit.authorize(options);
            if (res.success) {
                setIsGoogleFitConnected(true);
                AsyncStorage.setItem('isGoogleFitConnected', 'true');
                startTracking();
            } else {
                setIsGoogleFitConnected(false);
                AsyncStorage.setItem('isGoogleFitConnected', 'false');
                Alert.alert(t('errorTitle'), res.message);
            }
        } catch (error) {
            console.warn("Google Fit Auth Error:", error);
            setIsGoogleFitConnected(false);
        }
    };

    const startTracking = () => {
        fetchGoogleFitData();
        GoogleFit.observeSteps((result) => {
            if (result && result.steps) {
                fetchGoogleFitData();
            }
        });
    }

    const fetchGoogleFitData = async () => {
        const now = new Date();
        const startOfDay = new Date();
        startOfDay.setHours(0,0,0,0);
        
        const todayOpts = {
            startDate: startOfDay.toISOString(),
            endDate: now.toISOString(),
            bucketUnit: BucketUnit.DAY,
            bucketInterval: 1
        };

        try {
            const todayRes = await GoogleFit.getDailyStepCountSamples(todayOpts);
            if (todayRes && todayRes.length > 0) {
                let maxSteps = 0;
                todayRes.forEach(source => {
                    if (source.steps && source.steps.length > 0) {
                         const val = source.steps[0].value;
                         if (val > maxSteps) maxSteps = val;
                    }
                });
                setCurrentStepCount(maxSteps);
            } else {
                setCurrentStepCount(0);
            }
        } catch (e) {
            console.log("Error fetching today steps:", e);
        }

        const daysToFetch = 30;
        const historyStart = new Date();
        historyStart.setDate(historyStart.getDate() - daysToFetch);
        historyStart.setHours(0,0,0,0);

        const historyOpts = {
            startDate: historyStart.toISOString(),
            endDate: now.toISOString(),
            bucketUnit: BucketUnit.DAY,
            bucketInterval: 1
        };

        try {
            const historyRes = await GoogleFit.getDailyStepCountSamples(historyOpts);
            const stepsByDay = {};

            if (historyRes) {
                historyRes.forEach(source => {
                    source.steps.forEach(step => {
                        const dateStr = step.date.slice(0, 10); 
                        if (!stepsByDay[dateStr] || step.value > stepsByDay[dateStr]) {
                             stepsByDay[dateStr] = step.value;
                        }
                    });
                });
            }

            const formattedData = [];
            for (let i = 0; i < daysToFetch; i++) {
                const d = new Date();
                d.setDate(d.getDate() - i);
                const dateKey = d.toISOString().slice(0, 10);
                const dayName = d.toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US', { weekday: 'short' });
                
                formattedData.push({
                    day: dayName,
                    steps: stepsByDay[dateKey] || 0
                });
            }

            const localT = (key) => translations[language]?.[key] || translations['en'][key];

            if (selectedPeriod === 'week') {
                setHistoricalData(formattedData.slice(0, 7).reverse());
            } else {
                const weeklyData = [];
                for (let w = 0; w < 4; w++) {
                    let weekTotal = 0;
                    for (let d = 0; d < 7; d++) {
                        const index = (w * 7) + d;
                        if (formattedData[index]) {
                            weekTotal += formattedData[index].steps;
                        }
                    }
                    weeklyData.push({
                        day: `${localT('week')} ${4 - w}`,
                        steps: weekTotal
                    });
                }
                setHistoricalData(weeklyData.reverse());
            }

        } catch (e) {
            console.log("Error fetching history:", e);
        } finally {
            setLoading(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            let isMounted = true;
            
            const init = async () => {
                const savedTheme = await AsyncStorage.getItem('isDarkMode');
                if (isMounted) setTheme(savedTheme === 'true' ? darkTheme : lightTheme);
                
                const savedLang = await AsyncStorage.getItem('appLanguage');
                if (isMounted) setLanguage(savedLang || 'en');
                
                const savedGoal = await AsyncStorage.getItem('stepsGoal');
                if (isMounted && savedGoal) setStepsGoal(parseInt(savedGoal, 10));

                const isConnected = await AsyncStorage.getItem('isGoogleFitConnected');
                
                if (isConnected === 'true') {
                    const authorized = await GoogleFit.checkIsAuthorized();
                    if (authorized) {
                         setIsGoogleFitConnected(true);
                         startTracking();
                    } else {
                         connectGoogleFit();
                    }
                } else {
                    setIsGoogleFitConnected(false);
                    setLoading(false);
                }
            };
            
            init();

            const interval = setInterval(() => {
                if (isGoogleFitConnected) fetchGoogleFitData();
            }, 10000);

            return () => {
                isMounted = false;
                GoogleFit.unsubscribeListeners();
                clearInterval(interval);
            };
        }, [selectedPeriod, isGoogleFitConnected])
    );
    
    const handleSaveGoalFromPrompt = (text) => {
        const newGoal = parseInt(text, 10);
        if (!isNaN(newGoal) && newGoal > 0 && newGoal <= MAX_STEPS_GOAL) {
            AsyncStorage.setItem('stepsGoal', newGoal.toString());
            setStepsGoal(newGoal);
        } else if (newGoal > MAX_STEPS_GOAL) {
            Alert.alert(t('goalTooLargeTitle'), t('goalTooLargeMsg').replace('{maxSteps}', MAX_STEPS_GOAL.toLocaleString()));
        } else if (text) {
            Alert.alert(t('errorTitle'), t('invalidNumber'));
        }
        setPromptVisible(false);
    };

    const distance = (currentStepCount * STEP_LENGTH_KM).toFixed(2);
    const calories = Math.round(currentStepCount * CALORIES_PER_STEP);
    
    const totalPeriodSteps = historicalData.reduce((sum, item) => sum + item.steps, 0);
    const divisor = selectedPeriod === 'week' ? historicalData.length : 28; 
    const averagePeriodSteps = divisor > 0 ? Math.round(totalPeriodSteps / divisor) : 0;
    const bestDayInPeriod = historicalData.length > 0 ? Math.max(...historicalData.map(d => d.steps)) : 0;
    const maxChartSteps = historicalData.length > 0 ? Math.max(...historicalData.map(d => d.steps), 1) : 1;
    const periodLabel = selectedPeriod === 'week' ? t('week') : t('month');

    const progress = stepsGoal > 0 ? (currentStepCount || 0) / stepsGoal : 0;

    const renderTodaySummary = () => {
        if (loading) {
            return <ActivityIndicator size="large" color={theme.primary} style={{ height: 180, marginBottom: 79 }} />;
        }
        if (!isGoogleFitConnected) {
            return (
                <View style={styles.errorContainer}>
                    <MaterialCommunityIcons name="google-fit" size={48} color={theme.textSecondary} />
                    <Text style={styles.errorText(theme)}>{t('notAvailableTitle')}</Text>
                    <Text style={styles.errorSubText(theme)}>{t('notAvailableMsg')}</Text>
                    <TouchableOpacity style={styles.connectButton(theme)} onPress={connectGoogleFit}>
                        <Text style={styles.connectButtonText}>{t('connectBtn')}</Text>
                    </TouchableOpacity>
                </View>
            );
        }
        return (
            <>
                <AnimatedStepsCircle size={180} strokeWidth={15} currentStepCount={currentStepCount} progress={progress} theme={theme} />
                <View style={styles.subStatsContainer}>
                    {/* ✅ تم تصحيح قفلة التاج هنا */}
                    <TouchableOpacity style={styles.subStatBox} onPress={() => setPromptVisible(true)}>
                        <MaterialCommunityIcons name="flag-checkered" size={24} color={theme.accentBlue} />
                        <Text style={styles.subStatText(theme)}>{stepsGoal.toLocaleString()}</Text>
                    </TouchableOpacity>
                    <View style={styles.subStatBox}>
                        <MaterialCommunityIcons name="fire" size={24} color={theme.accentOrange} />
                        <Text style={styles.subStatText(theme)}>{calories} {t('calUnit')}</Text>
                    </View>
                    <View style={styles.subStatBox}>
                        <MaterialCommunityIcons name="map-marker-distance" size={24} color={theme.primary} />
                        <Text style={styles.subStatText(theme)}>{distance} {t('kmUnit')}</Text>
                    </View>
                </View>
            </>
        );
    }

    return (
        <SafeAreaView style={styles.modalPage(theme)}>
            <StatusBar barStyle={theme.statusBar} backgroundColor={theme.background} />
            <GoalPromptModal visible={isPromptVisible} onClose={() => setPromptVisible(false)} onSubmit={handleSaveGoalFromPrompt} theme={theme} t={t} />
            <ScrollView contentContainerStyle={styles.modalPageContent}>
                <View style={[styles.card(theme), styles.todaySummaryCard]}>
                    <Text style={styles.todaySummaryLabel(theme)}>{t('todaySteps')}</Text>
                    {renderTodaySummary()}
                </View>
                {isGoogleFitConnected && (
                <>
                    <View style={styles.card(theme)}>
                        <View style={styles.periodToggleContainer(theme)}>
                            <TouchableOpacity style={[styles.periodToggleButton, selectedPeriod === 'month' && styles.activePeriodButton(theme)]} onPress={() => setSelectedPeriod('month')}><Text style={[styles.periodButtonText(theme), selectedPeriod === 'month' && styles.activePeriodText(theme)]}>{t('last30Days')}</Text></TouchableOpacity>
                            <TouchableOpacity style={[styles.periodToggleButton, selectedPeriod === 'week' && styles.activePeriodButton(theme)]} onPress={() => setSelectedPeriod('week')}><Text style={[styles.periodButtonText(theme), selectedPeriod === 'week' && styles.activePeriodText(theme)]}>{t('last7Days')}</Text></TouchableOpacity>
                        </View>
                        <Text style={styles.sectionTitle(theme)}>{t('periodSummary').replace('{period}', periodLabel)}</Text>
                        {loading ? <ActivityIndicator color={theme.primary}/> : historicalData.length > 0 ? 
                        <View style={styles.chartContainer}>
                            {historicalData.map((item, index) => ( 
                                <View key={index} style={styles.barWrapper}>
                                    <View style={[
                                        styles.bar(theme), 
                                        {
                                            height: `${Math.max((item.steps / maxChartSteps) * 100, 5)}%`, 
                                            width: selectedPeriod === 'month' ? '60%' : '75%' 
                                        }
                                    ]} />
                                    <Text style={styles.barLabel(theme)} numberOfLines={1}>{item.day}</Text>
                                </View> 
                            ))}
                        </View> 
                        : <Text style={styles.emptyLogText(theme)}>{t('noData')}</Text>}
                    </View>
                    <View style={styles.card(theme)}>
                        <Text style={styles.sectionTitle(theme)}>{t('periodStats').replace('{period}', periodLabel)}</Text>
                        {loading ? <ActivityIndicator color={theme.primary}/> : <>
                            <View style={styles.statsRow(theme)}><Text style={styles.statLabel(theme)}>{t('avgSteps')}</Text><Text style={styles.statValue(theme)}>{averagePeriodSteps.toLocaleString()}</Text></View>
                            <View style={styles.statsRow(theme)}><Text style={styles.statLabel(theme)}>{t('totalSteps').replace('{period}', periodLabel)}</Text><Text style={styles.statValue(theme)}>{totalPeriodSteps.toLocaleString()}</Text></View>
                            <View style={styles.statsRow(theme)}><Text style={styles.statLabel(theme)}>{selectedPeriod === 'week' ? t('bestDay').replace('{period}', periodLabel) : `${t('week')} الأفضل:`}</Text><Text style={styles.statValue(theme)}>{bestDayInPeriod.toLocaleString()}</Text></View>
                        </>}
                    </View>
                </>
                )}
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = {
    modalPage: (theme) => ({ flex: 1, backgroundColor: theme.background }),
    modalPageContent: { padding: 20 },
    card: (theme) => ({ backgroundColor: theme.card, borderRadius: 20, padding: 20, marginBottom: 15, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5 }),
    sectionTitle: (theme) => ({ fontSize: 22, fontWeight: 'bold', color: theme.textPrimary, textAlign: 'left', marginBottom: 4, marginTop: 15 }),
    emptyLogText: (theme) => ({ textAlign: 'center', marginTop: 20, marginBottom: 10, fontSize: 16, color: theme.textSecondary }),
    todaySummaryCard: { alignItems: 'center', paddingVertical: 30, minHeight: 330 },
    todaySummaryLabel: (theme) => ({ fontSize: 16, color: theme.textSecondary, marginBottom: 20 }),
    progressCircleText: (theme) => ({ fontSize: 36, fontWeight: 'bold', color: theme.textPrimary }),
    summaryTextContainer: { position: 'absolute', justifyContent: 'center', alignItems: 'center' },
    subStatsContainer: { flexDirection: 'row', justifyContent: 'space-around', width: '100%', marginTop: 25 },
    subStatBox: { alignItems: 'center', padding: 10 },
    subStatText: (theme) => ({ fontSize: 16, fontWeight: '600', color: theme.textPrimary, marginTop: 5 }),
    chartContainer: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'flex-end', height: 150, marginTop: 20, direction: 'ltr' }, 
    
    barWrapper: { flex: 1, alignItems: 'center', height: '100%', justifyContent: 'flex-end' }, 
    barLabel: (theme) => ({ 
        marginTop: 5, 
        fontSize: 10,
        color: theme.textSecondary,
        textAlign: 'center'
    }),

    bar: (theme) => ({ backgroundColor: theme.primary, borderRadius: 5, minHeight: 5 }),
    statsRow: (theme) => ({ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: theme.background, direction: 'ltr' }),
    statLabel: (theme) => ({ fontSize: 16, color: theme.textSecondary }),
    statValue: (theme) => ({ fontSize: 16, fontWeight: 'bold', color: theme.textPrimary }),
    modalOverlay: (theme) => ({ flex: 1, backgroundColor: theme.overlay, justifyContent: 'center', alignItems: 'center' }),
    promptContainer: (theme) => ({ width: '85%', backgroundColor: theme.card, borderRadius: 15, padding: 20, elevation: 10 }),
    promptTitle: (theme) => ({ fontSize: 18, fontWeight: 'bold', textAlign: 'center', color: theme.textPrimary }),
    promptMessage: (theme) => ({ fontSize: 14, textAlign: 'center', color: theme.textSecondary, marginTop: 8, marginBottom: 15 }),
    promptInput: (theme) => ({ borderWidth: 1, borderColor: theme.progressUnfilled, backgroundColor: theme.inputBackground, color: theme.textPrimary, borderRadius: 8, paddingHorizontal: 15, paddingVertical: 10, textAlign: 'center', fontSize: 18, marginBottom: 20 }),
    promptButtons: { flexDirection: 'row', justifyContent: 'space-around' },
    promptButton: { paddingVertical: 10, paddingHorizontal: 25, borderRadius: 8 },
    promptButtonPrimary: (theme) => ({ backgroundColor: theme.primary }),
    promptButtonText: (theme) => ({ fontSize: 16, color: theme.primary, fontWeight: '600' }),
    promptButtonTextPrimary: { color: 'white' },
    progressIndicatorDot: (theme) => ({ position: 'absolute', top: 0, left: 0, backgroundColor: theme.primaryDark, borderWidth: 3, borderColor: theme.card, elevation: 5 }),
    periodToggleContainer: (theme) => ({ flexDirection: 'row', backgroundColor: theme.background, borderRadius: 10, padding: 4, marginBottom: 10, direction: 'ltr' }),
    periodToggleButton: { flex: 1, paddingVertical: 10, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
    activePeriodButton: (theme) => ({ backgroundColor: theme.card, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2 }),
    periodButtonText: (theme) => ({ fontSize: 16, fontWeight: '600', color: theme.textSecondary }),
    activePeriodText: (theme) => ({ color: theme.primary }),
    errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', height: 180, marginBottom: 79 },
    errorText: (theme) => ({ marginTop: 15, fontSize: 20, fontWeight: 'bold', color: theme.textPrimary }),
    errorSubText: (theme) => ({ marginTop: 5, fontSize: 14, color: theme.textSecondary, textAlign: 'center', paddingHorizontal: 20, marginBottom: 20 }),
    connectButton: (theme) => ({ backgroundColor: theme.primary, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 10 }),
    connectButtonText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
};

export default StepsScreen;