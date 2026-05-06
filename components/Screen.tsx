import React from 'react';
import {
  ScrollView,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
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
  const insets = useSafeAreaInsets();
  const bottomInset = Math.max(insets.bottom, spacing.md);
  const scrollPadding = {
    paddingBottom: spacing.xl + spacing.lg + 96 + bottomInset,
  };

  if (scroll) {
    return (
      <SafeAreaView edges={['top', 'left', 'right']} style={[styles.safe, style]}>
        <ScrollView
          contentContainerStyle={[
            styles.baseContent,
            !noPadding && styles.paddedContent,
            contentContainerStyle,
            !noPadding && scrollPadding,
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
