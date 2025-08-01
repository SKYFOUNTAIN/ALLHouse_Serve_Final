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
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: backgroundColor }]}
    >
      <ScrollView
        contentContainerStyle={{
          paddingBottom: insets.bottom + 70,
          paddingTop: 60,
          paddingHorizontal: 20,
        }}
      >
        <Text style={styles.title}>Settings</Text>

        {/* Account Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ACCOUNT</Text>
          <TouchableOpacity
            style={styles.card}
            onPress={() => navigation.navigate('Settings', { screen: 'Profile' })}
          >
            <View style={styles.iconCircle}>
              <Text style={styles.iconInitial}>
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
        </View>

        {/* Resources Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>RESOURCES</Text>
          <TouchableOpacity
            style={styles.item}
            onPress={() => navigation.navigate('Settings', { screen: 'Acknowledgements' })}
          >
            <FontAwesome
              name="book"
              size={20}
              color="#333"
              style={styles.itemIcon}
            />
            <Text style={styles.itemText}>Acknowledgements</Text>
          </TouchableOpacity>
        </View>

        {/* Support Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>SUPPORT</Text>
          <TouchableOpacity
            style={styles.item}
            onPress={() =>
              Alert.alert(
                'Contact the team',
                'Email: iresh_ramasamy@s2024.ssts.edu.sg',
                [{ text: 'OK' }]
              )
            }
          >
            <FontAwesome
              name="envelope"
              size={20}
              color="#007AFF"
              style={styles.itemIcon}
            />
            <Text style={[styles.itemText, { color: '#007AFF' }]}>
              Contact the team
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.item} onPress={handleSignOut}>
            <FontAwesome
              name="sign-out"
              size={20}
              color="red"
              style={styles.itemIcon}
            />
            <Text style={[styles.itemText, { color: 'red' }]}>Sign out</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginTop: 10,
    marginBottom: 20,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#666',
    marginBottom: 10,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 12,
    elevation: 1,
    shadowColor: '#ccc',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  iconCircle: {
    backgroundColor: '#007AFF',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  iconInitial: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 20,
  },
  cardTitle: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  cardSubtitle: {
    color: '#666',
    fontSize: 13,
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
