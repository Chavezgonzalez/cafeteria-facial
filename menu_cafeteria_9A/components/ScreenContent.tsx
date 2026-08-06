import React from 'react';
import { Text, View } from 'react-native';

import { EditScreenInfo } from './EditScreenInfo';

interface ScreenContentProps {
  title: string;
  path: string;
  children?: React.ReactNode;
}

export const ScreenContent: React.FC<ScreenContentProps> = ({ title, path, children }) => {
  return (
    <View className={styles.body}>
      <View className={styles.abstractDecorative.fisrtDiv}></View>
      <View className={styles.abstractDecorative.secondDiv}></View>
      <View className={styles.abstractDecorative.thirdDiv}></View>
      <View className={styles.main}>
        <View className={styles.logoAndHeaders.firstDiv}>
          <View className={styles.logoAndHeaders.secondDiv}>
            <View className={styles.span}>business_center</View>
          </View>
          <Text className={styles.titles}>Gestión de Asistencia</Text>
        </View>
      </View>
    </View>
    
  );
};

const styles = {
  body:"bg-background min-h-screen flex-1 items-center justify-center p-container-padding",
  abstractDecorative:{
    fisrtDiv:"fixed inset-0 overflow-hidden -z-10 pointer-events-none",
    secondDiv:"absolute -top-[10%] -left-[10%] w-[40%] h-[40%] rounded-full bg-primary/5 blur-[120px",
    thirdDiv:"absolute -bottom-[15%] -right-[5%] w-[50%] h-[50%] rounded-full bg-secondary-container/10 blur-[100px]"
  },
  main:"w-full max-w-[440px] animate-in fade-in slide-in-from-bottom-4 duration-700",
  logoAndHeaders:{
    firstDiv:"flex flex-col items-center mb-section-margin text-center",
    secondDiv:"w-16 h-16 bg-primary-container rounded-xl flex items-center justify-center mb-4 login-card-shadow",
  },
  span:"material-symbols-outlined text-on-primary-container text-[40px]",
  titles:"font-headline-lg-mobile text-headline-lg-mobile text-on-background mb-1"
};
