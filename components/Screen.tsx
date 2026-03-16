import React from 'react';
import {
  ScrollView,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing } from '@/constants/theme';

type ScreenProps = {
  children: React.ReactNode;
  scroll?: boolean;
  noPadding?: boolean;
  contentContainerStyle?: StyleProp<ViewStyle>;
  style?: StyleProp<ViewStyle>;
};

export function Screen({
  children,
  scroll = false,
  noPadding = false,
  contentContainerStyle,
  style,
}: ScreenProps) {
  if (scroll) {
    return (
      <SafeAreaView edges={['top', 'left', 'right']} style={[styles.safe, style]}>
        <ScrollView
          contentContainerStyle={[
            styles.baseContent,
            !noPadding && styles.paddedContent,
            contentContainerStyle,
          ]}
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={[styles.safe, style]}>
      <View
        style={[
          styles.baseContent,
          !noPadding && styles.paddedContent,
          contentContainerStyle,
        ]}
      >
        {children}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  baseContent: {
    flexGrow: 1,
  },
  paddedContent: {
    padding: spacing.md,
    gap: spacing.sm,
  },
});