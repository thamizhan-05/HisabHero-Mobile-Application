import React from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { AppButton } from './AppButton';

export function WelcomeScreen({ onGetStarted }: { onGetStarted?: () => void }) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.logoWrap}>
          <View style={styles.logoCircle}>
            <Text style={styles.logoText}>H</Text>
          </View>
          <Text style={styles.title}>HisabHero</Text>
        </View>

        <Text style={styles.tagline}>Manage your money smarter.</Text>
        <Text style={styles.description}>
          A calm, secure place to stay on top of your daily finances and build
          smarter money habits for the future.
        </Text>

        <View style={styles.card}>
          <Text style={styles.cardLabel}>Your personal finance companion</Text>
          <Text style={styles.cardText}>
            Get started with a clean, modern experience designed for Android and
            iOS from day one.
          </Text>
        </View>

        <AppButton title="Get Started" onPress={onGetStarted} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#06111f',
  },
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  logoWrap: {
    alignItems: 'center',
    marginBottom: 28,
  },
  logoCircle: {
    width: 108,
    height: 108,
    borderRadius: 54,
    backgroundColor: '#1c4f9d',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#7fb2ff',
    marginBottom: 16,
  },
  logoText: {
    color: '#ffffff',
    fontSize: 42,
    fontWeight: '800',
  },
  title: {
    color: '#f8fbff',
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  tagline: {
    color: '#8fc0ff',
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 12,
  },
  description: {
    color: '#c3d6f3',
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
    marginBottom: 28,
  },
  card: {
    padding: 18,
    borderRadius: 20,
    backgroundColor: '#0b1d38',
    borderWidth: 1,
    borderColor: '#15345f',
    marginBottom: 28,
  },
  cardLabel: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  cardText: {
    color: '#a6bedf',
    fontSize: 14,
    lineHeight: 22,
  },
});
