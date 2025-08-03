import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  StyleSheet,
  SafeAreaView,
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

export default function SettingsScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [userData, setUserData] = useState(null);

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

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      navigation.replace('Login');
    } catch (error) {
      console.error('Sign out error:', error);
      Alert.alert('Error', 'Failed to sign out. Please try again.');
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor }]}>
      <ScrollView
        contentContainerStyle={{
          paddingTop: 40,
          paddingBottom: insets.bottom + 60,
          paddingHorizontal: 20,
        }}
      >
        <Text style={styles.header}>Settings</Text>

        {/* ACCOUNT SECTION */}
        <Section title="Account">
          <TouchableOpacity
            style={styles.card}
            onPress={() => navigation.navigate('Settings', { screen: 'Profile' })}
          >
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {userData?.email ? getNameFromEmail(userData.email).charAt(0) : '?'}
              </Text>
            </View>
            <View>
              <Text style={styles.cardTitle}>
                {userData?.email ? getNameFromEmail(userData.email) : 'Loading...'}
              </Text>
              <Text style={styles.cardSubtitle}>{userData?.email || ''}</Text>
            </View>
          </TouchableOpacity>
        </Section>

        {/* RESOURCES SECTION */}
        <Section title="Resources">
          <SettingsItem
            icon="book"
            label="Acknowledgements"
            onPress={() => navigation.navigate('Settings', { screen: 'Acknowledgements' })}
          />
        </Section>

        {/* SUPPORT SECTION */}
        <Section title="Support">
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
          <SettingsItem
            icon="sign-out"
            label="Sign out"
            iconColor="red"
            textColor="red"
            onPress={handleSignOut}
          />
        </Section>
      </ScrollView>
    </SafeAreaView>
  );
}

// --- REUSABLE COMPONENTS ---
const Section = ({ title, children }) => (
  <View style={styles.section}>
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title.toUpperCase()}</Text>
      <View style={styles.sectionLine} />
    </View>
    {children}
  </View>
);

const SettingsItem = ({ icon, label, onPress, iconColor = '#333', textColor = '#000' }) => (
  <TouchableOpacity style={styles.item} onPress={onPress}>
    <FontAwesome name={icon} size={20} color={iconColor} style={styles.itemIcon} />
    <Text style={[styles.itemText, { color: textColor }]}>{label}</Text>
  </TouchableOpacity>
);

// --- STYLES ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    fontSize: 30,
    fontWeight: '800',
    marginBottom: 25,
    color: '#1c1c1e',
  },
  section: {
    marginBottom: 30,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#555',
    marginRight: 10,
  },
  sectionLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#ddd',
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 15,
    elevation: 2,
    shadowColor: '#aaa',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  avatar: {
    backgroundColor: '#007AFF',
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  avatarText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  cardSubtitle: {
    fontSize: 13,
    color: '#777',
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
  },
  itemIcon: {
    width: 30,
  },
  itemText: {
    fontSize: 16,
    marginLeft: 10,
  },
});
