import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  StyleSheet,
  SafeAreaView,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { auth, db } from '../firebase/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { FontAwesome } from '@expo/vector-icons';

const houseColors = {
  Red: '#e74c3c',
  Blue: '#3498db',
  Green: '#2ecc71',
  Yellow: '#f1c40f',
  Black: '#2c3e50',
};

// Enable smooth animation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function SettingsScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [userData, setUserData] = useState(null);
  const [aboutExpanded, setAboutExpanded] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) return;

      try {
        const docRef = doc(db, 'users', user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setUserData({ ...docSnap.data(), email: user.email });
        }
      } catch (error) {
        console.error('Failed to load user data:', error);
      }
    });

    return () => unsubscribe();
  }, []);

  const getNameFromEmail = (email) => {
    const raw = email.split('@')[0].replace(/_/g, ' ');
    return raw
      .split(' ')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const backgroundColor = houseColors[userData?.house] || '#f7f7f7';

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Yes, Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut(auth);
              navigation.replace('Login');
            } catch (error) {
              console.error('Sign out error:', error);
              Alert.alert('Error', 'Failed to sign out. Please try again.');
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  const toggleAbout = () => {
    LayoutAnimation.easeInEaseOut();
    setAboutExpanded(!aboutExpanded);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor }]}>
      <ScrollView
        contentContainerStyle={{
          paddingTop: 30,
          paddingBottom: insets.bottom + 60,
          paddingHorizontal: 20,
        }}
      >
        <Text style={styles.header}>Settings</Text>

        {/* PROFILE CARD */}
        <TouchableOpacity
          style={styles.profileCard}
          onPress={() => navigation.navigate('Settings', { screen: 'Profile' })}
        >
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {userData?.email ? getNameFromEmail(userData.email).charAt(0) : '?'}
            </Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>
              {userData?.email ? getNameFromEmail(userData.email) : 'Loading...'}
            </Text>
            <Text style={styles.profileEmail}>{userData?.email || ''}</Text>
          </View>
        </TouchableOpacity>

        {/* MAIN BUTTONS */}
        <View style={styles.buttonSection}>
          <SettingsItem
            icon="book"
            label="Acknowledgements"
            onPress={() => navigation.navigate('Settings', { screen: 'Acknowledgements' })}
          />
          <SettingsItem
            icon="envelope"
            label="Contact the team"
            iconColor="#007AFF"
            textColor="#007AFF"
            onPress={() =>
              Alert.alert('Contact the team', 'Email: iresh_ramasamy@s2024.ssts.edu.sg', [
                { text: 'OK' },
              ])
            }
          />

          {/* ABOUT BUTTON WITH EXPAND */}
          <TouchableOpacity style={styles.buttonCard} onPress={toggleAbout}>
            <FontAwesome
              name="info-circle"
              size={22}
              color="#333"
              style={styles.buttonIcon}
            />
            <Text style={styles.buttonText}>About</Text>
            <FontAwesome
              name={aboutExpanded ? 'angle-up' : 'angle-down'}
              size={20}
              color="#999"
              style={{ marginLeft: 'auto' }}
            />
          </TouchableOpacity>
          {aboutExpanded && (
            <View style={styles.aboutContent}>
              <Text style={styles.aboutText}>App Model: v1.0.0</Text>
              <Text style={styles.aboutText}>Developed by: Team 170+</Text>
              <Text style={styles.aboutText}>
                This app helps manage events, announcements, and House activities in one place.
              </Text>
            </View>
          )}

          {/* LOGOUT */}
          <SettingsItem
            icon="sign-out"
            label="Sign out"
            iconColor="red"
            textColor="red"
            onPress={handleSignOut}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// --- SETTINGS ITEM ---
const SettingsItem = ({ icon, label, onPress, iconColor = '#333', textColor = '#000' }) => (
  <TouchableOpacity style={styles.buttonCard} onPress={onPress}>
    <FontAwesome name={icon} size={22} color={iconColor} style={styles.buttonIcon} />
    <Text style={[styles.buttonText, { color: textColor }]}>{label}</Text>
    <FontAwesome name="angle-right" size={20} color="#999" style={{ marginLeft: 'auto' }} />
  </TouchableOpacity>
);

// --- STYLES ---
const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { fontSize: 32, fontWeight: '900', marginBottom: 25, color: '#1c1c1e' },
  profileCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 30,
    elevation: 3,
    shadowColor: '#aaa',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
  },
  avatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: { color: '#fff', fontSize: 28, fontWeight: 'bold' },
  profileInfo: { flex: 1, marginLeft: 20, justifyContent: 'center' },
  profileName: { fontSize: 20, fontWeight: 'bold', marginBottom: 5 },
  profileEmail: { fontSize: 14, color: '#777' },
  buttonSection: { marginBottom: 50 },
  buttonCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 18,
    borderRadius: 14,
    marginBottom: 15,
    elevation: 2,
    shadowColor: '#aaa',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  buttonIcon: { width: 30 },
  buttonText: { fontSize: 16, marginLeft: 15, fontWeight: '500' },

  // ABOUT EXPANDED CONTENT
  aboutContent: {
    backgroundColor: '#f9f9f9',
    padding: 15,
    borderRadius: 12,
    marginBottom: 15,
    marginTop: -5,
  },
  aboutText: { fontSize: 14, color: '#555', marginBottom: 5 },
});
